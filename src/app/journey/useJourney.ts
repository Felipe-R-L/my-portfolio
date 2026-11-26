import { useLayoutEffect, useMemo, useState } from "react";

import { ScrollTrigger } from "../scroll/gsap";
import { createSignal, type Signal } from "../scroll/signal";
import { CHAPTERS, journeyProgress, type ChapterId } from "./chapters";

export type Journey = {
  /** The chapter under the middle of the screen. Changes a handful of times. */
  active: ChapterId;
  /** Progress along the whole journey, 0..1, every frame (no re-render). */
  progress: Signal<number>;
};

/**
 * Tracks where the visitor is. Every element marked `data-journey="<id>"`
 * belongs to that chapter; a chapter spans from its first element's top to
 * its last element's bottom (the opening is the hero plus, on a phone, the
 * story list after it). Pins are already in place when this runs (the
 * scenes' layout effects run first), so the ranges include them.
 */
export function useJourney(): Journey {
  const [active, setActive] = useState<ChapterId>("partida");
  const progress = useMemo(() => createSignal(0), []);

  useLayoutEffect(() => {
    const triggers: ScrollTrigger[] = [];
    for (const chapter of CHAPTERS) {
      const els = [...document.querySelectorAll<HTMLElement>(`[data-journey="${chapter.id}"]`)];
      if (els.length === 0) continue;
      triggers.push(
        ScrollTrigger.create({
          trigger: els[0],
          endTrigger: els[els.length - 1],
          start: "top center",
          end: "bottom center",
          onToggle: (self) => {
            if (self.isActive) setActive(chapter.id);
          },
          onUpdate: (self) => progress.set(journeyProgress(chapter.id, self.progress)),
          onRefresh: (self) => {
            if (self.isActive) {
              setActive(chapter.id);
              progress.set(journeyProgress(chapter.id, self.progress));
            }
          },
        }),
      );
    }
    return () => triggers.forEach((t) => t.kill());
  }, [progress]);

  return { active, progress };
}
