import { reactive, toRefs } from 'vue'
import { UserManager, WebStorageStateStore } from 'oidc-client-ts'
import { getRuntimeConfig, getAppBaseUrl, isAuthEnabled } from '@/composables/runtime'

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

// authGuard protects routes: authenticated users pass, others are redirected to
// the identity provider with the target route remembered.
export async function authGuard(to) {
  if (!isAuthEnabled) {
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

// useAuth exposes reactive auth state and actions to components.
export function useAuth() {
  const { isAuthenticated, isLoading, user, error } = toRefs(state)

  return {
    isAuthenticated,
    isLoading,
    user,
    error,
    login,
    logout,
    getToken: getAccessToken,
  }
}
