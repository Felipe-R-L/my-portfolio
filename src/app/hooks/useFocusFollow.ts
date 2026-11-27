import { useEffect, type RefObject } from "react";
import type Lenis from "lenis";

/**
 * Keeps what the keyboard focuses on screen. The page is pinned stages and
 * glide passages, so the browser's own "scroll the focused element into
 * view" often lands short or is carried away by a passage; a visitor on the
 * keyboard would be tabbing through things they cannot see. When focus comes
 * from the keyboard and lands outside the screen, the page goes to it.
 *
 * A scene that knows better (the projects, whose items share one stage)
 * moves the page itself and marks the event with `data-focus-handled`.
 */
export function useFocusFollow(lenisRef: RefObject<Lenis | null>) {
  useEffect(() => {
    const onFocus = (e: FocusEvent) => {
      const el = e.target;
      if (!(el instanceof HTMLElement) || !el.matches(":focus-visible")) return;
      if (el.closest("nav, [data-focus-handled]")) return;
      // read after the scene's own handler has had its turn
      requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        if (r.width === 0 && r.height === 0) return;
        if (r.top >= 72 && r.bottom <= vh - 24) return;
        const lenis = lenisRef.current;
        const target = window.scrollY + r.top - vh * 0.35;
        if (lenis) lenis.scrollTo(target, { immediate: true, force: true });
        else window.scrollTo({ top: target, behavior: "instant" as ScrollBehavior });
      });
    };
    document.addEventListener("focusin", onFocus);
    return () => document.removeEventListener("focusin", onFocus);
  }, [lenisRef]);
}
