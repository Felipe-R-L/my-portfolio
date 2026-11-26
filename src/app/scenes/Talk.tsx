import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { summaries } from "virtual:posts";

import { AVAILABILITY, EMAIL, PROJECT_KINDS, whatsappHref, type ProjectKind } from "../data/contact";
import { socialLinks } from "../data/techStack";
import { pageTop, registerBeats } from "../journey/beats";
import { lerpBox, type Box } from "../journey/director";
import { useJourneyMode } from "../journey/useJourneyMode";
import { SCROLL } from "../motion/tokens";
import { span } from "../scroll/math";
import { easeInOut } from "../components/hero/camera";
import "./Talk.css";

/** The frame covering the whole screen, at 16:10. */
function coverBox(vw: number, vh: number): Box {
  const w = Math.max(vw, vh * 1.6);
  const h = w / 1.6;
  return { x: (vw - w) / 2, y: (vh - h) / 2, w, h };
}

/**
 * Where the frame comes to rest on a wide screen: a framed photo on the right,
 * clear of the invitation on the left, so Diamante (the chapter's light,
 * AmbientLight) shows around it.
 */
function restBox(vw: number, vh: number): Box {
  const w = Math.min(vw * 0.38, vh * 0.6 * 1.6);
  const h = w / 1.6;
  return { x: vw - w - vw * 0.06, y: (vh - h) / 2, w, h };
}

/** The frame in the middle of the screen, at the size the hero left it. */
function middleBox(vw: number, vh: number): Box {
  const w = Math.min(vw * 0.46, vh * 0.62 * 1.6);
  const h = w / 1.6;
  return { x: (vw - w) / 2, y: (vh - h) / 2, w, h };
}

/**
 * Retorno: and now? The journey closes where it opened.
 *
 * T5, from the last stop of Como funciona: the marker grows into a frame in
 * the middle of the screen, already close on the skyline, and the camera
 * pulls back over the city of the opening until the corners open to the
 * whole screen. The invitation then comes in over the city, which stays
 * behind the page to its end. The visitor picks what they need and the
 * WhatsApp message is written for them.
 */
export function Talk() {
  const { t, i18n } = useTranslation();
  const mode = useJourneyMode();
  const runwayRef = useRef<HTMLDivElement>(null);
  const [kind, setKind] = useState<ProjectKind | null>(null);
  const latest = summaries.length > 0 ? summaries[0] : null;
  const linkedin = socialLinks.find((s) => s.label === "LinkedIn");
  const whatsapp = whatsappHref(t(`talk.chips.${kind ?? "outro"}.message`));
  const lang = i18n.language?.startsWith("pt") ? "pt" : "en";

  useLayoutEffect(() => {
    if (mode === "list") return;
    return registerBeats("retorno", () => {
      const runway = runwayRef.current;
      if (!runway) return [];
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const end = document.documentElement.scrollHeight;
      if (mode === "swipe") {
        // phone: the city rises with the runway, the width of the screen, and
        // opens to the whole screen as the runway reaches the top; the steps
        // above it are never set over the picture
        const top = pageTop(runway);
        // and only once the marker of Como funciona has reached its last stop
        const lastStop = document.querySelector<HTMLElement>(".plano-stop:last-child");
        const start = Math.max(top - vh, lastStop ? pageTop(lastStop) - vh / 2 + 1 : 0);
        const rise = (): Box => {
          const r = runway.getBoundingClientRect();
          const k = span((vh - r.top) / vh, 0.5, 1);
          return lerpBox({ x: 0, y: r.top, w: vw, h: vw / 1.6 }, coverBox(vw, vh), easeInOut(k));
        };
        return [
          { content: "city", start, end: top + runway.offsetHeight, arrive: 0, gesture: "cut" as const, slot: rise },
          { content: "city", start: top + runway.offsetHeight, end, arrive: 0, gesture: "cut" as const, still: true, slot: () => coverBox(vw, vh) },
        ];
      }
      // T5 starts where Como funciona leaves the marker
      const plano = document.querySelector(".plano-track");
      const from = plano ? pageTop(plano) + plano.getBoundingClientRect().height - vh : pageTop(runway) - vh;
      const to = pageTop(runway) + runway.offsetHeight - vh * 0.35;
      const len = Math.max(1, to - from);
      const middle = middleBox(vw, vh);
      const rest = restBox(vw, vh);
      return [
        {
          content: "city",
          start: from,
          end: to,
          // the marker grows into the middle frame over the first quarter
          arrive: 0.25,
          gesture: "rack" as const,
          // then holds while the camera pulls back, and moves aside to rest at the end
          slot: () => lerpBox(middle, rest, easeInOut(span((window.scrollY - from) / len, 0.72, 1))),
        },
        // and the photo stays beside the invitation to the page's end
        { content: "city", start: to, end, arrive: 0, gesture: "cut" as const, still: true, slot: () => rest },
      ];
    });
  }, [mode]);

  return (
    <section
      id="contact"
      className="talk"
      data-journey="retorno"
      data-mode={mode}
      aria-labelledby="talk-title"
      style={{ ["--runway" as string]: `${SCROLL.finale * 100}svh` }}
    >
      {/* where the camera pulls back over the city (T5) */}
      <div ref={runwayRef} className="talk-runway" aria-hidden="true" />

      <div className="talk-body">
        <div className="talk-main">
          <h2 id="talk-title" className="talk-title">
            {t("contact.title_part2")}
          </h2>
          <p className="talk-lead">{t("contact.cta_desc")}</p>

          <fieldset className="talk-kinds">
            <legend className="talk-kinds-q">{t("talk.chips.prompt")}</legend>
            <div className="talk-chips">
              {PROJECT_KINDS.map((k) => (
                <label key={k} className="talk-chip" data-on={kind === k ? "true" : "false"}>
                  <input type="radio" name="project-kind" value={k} checked={kind === k} onChange={() => setKind(k)} />
                  {t(`talk.chips.${k}.label`)}
                </label>
              ))}
            </div>
          </fieldset>

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
          {AVAILABILITY.enabled && AVAILABILITY.text[lang] && <p className="talk-availability">{AVAILABILITY.text[lang]}</p>}

          {/* In place of a testimonial there is none yet: the proof itself. */}
          <a className="talk-proof" href="#proof">
            {t("talk.proof_link")}
          </a>
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
          <p className="talk-credits">{t("talk.credits")}</p>
        </footer>
      </div>
    </section>
  );
}
