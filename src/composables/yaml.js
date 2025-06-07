import { dump } from 'js-yaml'

export function toYAML(data) {
  // https://www.npmjs.com/package/js-yaml
  return dump(data, {
    indent: 4,
    noCompatMode: true,
    noRefs: true,
    noArrayIndent: false,
    replacer: replaceUndefinedOrNull
  })
}

function replaceUndefinedOrNull(key, value) {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  return value;
}