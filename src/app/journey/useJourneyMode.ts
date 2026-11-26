import { useEffect, useState } from "react";

import { PHONE_QUERY } from "../scroll/useScene";

/**
 * How a chapter is told on this device:
 * - "scroll": wide screens, a sticky stage and the journey's frame driven by the scroll;
 * - "swipe": phones, the frame in the flow of the page and touch gestures;
 * - "list": reduced motion, plain content with stills, no frame.
 */
export type JourneyMode = "scroll" | "swipe" | "list";

const REDUCED = "(prefers-reduced-motion: reduce)";

function current(): JourneyMode {
  if (typeof window === "undefined" || !window.matchMedia) return "scroll";
  if (window.matchMedia(REDUCED).matches) return "list";
  return window.matchMedia(PHONE_QUERY).matches ? "swipe" : "scroll";
}

export function useJourneyMode(): JourneyMode {
  const [mode, setMode] = useState<JourneyMode>(current);
  useEffect(() => {
    const queries = [window.matchMedia?.(REDUCED), window.matchMedia?.(PHONE_QUERY)];
    const update = () => setMode(current());
    queries.forEach((q) => q?.addEventListener?.("change", update));
    return () => queries.forEach((q) => q?.removeEventListener?.("change", update));
  }, []);
  return mode;
}
