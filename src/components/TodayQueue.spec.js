import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { decodeFilterState } from '@/composables/filter'

const api = vi.hoisted(() => ({ apiFetch: vi.fn() }))

vi.mock('@/composables/api', async (importOriginal) => ({
  ...(await importOriginal()),
  apiFetch: api.apiFetch,
}))

function report(id, overrides = {}) {
  return {
    ID: id,
    Name: `Bump ${id}`,
    Result: '✗',
    UpdatedAt: '2026-09-22T11:57:00Z',
    Report: {
      Targets: { t1: { Scm: { URL: 'https://github.com/updatecli/udash.git', Branch: { Source: 'main' } } } },
      Actions: {},
    },
    ...overrides,
  }
}

// Answers the failing queue and the waiting queue from the endpoint each one asks.
function answer({ failing, waiting }) {
  api.apiFetch.mockImplementation(async (path) => {
    const result = path === '/pipeline/actions/search' ? waiting : failing
    if (result instanceof Error) {
      throw result
    }
    return result
  })
}

async function mountQueue() {
  vi.resetModules()
  const { default: TodayQueue } = await import('@/components/TodayQueue.vue')
  const wrapper = mount(TodayQueue, { global: { stubs: { RouterLink: RouterLinkStub } } })
  await flushPromises()
  return wrapper
}

function column(wrapper, key) {
  return wrapper.get(`[aria-labelledby="queue-${key}"]`)
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setInterval', 'Date'] })
  vi.setSystemTime(new Date('2026-09-22T12:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
  api.apiFetch.mockReset()
})

describe('TodayQueue', () => {
  it('asks for the latest failing reports and the open pull requests', async () => {
    answer({ failing: { data: [], total_count: 0 }, waiting: { data: [], total_count: 0 } })
    await mountQueue()

    const bodies = api.apiFetch.mock.calls.map(([path, { method, body }]) => ({ path, method, body }))
    expect(bodies).toEqual([
      { path: '/pipeline/reports/search', method: 'POST', body: { limit: 5, page: 1, latest: true, results: ['✗'] } },
      { path: '/pipeline/actions/search', method: 'POST', body: { limit: 5, page: 1 } },
    ])
  })

  it('lists each pipeline with its repository, branch and age', async () => {
    answer({ failing: { data: [report('a')], total_count: 1 }, waiting: { data: [], total_count: 0 } })
    const wrapper = await mountQueue()

    const item = column(wrapper, 'failing').get('li')
    expect(item.text()).toContain('Bump a')
    expect(item.text()).toContain('updatecli/udash · main')
    expect(item.text()).toContain('3 minutes ago')
    expect(item.findComponent(RouterLinkStub).props('to')).toBe('/pipeline/reports/a')
  })

  it('links the count to the dashboard filtered on the same pipelines', async () => {
    answer({ failing: { data: [report('a'), report('b')], total_count: 12 }, waiting: { data: [], total_count: 0 } })
    const wrapper = await mountQueue()

    const link = column(wrapper, 'failing').findComponent(RouterLinkStub)
    expect(link.text()).toBe('12 pipelines · see all')
    expect(link.props('to').path).toBe('/scm/dashboard')
    expect(decodeFilterState(link.props('to').query.filter)).toEqual({
      dateRange: [0, 53],
      selectedResults: ['✗'],
    })
  })

  it('lists each pull request once, linked to the dashboard', async () => {
    const waiting = {
      url: 'https://github.com/updatecli/udash/pull/7',
      title: 'Bump udash',
      repository: 'https://github.com/updatecli/udash.git',
      branch: 'main',
      updated_at: '2026-09-22T11:57:00Z',
      pipelines: [
        { id: 'p1', name: 'First manifest', result: '✔', updated_at: '2026-09-22T11:57:00Z' },
        { id: 'p2', name: 'Second manifest', result: '⚠', updated_at: '2026-09-22T11:50:00Z' },
      ],
    }
    answer({ failing: { data: [], total_count: 0 }, waiting: { data: [waiting], total_count: 1 } })
    const wrapper = await mountQueue()

    const items = column(wrapper, 'waiting').findAll('.pull-requests__item')
    expect(items).toHaveLength(1)
    expect(items[0].get('a[target="_blank"]').attributes('href')).toBe('https://github.com/updatecli/udash/pull/7')
    expect(items[0].text()).toContain('2 pipelines')

    const link = column(wrapper, 'waiting').findComponent(RouterLinkStub)
    expect(link.text()).toBe('1 pull request · see all')
    expect(decodeFilterState(link.props('to').query.filter)).toEqual({
      dateRange: [0, 53],
      selectedOpenAction: 'open',
    })
  })

  it('says so when a queue is empty', async () => {
    answer({ failing: { data: [], total_count: 0 }, waiting: { data: [], total_count: 0 } })
    const wrapper = await mountQueue()

    expect(column(wrapper, 'failing').text()).toContain('No pipeline is failing.')
    expect(column(wrapper, 'waiting').text()).toContain('No pull request is waiting.')
  })

  it('shows the error of the queue that failed, and retries it alone', async () => {
    answer({
      failing: Object.assign(new Error('boom'), { status: 503 }),
      waiting: { data: [], total_count: 0 },
    })
    const wrapper = await mountQueue()

    expect(column(wrapper, 'failing').get('[role="alert"]').text()).toContain('The Udash API is unavailable right now.')
    expect(column(wrapper, 'waiting').find('[role="alert"]').exists()).toBe(false)

    answer({ failing: { data: [report('a')], total_count: 1 }, waiting: { data: [], total_count: 0 } })
    api.apiFetch.mockClear()
    await column(wrapper, 'failing').get('button').trigger('click')
    await flushPromises()

    expect(api.apiFetch).toHaveBeenCalledOnce()
    expect(column(wrapper, 'failing').text()).toContain('Bump a')
  })

  it('keeps what is on screen when a quiet refresh fails', async () => {
    answer({ failing: { data: [report('a')], total_count: 1 }, waiting: { data: [], total_count: 0 } })
    const wrapper = await mountQueue()

    answer({ failing: new Error('offline'), waiting: new Error('offline') })
    await vi.advanceTimersByTimeAsync(60 * 1000)
    await flushPromises()

    expect(api.apiFetch).toHaveBeenCalledTimes(4)
    expect(column(wrapper, 'failing').text()).toContain('Bump a')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })
})
