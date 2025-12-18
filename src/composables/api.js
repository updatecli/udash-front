
// getApiBaseURL returns the base URL for API requests with no trailing slash
export function getApiBaseURL() {
    const raw = config.API_BASE_URL || '/api'

    // remove any trailing slashes so we can safely append paths like "/pipeline/..."
    return raw.replace(/\/+$/, '')
}