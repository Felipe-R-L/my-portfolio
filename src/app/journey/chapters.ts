/**
 * The journey's chapters, in order, and the pure geometry of the frame that
 * travels through them. Nothing here touches the DOM, so it is tested as is.
 *
 * Each chapter keeps the element id the page already had, so links from the
 * blog (`/#projects` and friends) still land in the right place. The case
 * ("superfície") is not a scroll chapter: it is a layer opened from a
 * destination, so the rail shows it as a state of Destinos.
 */
import { clamp01 } from "../scroll/math";

export type ChapterId = "partida" | "destinos" | "telemetria" | "plano" | "retorno";

export type Chapter = {
  id: ChapterId;
  /** The DOM id the chapter starts at (kept from the previous page). */
  anchor: string;
  /** i18n key of the chapter's name, shown in the nav and the rail. */
  label: `journey.chapters.${ChapterId}`;
};

export const CHAPTERS: readonly Chapter[] = [
  { id: "partida", anchor: "about", label: "journey.chapters.partida" },
  { id: "destinos", anchor: "projects", label: "journey.chapters.destinos" },
  { id: "telemetria", anchor: "proof", label: "journey.chapters.telemetria" },
  { id: "plano", anchor: "process", label: "journey.chapters.plano" },
  { id: "retorno", anchor: "contact", label: "journey.chapters.retorno" },
];

export function chapterIndex(id: ChapterId): number {
  return CHAPTERS.findIndex((c) => c.id === id);
}

/**
 * Where the visitor is along the whole journey (0..1) given the chapter in
 * view and the progress inside it: every chapter weighs the same on the rail,
 * whatever its scroll length, so the rail reads as "chapter 3 of 5".
 */
export function journeyProgress(id: ChapterId, local: number): number {
  const i = chapterIndex(id);
  if (i < 0) return 0;
  return (i + clamp01(local)) / CHAPTERS.length;
}

/** A rectangle in viewport fractions: 0..1 of the width and of the height. */
export type FrameRect = { x: number; y: number; w: number; h: number };

export const FULL: FrameRect = { x: 0, y: 0, w: 1, h: 1 };

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpRect(a: FrameRect, b: FrameRect, t: number): FrameRect {
  const k = clamp01(t);
  return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), w: lerp(a.w, b.w, k), h: lerp(a.h, b.h, k) };
}

/**
 * The transform that puts a full-viewport box onto `r`, scaled non-uniformly
 * about its top-left corner. Only transform changes, so the frame moves on
 * the compositor. The content inside takes the inverse scale (see
 * `counterScale`) so it is never squashed.
 */
export function frameTransform(r: FrameRect, vw: number, vh: number) {
  return { x: r.x * vw, y: r.y * vh, sx: r.w, sy: r.h };
}

/**
 * The content's own transform inside a frame scaled by (sx, sy): it undoes
 * the squash and then covers the frame uniformly, centred, like
 * `object-fit: cover`. Returned scale factors are relative to the content box.
 */
export function counterScale(sx: number, sy: number) {
  const cover = Math.max(sx, sy);
  return { sx: cover / sx, sy: cover / sy };
}

/** The corner radius, in frame-local units, that lands at `px` on screen. */
export function radiusFor(px: number, sx: number, sy: number) {
  return { rx: px / Math.max(sx, 1e-6), ry: px / Math.max(sy, 1e-6) };
}
