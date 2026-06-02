
import { getRuntimeConfig } from '@/composables/runtime'

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
