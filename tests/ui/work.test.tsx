import { describe, it, expect, vi, afterEach } from 'vitest'
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import pt from '../../src/app/i18n/locales/pt.json'
import en from '../../src/app/i18n/locales/en.json'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'pt' } }),
}))

const { draggableCreate, scrollCreate } = vi.hoisted(() => ({
  draggableCreate: vi.fn(() => [{ kill: vi.fn(), update: vi.fn(), applyBounds: vi.fn() }]),
  scrollCreate: vi.fn(() => ({ start: 0, end: 1 })),
}))
vi.mock('../../src/app/scroll/gsap', () => ({
  gsap: {
    context: (fn: () => void) => { fn(); return { revert: vi.fn() } },
    matchMedia: () => ({ add: vi.fn(), revert: vi.fn() }),
    set: vi.fn(),
    utils: { snap: () => (v: number) => v },
  },
  ScrollTrigger: { defaults: vi.fn(), create: scrollCreate, addEventListener: vi.fn(), removeEventListener: vi.fn() },
  Draggable: { create: draggableCreate },
  InertiaPlugin: {},
}))

import { WORK } from '../../src/app/data/work'
import { Work } from '../../src/app/scenes/Work'

let root: Root | null = null
let container: HTMLDivElement | null = null
afterEach(() => {
  act(() => root?.unmount())
  container?.remove()
})

function render(phone = false) {
  draggableCreate.mockClear()
  scrollCreate.mockClear()
  window.matchMedia = ((q: string) => ({ matches: phone && q.includes('max-width'), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root!.render(React.createElement(Work)))
  return container
}

describe('work carousel', () => {
  it('shows the five pieces of work, Dallas Sync first and in focus', () => {
    const c = render()
    const ids = [...c.querySelectorAll('[data-work]')].map((n) => n.getAttribute('data-work'))
    expect(ids).toEqual(['dallas_sync', 'dallas_motel', 'secret', 'omdfarm', 'eco360'])
    expect(ids).toEqual(WORK.map((w) => w.id))
    expect(c.querySelector('[data-work="dallas_sync"]')?.getAttribute('data-focus')).toBe('true')
    expect(c.querySelector('section#projects')).not.toBeNull()
  })

  it('labels OMD work as built at OMD', () => {
    const c = render()
    for (const id of ['omdfarm', 'eco360']) {
      expect(c.querySelector(`[data-work="${id}"]`)?.textContent).toContain('work.kind.omd')
    }
  })

  it('on a wide screen, pins the scene and lets the page scroll carry the cards', () => {
    render(false)
    expect(draggableCreate).not.toHaveBeenCalled()
    const vars = scrollCreate.mock.calls.map((c) => (c as unknown[])[0] as Record<string, unknown>)
    expect(vars.some((v) => v.pin === true && v.scrub === true)).toBe(true)
  })

  it('on a phone, drags sideways only, leaving vertical scrolling to the page', () => {
    render(true)
    expect(draggableCreate).toHaveBeenCalled()
    const vars = (draggableCreate.mock.calls[0] as unknown[])[1] as Record<string, unknown>
    expect(vars.type).toBe('x')
    expect(vars.lockAxis).toBe(true)
    expect(vars.allowNativeTouchScrolling).toBe(true)
    expect(vars.inertia).toBe(true)
  })

  it('never shows the old OMD figures', () => {
    for (const bundle of [pt, en]) {
      const all = JSON.stringify(bundle.work)
      expect(all).not.toMatch(/\b87\b|40M|\b274\b/)
    }
  })
})
