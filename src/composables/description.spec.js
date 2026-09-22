import { describe, expect, it } from 'vitest'
import { splitDescription } from '@/composables/description'

describe('splitDescription', () => {
  it('unescapes the quoted content and keeps the colon with the sentence', () => {
    const text = '1 file(s) updated with "line one\\nline two":\n* Dockerfile'

    expect(splitDescription(text)).toEqual({
      before: '1 file(s) updated with:',
      payload: 'line one\nline two',
      after: '\n* Dockerfile',
    })
  })

  it('does not stop at an escaped quote', () => {
    const result = splitDescription('updated with "say \\"hi\\"\\n" done')
    expect(result.payload).toBe('say "hi"\n')
    expect(result.after).toBe(' done')
  })

  it('falls back on Go escapes JSON does not know', () => {
    const result = splitDescription('updated with "a\\x00b\\nc"')
    expect(result.payload).toBe('a\\x00b\nc')
  })

  it.each([
    ['not a string', 42],
    ['no quote', 'nothing to see here'],
    ['an unterminated quote', 'updated with "abc\\n'],
    ['a short quoted value', 'version set to "1.2.3"'],
  ])('returns null for %s', (_, text) => {
    expect(splitDescription(text)).toBeNull()
  })
})
