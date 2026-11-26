import { describe, it, expect, vi, afterEach } from 'vitest'
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

vi.hoisted(() => {
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia
})

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'pt' } }),
}))

import { CaseLayer } from '../../src/app/scenes/CaseLayer'
import { WORK } from '../../src/app/data/work'

let root: Root | null = null
let container: HTMLDivElement | null = null
afterEach(() => { act(() => root?.unmount()); container?.remove() })

describe('T2 (the case opening out of the frame)', () => {
  it('plays when the case mounts, which is a render after it is asked for', () => {
    const played: Element[] = []
    Element.prototype.animate = function (this: Element) {
      played.push(this)
      return { finished: Promise.resolve() } as unknown as Animation
    }
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    const from = { x: 600, y: 200, w: 800, h: 500 }
    act(() => root!.render(React.createElement(CaseLayer, { item: WORK[0], from, onClose: () => {} })))
    const classes = played.map((el) => el.className)
    // the floor rises, the picture flies from the frame, the words come in
    expect(classes).toContain('case-ground')
    expect(classes).toContain('case-media')
    expect(classes).toContain('case-head')
    // the surface itself is never clipped, or the picture would be hidden under it
    expect(classes).not.toContain('caselayer')
  })
})
