/**
 * Fora do código: Felipe's own photos, from his phones, picked with him
 * (2026-11-28). No one else's face from the front. The place is the town
 * the phone's GPS put the photo in, or what Felipe said; a photo without
 * either has no place at all, never a guess. The exposure comes from each
 * file's EXIF. The published files carry no metadata (no GPS).
 *
 * Files: `fora/<key>-800|1600.avif|webp` on the media host (media.ts).
 */
import { media } from "../media";

export type GalleryItem = {
  /** File key and i18n key (`fora.photos.<key>`). */
  key: string;
  /** Width over height. */
  ratio: number;
  /** Day the photo was taken, as the film's edge print writes it. */
  date: string;
  /** Town and state, or null when the file has no place. */
  place: string | null;
  /** Aperture, shutter, ISO and focal length (35 mm equivalent). */
  exposure: string;
  camera: string;
  /** A muted loop instead of a photo. */
  video?: { webm: string; mp4: string; poster: string };
};

const PORTRAIT = 3 / 4;
const LANDSCAPE = 4 / 3;

export const GALLERY: readonly GalleryItem[] = [
  { key: "img-1598", ratio: PORTRAIT, date: "25.12.25", place: "Trindade · Paraty, RJ", exposure: "ƒ/1.6 · 1/2398 · ISO 50 · 43 mm", camera: "iPhone 15" },
  { key: "20230201-124655", ratio: PORTRAIT, date: "01.02.23", place: null, exposure: "ƒ/2.2 · 1/2744 · ISO 50 · 13 mm", camera: "Galaxy S20" },
  { key: "img-1889", ratio: PORTRAIT, date: "26.12.25", place: "Paraty, RJ", exposure: "ƒ/1.6 · 1/120 · ISO 100 · 37 mm", camera: "iPhone 15" },
  {
    key: "jetski",
    ratio: 9 / 16,
    date: "29.01.23",
    place: null,
    exposure: "30 fps",
    camera: "Galaxy S20",
    video: { webm: "fora/jetski-720.webm", mp4: "fora/jetski-720.mp4", poster: "fora/jetski-poster-720.webp" },
  },
  { key: "20230603-121738", ratio: LANDSCAPE, date: "03.06.23", place: null, exposure: "ƒ/1.8 · 1/2296 · ISO 50 · 26 mm", camera: "Galaxy S20" },
  { key: "img-1591", ratio: PORTRAIT, date: "25.12.25", place: "Trindade · Paraty, RJ", exposure: "ƒ/1.6 · 1/3788 · ISO 50 · 26 mm", camera: "iPhone 15" },
  { key: "20231026-133039", ratio: PORTRAIT, date: "26.10.23", place: "Ribeirão Preto, SP", exposure: "ƒ/1.8 · 1/120 · ISO 1000 · 23 mm", camera: "Galaxy S23+" },
  { key: "img-3787", ratio: 1200 / 898, date: "01.07.26", place: null, exposure: "ƒ/1.6 · 1/1220 · ISO 50 · 26 mm", camera: "iPhone 15" },
  { key: "20230129-134030", ratio: LANDSCAPE, date: "29.01.23", place: null, exposure: "ƒ/1.8 · 1/1948 · ISO 50 · 26 mm", camera: "Galaxy S20" },
  { key: "img-4310", ratio: LANDSCAPE, date: "21.08.26", place: "Campinas, SP", exposure: "ƒ/1.6 · 1/121 · ISO 50 · 36 mm", camera: "iPhone 15" },
  { key: "20210813-081017", ratio: LANDSCAPE, date: "13.08.21", place: null, exposure: "ƒ/2.0 · 1/344 · ISO 50 · 28 mm", camera: "Galaxy S20" },
  { key: "20230127-115249", ratio: LANDSCAPE, date: "27.01.23", place: null, exposure: "ƒ/1.8 · 1/4512 · ISO 50 · 26 mm", camera: "Galaxy S20" },
  { key: "img-1827", ratio: PORTRAIT, date: "26.12.25", place: "Paraty, RJ", exposure: "ƒ/1.6 · 1/10989 · ISO 50 · 26 mm", camera: "iPhone 15" },
  { key: "20230126-174143", ratio: LANDSCAPE, date: "26.01.23", place: null, exposure: "ƒ/1.8 · 1/5472 · ISO 50 · 26 mm", camera: "Galaxy S20" },
];

/** The photos only (the lightbox pages through these). */
export const PHOTOS = GALLERY.filter((g) => !g.video);

export function photoSrc(key: string, w: 800 | 1600, type: "avif" | "webp"): string {
  return media(`fora/${key}-${w}.${type}`);
}

/** A caption's height under a frame, in column widths. */
const CAPTION = 0.12;

/**
 * The mosaic: each item, in order, goes to the shortest column, so the
 * columns end close together and the order still reads left to right.
 * Returns the indices of GALLERY per column.
 */
export function columnsOf(items: readonly { ratio: number }[], n: number): number[][] {
  const cols = Array.from({ length: Math.max(1, n) }, () => ({ ids: [] as number[], h: 0 }));
  items.forEach((it, i) => {
    let s = cols[0];
    for (const c of cols) if (c.h < s.h - 1e-9) s = c;
    s.ids.push(i);
    s.h += 1 / it.ratio + CAPTION;
  });
  return cols.map((c) => c.ids);
}
