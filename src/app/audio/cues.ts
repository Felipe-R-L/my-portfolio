/**
 * Every sound the site can make, by name. A cue is either a file (sea and
 * wind, recorded) or made in the page (synth.ts: paper, card, shutter, tick).
 * A file cue without its file yet stays silent, so code can ask for a sound
 * before the file exists.
 */
import type { Synth } from "./synth";

export type Cue = "wave" | "wind" | "card" | "slide" | "frame" | "tick";

export const CUES: Record<Cue, { src?: string; synth?: Synth; volume: number }> = {
  /** the sea washing over the hero (Pixabay, to be chosen) */
  wave: { volume: 0.5 },
  /** a soft wind over Diamante, in the hero (Pixabay, to be chosen) */
  wind: { volume: 0.2 },
  /** a chapter's card coming up beside the portrait: paper swiped */
  card: { synth: "card", volume: 0.22 },
  /** the portrait moving aside for the chapters: a card slid off a table */
  slide: { synth: "slide", volume: 0.2 },
  /** the portrait settling into its frame: a shutter */
  frame: { synth: "frame", volume: 0.22 },
  /** small UI moves */
  tick: { synth: "tick", volume: 0.12 },
};

/** The background music: soft and low under everything. */
export const MUSIC: { src?: string; volume: number } = { volume: 0.12 };
