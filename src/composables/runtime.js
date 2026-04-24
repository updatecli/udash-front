const runtimeConfig = window.config || {}

export const isAuthEnabled = import.meta.env.VITE_AUTH_ENABLED === 'true'

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
