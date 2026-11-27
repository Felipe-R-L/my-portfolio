/**
 * Passages: the stretches of scroll where a scene changes (a card turning,
 * the camera diving, a frame moving aside). None is ever left half done.
 *
 * - The wheel: a gesture into a change plays it through. A harder scroll
 *   plays it faster, like speeding up a video; another gesture the same way
 *   hurries it along; one the other way turns it back at once. The next
 *   change waits for a gesture of its own.
 * - The scrollbar and the keys move the page natively, in the visitor's
 *   hand; when they let go inside a change, it finishes in the direction
 *   they were going.
 * - Holds: the stretches where a pinned stage just waits between two changes
 *   (nothing on screen moves with the scroll). Left from when the scroll
 *   drove every frame, they would only be scroll that does nothing; a
 *   gesture crosses them at once, into the next change.
 * - Everywhere else (the page's own content) the scroll is free.
 *
 * Pure helpers here; the controller lives with Lenis (useSmoothScroll).
 */

export type Passage = {
  /** Page scroll, in px, where the change starts and where it has settled. */
  from: number;
  to: number;
  /** Seconds the whole change plays at 1x, when its scroll length says
      little about how much moves on screen (the camera diving 90x through a
      name in one screen of scroll). Omitted: derived from the length. */
  duration?: number;
  /** A hold, not a change: nothing moves on screen across it. */
  hold?: boolean;
  /** How much a fast scroll speeds this change up, against the rest (1):
      0.5 takes half the gain, 1.6 takes 60% more. Its time at 1x is the same. */
  sensitivity?: number;
  /** Played on a gentler curve: it gets moving at once and never rushes
      the middle (the sea crossing the screen), where a plain ease-in-out
      sat still for the first second and then swept it past in half a one. */
  soft?: boolean;
  /** Played under something that covers the screen (the sea before the
      Contato): the page barely moves while the cover comes up, crosses the
      whole way while the screen is covered, and is still as it goes. */
  under?: boolean;
  /** Plays whole, on its own time: a harder scroll does not speed it up and
      gestures while it plays do not hurry it (something on its own clock
      runs inside it, the hero's sea). Implied by `under`. */
  whole?: boolean;
};

type Builder = () => Passage[];

const builders = new Map<string, Builder>();

export function registerPassages(key: string, build: Builder): () => void {
  builders.set(key, build);
  return () => builders.delete(key);
}

/** Measured afresh on every gesture that might enter one: a handful of
    layout reads, and never stale (images, fonts and the stage settle late). */
export function passages(): Passage[] {
  return mergePassages(all().filter((p) => !p.hold));
}

/** The holds, sorted. */
export function holds(): Passage[] {
  return all()
    .filter((p) => p.hold && p.to - p.from > 1)
    .sort((a, b) => a.from - b.from);
}

function all(): Passage[] {
  return [...builders.values()].flatMap((b) => b());
}

/** The hold a gesture from `y` in direction `dir` would cross, and the end it
    lands on: one it is inside, or one starting right where it rests. */
export function holdAhead(list: Passage[], y: number, dir: number, eps = 1): number | null {
  for (const h of list) {
    if (dir > 0 && y >= h.from - eps && y < h.to - eps) return h.to;
    if (dir < 0 && y <= h.to + eps && y > h.from + eps) return h.from;
  }
  return null;
}

/** How long a change plays through `distance` px at 1x: time for the camera
    and the cards to be followed (about 1.2 s for the dive through the name,
    1 s for a card turning), never long enough to feel held. Tuned with
    Felipe on 2026-11-26: 2.6 s held the visitor back, 0.45 s was a jolt,
    0.9 to 1.8 s still a little heavy. A harder scroll plays it faster
    (useSmoothScroll). */
export function playDuration(distance: number, vh: number): number {
  return Math.min(1.5, Math.max(0.75, 0.66 + 0.5 * (Math.abs(distance) / Math.max(1, vh))));
}

/** How long `passage` plays from where the page is to `to`, at 1x: its own
    duration (or one derived from its length), shortened in proportion when
    the page enters it partway. */
export function durationFor(passage: Passage, distance: number, vh: number): number {
  if (!passage.duration) return playDuration(distance, vh);
  const share = Math.abs(distance) / Math.max(1, passage.to - passage.from);
  return passage.duration * Math.min(1, Math.max(0.35, share));
}

/** The speed a change plays at, from the speed the scroll asks for: the gain
    over 1x scaled by the change's own sensitivity. */
export function speedFor(passage: Passage, speed: number): number {
  if (passage.whole || passage.under) return 1;
  return 1 + (speed - 1) * (passage.sensitivity ?? 1);
}

