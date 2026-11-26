/**
 * The hero camera: which part of the one scene photo fills the screen at a
 * given point of the pull-back. Pure, so it can be tested and shared by the
 * <img> and the WebGL reveal.
 */

export type Rect = { x: number; y: number; w: number; h: number };
export type Shot = {
  src: string;
  /** The same frame in colour, any resolution, same aspect. */
  color: string;
  /** The person cut out: white is him. Same aspect. */
  matte: string;
  width: number;
  height: number;
  /** Centre of the face, in asset pixels (measured on the matte). */
  face: { x: number; y: number };
  /** The corner that is only buildings, where the scene starts. */
  start: Rect;
  /** Final framing for a given viewport size. */
  end: (vw: number, vh: number) => Rect;
};
export type Camera = { x: number; y: number; scale: number };

export const SHOT_WIDE: Shot = {
  src: "/assets/profile/scene-wide-3400.webp",
  color: "/assets/profile/scene-wide-color.webp",
  matte: "/assets/profile/scene-wide-matte.webp",
  width: 3400,
  height: 2125,
  face: { x: 1790, y: 543 },
  // Lower left of the frame: the near blocks, which the phone photographed
  // sharp. The distant skyline is haze in the original, and no upscaling
  // brings back detail that was never captured.
  start: { x: 0, y: 1000, w: 1141, h: 900 },
  end: () => ({ x: 0, y: 0, w: 3400, h: 2125 }),
};

export const SHOT_TALL: Shot = {
  src: "/assets/profile/scene-tall-1800.webp",
  color: "/assets/profile/scene-tall-color.webp",
  matte: "/assets/profile/scene-tall-matte.webp",
  width: 1800,
  height: 2185,
  face: { x: 933, y: 1262 },
  // Lower-left corner: blocks and the railing, clear of the arm.
  start: { x: 0, y: 1075, w: 323, h: 1025 },
  // Centred on the person, head in the upper third.
  end: (vw, vh) => {
    const h = 1589;
    const w = (h * vw) / vh;
    return { x: 826 - w / 2, y: 576, w, h };
  },
};

/** Scale and centre that make `r` cover a vw x vh viewport. */
export function cover(r: Rect, vw: number, vh: number) {
  const s = Math.max(vw / r.w, vh / r.h);
  return { s, cx: r.x + r.w / 2, cy: r.y + r.h / 2 };
}

export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * The camera at pull-back progress `q` (0 = skyline corner, 1 = final
 * framing). Scale moves geometrically so the pull-back keeps a constant speed.
 */
export function cameraAt(q: number, shot: Shot, vw: number, vh: number): Camera {
  const a = cover(shot.start, vw, vh);
  const b = cover(shot.end(vw, vh), vw, vh);
  const e = easeInOut(Math.min(1, Math.max(0, q)));
  const s = a.s * Math.pow(b.s / a.s, e);
  const cx = a.cx + (b.cx - a.cx) * e;
  const cy = a.cy + (b.cy - a.cy) * e;
  return { scale: s, x: vw / 2 - cx * s, y: vh / 2 - cy * s };
}
