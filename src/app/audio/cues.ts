/**
 * Every sound the site can make, by name. A cue is either a file (sea and
 * wind, recorded) or made in the page (synth.ts: paper, card, shutter, tick).
 * A file cue without its file yet stays silent, so code can ask for a sound
 * before the file exists. Files are kept out of git with the rest of the
 * media (public/assets/sb/).
 */
import type { Synth } from "./synth";
import { media } from "../media";

export type Cue = "wave" | "shore" | "wind" | "boat" | "sea" | "card" | "slide" | "frame" | "tick";

export const CUES: Record<Cue, { src?: string; synth?: Synth; loop?: boolean; volume: number }> = {
  /** the sea rising over Diamante (Pixabay: "Waves Crashing", DRAGON-STUDIO) */
  wave: { src: media("wave-in.mp3"), volume: 0.45 },
  /** the sea going back off the portrait (Pixabay: "Wave on the Shore", DRAGON-STUDIO) */
  shore: { src: media("wave-out.mp3"), volume: 0.4 },
  /** a soft wind over Diamante while the hero is up, a loop (Pixabay:
      "a gentle breeze, wind 4", mario1298 via Freesound) */
  wind: { src: media("wind-loop.mp3"), loop: true, volume: 0.35 },
  /** a small boat far off, while the one in the flight heads out to sea: a
      loop, its level following the video (Pixabay: "Distant small boat
      returning to marina", freesound_community) */
  boat: { src: media("boat-loop.mp3"), loop: true, volume: 0.32 },
  /** the sea, very low under the music, all the way down the page: Diamante
      is on the coast (Pixabay: "Gentle Ocean Waves", DRAGON-STUDIO; a 40 s
      loop) */
  sea: { src: media("sea-loop.mp3"), loop: true, volume: 0.1 },
  /** a chapter's card coming up beside the portrait: paper swiped */
  card: { synth: "card", volume: 0.18 },
  /** the portrait moving aside for the chapters: a card slid off a table */
  slide: { synth: "slide", volume: 0.2 },
  /** the portrait settling into its frame: a shutter */
  frame: { synth: "frame", volume: 0.22 },
  /** small UI moves */
  tick: { synth: "tick", volume: 0.12 },
};

/** The background music, soft and low under everything: a short playlist the
    visitor can step through (Pixabay Content License, chosen by Felipe). */
export type Track = { title: string; artist: string; src: string };

export const PLAYLIST: Track[] = [
  { title: "Amore al Mare", artist: "Grand_Project", src: media("music-amore-al-mare-501525.mp3") },
  { title: "Bossa Nova Soulful", artist: "andriih", src: media("music-bossa-nova-soulful-630197.mp3") },
  { title: "Nostalgic Folk No. 3", artist: "Sonican", src: media("music-nostalgic-folk-3-468043.mp3") },
];

export const MUSIC = { volume: 0.12 };
