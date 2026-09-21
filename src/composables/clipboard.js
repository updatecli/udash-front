// copyText puts text on the clipboard and resolves to whether it worked.
//
// navigator.clipboard only exists in a secure context, and self-hosted instances are
// often served over plain http on an internal network, so the legacy execCommand path
// is kept as a fallback rather than letting the copy button silently do nothing. It is
// deprecated but still the only option there. Callers must handle false: the text has
// to stay selectable for the reader to copy by hand.
export async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Permission denied or document not focused: fall through to the legacy path.
    }
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()

  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    document.body.removeChild(textarea)
  }
}
