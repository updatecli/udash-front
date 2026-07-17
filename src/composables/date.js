import { getStorageKey } from '@/composables/runtime'

export const FILTER_STORAGE_KEY = getStorageKey('scm.filter.v1')

export function toLocalDate(rawDate) {

    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })

    const formatter = new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'medium'
    })

    const date = new Date(rawDate)
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

export function formatToLayoutWithoutTimezone(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
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

        const start = Number(parsedFilter.dateRange[0])
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

        const end = Number(parsedFilter.dateRange[1])
        if (!Number.isFinite(end)) {
            return null
        }
        return stepToISO(end)

   } catch (error) {
        console.error('Error retrieving end time from storage:', error)
        return null
   }
}