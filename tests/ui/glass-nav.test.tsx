import { describe, it, expect, vi, afterEach } from 'vitest'
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { GlassNav, type GlassNavItem } from '../../src/app/components/shared/GlassNav'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('motion/react', () => ({
  useReducedMotion: () => false,
  motion: {
    nav: ({ children, initial, animate, transition, ...rest }: any) =>
      React.createElement('nav', rest, children),
    div: ({ children, initial, animate, transition, ...rest }: any) =>
      React.createElement('div', rest, children),
    a: ({ children, initial, animate, transition, whileHover, ...rest }: any) =>
      React.createElement('a', rest, children),
  },
}))
vi.mock('lucide-react', () => ({
  Menu: () => React.createElement('svg', { 'data-icon': 'menu' }),
  X: () => React.createElement('svg', { 'data-icon': 'x' }),
}))

const items: GlassNavItem[] = [
  { id: 'about', href: '#about', label: 'About' },
  { id: 'projects', href: '#projects', label: 'Projects' },
]
const languages = [
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
]

let container: HTMLDivElement | null = null
let root: Root | null = null

afterEach(() => {
  if (root) {
    act(() => root!.unmount())
    root = null
  }
  if (container) {
    container.remove()
    container = null
  }
  document.body.style.overflow = ''
})

async function mount(onSelect?: (event: React.MouseEvent<HTMLAnchorElement>) => void) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  const props = {
    items: onSelect ? items.map((item) => ({ ...item, onSelect })) : items,
    languages,
    activeLanguage: 'en',
    onLanguageChange: vi.fn(),
    openLabel: 'Menu',
    closeLabel: 'Close menu',
  }
  await act(async () => {
    root!.render(React.createElement(GlassNav, props))
  })
  return container
}

function getToggle(el: HTMLElement) {
  const toggle = el.querySelector<HTMLButtonElement>('button[aria-controls]')
  if (!toggle) throw new Error('toggle button not found')
  return toggle
}

// The desktop pill renders the same hrefs (just CSS-hidden below md), so a
// bare `el.querySelector('a[href="#about"]')` would silently grab the
// desktop link instead of the mobile one. Scope to the mobile <nav>, found
// via the toggle button, which only exists in the mobile presentation.
function getMobileLink(toggle: HTMLButtonElement, href: string) {
  const mobileNav = toggle.closest('nav')
  if (!mobileNav) throw new Error('mobile nav not found')
  const link = mobileNav.querySelector<HTMLAnchorElement>(`a[href="${href}"]`)
  if (!link) throw new Error(`link ${href} not found in mobile nav`)
  return link
}

describe('GlassNav mobile panel', () => {
  it('is closed by default', async () => {
    const el = await mount()
    const toggle = getToggle(el)
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
  })

  it('opens when the toggle is tapped', async () => {
    const el = await mount()
    const toggle = getToggle(el)
    act(() => {
      toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
  })

  it('closes on Escape', async () => {
    const el = await mount()
    const toggle = getToggle(el)
    act(() => {
      toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(toggle.getAttribute('aria-expanded')).toBe('true')

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
  })

  it('closes when a link inside the panel is tapped', async () => {
    const el = await mount()
    const toggle = getToggle(el)
    act(() => {
      toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(toggle.getAttribute('aria-expanded')).toBe('true')

    const link = getMobileLink(toggle, '#about')
    act(() => {
      link.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
  })

  it('closes on an outside tap', async () => {
    const el = await mount()
    const toggle = getToggle(el)
    act(() => {
      toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(toggle.getAttribute('aria-expanded')).toBe('true')

    act(() => {
      document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
  })

  it('locks body scroll while open and restores it on close', async () => {
    const el = await mount()
    const toggle = getToggle(el)
    expect(document.body.style.overflow).toBe('')

    act(() => {
      toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(document.body.style.overflow).toBe('hidden')

    act(() => {
      toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(document.body.style.overflow).toBe('')
  })

  it('does not call preventDefault on a link without onSelect, letting native navigation proceed', async () => {
    const el = await mount()
    const toggle = getToggle(el)
    act(() => {
      toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    const link = getMobileLink(toggle, '#about')

    let event: MouseEvent | null = null
    act(() => {
      event = new MouseEvent('click', { bubbles: true, cancelable: true })
      link.dispatchEvent(event)
    })
    expect(event!.defaultPrevented).toBe(false)
  })

  it('forwards to onSelect and still closes when onSelect calls preventDefault', async () => {
    const onSelect = vi.fn((event: React.MouseEvent<HTMLAnchorElement>) => event.preventDefault())
    const el = await mount(onSelect)
    const toggle = getToggle(el)
    act(() => {
      toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    const link = getMobileLink(toggle, '#about')

    act(() => {
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    })
    expect(onSelect).toHaveBeenCalled()
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
  })
})
