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
  scrollCreate: vi.fn(() => ({ start: 0, end: 1, kill: vi.fn() })),
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

function render(phone = false, reduced = false) {
  draggableCreate.mockClear()
  scrollCreate.mockClear()
  window.matchMedia = ((q: string) => ({
    matches: (phone && q.includes('max-width')) || (reduced && q.includes('reduced-motion')),
    media: q, addEventListener() {}, removeEventListener() {},
  })) as unknown as typeof window.matchMedia
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root!.render(React.createElement(Work)))
  return container
}

describe('destinations', () => {
  it('shows the three destinations, Dallas Sync first and current', () => {
    const c = render()
    const ids = [...c.querySelectorAll('[data-dest]')].map((n) => n.getAttribute('data-dest'))
    // OMD's platforms are the employer's work: they live in the story, not here
    expect(ids).toEqual(['dallas_sync', 'secret', 'dallas_motel'])
    expect(ids).toEqual(WORK.map((w) => w.id))
    expect(c.querySelector('[data-dest="dallas_sync"]')?.getAttribute('data-current')).toBe('true')
    expect(c.querySelector('section#projects')).not.toBeNull()
  })

  it('on a wide screen, holds a sticky stage with a slot for the frame, and follows the scroll without a pin', () => {
    const c = render(false)
    expect(c.querySelector('section')?.getAttribute('data-mode')).toBe('scroll')
    expect(c.querySelector('.dest-stage [data-frame-slot]')).not.toBeNull()
    expect(draggableCreate).not.toHaveBeenCalled()
    const vars = scrollCreate.mock.calls.map((call) => (call as unknown[])[0] as Record<string, unknown>)
    expect(vars.length).toBeGreaterThan(0)
    // the stage is sticky CSS: no GSAP pin, so the nav can jump anywhere
    expect(vars.some((v) => v.pin)).toBe(false)
    // every destination is reachable from the keyboard; focusing one that is
    // not on stage takes the page to it, so the page handles that focus
    expect(c.querySelectorAll('.dest-item[inert]').length).toBe(0)
    expect(c.querySelectorAll('.dest-item[data-focus-handled]').length).toBe(WORK.length)
  })

  it('on a phone, puts the frame on top and the destinations in a native swipe', () => {
    const c = render(true)
    expect(c.querySelector('section')?.getAttribute('data-mode')).toBe('swipe')
    expect(c.querySelector('.dest-phone [data-frame-slot]')).not.toBeNull()
    expect(c.querySelectorAll('.dest-swipe [data-dest]').length).toBe(WORK.length)
    expect(draggableCreate).not.toHaveBeenCalled()
  })

  it('with reduced motion, is a plain list with each picture and no frame', () => {
    const c = render(false, true)
    expect(c.querySelector('section')?.getAttribute('data-mode')).toBe('list')
    expect(c.querySelector('[data-frame-slot]')).toBeNull()
    expect(c.querySelectorAll('.dest-plain img.dest-still').length).toBe(WORK.length)
  })

  it('says, for the illustrative screen, that it is in training mode', () => {
    const c = render()
    expect(c.querySelector('[data-dest="dallas_sync"]')?.textContent).toContain('work.items.dallas_sync.note')
  })

  it('has the copy in both languages', () => {
    for (const bundle of [pt, en]) {
      for (const w of WORK) {
        const item = (bundle.work.items as Record<string, { title?: string; result?: string }>)[w.id]
        expect(item?.title, w.id).toBeTruthy()
        expect(item?.result, w.id).toBeTruthy()
      }
    }
  })
})
