import { describe, it, expect, vi, afterEach } from 'vitest'
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const order: string[] = []
vi.mock('../../src/app/scroll/gsap', () => ({
  ScrollTrigger: { refresh: vi.fn(() => order.push('refresh')) },
}))

import { useHashScroll } from '../../src/app/hooks/useHashScroll'

let root: Root | null = null
let container: HTMLDivElement | null = null
afterEach(() => { act(() => root?.unmount()); container?.remove(); order.length = 0 })

describe('useHashScroll', () => {
  it('lets the scenes lay out their pins before jumping to the hash', async () => {
    window.history.replaceState(null, '', '/#projects')
    const target = document.createElement('section')
    target.id = 'projects'
    target.scrollIntoView = vi.fn(() => order.push('scroll'))
    document.body.appendChild(target)
    function Probe() {
      useHashScroll(React.useRef(null))
      return null
    }
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() => root!.render(React.createElement(Probe)))
    await new Promise((r) => setTimeout(r, 50))
    expect(order[0]).toBe('refresh')
    expect(order).toContain('scroll')
    target.remove()
  })
})
