import { useTranslation } from "react-i18next";

/**
 * Pieces of the hero: the name set letter by letter, and the
 * credits row under it (one sentence and one link), set like the
 * billing block at the foot of a film poster.
 */

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

export function Letters({
  word,
  offset,
  mark,
  markX = 0.5,
}: {
  word: string;
  offset: number;
  /** Tags the first such letter, which the city hero zooms through. */
  mark?: string;
  markX?: number;
}) {
  let marked = false;
  return (
    <>
      {[...word].map((ch, i) => {
        const isTarget = !!mark && !marked && ch.toLowerCase() === mark;
        if (isTarget) marked = true;
        return (
          <span
            key={i}
            className="hero-letter"
            data-zoom-target={isTarget ? String(markX) : undefined}
            style={{ ["--i" as string]: offset + i }}
          >
            {ch}
          </span>
        );
      })}
    </>
  );
}

export function Credits({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  // The WhatsApp button lives in Contact; the hero only says what I do and
  // points at the work.
  return (
    <div className={`hero-credits ${className}`}>
      <p className="hero-pitch">{t("hero.description")}</p>
      <a href="#projects" className="hero-link">
        {t("hero.cta_projects")}
      </a>
    </div>
  );
}
