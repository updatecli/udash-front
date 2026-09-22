import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ResourceDescription from '@/components/pipeline/ResourceDescription.vue'

describe('ResourceDescription', () => {
  it('shows quoted content as a block of its own', () => {
    const wrapper = mount(ResourceDescription, {
      props: { text: '1 file(s) updated with "FROM node:24\\nRUN npm ci":\n* Dockerfile' },
    })

    expect(wrapper.get('code').text()).toBe('FROM node:24\nRUN npm ci')
    const paragraphs = wrapper.findAll('p').map((p) => p.text())
    expect(paragraphs).toEqual(['1 file(s) updated with:', '* Dockerfile'])
  })

  it('shows a plain description as text', () => {
    const wrapper = mount(ResourceDescription, { props: { text: 'version set to "1.2.3"' } })
    expect(wrapper.find('code').exists()).toBe(false)
    expect(wrapper.text()).toBe('version set to "1.2.3"')
  })

  it('says when there is no description', () => {
    expect(mount(ResourceDescription).text()).toBe('No description')
  })
})
