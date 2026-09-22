import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

// live.js starts its timers once per module, so every case loads a fresh copy under
// fake timers.
async function loadLive() {
  vi.resetModules()
  return import('@/composables/live')
}

function setVisibility(state) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state })
}

beforeEach(() => {
  vi.useFakeTimers()
  setVisibility('visible')
})

afterEach(() => {
  vi.useRealTimers()
})

describe('live refresh', () => {
  it('refreshes subscribers every minute while the tab is visible', async () => {
    const live = await loadLive()
    const refresh = vi.fn()
    live.subscribeRefresh(refresh)

    vi.advanceTimersByTime(60 * 1000)
    await nextTick()
    expect(refresh).toHaveBeenCalledOnce()
  })

  it('skips the refresh while the tab is hidden', async () => {
    const live = await loadLive()
    const refresh = vi.fn()
    live.subscribeRefresh(refresh)

    setVisibility('hidden')
    vi.advanceTimersByTime(3 * 60 * 1000)
    await nextTick()
    expect(refresh).not.toHaveBeenCalled()
  })

  it('refreshes a stale tab as soon as it is visible again', async () => {
    const live = await loadLive()
    const refresh = vi.fn()
    live.subscribeRefresh(refresh)
    live.markUpdated()

    setVisibility('hidden')
    vi.advanceTimersByTime(2 * 60 * 1000)
    setVisibility('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    await nextTick()

    expect(refresh).toHaveBeenCalledOnce()
  })

  it('stops calling a subscriber once it unsubscribes', async () => {
    const live = await loadLive()
    const refresh = vi.fn()
    const stop = live.subscribeRefresh(refresh)

    stop()
    live.refreshNow()
    await nextTick()
    expect(refresh).not.toHaveBeenCalled()
  })

  it('records and clears the last update', async () => {
    const live = await loadLive()
    vi.setSystemTime(new Date('2026-09-22T12:00:00Z'))

    live.markUpdated()
    expect(live.lastUpdated.value).toBe(Date.parse('2026-09-22T12:00:00Z'))

    live.clearUpdated()
    expect(live.lastUpdated.value).toBeNull()
  })
})
