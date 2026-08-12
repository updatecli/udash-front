// Filter state travels in the URL as a single base64url blob rather than as one query
// parameter per field, because it nests: the labels are a map and the date range is a
// pair of steps. Encoding it keeps a filtered view shareable as a plain link.
//
// It is read by the filter component on load and written whenever the filter is
// applied, so anything building a link to a filtered view has to speak the same
// format, which is why these live here rather than inside that component.

export function encodeBase64UrlUtf8(value) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

export function decodeBase64UrlUtf8(value) {
  const padded = value
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(value.length + (4 - (value.length % 4 || 4)), '=')

  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function encodeFilterState(state) {
  return encodeBase64UrlUtf8(JSON.stringify(state))
}

// decodeFilterState returns null rather than throwing: the blob comes from the URL,
// so it is whatever the reader pasted, and an unreadable one means falling back to
// the default filter rather than breaking the page.
export function decodeFilterState(encoded) {
  if (!encoded || typeof encoded !== 'string') {
    return null
  }

  try {
    const decoded = JSON.parse(decodeBase64UrlUtf8(encoded))
    return decoded && typeof decoded === 'object' ? decoded : null
  } catch (error) {
    console.warn('Unable to decode filter state', error)
    return null
  }
}
