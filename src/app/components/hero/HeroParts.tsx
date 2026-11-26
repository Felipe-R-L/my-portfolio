import { useTranslation } from "react-i18next";

/**
 * Pieces of the hero: the name set letter by letter, and the
 * credits row under it (one sentence and one link), set like the
 * billing block at the foot of a film poster.
 */

export { NAME } from "./name";

export function Letters({ word, offset }: { word: string; offset: number }) {
  return (
    <>
      {[...word].map((ch, i) => (
        <span key={i} className="hero-letter" style={{ ["--i" as string]: offset + i }}>
          {ch}
        </span>
      ))}
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
