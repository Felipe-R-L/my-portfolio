import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useTranslation } from "react-i18next";
import { MessageCircle } from "lucide-react";

import TextType from "./react-bits/TextType";
import { whatsappHref } from "../data/contact";
import "./Hero.css";

/**
 * The name is the hero. It runs wall to wall: FELIPE on the first line with the
 * portrait in the space it leaves free, RODRIGUES spanning the full width below
 * and crossing the photo with a difference blend. Everything else (pitch, CTAs,
 * the service band) sits quiet underneath so the type stays the one loud thing.
 *
 * Motion is one orchestrated load sequence (words rise out of a mask, the photo
 * unclips) plus a scroll response: the two words drift apart and the photo
 * rises slower than the page. Reduced-motion users get the static composition.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

const SERVICE_IDS = ["landing_pages", "ecommerce", "systems", "automation"] as const;

export function Hero() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  // Business owners reply on WhatsApp far more readily than by e-mail, so the
  // primary CTA opens a chat when a number is configured.
  const whatsapp = whatsappHref(t("contact.whatsapp_message"));

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const firstX = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-18%"]);
  const lastX = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "12%"]);
  const photoY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-22%"]);

  const titleVariants = t("hero.title_part2_variants", { returnObjects: true }) as string[];
  const services = SERVICE_IDS.map((id) => t(`services.items.${id}.title`));

  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { y: "105%" },
          animate: { y: "0%" },
          transition: { duration: 1.1, delay, ease: EASE },
        };

  const fade = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.9, delay, ease: EASE },
        };

  return (
    <section ref={ref} className="hero relative overflow-hidden">
      <h1 className="hero-name" aria-label="Felipe Rodrigues Leone">
        {/* Line 1: first name, with the portrait in the space it leaves free */}
        <span className="hero-line hero-line--first" aria-hidden="true">
          <motion.span style={{ x: firstX }} className="hero-word-wrap">
            <motion.span className="hero-word" {...rise(0.15)}>
              Felipe
            </motion.span>
          </motion.span>
        </span>

        <motion.span
          className="hero-photo"
          style={{ y: photoY }}
          aria-hidden="true"
          {...(reduce
            ? {}
            : {
                initial: { clipPath: "inset(100% 0% 0% 0% round 1.75rem)" },
                animate: { clipPath: "inset(0% 0% 0% 0% round 1.75rem)" },
                transition: { duration: 1.3, delay: 0.35, ease: EASE },
              })}
        >
          {/*
            LCP element. The srcset and sizes mirror the <link rel="preload"> in
            index.html so both resolve to the same candidate.
          */}
          <img
            src="/assets/profile/profile-448.webp"
            srcSet="/assets/profile/profile-320.webp 320w, /assets/profile/profile-448.webp 448w, /assets/profile/profile-640.webp 640w"
            sizes="(max-width: 767px) 56vw, 26vw"
            alt=""
            width={448}
            height={448}
            fetchPriority="high"
            loading="eager"
            decoding="async"
          />
        </motion.span>

        {/* Line 2: surname, full width, crossing the photo */}
        <span className="hero-line hero-line--last" aria-hidden="true">
          <motion.span style={{ x: lastX }} className="hero-word-wrap">
            <motion.span className="hero-word" {...rise(0.28)}>
              Rodrigues
            </motion.span>
          </motion.span>
        </span>
      </h1>

      <div className="hero-base">
        <motion.p className="hero-claim" {...fade(0.9)}>
          <span className="hero-claim-lead">{t("hero.title_part1")}</span>
          <TextType
            text={Array.isArray(titleVariants) ? titleVariants : ["Sells", "Organizes", "Automates"]}
            className="hero-claim-typed"
            typingSpeed={60}
            pauseDuration={2000}
            showCursor
            cursorClassName="bg-[var(--zone-a-1)]"
            startOnVisible
          />
        </motion.p>

        <motion.p className="hero-pitch" {...fade(1.0)}>
          {t("hero.description")}
        </motion.p>

        <motion.div className="hero-actions" {...fade(1.1)}>
          <p className="hero-status">
            <span className="hero-status-dot" aria-hidden="true" />
            {t("hero.badge")}
          </p>
          <div className="hero-buttons">
            <a
              href={whatsapp ?? "#contact"}
              {...(whatsapp ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="hero-cta hero-cta--primary"
            >
              {whatsapp ? (
                <MessageCircle className="w-[1.1em] h-[1.1em]" aria-hidden="true" />
              ) : null}
              {whatsapp ? t("hero.cta_whatsapp") : t("hero.cta_contact")}
            </a>
            <a href="#projects" className="hero-cta hero-cta--ghost">
              {t("hero.cta_projects")}
            </a>
          </div>
        </motion.div>
      </div>

      {/* What I build, on a slow loop. Duplicated once so the loop is seamless;
          the copy is hidden from assistive tech. */}
      <div className="hero-band" role="list" aria-label={t("nav.services")}>
        <div className="hero-band-track">
          {[0, 1].map((copy) =>
            [...services, ...services].map((label, i) => (
              <span
                key={`${copy}-${i}`}
                role={copy === 0 && i < services.length ? "listitem" : undefined}
                aria-hidden={copy === 0 && i < services.length ? undefined : true}
                className={i % 2 ? "hero-band-item hero-band-item--outline" : "hero-band-item"}
              >
                {label}
              </span>
            )),
          )}
        </div>
      </div>
    </section>
  );
}
