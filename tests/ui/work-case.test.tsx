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
  it('shows the problem, what was built, the stack and the link for a piece of work', () => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    const item = WORK[0]
    act(() => root!.render(React.createElement(WorkCase, { item, onClose: () => {} })))
    const text = container.textContent ?? ''
    expect(text).toContain(`work.items.${item.id}.case.problem`)
    expect(text).toContain(`work.items.${item.id}.case.built`)
    for (const s of item.stack) expect(text).toContain(s)
    expect(container.querySelector(`a[href="${item.href}"]`)).not.toBeNull()
  })

  it('has the case copy for every piece of work in both languages, with no family framing', () => {
    for (const bundle of [pt, en]) {
      for (const w of WORK) {
        const c = (bundle.work.items as Record<string, { case?: Record<string, string> }>)[w.id].case
        expect(c?.problem, `${w.id}.problem`).toBeTruthy()
        expect(c?.built, `${w.id}.built`).toBeTruthy()
        if (w.hasNow) expect(c?.now, `${w.id}.now`).toBeTruthy()
      }
      expect(JSON.stringify(bundle.work)).not.toMatch(/família|family|cresci|grew up|\b87\b|40M|\b274\b/i)
    }
  })
})
