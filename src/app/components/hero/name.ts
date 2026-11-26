/** The name, shared by the hero and its static shell (no React here). */

/**
 * The name as the hero sets it, one entry per line. The city shows through
 * the `city` line only, and the camera dives through the first `mark` letter
 * of that line, aimed at `markX` of its width (the middle of an I's stem, the
 * left of an L's).
 */
export const NAME = {
  full: "Felipe Rodrigues Leone",
  lines: ["Felipe", "Rodrigues", "Leone"],
  city: 1,
  mark: "i",
  markX: 0.5,
} as const;
