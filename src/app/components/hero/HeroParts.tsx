import { useTranslation } from "react-i18next";

/**
 * Pieces of the hero: the name set letter by letter, and the
 * credits row under it (one sentence and one link), set like the
 * billing block at the foot of a film poster.
 */

export const FIRST = "Felipe";
export const LAST = "Rodrigues";

export function Letters({
  word,
  offset,
  markI = false,
}: {
  word: string;
  offset: number;
  /** Tags the first "i", which the city hero zooms through. */
  markI?: boolean;
}) {
  let marked = false;
  return (
    <>
      {[...word].map((ch, i) => {
        const isTarget = markI && !marked && ch.toLowerCase() === "i";
        if (isTarget) marked = true;
        return (
          <span
            key={i}
            className="hero-letter"
            data-zoom-target={isTarget ? "" : undefined}
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
