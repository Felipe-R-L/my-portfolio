import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

import { Credits, FIRST, LAST, Letters } from "./HeroParts";
import "./HeroPhoto.css";

/**
 * The photo behind the name.
 *
 * A full-bleed black-and-white portrait (front on, on the Patriani rooftop),
 * darkened and graded so the bottom third, where the name and credits sit,
 * is near-black: the letters stand on shadow, never on the bright sky. As you
 * scroll away the photo sinks slower than the page and the words drift apart.
 *
 * The standalone About section follows with the side-profile photo, so the
 * two pictures never repeat.
 */
export function HeroPhoto() {
  const reduce = useReducedMotion() ?? false;
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const photoY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "18%"]);
  const firstX = useTransform(scrollYProgress, [0, 0.8], ["0%", reduce ? "0%" : "-14%"]);
  const lastX = useTransform(scrollYProgress, [0, 0.8], ["0%", reduce ? "0%" : "10%"]);

  return (
    <section ref={ref} className="photo-hero">
      <motion.picture className="photo-hero-img" style={{ y: photoY }} aria-hidden="true">
        <source
          media="(max-width: 767px)"
          srcSet="/assets/profile/front-tall-640.webp 640w, /assets/profile/front-tall-960.webp 960w, /assets/profile/front-tall-1280.webp 1280w"
          sizes="100vw"
        />
        <img
          src="/assets/profile/front-wide-1920.webp"
          srcSet="/assets/profile/front-wide-1280.webp 1280w, /assets/profile/front-wide-1920.webp 1920w, /assets/profile/front-wide-2560.webp 2560w"
          sizes="100vw"
          alt=""
          width={1920}
          height={1201}
          {...{ fetchpriority: "high" }}
          decoding="async"
        />
      </motion.picture>
      <div className="photo-hero-grade" aria-hidden="true" />

      <div className="hero-frame">
        <h1 className="hero-name" aria-label="Felipe Rodrigues">
          <span className="hero-line" aria-hidden="true">
            <motion.span style={{ x: firstX }} className="hero-word">
              <Letters word={FIRST} offset={0} />
            </motion.span>
          </span>
          <span className="hero-line hero-line--last" aria-hidden="true">
            <motion.span style={{ x: lastX }} className="hero-word">
              <Letters word={LAST} offset={FIRST.length} />
            </motion.span>
          </span>
        </h1>
        <Credits />
      </div>
    </section>
  );
}
