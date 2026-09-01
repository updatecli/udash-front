import { computed, reactive, toRefs } from 'vue'
import { UserManager, WebStorageStateStore } from 'oidc-client-ts'
import {
  getRuntimeConfig,
  getAppBasePath,
  getAppBaseUrl,
  isAuthEnabled,
  requiresLoginToRead,
} from '@/composables/runtime'

// Provider-agnostic OIDC auth layer (Authorization Code + PKCE).
// Backed by oidc-client-ts, configured from the runtime config.json so any
// standards-compliant provider (e.g. Zitadel) can be plugged in without code
// changes.

const RETURN_TO_KEY = 'udash.auth.returnTo'

const state = reactive({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,
})

// canReadData separates "may see pipeline data" from "has a session", which used to be
// the same flag. On a public instance an anonymous visitor reads everything the API
// serves anonymously, and signing in adds the profile and the API tokens rather than the
// data. It stays reactive so a visitor who signs in mid-session sees the panels appear
// without reloading.
export const canReadData = computed(() => !requiresLoginToRead || state.isAuthenticated)

let userManager = null
let initPromise = null

// loadUserInfoClaims resolves the profile claims for a session. The ID token carries
// only what the provider chooses to put there — Zitadel omits `email`, `name`,
// `preferred_username` and `picture` unless the application opts in — so the claims are
// read from the userinfo endpoint and merged over the token's own.
//
// This is deliberately non-fatal. oidc-client-ts' built-in `loadUserInfo` runs inside
// the signin callback and the refresh path and throws on failure, which would cost the
// user their session over a transient userinfo error. Here a failure degrades to the
// sparse ID-token profile and is recorded for the UI to surface.
async function loadUserInfoClaims(user) {
  if (!user?.access_token) {
    return user?.profile ?? null
  }

  try {
    const endpoint = await getUserManager().metadataService.getUserInfoEndpoint()
    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${user.access_token}` },
    })

    if (!response.ok) {
      throw new Error(`userinfo request failed with status ${response.status}`)
    }

    const claims = await response.json()

    // A response describing a different subject must never be merged in.
    if (claims.sub !== user.profile.sub) {
      throw new Error('userinfo subject does not match the ID token subject')
    }

    return { ...user.profile, ...claims }
  } catch (err) {
    state.error = err
    return user.profile
  }
}

async function applyUser(user) {
  if (user && !user.expired) {
    // Resolve the profile before flipping the flag so the two never disagree.
    state.user = await loadUserInfoClaims(user)
    state.isAuthenticated = true
  } else {
    state.isAuthenticated = false
    state.user = null
  }
}

function getUserManager() {
  if (!userManager) {
    const cfg = getRuntimeConfig()

    userManager = new UserManager({
      authority: cfg.OAUTH_DOMAIN,
      client_id: cfg.OAUTH_CLIENTID,
      redirect_uri: getAppBaseUrl(),
      post_logout_redirect_uri: getAppBaseUrl(),
      response_type: 'code',
      scope: cfg.OAUTH_SCOPE || 'openid profile email offline_access',
      userStore: new WebStorageStateStore({ store: window.localStorage }),
      automaticSilentRenew: true,
    })

    userManager.events.addUserLoaded((user) => applyUser(user))
    userManager.events.addUserUnloaded(() => applyUser(null))
    userManager.events.addAccessTokenExpired(() => applyUser(null))
    userManager.events.addSilentRenewError((err) => {
      state.error = err
    })
  }

  return userManager
}

// initAuth builds the UserManager, processes the redirect callback when the URL
// carries OAuth `code`/`state`, then hydrates the reactive state from any stored
// session. Safe to call multiple times: the work happens once.
export function initAuth() {
  if (!isAuthEnabled) {
    state.isLoading = false
    return Promise.resolve()
  }

  if (initPromise) {
    return initPromise
  }

  initPromise = (async () => {
    const mgr = getUserManager()

    try {
      const params = new URLSearchParams(window.location.search)
      if (params.has('code') && params.has('state')) {
        const user = await mgr.signinRedirectCallback()
        await applyUser(user)

        // Strip the OAuth query params, keeping the current path and hash.
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname + window.location.hash
        )
      } else {
        await applyUser(await mgr.getUser())
      }
    } catch (err) {
      state.error = err
      await applyUser(null)
    } finally {
      state.isLoading = false
    }
  })()

  return initPromise
}

// login redirects to the identity provider. When `returnTo` is provided it is
// stashed so the app can navigate back to the intended route after callback.
export async function login(returnTo) {
  if (returnTo) {
    sessionStorage.setItem(RETURN_TO_KEY, returnTo)
  }
  await getUserManager().signinRedirect()
}

export async function logout() {
  await getUserManager().signoutRedirect()
}

// getAccessToken returns a valid bearer token, silently renewing if expired.
export async function getAccessToken() {
  const mgr = getUserManager()
  let user = await mgr.getUser()

  if (user && user.expired) {
    try {
      user = await mgr.signinSilent()
    } catch (err) {
      state.error = err
      user = null
    }
  }

  return user?.access_token || null
}

// consumeReturnTo returns and clears the route stashed before a login redirect.
export function consumeReturnTo() {
  const target = sessionStorage.getItem(RETURN_TO_KEY)
  if (target) {
    sessionStorage.removeItem(RETURN_TO_KEY)
  }
  return target
}

// routeNeedsSession decides, for one route, whether a session is required:
//   - `requiresAuth`: an account page. Always needs one, whatever the visibility.
//   - `requiresRead`: a page of pipeline data. Needs one only where the API is private.
// A route with neither is open to everyone.
function routeNeedsSession(to) {
  return to.meta?.requiresAuth === true ||
    (to.meta?.requiresRead === true && requiresLoginToRead)
}

// authGuard is registered once as the router's global guard. It replaces the per-route
// `beforeEnter`, which could not express "needed here, but only on a private instance".
// Authenticated users pass, others are redirected to the identity provider with the
// target route remembered.
export async function authGuard(to) {
  if (!isAuthEnabled || !routeNeedsSession(to)) {
    return true
  }

  await initAuth()
  const user = await getUserManager().getUser()

  if (user && !user.expired) {
    return true
  }

  await login(to.fullPath)
  return false
}

// currentReturnTo rebuilds the router path from the address bar. The stashed value is
// replayed through router.replace(), so the APP_BASE_PATH prefix has to come off.
function currentReturnTo() {
  const base = getAppBasePath()
  const path = window.location.pathname
  const relative = path.startsWith(base) ? path.slice(base.length - 1) : path

  return relative + window.location.search + window.location.hash
}

// handleUnauthorized turns an API refusal into the login the viewer was never offered.
// It fires only for a viewer with no session: on an instance configured public while its
// API is private, every data request comes back 401 and the pages would otherwise render
// silently empty. A 401 for someone already signed in is a different fault — an expired
// token, a missing role, the wrong audience — and bouncing them to the provider would
// loop.
let unauthorizedRedirect = false

export function handleUnauthorized() {
  if (!isAuthEnabled || state.isAuthenticated || unauthorizedRedirect) {
    return
  }

  // A page fires several requests at once; they must not queue several redirects.
  unauthorizedRedirect = true

  login(currentReturnTo()).catch((err) => {
    state.error = err
    unauthorizedRedirect = false
  })
}

// useAuth exposes reactive auth state and actions to components.
export function useAuth() {
  const { isAuthenticated, isLoading, user, error } = toRefs(state)

  return {
    isAuthenticated,
    isLoading,
    user,
    error,
    canReadData,
    login,
    logout,
    getToken: getAccessToken,
  }
}
