import { describe, it, expect, vi, afterEach } from 'vitest'
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import pt from '../../src/app/i18n/locales/pt.json'
import en from '../../src/app/i18n/locales/en.json'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
// jsdom has no layout: an inert ResizeObserver is enough here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).ResizeObserver ??= class { observe() {} disconnect() {} }

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'pt' } }),
}))

import { STORY, chapterAt } from '../../src/app/data/story'
import { Story } from '../../src/app/scenes/Story'
import { createSignal } from '../../src/app/scroll/signal'

let root: Root | null = null
let container: HTMLDivElement | null = null
afterEach(() => {
  act(() => root?.unmount())
  container?.remove()
})

function render(el: React.ReactElement) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root!.render(el))
  return container
}

describe('story', () => {
  it('maps progress to the chapter in focus', () => {
    expect(chapterAt(0, 7)).toBe(0)
    expect(chapterAt(1, 7)).toBe(6)
    expect(chapterAt(0.5, 7)).toBe(3)
  })

  it('renders every chapter, in order, as a list', () => {
    const c = render(React.createElement(Story, { mode: 'list' }))
    const titles = [...c.querySelectorAll('[data-chapter]')].map((n) => n.getAttribute('data-chapter'))
    expect(titles).toEqual(STORY.map((s) => s.id))
    expect(c.querySelector('section#about')).not.toBeNull()
  })

  it('renders the rail with the same chapters, driven by a progress signal', () => {
    const progress = createSignal(0)
    const c = render(React.createElement(Story, { mode: 'rail', progress }))
    expect(c.querySelectorAll('[data-chapter]').length).toBe(STORY.length)
    act(() => progress.set(1))
    expect(c.querySelector('[data-chapter="hoje"]')?.getAttribute('data-focus')).toBe('true')
  })

  it('tells no family origin and never says the motel is the family business', () => {
    for (const bundle of [pt, en]) {
      const all = JSON.stringify(bundle.story)
      // Diamante is scenery now (Como funciona), not a chapter (2026-11-26)
      expect(all).not.toMatch(/Vincenzo|tatarav|great-great/i)
      expect(all).not.toMatch(/fam[ií]lia do|cresci|grew up|family business|family's/i)
    }
  })
})
