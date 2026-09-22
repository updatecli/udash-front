import { getStorageKey } from '@/composables/runtime'

export const FILTER_STORAGE_KEY = getStorageKey('scm.filter.v1')

// parseApiDate reads the API's timestamps ("2026-09-21 09:16:41.459368 +0000 UTC") as well
// as ISO strings. Safari rejects the API form outright, so it is rewritten to ISO first.
export function parseApiDate(raw) {
    if (raw instanceof Date) {
        return raw
    }

    const match = String(raw || '').match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(\.\d+)?\s*([+-]\d{2}):?(\d{2})/)
    if (match) {
        const fraction = match[3] ? match[3].slice(0, 4) : ''
        return new Date(`${match[1]}T${match[2]}${fraction}${match[4]}:${match[5]}`)
    }

    return new Date(raw)
}

// toRelativeTime says how long ago something happened ("3 minutes ago", "2 days ago"),
// falling back to the date once it is more than a month old.
export function toRelativeTime(raw, now = Date.now()) {
    const date = parseApiDate(raw)
    if (Number.isNaN(date.getTime())) {
        return ''
    }

    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
    const seconds = Math.round((date.getTime() - now) / 1000)
    const steps = [[60, 'second'], [60, 'minute'], [24, 'hour'], [30, 'day']]

    let value = seconds
    for (const [size, unit] of steps) {
        if (Math.abs(value) < size) {
            return rtf.format(value, unit)
        }
        value = Math.round(value / size)
    }

    return formatAbsoluteDate(date)
}

export function formatAbsoluteDate(raw) {
    const date = parseApiDate(raw)
    if (Number.isNaN(date.getTime())) {
        return ''
    }

    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'medium' }).format(date)
}

export function toLocalDate(rawDate) {

    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })

    const formatter = new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'medium'
    })

    const date = parseApiDate(rawDate)
    const now = new Date()
    const diffSec = Math.floor((now - date) / 1000)

    if (diffSec < 60) {
        return rtf.format(-diffSec, 'second')
    }

    const distMin = Math.floor(diffSec / 60)
    if (distMin < 60) {
        return rtf.format(-distMin, 'minute')
    }

    return formatter.format(date)
}


function stepToDate(step) {
      const now = new Date(Date.now())
      const date = new Date(now)

      if (step < 24) {
        date.setHours(date.getHours() - step)
      } else {
        const daysAgo = step - 23
        date.setDate(date.getDate() - daysAgo)
      }

      return date
}

export function stepToISO(step) {
      return formatToLayout(stepToDate(step))
}

export function formatToLayout(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')

      const offset = -date.getTimezoneOffset()
      const offsetHours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0')
      const offsetMinutes = String(Math.abs(offset) % 60).padStart(2, '0')
      const sign = offset >= 0 ? '+' : '-'
      const tzOffset = `${sign}${offsetHours}:${offsetMinutes}`

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}${tzOffset}`
}

export function getStartTimeFromStorage() {
    try{
        const storedFilter = localStorage.getItem(FILTER_STORAGE_KEY)
        if (!storedFilter) {
            return null
        }

        const parsedFilter = JSON.parse(storedFilter)
        if (!Array.isArray(parsedFilter.dateRange) || parsedFilter.dateRange.length !== 2) {
            return null
        }

        // dateRange[0] is the step closest to now, dateRange[1] the furthest back, so
        // the range starts at the second entry.
        const start = Number(parsedFilter.dateRange[1])
        if (!Number.isFinite(start)) {
            return null
        }
        return stepToISO(start)

   } catch (error) {
        console.error('Error retrieving start time from storage:', error)
        return null
   }
}

export function getEndTimeFromStorage() {
    try{
        const storedFilter = localStorage.getItem(FILTER_STORAGE_KEY)
        if (!storedFilter) {
            return null
        }

        const parsedFilter = JSON.parse(storedFilter)
        if (!Array.isArray(parsedFilter.dateRange) || parsedFilter.dateRange.length !== 2) {
            return null
        }

        const end = Number(parsedFilter.dateRange[0])
        if (!Number.isFinite(end)) {
            return null
        }
        return stepToISO(end)

   } catch (error) {
        console.error('Error retrieving end time from storage:', error)
        return null
   }
}