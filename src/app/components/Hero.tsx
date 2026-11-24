import { useEffect, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useTranslation } from "react-i18next";
import { MessageCircle } from "lucide-react";

import TextType from "./react-bits/TextType";
import { whatsappHref } from "../data/contact";
import "./Hero.css";

/**
 * The name is the hero, and it is alive. Space Grotesk is a variable font, so
 * every letter's weight can move: letters near the pointer (or a finger) thin
 * out and turn blue, and right after the load a single sweep runs across the
 * name so phone visitors see it happen without having to discover it.
 *
 * Layout: on wide screens FELIPE sits beside the portrait and RODRIGUES spans
 * the width, crossing the photo. On phones it becomes a cover: the photo full
 * width, the name set over its lower edge.
 *
 * Scroll pulls the two words apart and pushes into the photo. Reduced-motion
 * users get the static composition with none of this.
 */

const EASE = [0.16, 1, 0.3, 1] as const;
const SERVICE_IDS = ["landing_pages", "ecommerce", "systems", "automation"] as const;

const FIRST = "Felipe";
const LAST = "Rodrigues";

/** Heaviest and lightest weights the variable font ships. */
const W_MAX = 700;
const W_MIN = 300;

function Letters({ word, offset }: { word: string; offset: number }) {
  return (
    <>
      {[...word].map((ch, i) => (
        <span
          key={i}
          className="hero-letter"
          style={{ ["--i" as string]: offset + i }}
        >
          {ch}
        </span>
      ))}
    </>
  );
}

/**
 * Drives the weight of each letter from a point (pointer, touch or the intro
 * sweep). Writes straight to the DOM in an animation frame: fifteen letters
 * changing on every pointer move is not something React should re-render for.
 */
function usePressure(rootRef: React.RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled) return;

    const letters = Array.from(root.querySelectorAll<HTMLElement>(".hero-letter"));
    if (letters.length === 0) return;
    let frame = 0;
    let point: { x: number; y: number } | null = null;

    /** The box around the letters themselves. The heading also holds the
        photo, which on phones is far taller than the name. */
    const lettersBox = () => {
      const first = letters[0].getBoundingClientRect();
      let { left, top, right, bottom } = first;
      for (const el of letters) {
        const r = el.getBoundingClientRect();
        left = Math.min(left, r.left);
        top = Math.min(top, r.top);
        right = Math.max(right, r.right);
        bottom = Math.max(bottom, r.bottom);
      }
      return { left, top, width: right - left, height: bottom - top };
    };

    const paint = () => {
      frame = 0;
      const radius = Math.max(lettersBox().width * 0.26, 110);
      for (const el of letters) {
        let k = 0;
        if (point) {
          const r = el.getBoundingClientRect();
          const d = Math.hypot(r.left + r.width / 2 - point.x, r.top + r.height / 2 - point.y);
          k = Math.max(0, 1 - d / radius);
          k = k * k * (3 - 2 * k); // smoothstep, so the falloff has no hard edge
        }
        el.style.fontWeight = String(Math.round(W_MAX - k * (W_MAX - W_MIN)));
        el.style.setProperty("--k", k.toFixed(3));
      }
    };

    const set = (p: { x: number; y: number } | null) => {
      point = p;
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const onPointer = (e: PointerEvent) => set({ x: e.clientX, y: e.clientY });
    const onLeave = () => set(null);

    // One sweep across the whole name after the letters have landed: the
    // signature moment, and the only way a phone visitor learns the name
    // responds to touch.
    let sweep = 0;
    const startSweep = window.setTimeout(() => {
      const box = lettersBox();
      const t0 = performance.now();
      const DURATION = 2600;
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / DURATION);
        const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
        const b = lettersBox();
        set({
          x: b.left - box.width * 0.15 + eased * box.width * 1.3,
          y: b.top + b.height * (0.3 + 0.4 * eased),
        });
        if (t < 1) sweep = requestAnimationFrame(step);
        else set(null);
      };
      sweep = requestAnimationFrame(step);
    }, 1900);

    root.addEventListener("pointermove", onPointer);
    root.addEventListener("pointerdown", onPointer);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("pointerup", onLeave);
    root.addEventListener("pointercancel", onLeave);

    return () => {
      window.clearTimeout(startSweep);
      cancelAnimationFrame(sweep);
      cancelAnimationFrame(frame);
      root.removeEventListener("pointermove", onPointer);
      root.removeEventListener("pointerdown", onPointer);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointerup", onLeave);
      root.removeEventListener("pointercancel", onLeave);
    };
  }, [rootRef, enabled]);
}

export function Hero() {
  const { t } = useTranslation();
  const reduce = useReducedMotion() ?? false;
  const ref = useRef<HTMLElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);

  usePressure(nameRef, !reduce);

  // Business owners reply on WhatsApp far more readily than by e-mail, so the
  // primary CTA opens a chat when a number is configured.
  const whatsapp = whatsappHref(t("contact.whatsapp_message"));

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const firstX = useTransform(scrollYProgress, [0, 0.7], ["0%", reduce ? "0%" : "-38%"]);
  const lastX = useTransform(scrollYProgress, [0, 0.7], ["0%", reduce ? "0%" : "26%"]);
  const photoY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-14%"]);
  const photoScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.25]);

  const titleVariants = t("hero.title_part2_variants", { returnObjects: true }) as string[];
  const services = SERVICE_IDS.map((id) => t(`services.items.${id}.title`));

  const fade = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.9, delay, ease: EASE },
        };

  return (
    <section ref={ref} className={`hero relative overflow-hidden ${reduce ? "hero--still" : ""}`}>
      <h1 ref={nameRef} className="hero-name" aria-label="Felipe Rodrigues Leone">
        <motion.span
          className="hero-photo"
          style={{ y: photoY }}
          aria-hidden="true"
          {...(reduce
            ? {}
            : {
                initial: { clipPath: "inset(100% 0% 0% 0% round 1.75rem)" },
                animate: { clipPath: "inset(0% 0% 0% 0% round 1.75rem)" },
                transition: { duration: 1.3, delay: 0.2, ease: EASE },
              })}
        >
          {/*
            LCP element. The srcset and sizes mirror the <link rel="preload"> in
            index.html so both resolve to the same candidate.
          */}
          <motion.img
            style={{ scale: photoScale }}
            src="/assets/profile/profile-448.webp"
            srcSet="/assets/profile/profile-320.webp 320w, /assets/profile/profile-448.webp 448w, /assets/profile/profile-640.webp 640w"
            sizes="(max-width: 767px) 92vw, 26vw"
            alt=""
            width={448}
            height={448}
            fetchPriority="high"
            loading="eager"
            decoding="async"
          />
        </motion.span>

        <span className="hero-lines" aria-hidden="true">
          <span className="hero-line hero-line--first">
            <motion.span style={{ x: firstX }} className="hero-word">
              <Letters word={FIRST} offset={0} />
            </motion.span>
          </span>
          <span className="hero-line hero-line--last">
            <motion.span style={{ x: lastX }} className="hero-word">
              <Letters word={LAST} offset={FIRST.length} />
            </motion.span>
          </span>
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
              {whatsapp ? <MessageCircle className="w-[1.1em] h-[1.1em]" aria-hidden="true" /> : null}
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
