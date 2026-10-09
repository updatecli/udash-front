import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { VPagination } from 'vuetify/components'

const api = vi.hoisted(() => ({ apiFetch: vi.fn() }))

vi.mock('@/composables/api', async (importOriginal) => ({
  ...(await importOriginal()),
  apiFetch: api.apiFetch,
}))

const auth = vi.hoisted(() => ({ login: vi.fn(async () => {}) }))

vi.mock('@/composables/auth', async (importOriginal) => ({
  ...(await importOriginal()),
  login: auth.login,
}))

function action(n, overrides = {}) {
  return {
    url: `https://github.com/updatecli/udash/pull/${n}`,
    title: `Bump dependency ${n}`,
    repository: 'https://github.com/updatecli/udash.git',
    branch: 'main',
    updated_at: '2026-09-22T11:57:00Z',
    pipelines: [{ id: `p${n}`, name: `Pipeline ${n}`, result: '✔', updated_at: '2026-09-22T11:57:00Z' }],
    ...overrides,
  }
}

function answer(response) {
  api.apiFetch.mockImplementation(async () => {
    if (response instanceof Error) throw response
    return response
  })
}

// jsdom has no visualViewport, which VMenu needs to position itself. The stub renders
// the menu items inline, next to their activator.
const MenuStub = {
  template: '<div><slot name="activator" :props="{}" /><slot /></div>',
}

async function mountList(props = {}) {
  vi.resetModules()
  const { default: PullRequestList } = await import('@/components/PullRequestList.vue')
  const wrapper = mount(PullRequestList, { props, global: { stubs: { RouterLink: RouterLinkStub, VMenu: MenuStub } } })
  await flushPromises()
  return wrapper
}

