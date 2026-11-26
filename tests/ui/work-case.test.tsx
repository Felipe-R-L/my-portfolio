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
vi.mock('lucide-react', () => ({ X: () => React.createElement('svg') }))

import { WORK } from '../../src/app/data/work'
import { WorkCase } from '../../src/app/scenes/WorkCase'

let root: Root | null = null
let container: HTMLDivElement | null = null
afterEach(() => { act(() => root?.unmount()); container?.remove() })

describe('work details', () => {
  it('tells the case as a problem solved, in order, with the stack last and the link', () => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    const item = WORK[0]
    act(() => root!.render(React.createElement(WorkCase, { item, onClose: () => {} })))
    const text = container.textContent ?? ''
    // every part the project has, in CASE_PARTS order
    const at = item.parts.map((part) => text.indexOf(`work.items.${item.id}.case.${part}`))
    at.forEach((i) => expect(i).toBeGreaterThanOrEqual(0))
    expect([...at].sort((a, b) => a - b)).toEqual(at)
    // the stack is a supporting detail, after the story
    for (const s of item.stack) expect(text.indexOf(s)).toBeGreaterThan(at[at.length - 1])
    expect(container.querySelector(`a[href="${item.href}"]`)).not.toBeNull()
  })

  it('has the case copy for every piece of work in both languages, with no family framing', () => {
    for (const bundle of [pt, en]) {
      for (const w of WORK) {
        const c = (bundle.work.items as Record<string, { case?: Record<string, string> }>)[w.id].case
        for (const part of w.parts) expect(c?.[part], `${w.id}.${part}`).toBeTruthy()
      }
      expect(JSON.stringify(bundle.work)).not.toMatch(/família|family|cresci|grew up|\b87\b|40M|\b274\b/i)
    }
  })
})
