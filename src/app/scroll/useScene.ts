import { useLayoutEffect, type RefObject } from "react";

import { gsap, ScrollTrigger } from "./gsap";

export type SceneCtx = {
  /** Breakpoint-scoped setup: `mm.add("(min-width: 768px)", () => …)`. */
  mm: gsap.MatchMedia;
  /** The visitor asked for less motion: build a static, legible layout. */
  reduced: boolean;
  isPhone: boolean;
};

export const PHONE_QUERY = "(max-width: 767px)";
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

// Measurements change with the viewport; every trigger recomputes them on refresh.
ScrollTrigger.defaults({ invalidateOnRefresh: true });

/**
 * Runs a scene's GSAP setup after mount, scoped to `ref`, and reverts every
 * tween, trigger and pin it made on unmount (or when `deps` change).
 */
export function useScene(
  ref: RefObject<HTMLElement>,
  build: (ctx: SceneCtx) => void,
  deps: unknown[] = [],
): void {
  useLayoutEffect(() => {
    if (!ref.current) return;
    const mm = gsap.matchMedia();
    const reduced = window.matchMedia(REDUCED_QUERY).matches;
    const isPhone = window.matchMedia(PHONE_QUERY).matches;
    const ctx = gsap.context(() => build({ mm, reduced, isPhone }), ref.current);
    return () => {
      mm.revert();
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
