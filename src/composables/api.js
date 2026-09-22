
import { getAccessToken, handleUnauthorized } from '@/composables/auth'
import { getRuntimeConfig, isAuthEnabled } from '@/composables/runtime'

// getApiBaseURL returns the base URL for API requests with no trailing slash.
export function getApiBaseURL() {
  const raw = getRuntimeConfig().API_BASE_URL || '/api'

  // remove any trailing slashes so we can safely append paths like "/pipeline/..."
  return raw.replace(/\/+$/, '')
}

// getApiBaseUrl returns the fully-qualified API base URL (always includes scheme and domain).
// Use this when the URL needs to be displayed to or copied by the user.
export function getApiBaseUrl() {
  const raw = getApiBaseURL()

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw
  }

  return window.location.origin + raw
}

// apiFetch calls the udash API at `path`, which is relative to the API base URL, and
// returns the decoded JSON body. The bearer token is attached whenever a session exists,
// so callers don't need to know whether this instance runs with authentication, or
// whether its API serves this request anonymously.
//
// It throws on anything but a 2xx. The error uses the message the API puts in the body
// when there is one, because that message is usually the only explanation of why a view
// came back empty.
export async function apiFetch(path, { method = 'GET', body, signal } = {}) {
  const headers = {}

  if (isAuthEnabled) {
    const token = await getAccessToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  const init = { method, headers, signal }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(body)
  }

  const response = await fetch(`${getApiBaseURL()}${path}`, init)

  if (!response.ok) {
    let detail = ''
    try {
      const errorBody = await response.json()
      detail = errorBody?.error || errorBody?.message || ''
    } catch {
      detail = ''
    }

    const error = new Error(detail || `HTTP error! status: ${response.status}`)
    error.status = response.status

    // A 401 with no session means the API is stricter than this frontend's config says.
    // Only a login can unblock the page.
    if (response.status === 401) {
      handleUnauthorized()
    }

    throw error
  }

  return response.json()
}

export function describeLoadError(error, what) {
  const status = error?.status

  if (!status) {
    return `Could not reach the Udash API to load ${what}. Check your connection, then try again.`
  }

  // A gateway error means the proxy is up but the API behind it is not.
  if (status === 502 || status === 503 || status === 504) {
    return 'The Udash API is unavailable right now. Try again in a moment.'
  }

  const detail = error.message && !error.message.startsWith('HTTP error!') ? ` ${error.message}` : ''

  // Without a JSON error body, a 404 comes from the web server rather than the API.
  if (status === 404 && !detail) {
    return `No Udash API answered at ${getApiBaseUrl()}. Check API_BASE_URL in config.json.`
  }

  if (status === 401) {
    return `You need to sign in to see ${what}.`
  }

  if (status === 403) {
    return `Your account is not allowed to see ${what}.${detail}`
  }

  if (status === 429) {
    return `The Udash API is receiving too many requests. Wait a moment, then try loading ${what} again.`
  }

  if (status >= 500) {
    return `The Udash API failed while loading ${what} (HTTP ${status}). Try again in a moment.${detail}`
  }

  return `Could not load ${what} (HTTP ${status}).${detail}`
}
