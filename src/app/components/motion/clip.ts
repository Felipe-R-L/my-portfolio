/**
 * A recorded clip's metadata (scripts/capture → <clip>.json): the hand's path,
 * the clicks, the named moments and where things were on screen, all on the
 * video's own clock and in its own pixels (1440 × 900). Fetched only when the
 * clip is about to play, once.
 */
export type Rect = { x: number; y: number; w: number; h: number };
export type ClipMeta = {
  duration: number;
  size: [number, number];
  cursor: [number, number, number][];
  clicks: number[];
  marks: Record<string, number>;
  boxes: Record<string, Rect & { t: number }>;
};

export const CLIP_DIR = "/assets/projects/video";
const cache = new Map<string, Promise<ClipMeta | null>>();

export function loadClip(name: string): Promise<ClipMeta | null> {
  let p = cache.get(name);
  if (!p) {
    p = fetch(`${CLIP_DIR}/${name}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<ClipMeta>) : null))
      .catch(() => null);
    cache.set(name, p);
  }
  return p;
}

/**
 * Where the hand is at `t`. Between two samples of one movement it is
 * interpolated; across a pause (samples far apart) it rests where it stopped.
 */
export function cursorAt(meta: ClipMeta, t: number): { x: number; y: number } {
  const c = meta.cursor;
  if (c.length === 0) return { x: -100, y: -100 };
  if (t <= c[0][0]) return { x: c[0][1], y: c[0][2] };
  let lo = 0;
  let hi = c.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (c[mid][0] <= t) lo = mid;
    else hi = mid;
  }
  const a = c[lo];
  const b = c[hi];
  if (t >= b[0]) return { x: b[1], y: b[2] };
  const gap = b[0] - a[0];
  if (gap > 0.12) return { x: a[1], y: a[2] };
  const k = (t - a[0]) / gap;
  return { x: a[1] + (b[1] - a[1]) * k, y: a[2] + (b[2] - a[2]) * k };
}

/** The click under way at `t`: how far into it (0..1 over 0.6 s), or -1. */
export function clickAt(meta: ClipMeta, t: number): number {
  for (const c of meta.clicks) if (t >= c && t < c + 0.6) return (t - c) / 0.6;
  return -1;
}

export const center = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
