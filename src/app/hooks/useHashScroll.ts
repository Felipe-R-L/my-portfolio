import { useEffect, type RefObject } from "react";
import type Lenis from "lenis";

/**
 * How long to keep looking for the hash target before giving up. The sections
 * mount with React, and Galaxy/i18n resolve on their own schedule, so the
 * element is reliably absent for the first few frames and occasionally longer
 * on a cold cache.
 */
const LOOKUP_TIMEOUT_MS = 2000;

/**
 * How long to keep the target pinned to the top after first reaching it.
 *
 * Landing on the section once is not enough: web fonts swap, the marquee
 * measures itself, and images above the fold resolve, each of which changes
 * the height of everything before the target and slides it back down the
 * page. Waiting for `load` instead does not work — by the time this effect
 * runs, `load` has often already fired and a `once` listener would never see
 * it. So re-assert instead, and stop the moment the reader takes over.
 */
const SETTLE_MS = 1200;

/** Ignore sub-pixel drift; only correct movement a reader would notice. */
const DRIFT_TOLERANCE_PX = 2;

/**
 * Scrolls to `location.hash` once the section it names actually exists.
 *
 * index.html is an empty SPA shell. The browser resolves the fragment while
 * parsing it, finds no `#about` in the document, and gives up — permanently.
 * React mounts the section a few hundred milliseconds later, by which point
 * nobody is asking to scroll any more, so `/#about` from the blog landed on
 * the hero. Clicking the same link from the homepage always worked, because
 * there GlassNav scrolls imperatively from its own click handler and never
 * relies on the browser's fragment handling at all.
 */
export function useHashScroll(lenisRef: RefObject<Lenis | null>) {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;

    let frame = 0;
    let cancelled = false;
    const startedAt = performance.now();

    // Any deliberate input means the reader has taken the page over. Stop
    // correcting immediately — a page that scrolls itself back is worse than
    // one that landed slightly low.
    const yieldToReader = () => {
      cancelled = true;
    };
    const USER_INTENT = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
    USER_INTENT.forEach((type) =>
      window.addEventListener(type, yieldToReader, { passive: true, once: true }),
    );

    const scrollToTarget = (target: HTMLElement) => {
      const lenis = lenisRef.current;
      // Instant, never animated. This is an arrival, not a navigation: a
      // 1300px glide on first paint reads as the page scrolling by itself,
      // and it would race the hero's entrance animation. Lenis owns the
      // scroll position wherever it is running, so going through the browser
      // there would just be undone on its next frame.
      if (lenis) lenis.scrollTo(target, { immediate: true });
      else target.scrollIntoView({ behavior: "auto", block: "start" });
    };

    const settle = (settleStartedAt: number) => {
      if (cancelled) return;
      const target = document.getElementById(id);
      if (target && Math.abs(target.getBoundingClientRect().top) > DRIFT_TOLERANCE_PX) {
        scrollToTarget(target);
      }
      if (performance.now() - settleStartedAt < SETTLE_MS) {
        frame = requestAnimationFrame(() => settle(settleStartedAt));
      }
    };

    const findTarget = () => {
      if (cancelled) return;
      const target = document.getElementById(id);
      if (target) {
        scrollToTarget(target);
        settle(performance.now());
        return;
      }
      if (performance.now() - startedAt < LOOKUP_TIMEOUT_MS) {
        frame = requestAnimationFrame(findTarget);
      }
    };

    frame = requestAnimationFrame(findTarget);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      USER_INTENT.forEach((type) => window.removeEventListener(type, yieldToReader));
    };
  }, [lenisRef]);
}
