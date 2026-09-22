import { afterEach, describe, expect, it, vi } from 'vitest'

// runtime.js reads window.config once, when the module loads, so every case loads a
// fresh copy after setting it.
async function loadRuntime(config) {
  vi.resetModules()
  window.config = config
  return import('@/composables/runtime')
}

afterEach(() => {
  delete window.config
  vi.restoreAllMocks()
})

describe('auth visibility', () => {
  it('needs no login on an instance without auth', async () => {
    const runtime = await loadRuntime({ AUTH_VISIBILITY: 'private' })
    expect(runtime.isAuthEnabled).toBe(false)
    expect(runtime.requiresLoginToRead).toBe(false)
  })

  it('accepts AUTH_ENABLED as a boolean or a string', async () => {
    expect((await loadRuntime({ AUTH_ENABLED: true })).isAuthEnabled).toBe(true)
    expect((await loadRuntime({ AUTH_ENABLED: 'true' })).isAuthEnabled).toBe(true)
    expect((await loadRuntime({ AUTH_ENABLED: 'yes' })).isAuthEnabled).toBe(false)
  })

  it('defaults to private when auth is enabled', async () => {
    const runtime = await loadRuntime({ AUTH_ENABLED: 'true' })
    expect(runtime.requiresLoginToRead).toBe(true)
  })

  it('opens reading on a public instance, whatever the case', async () => {
    const runtime = await loadRuntime({ AUTH_ENABLED: 'true', AUTH_VISIBILITY: ' Public ' })
    expect(runtime.requiresLoginToRead).toBe(false)
  })

  it('falls back to private on a typo, and says so', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const runtime = await loadRuntime({ AUTH_ENABLED: 'true', AUTH_VISIBILITY: 'pubic' })
    expect(runtime.requiresLoginToRead).toBe(true)
    expect(warn).toHaveBeenCalledOnce()
  })
})

describe('base path', () => {
  it.each([
    [undefined, '/'],
    ['/', '/'],
    ['udash', '/udash/'],
    ['/udash/', '/udash/'],
    ['//team/udash//', '/team/udash/'],
  ])('normalizes %j to %s', async (value, expected) => {
    const runtime = await loadRuntime({ APP_BASE_PATH: value })
    expect(runtime.getAppBasePath()).toBe(expected)
  })

  it('builds absolute URLs and storage keys from it', async () => {
    const runtime = await loadRuntime({ APP_BASE_PATH: 'udash' })
    expect(runtime.getAppBaseUrl()).toBe(`${window.location.origin}/udash/`)
    expect(runtime.getDashboardUrl()).toBe(`${window.location.origin}/udash`)
    expect(runtime.getStorageKey('scm.filter.v1')).toBe('udash.scm.filter.v1:/udash/')
  })
})

describe('getMaxHistoryDays', () => {
  it.each([
    [undefined, 30],
    ['abc', 30],
    [0, 30],
    [-5, 30],
    [90, 90],
    ['14.9', 14],
    [1000, 366],
  ])('reads %j as %i', async (value, expected) => {
    const runtime = await loadRuntime({ MAX_HISTORY_DAYS: value })
    expect(runtime.getMaxHistoryDays()).toBe(expected)
  })
})
