import { describe, it, expect, vi, afterEach } from 'vitest'
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'pt' } }),
}))
vi.mock('virtual:posts', () => ({
  summaries: [{ slug: 'arc-routing-for-waste-collection', title: 'Arc Routing for Waste Collection', date: '2026-09-02', readingTimeMinutes: 9 }],
}))

import { Talk } from '../../src/app/scenes/Talk'
import { WHATSAPP_NUMBER } from '../../src/app/data/contact'

let root: Root | null = null
let container: HTMLDivElement | null = null
afterEach(() => { act(() => root?.unmount()); container?.remove() })

function render() {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root!.render(React.createElement(Talk)))
  return container
}

describe('talk', () => {
  it('opens WhatsApp with the pre-filled message', () => {
    const c = render()
    const wa = c.querySelector<HTMLAnchorElement>('a[href*="wa.me"]')
    expect(wa?.href).toContain(`wa.me/${WHATSAPP_NUMBER}`)
    expect(wa?.href).toContain(encodeURIComponent('contact.whatsapp_message'))
    expect(c.querySelector('section#contact')).not.toBeNull()
  })

  it('invites networking on LinkedIn and links the latest article', () => {
    const c = render()
    expect(c.textContent).toContain('contact.network_title')
    expect(c.querySelector('a[href*="linkedin.com/in/felipe-rodrigues-leone"]')).not.toBeNull()
    expect(c.querySelector('a[href="/blog/arc-routing-for-waste-collection"]')).not.toBeNull()
  })

  it('signs the page', () => {
    const c = render()
    expect(c.textContent).toContain(`© ${new Date().getFullYear()} Felipe Rodrigues Leone`)
  })
})
