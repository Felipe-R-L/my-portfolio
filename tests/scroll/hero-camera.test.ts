import { describe, it, expect } from 'vitest'
import { cameraAt, SHOT_WIDE, SHOT_TALL, cover } from '../../src/app/components/hero/camera'

/** The asset rect a camera shows on a vw x vh screen. */
function visible(c: { x: number; y: number; scale: number }, vw: number, vh: number) {
  return { x: -c.x / c.scale, y: -c.y / c.scale, w: vw / c.scale, h: vh / c.scale }
}

describe('hero camera', () => {
  it('starts on the skyline-only corner', () => {
    const c = cameraAt(0, SHOT_WIDE, 1440, 900)
    const a = cover(SHOT_WIDE.start, 1440, 900)
    expect(c.scale).toBeCloseTo(a.s, 5)
    const v = visible(c, 1440, 900)
    // centred on the start rect, covering it
    expect(v.x + v.w / 2).toBeCloseTo(a.cx, 0)
    expect(v.y + v.h / 2).toBeCloseTo(a.cy, 0)
  })

  it('ends on the final framing', () => {
    const c = cameraAt(1, SHOT_TALL, 390, 844)
    const b = cover(SHOT_TALL.end(390, 844), 390, 844)
    expect(c.scale).toBeCloseTo(b.s, 5)
  })

  it('pulls back monotonically', () => {
    let prev = Infinity
    for (let i = 0; i <= 20; i++) {
      const s = cameraAt(i / 20, SHOT_WIDE, 1440, 900).scale
      expect(s).toBeLessThanOrEqual(prev + 1e-9)
      prev = s
    }
  })
})
