import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// One fake UserManager stands in for the identity provider; each case sets what it
// returns.
const oidc = vi.hoisted(() => ({
  manager: null,
}))

vi.mock('oidc-client-ts', () => ({
  WebStorageStateStore: class {},
  UserManager: class {
    constructor() {
      Object.assign(this, oidc.manager)
    }
  },
}))

function fakeManager() {
  return {
    getUser: vi.fn().mockResolvedValue(null),
    signinRedirect: vi.fn().mockResolvedValue(undefined),
    signinRedirectCallback: vi.fn(),
    signinSilent: vi.fn(),
    signoutRedirect: vi.fn(),
    metadataService: { getUserInfoEndpoint: vi.fn().mockResolvedValue('https://idp/userinfo') },
    events: {
      addUserLoaded: vi.fn(),
      addUserUnloaded: vi.fn(),
      addAccessTokenExpired: vi.fn(),
      addSilentRenewError: vi.fn(),
    },
  }
}

function session(overrides = {}) {
  return { access_token: 'token', expired: false, profile: { sub: 'user-1' }, ...overrides }
}

// auth.js keeps its state in the module and reads window.config through runtime.js when
// it loads, so every case loads a fresh copy.
async function loadAuth(config) {
  vi.resetModules()
  window.config = config
  return import('@/composables/auth')
}

const PRIVATE = { AUTH_ENABLED: 'true', AUTH_VISIBILITY: 'private' }
const PUBLIC = { AUTH_ENABLED: 'true', AUTH_VISIBILITY: 'public' }

beforeEach(() => {
  oidc.manager = fakeManager()
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
})

afterEach(() => {
  vi.unstubAllGlobals()
  sessionStorage.clear()
  delete window.config
})

describe('authGuard', () => {
  const home = { fullPath: '/', meta: {} }
  const reports = { fullPath: '/pipeline/reports?page=2', meta: { requiresRead: true } }
  const profile = { fullPath: '/profile', meta: { requiresAuth: true } }

  it('lets everything through on an instance without auth', async () => {
    const { authGuard } = await loadAuth({})
    for (const route of [home, reports, profile]) {
      expect(await authGuard(route)).toBe(true)
    }
    expect(oidc.manager.signinRedirect).not.toHaveBeenCalled()
  })

  it('lets anonymous visitors read data on a public instance, but not see the profile', async () => {
    const { authGuard } = await loadAuth(PUBLIC)
    expect(await authGuard(home)).toBe(true)
    expect(await authGuard(reports)).toBe(true)
    expect(await authGuard(profile)).toBe(false)
    expect(oidc.manager.signinRedirect).toHaveBeenCalledOnce()
  })

  it('sends anonymous visitors to the login on a private instance, remembering the page', async () => {
    const { authGuard, consumeReturnTo } = await loadAuth(PRIVATE)
    expect(await authGuard(reports)).toBe(false)
    expect(oidc.manager.signinRedirect).toHaveBeenCalledOnce()
    expect(consumeReturnTo()).toBe('/pipeline/reports?page=2')
    expect(consumeReturnTo()).toBeNull()
  })

  it('lets a signed-in user through', async () => {
    oidc.manager.getUser.mockResolvedValue(session())
    const { authGuard } = await loadAuth(PRIVATE)
    expect(await authGuard(reports)).toBe(true)
    expect(await authGuard(profile)).toBe(true)
  })

  it('treats an expired session as none', async () => {
    oidc.manager.getUser.mockResolvedValue(session({ expired: true }))
    const { authGuard } = await loadAuth(PRIVATE)
    expect(await authGuard(profile)).toBe(false)
  })
})

