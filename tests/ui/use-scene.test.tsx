import { describe, it, expect, vi, afterEach } from 'vitest'
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const revert = vi.fn()
const mmRevert = vi.fn()
vi.mock('../../src/app/scroll/gsap', () => ({
  gsap: {
    context: (fn: () => void) => {
      fn()
      return { revert }
    },
    matchMedia: () => ({ add: vi.fn(), revert: mmRevert }),
  },
  ScrollTrigger: { defaults: vi.fn() },
}))

import { useScene, type SceneCtx } from '../../src/app/scroll/useScene'

function setReduced(reduced: boolean) {
  window.matchMedia = ((q: string) => ({
    matches: q.includes('prefers-reduced-motion') ? reduced : false,
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia
}

let root: Root | null = null
let container: HTMLDivElement | null = null

afterEach(() => {
  act(() => root?.unmount())
  container?.remove()
  root = null
  container = null
  revert.mockClear()
  mmRevert.mockClear()
})

function mount(build: (ctx: SceneCtx) => void) {
  function Scene() {
    const ref = React.useRef<HTMLDivElement>(null)
    useScene(ref, build)
    return React.createElement('div', { ref })
  }
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root!.render(React.createElement(Scene)))
}

describe('useScene', () => {
  it('tells the scene when motion is reduced', () => {
    setReduced(true)
    const build = vi.fn()
    mount(build)
    expect(build).toHaveBeenCalledTimes(1)
    expect(build.mock.calls[0][0].reduced).toBe(true)
  })

  it('reverts everything it created on unmount', () => {
    setReduced(false)
    mount(() => {})
    act(() => root!.unmount())
    root = null
    expect(revert).toHaveBeenCalled()
    expect(mmRevert).toHaveBeenCalled()
  })
})
