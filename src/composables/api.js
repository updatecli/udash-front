
import { getAccessToken } from '@/composables/auth'
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
// returns the decoded JSON body. The bearer token is attached whenever auth is enabled,
// so no caller has to know whether this instance runs with authentication or without.
//
// It throws on anything but a 2xx, preferring the sentence the API puts in the body over
// the bare status code: that sentence is usually the only thing telling the reader why a
// view came back empty.
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
    throw error
  }

  return response.json()
}
