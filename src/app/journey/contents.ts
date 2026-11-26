/**
 * What the journey's frame can show, by id. Each entry is a picture (and,
 * when recorded, its loop) plus a tiny pre-blurred copy for the rack focus:
 * the blur comes from upscaling 64 px, so nothing filters at run time.
 */
import { WORK, type ProjectVideoSources } from "../data/work";

/** A shot's own camera move over its beat, t 0..1: scale, and offsets in
    percent of the frame. Transform only. */
export type Drift = (t: number) => { s: number; x: number; y: number };

export type FrameContent = {
  id: string;
  image: { src: string; srcSet?: string };
  blur: string;
  video?: ProjectVideoSources;
  /** Presented with motion: the clip and the i18n base of its words. */
  motion?: { clip: string; text: string };
  drift?: Drift;
};

const P = "/assets/projects";
// the rack focus starts on the clip's own first frame, blurred
const BLUR: Record<string, string> = {
  dallas_sync: `${P}/video/dallas-sync-card-blur.webp`,
  secret: `${P}/video/secret-detail-blur.webp`,
  dallas_motel: `${P}/video/dallas-motel-detail-blur.webp`,
};


/**
 * Em uso: the front desk working with no internet. Until the offline loop is
 * recorded (scripts/capture), the operation screen stands in, in training
 * mode like every Dallas Sync picture on the site.
 */
const OFFLINE: FrameContent = {
  id: "offline",
  image: { src: `${P}/dallas-sync-op-1440.webp`, srcSet: `${P}/dallas-sync-op-720.webp 720w, ${P}/dallas-sync-op-1440.webp 1440w` },
  blur: `${P}/video/dallas-sync-offline-blur.webp`,
  video: WORK.find((w) => w.id === "dallas_sync")?.video?.detail,
  // the camera holds still here (the chapter's idea): only the hand is drawn
  motion: { clip: "dallas-sync-offline", text: "work.items.dallas_sync.motion" },
};

/**
 * Retorno: the photo of the opening, now in colour. The shot starts on his
 * face, already the person the visitor met in the hero (Felipe asked for it
 * on 2026-11-26, rather than a zoom into the buildings), and eases back a
 * little as the corners open, so he settles in the right-hand third.
 */
// on the face: at scale 1.5 a half-width of 0.33 of the photo shows
const CITY_FROM = { s: 1.5, fx: 0.5, fy: 0.44 };
// and it settles a little closer than the whole photo, with him in the
// right-hand third: the invitation is set on the left, clear of his face
const CITY_TO = { s: 1.25, fx: 0.41, fy: 0.5 };
const ease = (v: number) => (v < 0.5 ? 4 * v * v * v : 1 - (-2 * v + 2) ** 3 / 2);
const CITY: FrameContent = {
  id: "city",
  image: { src: "/assets/profile/scene-wide-color.webp" },
  blur: "/assets/profile/scene-wide-color-blur.webp",
  drift: (t) => {
    const e = ease(Math.min(1, Math.max(0, (t - 0.08) / 0.62)));
    const s = Math.pow(CITY_FROM.s, 1 - e) * Math.pow(CITY_TO.s, e);
    const fx = CITY_FROM.fx + (CITY_TO.fx - CITY_FROM.fx) * e;
    const fy = CITY_FROM.fy + (CITY_TO.fy - CITY_FROM.fy) * e;
    return { s, x: -(fx - 0.5) * s * 100, y: -(fy - 0.5) * s * 100 };
  },
};

export const FRAME_CONTENTS: readonly FrameContent[] = [
  ...WORK.map((w) => ({
    id: w.id,
    image: w.image,
    blur: BLUR[w.id],
    video: w.video?.card,
    motion: w.motion ? { clip: w.motion, text: `work.items.${w.id}.motion` } : undefined,
  })),
  OFFLINE,
  CITY,
];
