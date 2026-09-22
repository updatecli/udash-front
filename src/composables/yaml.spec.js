import { describe, expect, it } from 'vitest'
import { toYAML } from '@/composables/yaml'

describe('toYAML', () => {
  it('drops null, undefined and empty values', () => {
    const yaml = toYAML({ name: 'pipeline', kind: null, spec: { file: '', key: undefined, value: 'x' } })
    expect(yaml).toBe('name: pipeline\nspec:\n    value: x\n')
  })

  it('indents with four spaces', () => {
    expect(toYAML({ a: { b: 1 } })).toBe('a:\n    b: 1\n')
  })
})

describe('toYAML with sequences', () => {
  it('prunes inside the items of a list', () => {
    expect(toYAML({ files: [{ path: 'a', key: null }] })).toBe('files:\n    -   path: a\n')
  })
})
