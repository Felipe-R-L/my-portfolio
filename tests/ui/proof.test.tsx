import { describe, it, expect, vi, afterEach } from 'vitest'
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import pt from '../../src/app/i18n/locales/pt.json'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'pt' } }),
}))
vi.mock('../../src/app/scroll/gsap', () => ({
  gsap: { context: (fn: () => void) => { fn(); return { revert: vi.fn() } }, matchMedia: () => ({ add: vi.fn(), revert: vi.fn() }) },
  ScrollTrigger: { defaults: vi.fn(), create: vi.fn() },
}))

import { Proof, PROOF } from '../../src/app/scenes/Proof'

let root: Root | null = null
let container: HTMLDivElement | null = null
afterEach(() => { act(() => root?.unmount()); container?.remove() })

function render(reduced: boolean) {
  window.matchMedia = ((q: string) => ({ matches: q.includes('reduced') ? reduced : false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root!.render(React.createElement(Proof)))
  return container
}

describe('proof', () => {
  it('shows the OMD figures at their final values with reduced motion', () => {
    const c = render(true)
    const text = c.textContent ?? ''
    expect(text).toContain('31')
    expect(text).toContain('92')
    expect(text).toMatch(/<\s?2\s?s/)
    expect(PROOF.map((p) => p.value)).toEqual([31, 92, 2])
  })

  it('never shows the old figures', () => {
    const c = render(true)
    expect(c.textContent).not.toMatch(/\b87\b|40M|\b274\b/)
    expect(JSON.stringify(pt.proof)).not.toMatch(/\b87\b|40M|\b274\b/)
    expect(JSON.stringify(pt.proof)).toContain('OMD do Brasil')
  })
})
