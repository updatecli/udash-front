import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { FILTER_STORAGE_KEY } from '@/composables/date'

const api = vi.hoisted(() => ({ apiFetch: vi.fn() }))

vi.mock('@/composables/api', async (importOriginal) => ({
  ...(await importOriginal()),
  apiFetch: api.apiFetch,
}))

vi.mock('@/router', () => ({
  default: {
    currentRoute: { value: { query: {} } },
    replace: vi.fn(() => Promise.resolve()),
  },
}))

// labels answers the label endpoint: the key list, or the values of the asked key.
function labels(keys, valuesByKey = {}) {
  return async (query) => {
    const key = new URLSearchParams(query.split('?')[1]).get('key')
    if (key) {
      return { labels: (valuesByKey[key] || []).map((value) => ({ key, value })) }
    }
    return { labels: keys }
  }
}

function keyCalls() {
  return api.apiFetch.mock.calls.map(([query]) => query).filter((query) => query.includes('keyonly=true'))
}

// The live module keeps its timers and tick at module level, so each mount gets fresh
// copies and refreshNow comes from the same copy the component subscribed to.
async function mountFilter() {
  vi.resetModules()
  const { default: Filter } = await import('@/components/scm/_filter.vue')
  const { refreshNow } = await import('@/composables/live')
  const wrapper = mount(Filter, { props: { showRepositoryBranch: false } })
  await flushPromises()
  return { wrapper, refreshNow }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setInterval', 'Date'] })
  vi.setSystemTime(new Date('2026-09-22T12:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
  api.apiFetch.mockReset()
  localStorage.clear()
})

describe('PipelineSCMS label lists', () => {
  it('asks for the window as it stands when the live refresh fires', async () => {
    api.apiFetch.mockImplementation(labels(['team']))
    const { refreshNow } = await mountFilter()
    expect(keyCalls().at(-1)).toContain(encodeURIComponent('2026-09-22 12:00:00+00:00'))

    vi.setSystemTime(new Date('2026-09-22T13:00:00Z'))
    api.apiFetch.mockImplementation(labels(['team', 'squad']))
    refreshNow()
    await flushPromises()

    expect(keyCalls().at(-1)).toContain(encodeURIComponent('2026-09-22 13:00:00+00:00'))
  })

  it('offers keys first reported after the page loaded', async () => {
    api.apiFetch.mockImplementation(labels(['team']))
    const { wrapper, refreshNow } = await mountFilter()
    expect(wrapper.vm.labelKeys).toEqual(['team'])

    api.apiFetch.mockImplementation(labels(['team', 'squad']))
    refreshNow()
    await flushPromises()

    expect(wrapper.vm.labelKeys).toEqual(['team', 'squad'])
  })

  it('loads the values of a label restored from the saved filter', async () => {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify({
      dateRange: [0, 24],
      selectedLabels: [{ key: 'team', value: 'core' }],
    }))
    api.apiFetch.mockImplementation(labels(['team'], { team: ['core', 'web'] }))

    const { wrapper } = await mountFilter()

    expect(wrapper.vm.getLabelValuesForIndex(0)).toEqual(['core', 'web'])
  })

  it('keeps the lists it has when a refresh fails', async () => {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify({
      dateRange: [0, 24],
      selectedLabels: [{ key: 'team', value: 'core' }],
    }))
    api.apiFetch.mockImplementation(labels(['team'], { team: ['core'] }))
    const { wrapper, refreshNow } = await mountFilter()

    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    api.apiFetch.mockRejectedValue(new Error('offline'))
    refreshNow()
    await flushPromises()
    error.mockRestore()

    expect(wrapper.vm.labelKeys).toEqual(['team'])
    expect(wrapper.vm.getLabelValuesForIndex(0)).toEqual(['core'])
  })

  it('does not keep the lists of the previous range when a refresh fails', async () => {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify({
      dateRange: [0, 24],
      selectedLabels: [{ key: 'team', value: 'core' }],
    }))
    api.apiFetch.mockImplementation(labels(['team'], { team: ['core'] }))
    const { wrapper } = await mountFilter()

    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    api.apiFetch.mockRejectedValue(new Error('offline'))
    wrapper.vm.dateRange = [0, 2]
    await wrapper.vm.refreshLabels()
    await flushPromises()
    error.mockRestore()

    expect(wrapper.vm.labelKeys).toEqual([])
    expect(wrapper.vm.getLabelValuesForIndex(0)).toEqual([])
    wrapper.unmount()
  })

  it('drops a response that a newer refresh has superseded', async () => {
    api.apiFetch.mockImplementation(labels(['team']))
    const { wrapper } = await mountFilter()

    let answerOld
    api.apiFetch.mockImplementationOnce(() => new Promise((resolve) => { answerOld = resolve }))
    const older = wrapper.vm.refreshLabels()
    api.apiFetch.mockImplementation(labels(['squad']))
    await wrapper.vm.refreshLabels()

    answerOld({ labels: ['stale'] })
    await older

    expect(wrapper.vm.labelKeys).toEqual(['squad'])
  })
})
