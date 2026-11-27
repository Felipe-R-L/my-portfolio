/**
 * Where the licensed media lives (the drone, the sea, the sounds, the
 * music): the R2 bucket's own domain in production, given at build time as
 * VITE_MEDIA_BASE (https://media.feliperl.space), and public/assets/sb/ when
 * it is not set (dev). The files are never in git: the repo is public.
 *
 * Read on every call, not once: the hero shell is also rendered by the Vite
 * config (into index.html), where the env is set only after the import.
 */
export function mediaBase(): string {
  const fromVite = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_MEDIA_BASE;
  const fromNode = typeof process !== "undefined" ? process.env?.VITE_MEDIA_BASE : undefined;
  return (fromVite || fromNode || "/assets/sb").replace(/\/+$/, "");
}

export const media = (file: string) => `${mediaBase()}/${file}`;
