import { describe, it, expect, vi, afterEach } from 'vitest'
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

// AppLayout pulls in the whole homepage tree. For this test we only care
// about the nav-pill click handler, so every section, the WebGL background
// and i18n are replaced with trivial stand-ins.
const lenisRef: { current: null | { scrollTo: ReturnType<typeof vi.fn> } } = { current: null }

vi.mock('../../src/app/hooks/useSmoothScroll', () => ({
  useSmoothScroll: () => lenisRef,
}))
vi.mock('../../src/app/hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}))
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

const stub = (label: string) => () => React.createElement('div', { 'data-stub': label })
vi.mock('../../src/app/components/Hero', () => ({ Hero: stub('hero') }))
vi.mock('../../src/app/components/TechMarquee', () => ({ default: stub('marquee') }))
vi.mock('../../src/app/components/About', () => ({ About: stub('about') }))
vi.mock('../../src/app/components/Experience', () => ({ Experience: stub('experience') }))
vi.mock('../../src/app/components/Services', () => ({ Services: stub('services') }))
vi.mock('../../src/app/components/Projects', () => ({ Projects: stub('projects') }))
vi.mock('../../src/app/components/LatestWriting', () => ({ LatestWriting: stub('latest-writing') }))
vi.mock('../../src/app/components/Contact', () => ({ Contact: stub('contact') }))
vi.mock('../../src/app/components/shared/StarField', () => ({ StarField: stub('starfield') }))
vi.mock('../../src/app/components/shared/SocialLinks', () => ({ SocialLinks: stub('social') }))
vi.mock('../../src/app/components/react-bits/GradientText', () => ({ default: stub('gradient-text') }))
vi.mock('../../src/app/components/react-bits/Galaxy', () => ({ default: stub('galaxy') }))
vi.mock('../../src/app/components/react-bits/FluidGlass', () => ({ default: stub('fluid-glass') }))

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
  lenisRef.current = null
})

async function mountAppLayout() {
  const { default: AppLayout } = await import('../../src/app/AppLayout')
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root!.render(React.createElement(AppLayout))
  })
  return container
}

describe('AppLayout nav pill click handler', () => {
  it('does not call preventDefault when Lenis is unavailable (mobile), letting the anchor jump natively', async () => {
    lenisRef.current = null
    const el = await mountAppLayout()
    const link = el.querySelector<HTMLAnchorElement>('a[href="#about"]')
    expect(link).not.toBeNull()

    let event: MouseEvent | null = null
    act(() => {
      event = new MouseEvent('click', { bubbles: true, cancelable: true })
      link!.dispatchEvent(event)
    })

    expect(event!.defaultPrevented).toBe(false)
  })

  it('calls preventDefault and scrolls via Lenis when it is available', async () => {
    const scrollTo = vi.fn()
    lenisRef.current = { scrollTo }
    const el = await mountAppLayout()
    const link = el.querySelector<HTMLAnchorElement>('a[href="#about"]')
    expect(link).not.toBeNull()

    let event: MouseEvent | null = null
    act(() => {
      event = new MouseEvent('click', { bubbles: true, cancelable: true })
      link!.dispatchEvent(event)
    })

    expect(event!.defaultPrevented).toBe(true)
    expect(scrollTo).toHaveBeenCalledWith('#about', { duration: 1.2 })
  })
})
