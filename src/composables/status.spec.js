import { describe, expect, it } from 'vitest'
import {
  OPEN_ACTION_VALUES,
  PIPELINE_RESULT_VALUES,
  getPipelineResultText,
  getStatusColor,
  getStatusIcon,
  getStatusText,
  openActionToQuery,
} from '@/composables/status'

describe('status glyphs', () => {
  it.each([
    ['✔', 'success', 'mdi-check-circle', 'Success'],
    ['✗', 'error', 'mdi-close-circle', 'Failed'],
    ['⚠', 'warning', 'mdi-arrow-up-bold-circle', 'Changed'],
    ['-', 'result-skipped', 'mdi-minus-circle', 'Skipped'],
  ])('maps %s', (glyph, color, icon, text) => {
    expect(getStatusColor(glyph)).toBe(color)
    expect(getStatusIcon(glyph)).toBe(icon)
    expect(getStatusText(glyph)).toBe(text)
  })

  it('falls back for anything else', () => {
    expect(getStatusColor('?')).toBe('result-unknown')
    expect(getStatusIcon(undefined)).toBe('mdi-help-circle')
    expect(getStatusText('?')).toBe('Unknown')
    expect(getStatusText(undefined)).toBe('Unknown')
    expect(getStatusText('custom')).toBe('custom')
  })
})

describe('pipeline results', () => {
  it('names each result without its glyph', () => {
    expect(getPipelineResultText('✔')).toBe('Success')
    expect(getPipelineResultText('⚠')).toBe('Changed')
    expect(getPipelineResultText('✗')).toBe('Failed')
    expect(getPipelineResultText('-')).toBe('Skipped')
    expect(getPipelineResultText('?')).toBe('Unknown')
  })

  it('lists the values a restored filter may hold', () => {
    expect(PIPELINE_RESULT_VALUES).toEqual(['✔', '⚠', '✗', '-'])
    expect(OPEN_ACTION_VALUES).toEqual(['open', 'none'])
  })

  it('maps the open action filter to the API boolean', () => {
    expect(openActionToQuery('open')).toBe(true)
    expect(openActionToQuery('none')).toBe(false)
    expect(openActionToQuery(null)).toBeUndefined()
    expect(openActionToQuery('bogus')).toBeUndefined()
  })
})
