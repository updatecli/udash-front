import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PageTitle from '@/components/PageTitle.vue'

describe('PageTitle', () => {
  it('renders one h1 with the title', () => {
    const wrapper = mount(PageTitle, { props: { title: 'Pipeline reports' } })
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.get('h1').text()).toBe('Pipeline reports')
  })

  it('reserves no subtitle paragraph when there is none', () => {
    const wrapper = mount(PageTitle, { props: { title: 'Reports' } })
    expect(wrapper.find('p').exists()).toBe(false)
  })

  it('takes the subtitle from the prop or from the slot', () => {
    const fromProp = mount(PageTitle, { props: { title: 'Reports', subtitle: 'Latest runs' } })
    expect(fromProp.get('p').text()).toBe('Latest runs')

    const fromSlot = mount(PageTitle, {
      props: { title: 'Reports' },
      slots: { subtitle: '<strong>From the slot</strong>' },
    })
    expect(fromSlot.get('p strong').text()).toBe('From the slot')
  })

  it('renders the actions slot on the compact bar only', () => {
    const slots = { actions: '<button class="action">Refresh</button>' }
    expect(mount(PageTitle, { props: { title: 'Reports' }, slots }).find('.action').exists()).toBe(true)
    expect(mount(PageTitle, { props: { title: 'Home', hero: true }, slots }).find('.action').exists()).toBe(false)
  })

  it('labels the tooltip button after the page', () => {
    const wrapper = mount(PageTitle, { props: { title: 'Tokens', tooltip: 'Tokens let Updatecli publish reports' } })
    expect(wrapper.get('button').attributes('aria-label')).toBe('About Tokens')
  })

  it('renders the icon', () => {
    const wrapper = mount(PageTitle, { props: { title: 'Reports', icon: 'mdi-view-dashboard' } })
    expect(wrapper.find('h1 .v-icon').exists()).toBe(true)
  })
})
