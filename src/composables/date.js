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
