import { describe, it, expect } from 'vitest'
import { clamp01, span, timelineDistance, countAt } from '../../src/app/scroll/math'

describe('scroll math', () => {
  it('clamps to [0, 1]', () => {
    expect(clamp01(-1)).toBe(0)
    expect(clamp01(2)).toBe(1)
    expect(clamp01(0.3)).toBe(0.3)
  })

  it('maps a global progress to the local progress of a band', () => {
    expect(span(0.5, 0.4, 0.6)).toBeCloseTo(0.5)
    expect(span(0.3, 0.4, 0.6)).toBe(0)
    expect(span(0.9, 0.4, 0.6)).toBe(1)
  })

  it('measures how far a horizontal track has to travel', () => {
    expect(timelineDistance(3000, 1440)).toBe(1560)
    expect(timelineDistance(800, 1440)).toBe(0)
  })

  it('counts up with an ease-out and lands exactly on the target', () => {
    expect(countAt(1, 92)).toBe(92)
    expect(countAt(0, 92)).toBe(0)
    expect(countAt(0.5, 31)).toBeGreaterThan(15)
    expect(Number.isInteger(countAt(0.37, 92))).toBe(true)
  })
})
