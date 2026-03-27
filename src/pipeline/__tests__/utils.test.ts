import { describe, it, expect } from 'vitest'
import { extractJson } from '../utils'

describe('extractJson', () => {
  it('passes through clean JSON', () => {
    const json = '{"key": "value"}'
    expect(extractJson(json)).toBe(json)
  })

  it('strips ```json code fences', () => {
    const input = '```json\n{"key": "value"}\n```'
    expect(extractJson(input)).toBe('{"key": "value"}')
  })

  it('strips ``` code fences without language tag', () => {
    const input = '```\n[1, 2, 3]\n```'
    expect(extractJson(input)).toBe('[1, 2, 3]')
  })

  it('handles whitespace around fences', () => {
    const input = '  ```json\n  {"a": 1}  \n```  '
    expect(extractJson(input)).toBe('{"a": 1}')
  })

  it('handles surrounding text outside fences', () => {
    const input = 'Here is the JSON:\n```json\n{"result": true}\n```\nDone.'
    expect(extractJson(input)).toBe('{"result": true}')
  })

  it('trims plain text input', () => {
    const input = '  {"trimmed": true}  '
    expect(extractJson(input)).toBe('{"trimmed": true}')
  })

  it('handles multiline JSON inside fences', () => {
    const input = '```json\n{\n  "a": 1,\n  "b": 2\n}\n```'
    const result = extractJson(input)
    expect(JSON.parse(result)).toEqual({ a: 1, b: 2 })
  })

  it('handles array JSON', () => {
    const input = '```json\n[{"index":1},{"index":2}]\n```'
    const result = extractJson(input)
    expect(JSON.parse(result)).toHaveLength(2)
  })
})
