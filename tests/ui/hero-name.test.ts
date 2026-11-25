import { describe, it, expect } from 'vitest'
import { NAME } from '../../src/app/components/hero/HeroParts'

describe('hero name', () => {
  it('carries the surname Leone and the camera dives through the city line', () => {
    expect(NAME.full).toBe('Felipe Rodrigues Leone')
    expect(NAME.lines.join(' ')).toBe(NAME.full)
    expect(NAME.lines[NAME.city].toLowerCase()).toContain(NAME.mark)
  })
})
