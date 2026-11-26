import { useLayoutEffect, type RefObject } from "react";

import { clamp01 } from "../scroll/math";

/**
 * How far a sticky stage has gone on its way out, as `--leave` (0..1) on the
 * stage: 0 while it is stuck, 1 once it has scrolled `over` screens past its
 * track's end. A crossing starts the moment a stage lets go, and its words
 * have to be gone before the frame passes where they stand; the CSS fades
 * them by it (opacity only).
 */
export function useLeave(track: RefObject<HTMLElement | null>, stage: RefObject<HTMLElement | null>, enabled: boolean, over = 0.25) {
  useLayoutEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const t = track.current;
      const s = stage.current;
      if (!t || !s) return;
      const vh = window.innerHeight;
      // the track's bottom reaches the screen's bottom when the stage lets go
      const past = vh - t.getBoundingClientRect().bottom;
      s.style.setProperty("--leave", clamp01(past / (over * vh)).toFixed(3));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [track, stage, enabled, over]);
}