function lastBody() {
  return api.apiFetch.mock.calls.at(-1)[1].body
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setInterval', 'Date'] })
  vi.setSystemTime(new Date('2026-09-22T12:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
  api.apiFetch.mockReset()
  auth.login.mockClear()
  delete window.config
})

// answerAcknowledging answers searches with search (a value, or a function of the request
// body) and acknowledgement requests with change (null, as for a 204, by default).
function answerAcknowledging(search, change = null) {
  api.apiFetch.mockImplementation(async (path, { body } = {}) => {
    if (path.startsWith('/pipeline/actions/ack')) {
      if (change instanceof Error) throw change
      return change
    }
    return typeof search === 'function' ? search(body) : search
  })
}

function ackCalls() {
  return api.apiFetch.mock.calls.filter(([path]) => path.startsWith('/pipeline/actions/ack'))
}

// pickDays picks a duration from the acknowledge menu of the first row.
async function pickDays(wrapper, label) {
  const item = wrapper.findAll('.pull-requests__item .v-list-item').find((element) => element.text().includes(label))
  await item.trigger('click')
  await flushPromises()
}

describe('PullRequestList', () => {
  it('asks for the open pull requests matching the filter', async () => {
    answer({ data: [], total_count: 0 })
    await mountList({
      limit: 10,
      filter: {
        startTime: '2026-09-01T00:00:00Z',
        endTime: '2026-09-02T00:00:00Z',
        labels: { team: 'infra' },
        results: ['✗'],
        openAction: true,
      },
    })

    expect(api.apiFetch).toHaveBeenCalledWith('/pipeline/actions/search', {
      method: 'POST',
      body: {
        start_time: '2026-09-01T00:00:00Z',
        end_time: '2026-09-02T00:00:00Z',
        labels: { team: 'infra' },
        results: ['✗'],
        limit: 10,
        page: 1,
      },
    })
  })

  it('narrows the pull requests to the repository branch the filter picked', async () => {
    answer({ data: [], total_count: 0 })
    await mountList({ filter: { scmid: 'scm-1', results: ['✗'] } })

    expect(lastBody()).toEqual({ results: ['✗'], scmid: 'scm-1', limit: 5, page: 1 })
  })

  it('lists a pull request with its repository, age and pipeline', async () => {
    answer({ data: [action(7)], total_count: 1 })
    const wrapper = await mountList()

    const item = wrapper.get('.pull-requests__item')
    const link = item.get('a[target="_blank"]')
    expect(link.attributes('href')).toBe('https://github.com/updatecli/udash/pull/7')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
    expect(item.text()).toContain('Bump dependency 7')
    expect(item.text()).toContain('updatecli/udash · main')
    expect(item.text()).toContain('3 minutes ago')
    expect(item.findComponent(RouterLinkStub).props('to')).toBe('/pipeline/reports/p7')
    expect(item.find('.pull-requests__toggle').exists()).toBe(false)
    expect(wrapper.text()).toContain('1 pull request')
  })

  it('leads with the worst result and tallies the pipelines of a pull request fed by several', async () => {
    answer({
      data: [action(7, {
        pipelines: [
          { id: 'a', name: 'First manifest', result: '✔' },
          { id: 'b', name: 'Second manifest', result: '✗' },
          { id: 'c', name: 'Third manifest', result: '✔' },
        ],
      })],
      total_count: 1,
    })
    const wrapper = await mountList()

    expect(wrapper.get('.pull-requests__icon').classes()).toContain('text-error')

    const toggle = wrapper.get('.pull-requests__toggle')
    expect(toggle.text()).toContain('✗ 1')
    expect(toggle.text()).toContain('✔ 2')
    expect(toggle.text()).toContain('3 pipelines')
    expect(toggle.attributes('aria-label')).toBe('3 pipelines feeding Bump dependency 7: 1 failed, 2 success')
    expect(toggle.attributes('aria-expanded')).toBe('false')

    // The list it controls always exists, hidden until expanded.
    const list = wrapper.get(`#${toggle.attributes('aria-controls')}`)
    expect(list.attributes('style')).toContain('display: none')

    await toggle.trigger('click')

    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(list.attributes('style') || '').not.toContain('display: none')
    // The failing pipeline comes first, and each result is spelled out for screen readers.
    const links = wrapper.findAllComponents(RouterLinkStub)
    expect(links.map((link) => link.props('to'))).toEqual(['/pipeline/reports/b', '/pipeline/reports/a', '/pipeline/reports/c'])
    expect(list.findAll('li')[0].text()).toContain('Failed:')
  })

  it('dims the pipelines the result filter left out', async () => {
    answer({
      data: [action(7, {
        pipelines: [
          { id: 'a', name: 'Changed', result: '⚠' },
          { id: 'b', name: 'Failing', result: '✗' },
        ],
      })],
      total_count: 1,
    })
    const wrapper = await mountList({ filter: { results: ['✗'] } })

    const items = wrapper.findAll('.pull-requests__pipelines li')
    expect(items[0].classes()).not.toContain('pull-requests__pipeline--unmatched')
    expect(items[1].classes()).toContain('pull-requests__pipeline--unmatched')
  })

  it('falls back to the link, as an identifier, when the pull request has no title', async () => {
    answer({ data: [action(7, { title: '', url: 'https://gitlab.com/group/project/-/merge_requests/7' })], total_count: 1 })
    const wrapper = await mountList()

    const title = wrapper.get('.pull-requests__title')
    expect(title.text()).toContain('gitlab.com/group/project/-/merge_requests/7')
    expect(title.classes()).toContain('text-mono')
    expect(title.text()).toContain('opens the merge request in a new tab')
  })

  it('lists a pull request whose link is not http or https as plain text', async () => {
    answer({ data: [action(7, { url: 'javascript:alert(1)', title: 'Unsafe' }), action(8)], total_count: 2 })
    const wrapper = await mountList()

    // Both are counted and listed, only the safe one is a link.
    expect(wrapper.findAll('.pull-requests__item')).toHaveLength(2)
    const hrefs = wrapper.findAll('a[target="_blank"]').map((link) => link.attributes('href'))
    expect(hrefs).toEqual(['https://github.com/updatecli/udash/pull/8'])
    const unsafe = wrapper.findAll('.pull-requests__title')[0]
    expect(unsafe.element.tagName).toBe('SPAN')
    expect(unsafe.text()).toBe('Unsafe')
  })

  it('keeps the pager on the rows shown when the page asked for fails to load', async () => {
    answer({ data: [action(1)], total_count: 30 })
    const wrapper = await mountList({ paginated: true, limit: 10 })

    api.apiFetch.mockImplementation(async () => { throw Object.assign(new Error('boom'), { status: 503 }) })
    wrapper.getComponent(VPagination).vm.$emit('update:modelValue', 3)
    await flushPromises()

    expect(wrapper.getComponent(VPagination).props('modelValue')).toBe(1)
    expect(wrapper.text()).toContain('Bump dependency 1')
    expect(wrapper.get('.pull-requests__page-error').text()).toBe('Page 3 could not be loaded. The Udash API is unavailable right now. Try again in a moment.')

    // A later refresh still reads the page on screen, not the one that failed, and keeps
    // saying the page asked for could not be loaded.
    answer({ data: [action(1)], total_count: 30 })
    await vi.advanceTimersByTimeAsync(60 * 1000)
    await flushPromises()
    expect(lastBody()).toMatchObject({ page: 1 })
    expect(wrapper.find('.pull-requests__page-error').exists()).toBe(true)

    // Asking for a page again replaces it.
    answer({ data: [action(11)], total_count: 30 })
    wrapper.getComponent(VPagination).vm.$emit('update:modelValue', 2)
    await flushPromises()
    expect(wrapper.find('.pull-requests__page-error').exists()).toBe(false)
  })

  it('drops the count of the previous filter while the new one loads', async () => {
    answer({ data: [action(1)], total_count: 12 })
    const wrapper = await mountList({ filter: {}, countQualifier: 'in this period' })
    expect(wrapper.get('.pull-requests__count').text()).toBe('12 pull requests in this period')

    api.apiFetch.mockImplementation(() => new Promise(() => {}))
    await wrapper.setProps({ filter: { results: ['✗'] } })

    expect(wrapper.find('.pull-requests__count').exists()).toBe(false)
  })

  it('pages through every pull request', async () => {
    answer({ data: [action(1), action(2)], total_count: 30 })
    const wrapper = await mountList({ paginated: true, limit: 10 })

    expect(lastBody()).toMatchObject({ limit: 10, page: 1 })
    const pagination = wrapper.getComponent(VPagination)
    expect(pagination.props('length')).toBe(3)

    pagination.vm.$emit('update:modelValue', 2)
    await flushPromises()
    expect(lastBody()).toMatchObject({ limit: 10, page: 2 })
    expect(wrapper.get('[aria-live="polite"]').text()).toBe('Page 2 of 3, pull requests 11 to 12 of 30')
  })

  it('shows only the first page when it is not paginated', async () => {
    answer({ data: [action(1)], total_count: 30 })
    const wrapper = await mountList({ limit: 5 })

    expect(lastBody()).toMatchObject({ limit: 5, page: 1 })
    expect(wrapper.findComponent(VPagination).exists()).toBe(false)
  })

  it('does not offer pages when everything fits on one', async () => {
    answer({ data: [action(1)], total_count: 10 })
    const wrapper = await mountList({ paginated: true, limit: 10 })

    expect(wrapper.findComponent(VPagination).exists()).toBe(false)
  })

  it('goes back to the first page when the filter changes', async () => {
    answer({ data: [action(1)], total_count: 30 })
    const wrapper = await mountList({ paginated: true, limit: 10, filter: {} })

    wrapper.getComponent(VPagination).vm.$emit('update:modelValue', 3)
    await flushPromises()
    api.apiFetch.mockClear()

    await wrapper.setProps({ filter: { results: ['⚠'] } })
    await flushPromises()

    expect(api.apiFetch).toHaveBeenCalledOnce()
    expect(lastBody()).toEqual({ results: ['⚠'], limit: 10, page: 1 })
  })

  it('moves back to the last page when a refresh leaves the current one past it', async () => {
    answer({ data: [action(1)], total_count: 30 })
    const wrapper = await mountList({ paginated: true, limit: 10 })
    wrapper.getComponent(VPagination).vm.$emit('update:modelValue', 3)
    await flushPromises()

    // Pull requests got merged: 12 are left, so page 3 of 10 no longer exists.
    api.apiFetch.mockImplementation(async (path, { body }) => (
      body.page === 3 ? { data: [], total_count: 12 } : { data: [action(11), action(12)], total_count: 12 }
    ))
    await vi.advanceTimersByTimeAsync(60 * 1000)
    await flushPromises()

    expect(lastBody()).toMatchObject({ page: 2 })
    expect(wrapper.text()).toContain('Bump dependency 12')
  })

  it('keeps the page asked for when a refresh comes before it arrived', async () => {
    answer({ data: [action(1)], total_count: 30 })
    const wrapper = await mountList({ paginated: true, limit: 10 })

    api.apiFetch.mockImplementation(() => new Promise(() => {}))
    wrapper.getComponent(VPagination).vm.$emit('update:modelValue', 3)
    await flushPromises()

    answer({ data: [action(21)], total_count: 30 })
    await vi.advanceTimersByTimeAsync(60 * 1000)
    await flushPromises()

    expect(lastBody()).toMatchObject({ page: 3 })
    expect(wrapper.getComponent(VPagination).props('modelValue')).toBe(3)
    expect(wrapper.text()).toContain('Bump dependency 21')
    expect(wrapper.get('[aria-live="polite"]').text()).toBe('Page 3 of 3, pull requests 21 to 21 of 30')
  })

  it('says nothing when a refresh fails to move back to the last page', async () => {
    answer({ data: [action(1)], total_count: 30 })
    const wrapper = await mountList({ paginated: true, limit: 10 })
    wrapper.getComponent(VPagination).vm.$emit('update:modelValue', 3)
    await flushPromises()

    api.apiFetch.mockImplementation(async (path, { body }) => {
      if (body.page === 3) return { data: [], total_count: 12 }
      throw Object.assign(new Error('boom'), { status: 503 })
    })
    await vi.advanceTimersByTimeAsync(60 * 1000)
    await flushPromises()

    expect(lastBody()).toMatchObject({ page: 2 })
    expect(wrapper.find('.pull-requests__page-error').exists()).toBe(false)
  })

  it('qualifies the count when a filter narrows it', async () => {
    answer({ data: [action(1)], total_count: 3 })
    const wrapper = await mountList({ countQualifier: 'in this period' })

    expect(wrapper.get('.pull-requests__count').text()).toBe('3 pull requests in this period')
  })

  it('links the count when it is given somewhere to go', async () => {
    answer({ data: [action(1)], total_count: 12 })
    const wrapper = await mountList({ seeAllLink: '/scm/dashboard' })

    const link = wrapper.findAllComponents(RouterLinkStub).find((stub) => stub.props('to') === '/scm/dashboard')
    expect(link.text()).toBe('12 pull requests · see all')
  })

  it('says so when no pull request is waiting', async () => {
    answer({ data: [], total_count: 0 })
    const wrapper = await mountList()

    expect(wrapper.text()).toContain('No pull request is waiting.')
  })

  it('acknowledges a pull request for the days picked, then reloads without it', async () => {
    let acknowledged = false
    answerAcknowledging(() => (acknowledged
      ? { data: [], total_count: 0, acknowledged_count: 1 }
      : { data: [action(7)], total_count: 1, acknowledged_count: 0 }))
    const wrapper = await mountList()
    expect(wrapper.find('.pull-requests__acknowledged').exists()).toBe(false)

    api.apiFetch.mockImplementationOnce(async () => {
      acknowledged = true
      return null
    })
    await pickDays(wrapper, '7 days')

    expect(ackCalls()).toEqual([['/pipeline/actions/ack', {
      method: 'PUT',
      body: { url: 'https://github.com/updatecli/udash/pull/7', days: 7, result: '✔' },
      signInOnUnauthorized: false,
    }]])
    expect(lastBody()).toEqual({ limit: 5, page: 1 })
    expect(wrapper.text()).toContain('No pull request is waiting.')
    expect(wrapper.get('.pull-requests__notice').text()).toBe('Acknowledged Bump dependency 7 for 7 days. Undo')
    expect(wrapper.get('.pull-requests__acknowledged').text()).toBe('Show 1 acknowledged')
  })

  it('acknowledges a pull request whose result it does not know as unknown', async () => {
    answerAcknowledging({
      data: [action(7, { pipelines: [{ id: 'a', name: 'Odd', result: 'weird' }] })],
      total_count: 1,
    })
    const wrapper = await mountList()

    await pickDays(wrapper, '1 day')

    expect(ackCalls()[0][1].body).toMatchObject({ days: 1, result: '?' })
  })

  it('undoes the acknowledgement just made', async () => {
    answerAcknowledging({ data: [action(7)], total_count: 1 })
    const wrapper = await mountList()
    await pickDays(wrapper, '30 days')

    await wrapper.get('.pull-requests__notice button').trigger('click')
    await flushPromises()

    expect(ackCalls().at(-1)).toEqual([
      '/pipeline/actions/ack?url=https%3A%2F%2Fgithub.com%2Fupdatecli%2Fudash%2Fpull%2F7',
      { method: 'DELETE', signInOnUnauthorized: false },
    ])
    expect(wrapper.find('.pull-requests__notice').exists()).toBe(false)
  })

  it('lists the acknowledged pull requests on demand, and brings one back', async () => {
    answerAcknowledging((body) => (body.acknowledged
      ? {
        data: [action(3, { acknowledgement: { until: '2026-09-29T12:00:00Z', by: 'Pat' } })],
        total_count: 1,
        acknowledged_count: 1,
      }
      : { data: [action(1)], total_count: 1, acknowledged_count: 1 }))
    const wrapper = await mountList()

    await wrapper.get('.pull-requests__acknowledged').trigger('click')
    await flushPromises()

    expect(lastBody()).toEqual({ acknowledged: true, limit: 5, page: 1 })
    expect(wrapper.get('.pull-requests__count').text()).toBe('1 acknowledged pull request')
    expect(wrapper.get('.pull-requests__meta').text()).toContain('Acknowledged by Pat, back in 7 days')
    expect(wrapper.get('.pull-requests__acknowledged').text()).toBe('Hide acknowledged')

    const unacknowledge = wrapper.get('.pull-requests__ack')
    expect(unacknowledge.attributes('aria-label')).toBe('Unacknowledge Bump dependency 3')
    await unacknowledge.trigger('click')
    await flushPromises()

    expect(ackCalls()).toEqual([[
      '/pipeline/actions/ack?url=https%3A%2F%2Fgithub.com%2Fupdatecli%2Fudash%2Fpull%2F3',
      { method: 'DELETE', signInOnUnauthorized: false },
    ]])

    await wrapper.get('.pull-requests__acknowledged').trigger('click')
    await flushPromises()
    expect(lastBody()).toEqual({ limit: 5, page: 1 })
  })

  it('keeps the pull request and says why when it cannot be acknowledged', async () => {
    answerAcknowledging({ data: [action(7)], total_count: 1 }, Object.assign(new Error('forbidden'), { status: 403 }))
    const wrapper = await mountList()

    await pickDays(wrapper, '7 days')

    expect(wrapper.get('.pull-requests__change-error').text())
      .toBe('Your account is not allowed to acknowledge Bump dependency 7.')
    expect(wrapper.text()).toContain('Bump dependency 7')
    expect(wrapper.find('.pull-requests__notice').exists()).toBe(false)
  })

  it('offers to acknowledge even signed out, since only the API knows whether that needs a session', async () => {
    window.config = { AUTH_ENABLED: 'true', AUTH_VISIBILITY: 'public' }
    answerAcknowledging({ data: [action(7)], total_count: 1, acknowledged_count: 2 })
    const wrapper = await mountList()

    expect(wrapper.get('.pull-requests__ack').attributes('aria-label')).toBe('Acknowledge Bump dependency 7')
    expect(wrapper.get('.pull-requests__acknowledged').text()).toBe('Show 2 acknowledged')
  })

  it('offers to sign in, rather than leaving the page, when the API wants a session to acknowledge', async () => {
    window.config = { AUTH_ENABLED: 'true', AUTH_VISIBILITY: 'public' }
    answerAcknowledging({ data: [action(7)], total_count: 1 }, Object.assign(new Error('unauthorized'), { status: 401 }))
    const wrapper = await mountList()

    await pickDays(wrapper, '1 day')

    expect(ackCalls()[0][1]).toMatchObject({ signInOnUnauthorized: false })
    expect(auth.login).not.toHaveBeenCalled()
    expect(wrapper.get('.pull-requests__change-error').text()).toBe('Sign in to acknowledge Bump dependency 7. Sign in')
    expect(wrapper.text()).toContain('Bump dependency 7')

    await wrapper.get('.pull-requests__change-error button').trigger('click')
    expect(auth.login).toHaveBeenCalledWith('/')
  })

  it('does not offer to sign in again when the API refused the session already open', async () => {
    window.config = { AUTH_ENABLED: 'true', AUTH_VISIBILITY: 'public' }
    answerAcknowledging({ data: [action(7)], total_count: 1 }, Object.assign(new Error('unauthorized'), { status: 401 }))
    const wrapper = await mountList()
    const { useAuth } = await import('@/composables/auth')
    useAuth().isAuthenticated.value = true

    await pickDays(wrapper, '1 day')

    expect(wrapper.get('.pull-requests__change-error').text()).toBe(
      'Could not acknowledge Bump dependency 7: the Udash API did not accept your session. Sign out, then sign in again.',
    )
    expect(wrapper.find('.pull-requests__change-error button').exists()).toBe(false)
  })

  it('sends a single request however many times Undo is pressed', async () => {
    answerAcknowledging({ data: [action(7)], total_count: 1 })
    const wrapper = await mountList()
    await pickDays(wrapper, '7 days')

    let settle
    api.apiFetch.mockImplementationOnce(() => new Promise((resolve) => { settle = resolve }))
    const undo = wrapper.get('.pull-requests__notice button')
    await undo.trigger('click')
    await undo.trigger('click')
    settle(null)
    await flushPromises()

    expect(ackCalls().filter(([, options]) => options.method === 'DELETE')).toHaveLength(1)
  })

  it('says sign-in is off rather than offering it, when this frontend has none', async () => {
    answerAcknowledging({ data: [action(7)], total_count: 1 }, Object.assign(new Error('unauthorized'), { status: 401 }))
    const wrapper = await mountList()

    await pickDays(wrapper, '1 day')

    expect(wrapper.get('.pull-requests__change-error').text()).toBe(
      'Could not acknowledge Bump dependency 7: the Udash API wants somebody signed in, and sign-in is turned off in this frontend (AUTH_ENABLED).',
    )
    expect(wrapper.find('.pull-requests__change-error button').exists()).toBe(false)
  })

  it('still leads back to the waiting pull requests when the acknowledged ones fail to load', async () => {
    answerAcknowledging((body) => {
      if (body.acknowledged) throw Object.assign(new Error('boom'), { status: 503 })
      return { data: [action(1)], total_count: 1, acknowledged_count: 2 }
    })
    const wrapper = await mountList()

    await wrapper.get('.pull-requests__acknowledged').trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)

    await wrapper.get('.pull-requests__acknowledged').trigger('click')
    await flushPromises()

    expect(lastBody()).toEqual({ limit: 5, page: 1 })
    expect(wrapper.text()).toContain('Bump dependency 1')
  })

  it('does not report an acknowledgement on a list the reader left meanwhile', async () => {
    answerAcknowledging({ data: [action(7)], total_count: 1, acknowledged_count: 1 })
    const wrapper = await mountList()

    let settle
    api.apiFetch.mockImplementationOnce(() => new Promise((resolve) => { settle = resolve }))
    await pickDays(wrapper, '7 days')

    await wrapper.get('.pull-requests__acknowledged').trigger('click')
    settle(null)
    await flushPromises()

    expect(lastBody()).toMatchObject({ acknowledged: true })
    expect(wrapper.find('.pull-requests__notice').exists()).toBe(false)
  })

  it('shows the error and retries', async () => {
    answer(Object.assign(new Error('boom'), { status: 503 }))
    const wrapper = await mountList()

    expect(wrapper.get('[role="alert"]').text()).toContain('The Udash API is unavailable right now.')

    answer({ data: [action(1)], total_count: 1 })
    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Bump dependency 1')
  })
})
