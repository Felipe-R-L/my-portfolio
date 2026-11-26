import { describe, it, expect } from 'vitest'
import { NAME } from '../../src/app/components/hero/HeroParts'

describe('hero name', () => {
  it('carries the surname Leone in two lines, Rodrigues in italic', () => {
    expect(NAME.full).toBe('Felipe Rodrigues Leone')
    expect(NAME.lines.map((l) => l.map((w) => w.text).join(' ')).join(' ')).toBe(NAME.full)
    expect(NAME.lines).toHaveLength(2)
    expect(NAME.lines.flat().filter((w) => w.em).map((w) => w.text)).toEqual(['Rodrigues'])
  })
})
