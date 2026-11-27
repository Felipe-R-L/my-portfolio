import type Lenis from "lenis";
import { sound } from "../audio/sound";
import { passages } from "./glide";

/**
 * The nav's jump to a chapter: the page flown through in under a second, a
 * gust of wind on screen (motion blur and streaks, `html[data-jump]`,
 * journey.css) and a woosh, landing where the chapter comes to rest. No sea
 * on the way: the seas of the opening and of the Contato are set straight
 * to how they look there (picking chapters from the nav again and again,
 * the wave every time grew tiresome: Felipe, 2026-11-27), and the cues the
 * page would set off on the way (shutters, cards) stay quiet.
 */

/** Seconds the flight takes. */
export const JUMP_SECONDS = 0.9;

let jumping = false;
/** True while the nav is flying the page to a chapter. */
export const isJumping = () => jumping;

/** Where a target `y` comes to rest: a chapter's anchor can fall inside a
    change (the Contato's starts where the sea does), which would otherwise
    be finished one way or the other once the page stops there. */
export function restFor(y: number, list = passages()): number {
  for (const p of list) if (y > p.from + 1 && y < p.to - 1) return p.to;
  return y;
}

/** Where `el` sits on the page, wherever the page is now: inside a sticky
    stage (the hero's anchor for "Sobre"), a box reads wherever the stage has
    stuck, so it is measured from the stage's own section instead. */
export function docTop(el: HTMLElement): number {
  const r = el.getBoundingClientRect();
  for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
    if (getComputedStyle(a).position === "sticky" && a.parentElement) {
      return a.parentElement.getBoundingClientRect().top + window.scrollY + (r.top - a.getBoundingClientRect().top);
    }
  }
  return r.top + window.scrollY;
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function jumpTo(lenis: Lenis, el: HTMLElement): void {
  const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  // (measured first: the scenes place their anchors as they measure)
  const list = passages();
  const y = Math.min(max, restFor(Math.round(docTop(el)), list));
  if (Math.abs(y - window.scrollY) < 2) return;
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  jumping = true;
  sound.hush(JUMP_SECONDS + 0.3);
  if (!reduce) {
    sound.play("woosh", { force: true, pan: y > window.scrollY ? 0.15 : -0.15 });
    document.documentElement.dataset.jump = y > window.scrollY ? "down" : "up";
  }
  const done = () => {
    window.clearTimeout(safety);
    // a frame for the scenes to set themselves at the landing first
    requestAnimationFrame(() => {
      jumping = false;
      delete document.documentElement.dataset.jump;
    });
  };
  // never left flying if the scroll is taken over before it lands
  const safety = window.setTimeout(done, (JUMP_SECONDS + 0.6) * 1000);
  lenis.scrollTo(y, {
    duration: reduce ? 0 : JUMP_SECONDS,
    immediate: !!reduce,
    easing: easeInOutCubic,
    force: true,
    lock: true,
    onComplete: done,
  });
}
