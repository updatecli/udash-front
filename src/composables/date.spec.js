import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  FILTER_STORAGE_KEY,
  formatAbsoluteDate,
  formatToLayout,
  getEndTimeFromStorage,
  getStartTimeFromStorage,
  parseApiDate,
  stepToISO,
  toRelativeTime,
} from '@/composables/date'

// The test environment pins TZ to UTC, see vite.config.js.
const NOW = new Date('2026-09-22T12:00:00Z')

describe('parseApiDate', () => {
  it('reads the API timestamp format', () => {
    const date = parseApiDate('2026-09-21 09:16:41.459368 +0000 UTC')
    expect(date.toISOString()).toBe('2026-09-21T09:16:41.459Z')
  })

  it('applies the offset', () => {
    expect(parseApiDate('2026-09-21 09:16:41 +0200').toISOString()).toBe('2026-09-21T07:16:41.000Z')
  })

  it('reads ISO strings and passes dates through', () => {
    expect(parseApiDate('2026-09-21T09:16:41Z').toISOString()).toBe('2026-09-21T09:16:41.000Z')
    expect(parseApiDate(NOW)).toBe(NOW)
  })

  it('gives an invalid date for garbage', () => {
    expect(Number.isNaN(parseApiDate('yesterday').getTime())).toBe(true)
  })
})

describe('toRelativeTime', () => {
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

  it.each([
    ['2026-09-22T11:59:30Z', -30, 'second'],
    ['2026-09-22T11:57:00Z', -3, 'minute'],
    ['2026-09-22T07:00:00Z', -5, 'hour'],
    ['2026-09-20T12:00:00Z', -2, 'day'],
  ])('says %s is %i %s(s) away', (raw, value, unit) => {
    expect(toRelativeTime(raw, NOW.getTime())).toBe(rtf.format(value, unit))
  })

  it('falls back to the date once it is more than a month old', () => {
    const raw = '2026-06-01T12:00:00Z'
    expect(toRelativeTime(raw, NOW.getTime())).toBe(formatAbsoluteDate(raw))
  })

  it('returns an empty string for an unreadable date', () => {
    expect(toRelativeTime('nope', NOW.getTime())).toBe('')
    expect(formatAbsoluteDate('nope')).toBe('')
  })
})

describe('date range steps', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  it('formats a date in the API layout', () => {
    expect(formatToLayout(NOW)).toBe('2026-09-22 12:00:00+00:00')
  })

  it('counts the first 24 steps in hours and the rest in days', () => {
    expect(stepToISO(0)).toBe('2026-09-22 12:00:00+00:00')
    expect(stepToISO(5)).toBe('2026-09-22 07:00:00+00:00')
    expect(stepToISO(23)).toBe('2026-09-21 13:00:00+00:00')
    expect(stepToISO(24)).toBe('2026-09-21 12:00:00+00:00')
    expect(stepToISO(30)).toBe('2026-09-15 12:00:00+00:00')
  })

  it('reads the range from the stored filter, the furthest step being the start', () => {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify({ dateRange: [0, 24] }))
    expect(getStartTimeFromStorage()).toBe('2026-09-21 12:00:00+00:00')
    expect(getEndTimeFromStorage()).toBe('2026-09-22 12:00:00+00:00')
  })

  it.each([
    ['nothing stored', null],
    ['no range', JSON.stringify({})],
    ['a range of the wrong length', JSON.stringify({ dateRange: [0] })],
    ['a range that is not numbers', JSON.stringify({ dateRange: ['a', 'b'] })],
  ])('returns null with %s', (_, stored) => {
    if (stored !== null) {
      localStorage.setItem(FILTER_STORAGE_KEY, stored)
    }
    expect(getStartTimeFromStorage()).toBeNull()
    expect(getEndTimeFromStorage()).toBeNull()
  })

  it('returns null rather than throwing on corrupt storage', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    localStorage.setItem(FILTER_STORAGE_KEY, '{not json')
    expect(getStartTimeFromStorage()).toBeNull()
    expect(getEndTimeFromStorage()).toBeNull()
    error.mockRestore()
  })
})
