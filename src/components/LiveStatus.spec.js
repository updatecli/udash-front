import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, reactive } from 'vue'

const route = reactive({ path: '/' })
vi.mock('vue-router', () => ({ useRoute: () => route }))

// live.js holds the freshness state for the whole app, so every case loads a fresh copy
// of it and of the component reading it.
async function mountLiveStatus() {
  vi.resetModules()
  const live = await import('@/composables/live')
  const { default: LiveStatus } = await import('@/components/LiveStatus.vue')
  return { live, wrapper: mount(LiveStatus) }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-22T12:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
  route.path = '/'
})

describe('LiveStatus', () => {
  it('stays hidden until the page reports an update', async () => {
    const { live, wrapper } = await mountLiveStatus()
    expect(wrapper.find('button').exists()).toBe(false)

    live.markUpdated()
    await nextTick()
    expect(wrapper.get('button').text()).toBe('Updated just now')
  })

  it.each([
    [2, 'just now'],
    [30, '30s ago'],
    [5 * 60, '5m ago'],
    [3 * 60 * 60, '3h ago'],
  ])('reads %is later as %s', async (seconds, label) => {
    const { live, wrapper } = await mountLiveStatus()
    live.markUpdated()

    await vi.advanceTimersByTimeAsync(seconds * 1000)
    expect(wrapper.get('button').attributes('aria-label')).toBe(`Refresh now. Last updated ${label}.`)
  })

  it('pulses only while the data is fresh', async () => {
    const { live, wrapper } = await mountLiveStatus()
    live.markUpdated()
    await nextTick()
    expect(wrapper.find('.live-status__dot--fresh').exists()).toBe(true)

    await vi.advanceTimersByTimeAsync(5000)
    expect(wrapper.find('.live-status__dot--fresh').exists()).toBe(false)
  })

  it('refreshes the page when clicked', async () => {
    const { live, wrapper } = await mountLiveStatus()
    const refresh = vi.fn()
    live.subscribeRefresh(refresh)
    live.markUpdated()
    await nextTick()

    await wrapper.get('button').trigger('click')
    await nextTick()
    expect(refresh).toHaveBeenCalledOnce()
  })

  it('drops the freshness claim when navigating to another page', async () => {
    const { live, wrapper } = await mountLiveStatus()
    live.markUpdated()
    await nextTick()

    route.path = '/about'
    await nextTick()
    await nextTick()
    expect(wrapper.find('button').exists()).toBe(false)
  })
})
