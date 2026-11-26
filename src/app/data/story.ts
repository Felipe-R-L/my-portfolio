/** The chapters of the story scene, in order. Prose lives in i18n under `story.chapters.<id>`. */

export type ChapterId = "oba" | "etec" | "ifsp" | "dallas" | "omd" | "hoje";

export type StoryChapter = {
  id: ChapterId;
  /** Shown as-is; "hoje" is translated (`story.today`). */
  year: string;
  /** A small seal instead of a full chapter weight (the OBA medal). */
  seal?: boolean;
  /** A photo (alt text in i18n under `story.chapters.<id>.alt`) or one of
      the drawn figures, for chapters no photo can honestly show. */
  image?: { src: string; srcSet?: string } | { figure: "orbit" | "code" };
};

const S = "/assets/story";
const P = "/assets/projects";

export const STORY: readonly StoryChapter[] = [
  { id: "oba", year: "2017", seal: true, image: { figure: "orbit" } },
  { id: "etec", year: "2020", image: { figure: "code" } },
  { id: "ifsp", year: "2022", image: { src: `${S}/ifsp-1280.webp`, srcSet: `${S}/ifsp-640.webp 640w, ${S}/ifsp-1280.webp 1280w` } },
  { id: "dallas", year: "2023", image: { src: `${P}/dallas-720.webp`, srcSet: `${P}/dallas-720.webp 720w, ${P}/dallas.webp 1919w` } },
  { id: "omd", year: "2024", image: { src: `${P}/omdfarm-720.webp` } },
  { id: "hoje", year: "hoje", image: { src: `${P}/dallas-sync-op-720.webp`, srcSet: `${P}/dallas-sync-op-720.webp 720w, ${P}/dallas-sync-op-1440.webp 1440w` } },
];

/** Index of the chapter in focus at story progress `p`. */
export function chapterAt(p: number, n: number): number {
  return Math.min(n - 1, Math.max(0, Math.round(p * (n - 1))));
}

/**
 * Where the story starts, before the first chapter: Diamante, in Calabria,
 * where the surname comes from. On a wide screen it plays in the journey's
 * frame (journey/contents.ts); on a phone and with reduced motion these two
 * photos open the list. Prose: `story.origin.caption` and
 * `story.chapters.diamante.text`.
 */
export const ORIGIN_SHOTS = [
  { src: `${S}/diamante-a-1200.webp`, srcSet: `${S}/diamante-a-1200.webp 1200w, ${S}/diamante-a-2400.webp 2400w` },
  { src: `${S}/diamante-c-1200.webp`, srcSet: `${S}/diamante-c-1200.webp 1200w, ${S}/diamante-c-2400.webp 2400w` },
] as const;
