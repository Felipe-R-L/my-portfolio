/** The name, shared by the hero and its static shell (no React here). */

export type NameWord = { readonly text: string; readonly em?: boolean };

/**
 * The name as the hero sets it: one entry per line, each a row of words.
 * Two lines with "Rodrigues" in italic (Felipe, 2026-11-26: proposal B).
 */
export const NAME: { full: string; lines: readonly (readonly NameWord[])[] } = {
  full: "Felipe Rodrigues Leone",
  lines: [[{ text: "Felipe" }], [{ text: "Rodrigues", em: true }, { text: "Leone" }]],
};
