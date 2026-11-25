/** Pure helpers shared by the scroll scenes, kept apart from GSAP so they can be tested. */

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Local progress (0..1) of `p` inside the band [from, to]. */
export function span(p: number, from: number, to: number): number {
  return clamp01((p - from) / (to - from));
}

/** How far a horizontal track must travel to show its last item. */
export function timelineDistance(trackWidth: number, viewportWidth: number): number {
  return Math.max(0, trackWidth - viewportWidth);
}

/** A count-up value at progress `p`, eased out so the last digits settle slowly. */
export function countAt(p: number, target: number): number {
  const t = clamp01(p);
  return Math.round(target * (1 - Math.pow(1 - t, 3)));
}
