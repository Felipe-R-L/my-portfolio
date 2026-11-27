/**
 * Every sound the site can make, by name. A cue is either a file (sea and
 * wind, recorded) or made in the page (synth.ts: paper, card, shutter, tick).
 * A file cue without its file yet stays silent, so code can ask for a sound
 * before the file exists. Files are kept out of git with the rest of the
 * media (public/assets/sb/).
 */
import type { Synth } from "./synth";

export type Cue = "wave" | "shore" | "wind" | "card" | "slide" | "frame" | "tick";

export const CUES: Record<Cue, { src?: string; synth?: Synth; loop?: boolean; volume: number }> = {
  /** the sea rising over Diamante (Pixabay: "Waves Crashing", DRAGON-STUDIO) */
  wave: { src: "/assets/sb/wave-in.mp3", volume: 0.45 },
  /** the sea going back off the portrait (Pixabay: "Wave on the Shore", DRAGON-STUDIO) */
  shore: { src: "/assets/sb/wave-out.mp3", volume: 0.4 },
  /** a soft wind over Diamante while the hero is up, a loop (Pixabay:
      "a gentle breeze, wind 4", mario1298 via Freesound) */
  wind: { src: "/assets/sb/wind-loop.mp3", loop: true, volume: 0.35 },
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
