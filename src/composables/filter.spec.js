import { describe, expect, it, vi } from 'vitest'
import {
  decodeBase64UrlUtf8,
  decodeFilterState,
  encodeBase64UrlUtf8,
  encodeFilterState,
} from '@/composables/filter'

describe('base64url', () => {
  it('round-trips text outside of Latin-1', () => {
    const value = 'label: café — 日本語 🚀'
    expect(decodeBase64UrlUtf8(encodeBase64UrlUtf8(value))).toBe(value)
  })

  it('only uses characters that are safe in a URL', () => {
    // Bytes chosen to produce "+", "/" and padding in plain base64.
    const encoded = encodeBase64UrlUtf8('\u00fb\u00ff\u00bf?')
    expect(encoded).not.toMatch(/[+/=]/)
  })

  it('decodes every padding length', () => {
    for (const value of ['a', 'ab', 'abc', 'abcd']) {
      expect(decodeBase64UrlUtf8(encodeBase64UrlUtf8(value))).toBe(value)
    }
  })
})

describe('filter state', () => {
  it('round-trips a nested filter', () => {
    const state = { dateRange: [0, 30], labels: { team: 'infra' }, results: ['✗', '⚠'] }
    expect(decodeFilterState(encodeFilterState(state))).toEqual(state)
  })

  it('returns null for a missing or non-string blob', () => {
    expect(decodeFilterState('')).toBeNull()
    expect(decodeFilterState(undefined)).toBeNull()
    expect(decodeFilterState(42)).toBeNull()
  })

  it('returns null rather than throwing on a blob pasted by hand', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(decodeFilterState('not base64 at all!')).toBeNull()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('returns null when the blob decodes to something other than an object', () => {
    expect(decodeFilterState(encodeBase64UrlUtf8('"a string"'))).toBeNull()
    expect(decodeFilterState(encodeBase64UrlUtf8('null'))).toBeNull()
  })
})
