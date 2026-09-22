import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadError from '@/components/LoadError.vue'

describe('LoadError', () => {
  it('announces the title and message as an alert', () => {
    const wrapper = mount(LoadError, {
      props: { title: 'Reports could not be loaded', message: 'The Udash API is unavailable right now.' },
    })

    expect(wrapper.get('[role="alert"]').text()).toContain('Reports could not be loaded')
    expect(wrapper.text()).toContain('The Udash API is unavailable right now.')
  })

  it('asks for a retry', async () => {
    const wrapper = mount(LoadError, { props: { message: 'x' } })
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('shows the retry in progress', () => {
    const wrapper = mount(LoadError, { props: { message: 'x', retrying: true } })
    expect(wrapper.find('.v-btn--loading').exists()).toBe(true)
  })

  it('shrinks when compact', () => {
    const compact = mount(LoadError, { props: { message: 'x', compact: true } })
    const regular = mount(LoadError, { props: { message: 'x' } })
    expect(compact.find('.v-alert--density-compact').exists()).toBe(true)
    expect(regular.find('.v-alert--density-compact').exists()).toBe(false)
  })
})
