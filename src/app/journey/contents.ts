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
  drift?: Drift;
};

const P = "/assets/projects";
const BLUR: Record<string, string> = {
  dallas_sync: `${P}/dallas-sync-blur.webp`,
  secret: `${P}/secret-blur.webp`,
  dallas_motel: `${P}/dallas-blur.webp`,
};

const S = "/assets/story";

/**
 * Diamante, where the surname comes from (Eugenio Magurno, CC BY-SA 3.0, via
 * Wikimedia Commons; credited in the footer). Two shots and a cut: high over
 * the beach towards the island of Cirella, the camera coming down; then the
 * town on its headland, the camera drifting along the coast. The photos are
 * 3008 px wide, which is why the frame holds them at about 80% of the screen
 * and the moves stay under 1.15x.
 */
const ORIGIN: readonly FrameContent[] = [
  {
    id: "diamante-a",
    image: { src: `${S}/diamante-a-2400.webp`, srcSet: `${S}/diamante-a-1200.webp 1200w, ${S}/diamante-a-2400.webp 2400w` },
    blur: `${S}/diamante-a-blur.webp`,
    // always more picture than frame: at scale s the margin per side is (s - 1) / 2
    drift: (t) => ({ s: 1.06 + 0.08 * t, x: 0, y: 2 - 4 * t }),
  },
  {
    id: "diamante-c",
    image: { src: `${S}/diamante-c-2400.webp`, srcSet: `${S}/diamante-c-1200.webp 1200w, ${S}/diamante-c-2400.webp 2400w` },
    blur: `${S}/diamante-c-blur.webp`,
    drift: (t) => ({ s: 1.08, x: 3 - 6 * t, y: 0 }),
  },
];

/**
 * Em uso: the front desk working with no internet. Until the offline loop is
 * recorded (scripts/capture), the operation screen stands in, in training
 * mode like every Dallas Sync picture on the site.
 */
const OFFLINE: FrameContent = {
  id: "offline",
  image: { src: `${P}/dallas-sync-op-1440.webp`, srcSet: `${P}/dallas-sync-op-720.webp 720w, ${P}/dallas-sync-op-1440.webp 1440w` },
  blur: `${P}/dallas-sync-op-blur.webp`,
  video: WORK.find((w) => w.id === "dallas_sync")?.video?.detail,
};

export const FRAME_CONTENTS: readonly FrameContent[] = [
  ...ORIGIN,
  ...WORK.map((w) => ({
    id: w.id,
    image: w.image,
    blur: BLUR[w.id],
    video: w.video?.card,
  })),
  OFFLINE,
];
