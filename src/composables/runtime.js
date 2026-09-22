const runtimeConfig = window.config || {}

// MAX_HISTORY_DAYS caps how far back the interface lets anyone look: it drives the
// date filter's reach and the window of the activity chart.
//
// The API enforces its own ceiling (366 days), so we clamp to it here. Otherwise a
// misconfigured instance would send requests the API rejects with a 400. Raising the
// value does not increase the default load: the filter still starts on the last day
// whatever the maximum is, so a wider range is only queried when someone asks for it.
const DEFAULT_MAX_HISTORY_DAYS = 30
const API_MAX_HISTORY_DAYS = 366

// AUTH_ENABLED is read from the runtime config rather than the build environment so a
// single image can serve both authenticated and open deployments. index.html populates
// window.config before importing the bundle, so this is resolved by the time any module
// body runs.
export const isAuthEnabled = String(runtimeConfig.AUTH_ENABLED) === 'true'

// AUTH_VISIBILITY mirrors the API's own `server.auth.visibility`. It only matters when
// AUTH_ENABLED is true, since an instance with no login is readable by everyone whatever
// it says here.
//
// It defaults to "private" while the API defaults to "public", and that difference is
// intended. This value decides whether an existing deployment starts serving its data to
// anonymous visitors, which must never happen just because someone upgraded without
// editing a config file. An unknown value falls back to "private" too, so a typo cannot
// open an instance either.
const VISIBILITY_PUBLIC = 'public'
const VISIBILITY_PRIVATE = 'private'

function readAuthVisibility() {
  const configured = String(runtimeConfig.AUTH_VISIBILITY ?? '').trim().toLowerCase()

  if (configured === VISIBILITY_PUBLIC || configured === VISIBILITY_PRIVATE) {
    return configured
  }

  if (configured !== '') {
    console.warn(
      `Unknown AUTH_VISIBILITY ${JSON.stringify(runtimeConfig.AUTH_VISIBILITY)}, ` +
      `accepted values are "${VISIBILITY_PUBLIC}" and "${VISIBILITY_PRIVATE}". ` +
      `Falling back to "${VISIBILITY_PRIVATE}".`
    )
  }

  return VISIBILITY_PRIVATE
}

const authVisibility = isAuthEnabled ? readAuthVisibility() : VISIBILITY_PUBLIC

// requiresLoginToRead answers one question: does browsing pipeline data need a session?
// It is false on an open instance and on a public one. The account pages (the profile
// and the API tokens) have their own rule and never check it.
export const requiresLoginToRead = isAuthEnabled && authVisibility === VISIBILITY_PRIVATE

export function getRuntimeConfig() {
  return runtimeConfig
}

export function getAppBasePath() {
  const rawBasePath = runtimeConfig.APP_BASE_PATH || '/'

  if (!rawBasePath || rawBasePath === '/') {
    return '/'
  }

  return `/${String(rawBasePath).replace(/^\/+|\/+$/g, '')}/`
}

export function getAppBaseUrl() {
  return new URL(getAppBasePath().replace(/^\//, ''), `${window.location.origin}/`).href
}

export function getDashboardUrl() {
  return getAppBaseUrl().replace(/\/$/, '')
}

export function getStorageKey(id) {
  return `udash.${id}:${getAppBasePath()}`
}

// getMaxHistoryDays returns how many days of history the UI may offer, falling back
// to the default whenever the value is missing or unusable.
export function getMaxHistoryDays() {
  const configured = Number(runtimeConfig.MAX_HISTORY_DAYS)

  if (!Number.isFinite(configured) || configured < 1) {
    return DEFAULT_MAX_HISTORY_DAYS
  }

  return Math.min(Math.floor(configured), API_MAX_HISTORY_DAYS)
}
