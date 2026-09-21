// splitDescription separates a resource description from the content Updatecli quotes
// inside it. Targets report changes as `1 file(s) updated with "<content>":` where the
// content is a Go-quoted string, so its line breaks arrive as literal `\n` sequences.
//
// It returns { before, payload, after } with the payload unescaped, or null when the
// description carries no quoted content worth showing apart, such as a short quoted
// version number.
export function splitDescription(text) {
  if (typeof text !== 'string') {
    return null
  }

  const start = text.indexOf('"')
  if (start < 0) {
    return null
  }

  let end = -1
  for (let i = start + 1; i < text.length; i += 1) {
    if (text[i] === '\\') {
      i += 1
    } else if (text[i] === '"') {
      end = i
      break
    }
  }

  if (end < 0) {
    return null
  }

  const inner = text.slice(start + 1, end)
  if (!/\\[nt"]/.test(inner)) {
    return null
  }

  let before = text.slice(0, start).trimEnd()
  let after = text.slice(end + 1)

  // "updated with "<content>":" introduces the list that follows, so the colon belongs
  // with the sentence rather than on a line of its own.
  if (after.startsWith(':')) {
    before += ':'
    after = after.slice(1)
  }

  return { before, payload: unescape(inner), after }
}

function unescape(inner) {
  try {
    return JSON.parse(`"${inner}"`)
  } catch {
    // Go escapes JSON does not know, such as \x00, fall back to the common ones.
    return inner
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
  }
}
