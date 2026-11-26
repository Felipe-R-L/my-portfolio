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

/** A camera pose at a time: tilt (deg), scale, and the screen point at the centre. */
export type Pose = { t: number; rx: number; ry: number; s: number; x: number; y: number };
const CHANNELS = ["rx", "ry", "s", "x", "y"] as const;

/**
 * The camera between its keys: one smooth curve through all of them (a
 * monotone cubic, Fritsch–Carlson), instead of an ease in and out per pair,
 * which brought the camera to a stop at every key and read as a jolt. Being
 * monotone it never overshoots a key, and where two keys hold the same pose
 * the camera stays perfectly still; it starts and ends at rest.
 */
export function cameraAt(keys: readonly Pose[], t: number): Pose {
  const n = keys.length;
  if (n === 0) throw new Error("cameraAt: no keys");
  if (t <= keys[0].t || n === 1) return { ...keys[0], t };
  if (t >= keys[n - 1].t) return { ...keys[n - 1], t };
  let i = 1;
  while (keys[i].t < t) i++;
  const a = keys[i - 1];
  const b = keys[i];
  const h = Math.max(1e-3, b.t - a.t);
  const u = (t - a.t) / h;
  const out: Pose = { t, rx: 0, ry: 0, s: 0, x: 0, y: 0 };
  for (const c of CHANNELS) out[c] = hermite(a[c], b[c], slope(keys, i - 1, c) * h, slope(keys, i, c) * h, u);
  return out;
}

function hermite(p0: number, p1: number, m0: number, m1: number, u: number) {
  const u2 = u * u;
  const u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * m1;
}

/** The curve's slope at key `k` for one channel (per second). */
function slope(keys: readonly Pose[], k: number, c: (typeof CHANNELS)[number]): number {
  if (k === 0 || k === keys.length - 1) return 0;
  const h0 = Math.max(1e-3, keys[k].t - keys[k - 1].t);
  const h1 = Math.max(1e-3, keys[k + 1].t - keys[k].t);
  const d0 = (keys[k][c] - keys[k - 1][c]) / h0;
  const d1 = (keys[k + 1][c] - keys[k][c]) / h1;
  if (d0 === 0 || d1 === 0 || Math.sign(d0) !== Math.sign(d1)) return 0;
  const w1 = 2 * h1 + h0;
  const w2 = h1 + 2 * h0;
  return (w1 + w2) / (w1 / d0 + w2 / d1);
}
