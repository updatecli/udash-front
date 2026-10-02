// safeHttpUrl keeps a link only when it is http or https, so a report cannot slip a
// javascript: URL into the page.
export function safeHttpUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : ''
  } catch {
    return ''
  }
}

// shortRepository reads a git repository url as "owner/name", dropping the host and the
// .git suffix.
export function shortRepository(url) {
  return String(url || '').replace(/^https?:\/\/[^/]+\//, '').replace(/\.git$/, '')
}
