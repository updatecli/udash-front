import { dump } from 'js-yaml'

export function toYAML(data) {
  // https://www.npmjs.com/package/js-yaml
  return dump(pruneEmpty(data), {
    indent: 4,
    noRefs: true,
  })
}

// pruneEmpty drops the keys holding null, undefined or an empty string, which Updatecli
// reports for every spec field left unset. It is done here rather than with a dump
// option because js-yaml 5 removed `replacer`, which used to do it.
function pruneEmpty(value) {
  if (Array.isArray(value)) {
    return value.map(pruneEmpty)
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== null && item !== undefined && item !== '')
        .map(([key, item]) => [key, pruneEmpty(item)])
    )
  }

  return value
}
