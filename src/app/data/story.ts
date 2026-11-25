/** The chapters of the story scene, in order. Prose lives in i18n under `story.chapters.<id>`. */

export type ChapterId = "diamante" | "oba" | "etec" | "ifsp" | "dallas" | "omd" | "hoje";

export type StoryChapter = {
  id: ChapterId;
  /** Shown as-is; "hoje" is translated (`story.today`). */
  year: string;
  /** A small seal instead of a full chapter weight (the OBA medal). */
  seal?: boolean;
  image?: { src: string; alt: string; credit?: string };
};

export const STORY: readonly StoryChapter[] = [
  { id: "diamante", year: "1867" },
  { id: "oba", year: "2017", seal: true },
  { id: "etec", year: "2020" },
  { id: "ifsp", year: "2022" },
  { id: "dallas", year: "2023" },
  { id: "omd", year: "2024" },
  { id: "hoje", year: "hoje" },
];

/** Index of the chapter in focus at story progress `p`. */
export function chapterAt(p: number, n: number): number {
  return Math.min(n - 1, Math.max(0, Math.round(p * (n - 1))));
}
