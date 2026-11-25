import { useTranslation } from "react-i18next";

import "./About.css";

/**
 * Who I am, kept short: a square portrait, a small heading and one paragraph,
 * set at body size so it reads as a note, not a section that competes with
 * the scene around it.
 *
 * `overlay`: rendered as the caption at the foot of the city hero's photo,
 * where the nav's "Sobre" anchor lives in the scene instead.
 */
export function About({ overlay = false }: { overlay?: boolean }) {
  const { t } = useTranslation();
  const lines = t("about.lines", { returnObjects: true }) as string[];

  return (
    <section
      id={overlay ? undefined : "about"}
      className={`about ${overlay ? "about--overlay" : ""}`}
      aria-labelledby="about-title"
    >
      <img
        className="about-card"
        src="/assets/profile/card-320.webp"
        srcSet="/assets/profile/card-320.webp 320w, /assets/profile/card-640.webp 640w"
        sizes="(max-width: 767px) 6rem, 9rem"
        alt={t("about.photo_alt")}
        width={320}
        height={320}
        loading="lazy"
        decoding="async"
      />
      <div className="about-text">
        <h2 id="about-title" className="about-title">
          {t("about.title")}
        </h2>
        <p className="about-body">{lines.join(" ")}</p>
      </div>
    </section>
  );
}
