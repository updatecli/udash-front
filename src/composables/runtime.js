const runtimeConfig = window.config || {}

// MAX_HISTORY_DAYS caps how far back the interface lets anyone look: it drives the
// date filter's reach and the window of the activity chart.
//
// It guards the UI only — the API enforces its own ceiling — so it is clamped to
// that ceiling here rather than letting a misconfigured instance send requests the
// backend answers with a 400. Raising it does not increase baseline load: the
// filter's default selection stays at the last day whatever the maximum is, so a
// wider range only ever costs something once someone deliberately asks for it.
const DEFAULT_MAX_HISTORY_DAYS = 30
const API_MAX_HISTORY_DAYS = 366

// AUTH_ENABLED is read from the runtime config rather than the build environment so a
// single image can serve both authenticated and open deployments. index.html populates
// window.config before importing the bundle, so this is resolved by the time any module
// body runs.
export const isAuthEnabled = String(runtimeConfig.AUTH_ENABLED) === 'true'

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
