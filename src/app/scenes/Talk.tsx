import { useTranslation } from "react-i18next";
import { summaries } from "virtual:posts";

import { EMAIL, whatsappHref } from "../data/contact";
import { socialLinks } from "../data/techStack";
import "./Talk.css";

/**
 * Scene 7, the conversation: the page closes the way it opened, in the
 * editorial voice, with the one thing to do next. Then a quiet footer.
 */
export function Talk() {
  const { t } = useTranslation();
  const whatsapp = whatsappHref(t("contact.whatsapp_message"));
  const latest = summaries.length > 0 ? summaries[0] : null;
  const linkedin = socialLinks.find((s) => s.label === "LinkedIn");

  return (
    <section id="contact" className="talk" aria-labelledby="talk-title">
      {/* The close answers the opening: the city from the hero, now in
          colour, seen through the letters. */}
      <h2 id="talk-title" className="talk-title">
        {t("contact.title_part2")}
      </h2>
      <div className="talk-main">
        <p className="talk-lead">{t("contact.cta_desc")}</p>
        <div className="talk-actions">
          {whatsapp && (
            <a className="talk-cta" href={whatsapp} target="_blank" rel="noreferrer">
              {t("contact.whatsapp_cta")}
            </a>
          )}
          <a className="talk-mail" href={`mailto:${EMAIL}`}>
            <span className="talk-mail-label">{t("talk.email_label")}</span> {EMAIL}
          </a>
        </div>
      </div>

      <div className="talk-side">
        <div className="talk-block">
          <h3 className="talk-block-title">{t("contact.network_title")}</h3>
          <p className="talk-block-text">{t("contact.network_desc")}</p>
          {linkedin && (
            <a className="talk-link" href={linkedin.href} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
          )}
        </div>
        {latest && (
          <div className="talk-block">
            <h3 className="talk-block-title">{t("talk.blog_label")}</h3>
            <a className="talk-link talk-link--post" href={`/blog/${latest.slug}`}>
              {latest.title}
            </a>
          </div>
        )}
      </div>

      <footer className="talk-foot">
        <span>© {new Date().getFullYear()} Felipe Rodrigues Leone</span>
        <nav className="talk-foot-links" aria-label="Links">
          {socialLinks.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer">
              {s.label}
            </a>
          ))}
          <a href="/blog">Blog</a>
        </nav>
      </footer>
    </section>
  );
}
