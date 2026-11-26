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
  image?: { src: string; srcSet?: string } | { figure: "orbit" | "code" | "medal" };
  /** A mark over the picture (the institution's logo), alt in `story.chapters.<id>.badge`. */
  badge?: string;
  /**
   * What fills the space behind the rail while this chapter is in focus
   * (desktop): it slides slower than the cards and turns into the next
   * chapter's as the focus moves. A picture, or one of the drawn figures.
   */
  bg: { src: string; srcSet?: string } | { figure: "orbit" | "code" };
};

const S = "/assets/story";
const P = "/assets/projects";

// The photos of Felipe are his own (Mídia/Fotos, metadata stripped). The
// backgrounds: the night sky and the code are drawn; the gears and the
// centre pivots are generated (scripts/assets/textures.mjs); the motel is the
// hero of the site he built; "today" is the system's own screen, blurred.
export const STORY: readonly StoryChapter[] = [
  { id: "oba", year: "2017", seal: true, image: { figure: "medal" }, bg: { figure: "orbit" } },
  { id: "etec", year: "2020", image: { figure: "code" }, bg: { figure: "code" } },
  {
    id: "ifsp",
    year: "2022",
    image: { src: `${S}/ifsp-turma-1280.webp`, srcSet: `${S}/ifsp-turma-640.webp 640w, ${S}/ifsp-turma-1280.webp 1280w` },
    badge: `${S}/ifsp-logo.svg`,
    // his notebook: the CD car of that class, ink lifted off the page
    bg: { src: `${S}/bg-sketch-1200.webp`, srcSet: `${S}/bg-sketch-1200.webp 1200w, ${S}/bg-sketch-2400.webp 2400w` },
  },
  {
    id: "dallas",
    year: "2023",
    image: { src: `${P}/dallas-720.webp`, srcSet: `${P}/dallas-720.webp 720w, ${P}/dallas.webp 1919w` },
    bg: { src: `${S}/bg-dallas-800.webp`, srcSet: `${S}/bg-dallas-800.webp 800w, ${S}/bg-dallas-1600.webp 1600w` },
  },
  {
    id: "omd",
    year: "2024",
    image: { src: `${S}/omd-felipe-1280.webp`, srcSet: `${S}/omd-felipe-640.webp 640w, ${S}/omd-felipe-1280.webp 1280w` },
    bg: { src: `${S}/bg-pivots-1200.webp`, srcSet: `${S}/bg-pivots-1200.webp 1200w, ${S}/bg-pivots-2400.webp 2400w` },
  },
  {
    id: "hoje",
    year: "hoje",
    // the three systems he looks after, side by side (scripts/assets/today.mjs)
    image: { src: `${S}/hoje-720.webp`, srcSet: `${S}/hoje-720.webp 720w, ${S}/hoje-1440.webp 1440w` },
    bg: { src: `${S}/bg-hoje-1440.webp` },
  },
];

/** Index of the chapter in focus at story progress `p`. */
export function chapterAt(p: number, n: number): number {
  return Math.min(n - 1, Math.max(0, Math.round(p * (n - 1))));
}

