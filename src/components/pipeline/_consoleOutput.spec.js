import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

vi.mock('@/composables/clipboard', () => ({ copyText: vi.fn() }))

import { copyText } from '@/composables/clipboard'
import ConsoleOutput, { CONSOLE_OUTPUT_LIMIT } from '@/components/pipeline/_consoleOutput.vue'

// open expands the panel, whose body is only rendered once opened.
async function open(wrapper) {
  await wrapper.get('.v-expansion-panel-title').trigger('click')
  await flushPromises()
}

describe('ConsoleOutput', () => {
  beforeEach(() => copyText.mockReset())

  it('names the output and counts its lines while collapsed', () => {
    const wrapper = mount(ConsoleOutput, { props: { data: 'one\ntwo\nthree\n' } })

    expect(wrapper.text()).toContain('Console output')
    expect(wrapper.text()).toContain('3 lines')
    expect(wrapper.find('pre').exists()).toBe(false)
  })

  it('takes its title from the caller', () => {
    const wrapper = mount(ConsoleOutput, { props: { data: 'x', title: 'Target output' } })
    expect(wrapper.text()).toContain('Target output')
    expect(wrapper.text()).toContain('1 line')
  })

  it('shows the log as plain text once opened', async () => {
    const wrapper = mount(ConsoleOutput, { props: { data: 'ERROR something <b>broke</b>' } })
    await open(wrapper)

    expect(wrapper.get('pre').text()).toBe('ERROR something <b>broke</b>')
    expect(wrapper.text()).not.toContain('Earlier output was cut')
  })

  it('warns that the beginning is missing when the output reached the cap', async () => {
    const wrapper = mount(ConsoleOutput, { props: { data: 'a'.repeat(CONSOLE_OUTPUT_LIMIT) } })
    await open(wrapper)

    expect(wrapper.text()).toContain('Earlier output was cut')
  })

  it('copies the whole output', async () => {
    copyText.mockResolvedValue(true)
    const wrapper = mount(ConsoleOutput, { props: { data: 'line 1\nline 2' } })
    await open(wrapper)

    await wrapper.get('button[aria-label="Copy console output"]').trigger('click')
    await flushPromises()

    expect(copyText).toHaveBeenCalledWith('line 1\nline 2')
    expect(wrapper.find('button[aria-label="Copied"]').exists()).toBe(true)
  })

  it('says so when the browser blocks copying', async () => {
    copyText.mockResolvedValue(false)
    const wrapper = mount(ConsoleOutput, { props: { data: 'x' } })
    await open(wrapper)

    await wrapper.get('button[aria-label="Copy console output"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('Copying is blocked')
  })
})
