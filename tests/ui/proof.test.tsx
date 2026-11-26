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

import { Proof, ENTRIES } from '../../src/app/scenes/Proof'
import { WORK } from '../../src/app/data/work'

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
  act(() => root!.render(React.createElement(Proof)))
  return container
}

describe('em uso (telemetria)', () => {
  it('states the three facts as a log, with no counter anywhere', () => {
    const c = render()
    const labels = [...c.querySelectorAll('.log-label')].map((n) => n.textContent)
    expect(labels).toEqual(ENTRIES.map((id) => `telemetria.entries.${id}.label`))
    expect(c.querySelector('[data-count]')).toBeNull()
  })

  it('keeps the frame slot on the destinations\' grid on a wide screen, and in the flow on a phone', () => {
    expect(render().querySelector('.proof-stage [data-frame-slot]')).not.toBeNull()
    act(() => root?.unmount()); container?.remove()
    expect(render(true).querySelector('.proof-phone [data-frame-slot]')).not.toBeNull()
  })

  it('with reduced motion, shows a still and no frame', () => {
    const c = render(false, true)
    expect(c.querySelector('[data-frame-slot]')).toBeNull()
    expect(c.querySelector('img.proof-still')).not.toBeNull()
  })

  it('never promises a video that has not been recorded', () => {
    const c = render()
    // the note says what is on screen: the recording when there is one, else the still
    const recorded = !!WORK.find((w) => w.id === 'dallas_sync')?.video?.detail
    expect(c.querySelector('.proof-note')?.textContent).toBe(recorded ? 'telemetria.video_note' : 'telemetria.still_note')
    for (const bundle of [pt, en]) {
      for (const id of ENTRIES) expect(bundle.telemetria.entries[id].text).not.toMatch(/vídeo|video/i)
    }
  })
})
