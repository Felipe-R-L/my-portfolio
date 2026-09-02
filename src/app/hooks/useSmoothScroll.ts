import { useEffect, useRef } from "react";
import Lenis from "lenis";

/**
 * Initialises Lenis smooth-scroll with momentum/inertia.
 *
 * `lerp` controls how quickly the scroll "catches up" to the target —
 * lower = more momentum & glide, higher = snappier.
 * 0.06-0.08 gives a nice Apple-like coasting feel.
 */
export function useSmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) return;

    const lenis = new Lenis({
      lerp: 0.07, // low lerp = more momentum glide
      smoothWheel: true, // smooth mouse-wheel scrolling
      autoResize: true, // recalculate on resize
    });

    lenisRef.current = lenis;

    // The frame id has to be captured: `lenis.destroy()` only cancels Lenis's
    // own loop, and it never starts one here because `autoRaf` defaults to
    // false. Without this the loop outlives the effect and keeps calling
    // `raf()` on a destroyed instance — one leaked loop per hot reload.
    let frameId = requestAnimationFrame(function raf(time: number) {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    });

    return () => {
      cancelAnimationFrame(frameId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return lenisRef;
}
