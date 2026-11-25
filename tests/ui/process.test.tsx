import { describe, it, expect, vi, afterEach } from 'vitest'
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'pt' } }),
}))
vi.mock('../../src/app/scroll/gsap', () => ({
  gsap: { context: (fn: () => void) => { fn(); return { revert: vi.fn() } }, matchMedia: () => ({ add: vi.fn(), revert: vi.fn() }), set: vi.fn() },
  ScrollTrigger: { defaults: vi.fn(), create: vi.fn() },
}))

import { Process } from '../../src/app/scenes/Process'

let root: Root | null = null
let container: HTMLDivElement | null = null
afterEach(() => { act(() => root?.unmount()); container?.remove() })

function render(reduced: boolean) {
  window.matchMedia = ((q: string) => ({ matches: q.includes('reduced') ? reduced : false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root!.render(React.createElement(Process)))
  return container
}

describe('process', () => {
  it('lists the four steps in order, with the gate sentence', () => {
    const c = render(false)
    const steps = [...c.querySelectorAll('[data-step]')].map((n) => n.getAttribute('data-step'))
    expect(steps).toEqual(['talk', 'draft', 'build', 'launch'])
    expect(c.textContent).toContain('process.gate')
    expect(c.querySelector('section#process')).not.toBeNull()
  })

  it('shows the line complete and every step lit with reduced motion', () => {
    const c = render(true)
    expect(c.querySelector('.process')?.getAttribute('data-done')).toBe('true')
    expect([...c.querySelectorAll('[data-step]')].every((n) => n.getAttribute('data-lit') === 'true')).toBe(true)
  })
})
