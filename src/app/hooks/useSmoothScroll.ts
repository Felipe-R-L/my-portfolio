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
    const lenis = new Lenis({
      lerp: 0.07, // low lerp = more momentum glide
      smoothWheel: true, // smooth mouse-wheel scrolling
      autoResize: true, // recalculate on resize
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return lenisRef;
}
