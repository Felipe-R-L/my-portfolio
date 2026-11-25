import { useEffect, useRef } from "react";
import Lenis from "lenis";

import { gsap, ScrollTrigger } from "../scroll/gsap";

/**
 * Lenis smooth scrolling on desktop, driven by GSAP's ticker so ScrollTrigger
 * and Lenis read the same frame. Off on phones (native touch scrolling) and
 * for visitors who asked for reduced motion.
 */
export function useSmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const isPhone = window.matchMedia("(max-width: 767px)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isPhone || reduced) return;

    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true, autoResize: true });
    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return lenisRef;
}