describe('initAuth', () => {
  it('settles at once without auth', async () => {
    const { initAuth, useAuth } = await loadAuth({})
    await initAuth()
    const { isLoading, isAuthenticated, canReadData } = useAuth()
    expect(isLoading.value).toBe(false)
    expect(isAuthenticated.value).toBe(false)
    expect(canReadData.value).toBe(true)
  })

  it('restores a stored session and merges the userinfo claims over the token ones', async () => {
    oidc.manager.getUser.mockResolvedValue(session())
    fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ sub: 'user-1', email: 'a@b.c' }) })

    const { initAuth, useAuth } = await loadAuth(PRIVATE)
    await initAuth()
    const { isAuthenticated, user, canReadData } = useAuth()

    expect(isAuthenticated.value).toBe(true)
    expect(canReadData.value).toBe(true)
    expect(user.value).toEqual({ sub: 'user-1', email: 'a@b.c' })
    expect(fetch).toHaveBeenCalledWith('https://idp/userinfo', { headers: { Authorization: 'Bearer token' } })
  })

  it('never merges claims describing someone else', async () => {
    oidc.manager.getUser.mockResolvedValue(session())
    fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ sub: 'user-2', email: 'x@y.z' }) })

    const { initAuth, useAuth } = await loadAuth(PRIVATE)
    await initAuth()
    const { isAuthenticated, user, error } = useAuth()

    expect(isAuthenticated.value).toBe(true)
    expect(user.value).toEqual({ sub: 'user-1' })
    expect(error.value.message).toMatch(/subject does not match/)
  })

  it('keeps the session when userinfo fails', async () => {
    oidc.manager.getUser.mockResolvedValue(session())

    const { initAuth, useAuth } = await loadAuth(PRIVATE)
    await initAuth()

    expect(useAuth().isAuthenticated.value).toBe(true)
    expect(useAuth().user.value).toEqual({ sub: 'user-1' })
  })

  it('does the work once however often it is called', async () => {
    const { initAuth } = await loadAuth(PRIVATE)
    await Promise.all([initAuth(), initAuth(), initAuth()])
    expect(oidc.manager.getUser).toHaveBeenCalledOnce()
  })

  it('withholds data from anonymous visitors on a private instance only', async () => {
    const privateAuth = await loadAuth(PRIVATE)
    await privateAuth.initAuth()
    expect(privateAuth.useAuth().canReadData.value).toBe(false)

    const publicAuth = await loadAuth(PUBLIC)
    await publicAuth.initAuth()
    expect(publicAuth.useAuth().canReadData.value).toBe(true)
  })
})

describe('getAccessToken', () => {
  it('returns the current token', async () => {
    oidc.manager.getUser.mockResolvedValue(session())
    const { getAccessToken } = await loadAuth(PRIVATE)
    expect(await getAccessToken()).toBe('token')
  })

  it('renews an expired token silently', async () => {
    oidc.manager.getUser.mockResolvedValue(session({ expired: true }))
    oidc.manager.signinSilent.mockResolvedValue(session({ access_token: 'fresh' }))
    const { getAccessToken } = await loadAuth(PRIVATE)
    expect(await getAccessToken()).toBe('fresh')
  })

  it('returns null when the renewal fails', async () => {
    oidc.manager.getUser.mockResolvedValue(session({ expired: true }))
    oidc.manager.signinSilent.mockRejectedValue(new Error('login_required'))
    const { getAccessToken } = await loadAuth(PRIVATE)
    expect(await getAccessToken()).toBeNull()
  })
})

describe('handleUnauthorized', () => {
  it('does nothing on an instance without auth', async () => {
    const { handleUnauthorized } = await loadAuth({})
    handleUnauthorized()
    expect(oidc.manager.signinRedirect).not.toHaveBeenCalled()
  })

  it('redirects an anonymous visitor once, however many requests fail', async () => {
    const { handleUnauthorized, consumeReturnTo } = await loadAuth(PUBLIC)
    window.history.replaceState({}, '', '/scm/dashboard?filter=abc')

    handleUnauthorized()
    handleUnauthorized()
    handleUnauthorized()

    expect(oidc.manager.signinRedirect).toHaveBeenCalledOnce()
    expect(consumeReturnTo()).toBe('/scm/dashboard?filter=abc')
  })

  it('strips the base path from the page to come back to', async () => {
    const { handleUnauthorized, consumeReturnTo } = await loadAuth({ ...PUBLIC, APP_BASE_PATH: 'udash' })
    window.history.replaceState({}, '', '/udash/pipeline/reports')

    handleUnauthorized()
    expect(consumeReturnTo()).toBe('/pipeline/reports')
  })

  it('never bounces a signed-in user back to the provider', async () => {
    oidc.manager.getUser.mockResolvedValue(session())
    const { initAuth, handleUnauthorized } = await loadAuth(PUBLIC)
    await initAuth()

    handleUnauthorized()
    expect(oidc.manager.signinRedirect).not.toHaveBeenCalled()
  })
})
