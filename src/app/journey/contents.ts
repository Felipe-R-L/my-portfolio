/**
 * What the journey's frame can show, by id. Each entry is a picture (and,
 * when recorded, its loop) plus a tiny pre-blurred copy for the rack focus:
 * the blur comes from upscaling 64 px, so nothing filters at run time.
 */
import { WORK, type ProjectVideoSources } from "../data/work";

export type FrameContent = {
  id: string;
  image: { src: string; srcSet?: string };
  blur: string;
  video?: ProjectVideoSources;
};

const P = "/assets/projects";
const BLUR: Record<string, string> = {
  dallas_sync: `${P}/dallas-sync-blur.webp`,
  secret: `${P}/secret-blur.webp`,
  dallas_motel: `${P}/dallas-blur.webp`,
};

export const FRAME_CONTENTS: readonly FrameContent[] = WORK.map((w) => ({
  id: w.id,
  image: w.image,
  blur: BLUR[w.id],
  video: w.video?.card,
}));
