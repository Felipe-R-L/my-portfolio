/**
 * Every sound the site can make, by name. A cue without a file is silent, so
 * code can ask for a sound before its file exists.
 *
 * Files are licensed (Storyblocks) and live in public/assets/audio/.
 */
export type Cue = "wave" | "card" | "frame" | "tick";

export const CUES: Record<Cue, { src?: string; volume: number }> = {
  /** the sea washing over the hero */
  wave: { volume: 0.5 },
  /** a card or a project coming into place */
  card: { volume: 0.25 },
  /** the portrait settling into its frame, a shutter */
  frame: { volume: 0.3 },
  /** chapter rail, small UI moves */
  tick: { volume: 0.15 },
};

/** The background music: soft and low under everything. */
export const MUSIC: { src?: string; volume: number } = { volume: 0.12 };
