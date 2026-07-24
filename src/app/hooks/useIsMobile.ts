import { useSyncExternalStore } from "react";

const MOBILE_QUERY = "(max-width: 768px)";

/**
 * Reactive mobile detection.
 *
 * The previous approach (`window.innerWidth <= 768` read inline during render)
 * was evaluated once per render, never updated on resize, and broke the
 * render/commit contract. `useSyncExternalStore` keeps every consumer in sync
 * with a single `matchMedia` listener and is SSR-safe via `getServerSnapshot`.
 */
function subscribe(onChange: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(MOBILE_QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
