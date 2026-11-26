import { describe, it, expect, vi, afterEach } from 'vitest'
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import pt from '../../src/app/i18n/locales/pt.json'
import en from '../../src/app/i18n/locales/en.json'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

// GSAP registers ScrollTrigger on import and asks for matchMedia (jsdom has none).
vi.hoisted(() => {
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia
})

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'pt' } }),
}))

import { Process, STEPS } from '../../src/app/scenes/Process'

let root: Root | null = null
let container: HTMLDivElement | null = null
afterEach(() => { act(() => root?.unmount()); container?.remove() })

function render(phone = false, reduced = false) {
  window.matchMedia = ((q: string) => ({
    matches: (phone && q.includes('max-width')) || (reduced && q.includes('reduced')),
    media: q, addEventListener() {}, removeEventListener() {},
  })) as unknown as typeof window.matchMedia
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root!.render(React.createElement(Process)))
  return container
}

describe('como funciona (plano)', () => {
  it('lists the three steps in order, one stop on the line for each', () => {
    const c = render()
    expect([...c.querySelectorAll('.step-title')].map((n) => n.textContent)).toEqual(STEPS.map((id) => `plano.steps.${id}.title`))
    expect(c.querySelectorAll('.plano-stop').length).toBe(STEPS.length)
    expect(c.querySelector('section#process')?.getAttribute('data-journey')).toBe('plano')
  })

  it('starts with only the first stop reached, and with reduced motion shows every step reached', () => {
    const c = render()
    expect([...c.querySelectorAll('.step')].map((s) => s.getAttribute('data-reached'))).toEqual(['true', 'false', 'false'])
    act(() => root?.unmount()); container?.remove()
    const r = render(false, true)
    expect([...r.querySelectorAll('.step')].every((s) => s.getAttribute('data-reached') === 'true')).toBe(true)
  })

  it('describes each step in both languages without a deadline', () => {
    for (const bundle of [pt, en]) {
      for (const id of STEPS) {
        expect(bundle.plano.steps[id].title).toBeTruthy()
        expect(bundle.plano.steps[id].text).not.toMatch(/\b\d+\s*(dias?|days?|semanas?|weeks?)\b/i)
      }
    }
  })
})
