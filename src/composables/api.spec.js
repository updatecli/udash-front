import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({
  getAccessToken: vi.fn(),
  handleUnauthorized: vi.fn(),
}))

vi.mock('@/composables/auth', () => auth)

// api.js resolves its settings through runtime.js, which reads window.config when it
// loads, so every case loads a fresh copy of both.
async function loadApi(config = {}) {
  vi.resetModules()
  window.config = config
  return import('@/composables/api')
}

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: body === undefined ? () => Promise.reject(new SyntaxError('no body')) : () => Promise.resolve(body),
  }
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  delete window.config
})

describe('API base URL', () => {
  it('defaults to /api', async () => {
    const api = await loadApi()
    expect(api.getApiBaseURL()).toBe('/api')
    expect(api.getApiBaseUrl()).toBe(`${window.location.origin}/api`)
  })

  it('strips trailing slashes and keeps absolute URLs as they are', async () => {
    const api = await loadApi({ API_BASE_URL: 'https://api.uda.sh/updatecli//' })
    expect(api.getApiBaseURL()).toBe('https://api.uda.sh/updatecli')
    expect(api.getApiBaseUrl()).toBe('https://api.uda.sh/updatecli')
  })
})

describe('apiFetch', () => {
  it('returns the decoded body without a token on an open instance', async () => {
    const api = await loadApi()
    fetch.mockResolvedValue(jsonResponse(200, { data: [1] }))

    await expect(api.apiFetch('/pipeline/reports')).resolves.toEqual({ data: [1] })
    expect(fetch).toHaveBeenCalledWith('/api/pipeline/reports', { method: 'GET', headers: {}, signal: undefined })
    expect(auth.getAccessToken).not.toHaveBeenCalled()
  })

  it('attaches the bearer token and a JSON body when there is one', async () => {
    const api = await loadApi({ AUTH_ENABLED: 'true' })
    auth.getAccessToken.mockResolvedValue('secret')
    fetch.mockResolvedValue(jsonResponse(201, { id: 'x' }))

    await api.apiFetch('/tokens', { method: 'POST', body: { name: 'ci' } })

    expect(fetch).toHaveBeenCalledWith('/api/tokens', {
      method: 'POST',
      headers: { Authorization: 'Bearer secret', 'Content-Type': 'application/json' },
      body: '{"name":"ci"}',
      signal: undefined,
    })
  })

  it('sends no Authorization header without a session', async () => {
    const api = await loadApi({ AUTH_ENABLED: 'true' })
    auth.getAccessToken.mockResolvedValue(null)
    fetch.mockResolvedValue(jsonResponse(200, {}))

    await api.apiFetch('/pipeline/reports')
    expect(fetch.mock.calls[0][1].headers).toEqual({})
  })

  it('throws the sentence from the error body along with the status', async () => {
    const api = await loadApi()
    fetch.mockResolvedValue(jsonResponse(400, { error: 'start time is after end time' }))

    await expect(api.apiFetch('/x')).rejects.toMatchObject({
      message: 'start time is after end time',
      status: 400,
    })
  })

  it('falls back to the status when the error has no JSON body', async () => {
    const api = await loadApi()
    fetch.mockResolvedValue(jsonResponse(500))

    await expect(api.apiFetch('/x')).rejects.toMatchObject({
      message: 'HTTP error! status: 500',
      status: 500,
    })
  })

  it('offers the login on a 401', async () => {
    const api = await loadApi()
    fetch.mockResolvedValue(jsonResponse(401, { message: 'unauthorized' }))

    await expect(api.apiFetch('/x')).rejects.toMatchObject({ status: 401 })
    expect(auth.handleUnauthorized).toHaveBeenCalledOnce()
  })
})

describe('describeLoadError', () => {
  let describeLoadError

  beforeEach(async () => {
    ({ describeLoadError } = await loadApi())
  })

  function httpError(status, message = `HTTP error! status: ${status}`) {
    return Object.assign(new Error(message), { status })
  }

  it('blames the connection when there is no status', () => {
    expect(describeLoadError(new TypeError('Failed to fetch'), 'reports')).toMatch(/Could not reach the Udash API to load reports/)
  })

  it.each([502, 503, 504])('reports %i as the API being unavailable', (status) => {
    expect(describeLoadError(httpError(status), 'reports')).toBe('The Udash API is unavailable right now. Try again in a moment.')
  })

  it('points at API_BASE_URL on a bare 404', () => {
    expect(describeLoadError(httpError(404), 'reports')).toMatch(/No Udash API answered at .*\/api\. Check API_BASE_URL/)
  })

  it('keeps the API sentence on a 404 that has one', () => {
    expect(describeLoadError(httpError(404, 'report not found'), 'the report')).toBe('Could not load the report (HTTP 404). report not found')
  })

  it.each([
    [401, 'You need to sign in to see reports.'],
    [403, 'Your account is not allowed to see reports. missing role'],
    [429, 'The Udash API is receiving too many requests. Wait a moment, then try loading reports again.'],
    [500, 'The Udash API failed while loading reports (HTTP 500). Try again in a moment. missing role'],
  ])('explains a %i', (status, expected) => {
    expect(describeLoadError(httpError(status, 'missing role'), 'reports')).toBe(expected)
  })
})