/** The finish of a change the scrollbar or a key left half done. */
export function settleDuration(distance: number, vh: number): number {
  return Math.min(0.9, Math.max(0.45, 0.4 + 0.6 * (Math.abs(distance) / Math.max(1, vh))));
}

/** Sorted, with passages that overlap made one (a hand-over between two
    scenes plays as a single move). Passages that only touch stay apart: one
    gesture, one step (a rail moving chapter by chapter). */
export function mergePassages(list: Passage[], gap = 2): Passage[] {
  const sorted = list.filter((p) => p.to - p.from > 1).sort((a, b) => a.from - b.from);
  const out: Passage[] = [];
  for (const p of sorted) {
    const last = out[out.length - 1];
    if (last && p.from < last.to - gap) {
      // a merged passage plays the longer of the two times, or takes its
      // time from its whole length
      const duration = Math.max(last.duration ?? 0, p.duration ?? 0) || undefined;
      const sensitivity = last.sensitivity ?? p.sensitivity;
      const soft = last.soft || p.soft;
      const under = last.under || p.under;
      const whole = last.whole || p.whole;
      out[out.length - 1] = { from: last.from, to: Math.max(last.to, p.to), ...(duration ? { duration } : {}), ...(sensitivity !== undefined ? { sensitivity } : {}), ...(soft ? { soft } : {}), ...(under ? { under } : {}), ...(whole ? { whole } : {}) };
    } else out.push({ ...p });
  }
  return out;
}

/**
 * Where a wheel gesture should play to, if anywhere: from `y` (where the page
 * is headed), moving by `delta`, the first change in the direction of travel
 * that the move would enter or that `y` is already inside. Null lets the
 * scroll through.
 */
export function playTarget(list: Passage[], y: number, delta: number, eps = 0.5): { passage: Passage; to: number } | null {
  const next = y + delta;
  if (delta > 0) {
    for (const p of list) if (y < p.to - eps && next > p.from + eps) return { passage: p, to: p.to };
  } else if (delta < 0) {
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      if (y > p.from + eps && next < p.to - eps) return { passage: p, to: p.from };
    }
  }
  return null;
}

/**
 * Where a page left at `y` should settle: inside a change, its end in the
 * direction of travel (`dir` > 0 down, < 0 up; 0 = the nearer end). Null when
 * it rests outside every change.
 */
export function settleTarget(list: Passage[], y: number, dir: number, eps = 1): number | null {
  const p = list.find((q) => y > q.from + eps && y < q.to - eps);
  if (!p) return null;
  if (dir > 0) return p.to;
  if (dir < 0) return p.from;
  return y - p.from < p.to - y ? p.from : p.to;
}

// dev only: the measured passages, for checking them in the console
if (import.meta.env?.DEV && typeof window !== "undefined") {
  (window as unknown as { __passages: () => Passage[] }).__passages = passages;
}

/** The curve of a passage played `under` a cover: still, then across while
    the cover is whole (45% to 55% of the time: the sea fills the screen
    from about 0.4 to 0.6 of its wash), then still. */
export function underCurve(t: number): number {
  const x = Math.max(0, Math.min(1, (t - 0.45) / 0.1));
  return x * x * (3 - 2 * x);
}

/** Fired on window when a passage played `under` a cover starts, so the
    cover plays with it: detail = { dir, seconds }. */
export const UNDER_EVENT = "glide:under";

/** Fired on window when the pace of a passage on its own clock changes (a
    gesture hurrying it along, or back to 1x when it is done or turned
    back): detail = { pace }. Whatever runs on a clock inside the passage
    (the seas) plays at that pace too, so the page and the water stay
    together frame for frame. */
export const PACE_EVENT = "glide:pace";

let pace = 1;

/** The pace a passage on its own clock plays at now (1 = its own time). */
export function currentPace(): number {
  return pace;
}

export function setPace(k: number): void {
  if (k === pace) return;
  pace = k;
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(PACE_EVENT, { detail: { pace: k } }));
}

/** A stretch of a passage's curve: `ease` from u0 to u1 (either way),
    renormalised to 0..1 for a scroll from where the page is to the end it
    is headed for. Hurrying keeps the same curve, only faster; turning back
    plays it backwards; so every frame in between is still seen. */
export function segmentEase(ease: (t: number) => number, u0: number, u1: number): (s: number) => number {
  const a = ease(u0);
  const d = ease(u1) - a;
  if (Math.abs(d) < 1e-6) return (s) => s;
  return (s) => (ease(u0 + s * (u1 - u0)) - a) / d;
}
