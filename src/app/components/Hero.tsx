import React from "react";
import { motion } from "motion/react";
import SplitText from "./react-bits/SplitText";
import GradientText from "./react-bits/GradientText";
import TextType from "./react-bits/TextType";
import { useTranslation } from "react-i18next";

export function Hero() {
  const { t } = useTranslation();

  const titleVariants = t("hero.title_part2_variants", {
    returnObjects: true,
  }) as string[];

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 md:pt-40 pb-20 md:pb-28 overflow-hidden px-[var(--gutter)]">
      {/* Deep space Apple-style glowing orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1000px] h-[500px] opacity-60 pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/4 w-72 md:w-96 h-72 md:h-96 bg-[color-mix(in_oklab,var(--zone-a-1)_38%,transparent)] rounded-full mix-blend-screen filter blur-[80px] md:blur-[120px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.6, 0.4],
            x: [0, 30, -20, 0],
            y: [0, -20, 10, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="measure z-10 relative flex-1 flex flex-col justify-start">
        {/* 1. The Neo-Brutalism Name Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full mb-12 lg:mb-20"
        >
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-[var(--zone-a-1)] text-[10px] md:text-xs lg:text-sm font-bold uppercase tracking-[0.5em] md:tracking-[0.8em] mb-4"
            >
              {t("hero.role")}
            </motion.span>
            {/*
              At `lg:text-[10rem]` the two words side by side measured wider than
              the viewport and the final S of RODRIGUES was clipped off-screen at
              1440px. The clamp ceiling is set so the pair always fits inside the
              page measure.
            */}
            <h1 className="text-[13vw] md:text-[clamp(3rem,10vw,7.5rem)] font-bold text-white tracking-tighter leading-[0.9] uppercase flex flex-col md:flex-row items-center lg:items-start md:gap-x-6">
              <span className="text-white">FELIPE</span>
              <span className="text-white">RODRIGUES</span>
            </h1>
          </div>
        </motion.div>

        {/* 2. The Unified Hero Content (Photo + Pitch) */}
        {/*
          The gap was `lg:gap-20` (80px), which left the text column at exactly
          624px — one pixel short of the 625px the Portuguese CTA pair needs, so
          the buttons stacked in pt-BR and sat side by side in en-US. 48px gives
          the column 656px, enough for the longer labels in either language, so
          the hero composes identically in both.
        */}
        <div className="relative w-full flex flex-col lg:flex-row items-center lg:items-start justify-between gap-10 lg:gap-12">
          {/*
            Profile Image - Left Side.
            The box caps at 448px (not 450) so the widest layout lands exactly
            on the 448w srcset candidate instead of rounding up to the 640w file.
          */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="relative z-20 w-full max-w-[240px] md:max-w-[400px] lg:max-w-[448px] flex-shrink-0"
          >
            <div className="absolute inset-0 bg-[color-mix(in_oklab,var(--zone-a-1)_10%,transparent)] blur-3xl rounded-full" />
            <div className="relative aspect-square w-full rounded-[2.5rem] md:rounded-[4.5rem] overflow-hidden border border-white/10 shadow-2xl group">
              {/*
                LCP element. The srcset lets the browser pick a variant that
                matches the rendered box instead of always downloading the
                640px original for a 406px slot, and the attributes here mirror
                the <link rel="preload"> in index.html so the two resolve to
                the same candidate.
              */}
              <img
                src="/assets/profile/profile-448.webp"
                srcSet="/assets/profile/profile-320.webp 320w, /assets/profile/profile-448.webp 448w, /assets/profile/profile-640.webp 640w"
                sizes="(max-width: 767px) 240px, (max-width: 1023px) 400px, 448px"
                alt="Felipe Rodrigues Leone - Full-Stack Developer"
                width={448}
                height={448}
                fetchPriority="high"
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover transition-all duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            </div>
          </motion.div>

          {/* Sales Pitch - Right Side */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, delay: 0.8 }}
            className="flex-1 min-w-0 w-full flex flex-col items-center lg:items-start text-center lg:text-left"
          >
            <div className="flex flex-col gap-0 w-full">
              <h2 className="text-2xl md:text-5xl lg:text-[4rem] font-light text-white/50 tracking-tight uppercase leading-none">
                {t("hero.title_part1")}
              </h2>
              {/*
                The typed line used to resize this column on every keystroke: the
                pitch column is a flex item, and without `min-w-0` its min-width
                resolves to the text's min-content width. As TextType added
                characters the column grew, squeezed the CTA row, and flipped its
                wrap state mid-animation. `min-w-0` on the column plus a size that
                keeps the longest variant on one line makes the box static.
              */}
              <div className="flex items-center justify-center lg:justify-start gap-4 py-2 md:py-4 min-w-0">
                <div className="w-full min-w-0">
                  <TextType
                    text={
                      Array.isArray(titleVariants)
                        ? titleVariants
                        : ["Solutions", "Experiences", "Ideas"]
                    }
                    className="block whitespace-nowrap min-h-[1.3em] text-3xl md:text-6xl lg:text-[clamp(2.5rem,4.4vw,5rem)] font-bold tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-[var(--zone-a-1)] via-[var(--zone-a-2)] to-[var(--zone-a-1)] drop-shadow-2xl leading-[1.3] py-2"
                    typingSpeed={60}
                    pauseDuration={2000}
                    showCursor={true}
                    cursorClassName="bg-[var(--zone-a-1)]"
                    /*
                      Defaults to false, which made the observer bail out and the
                      loop run from mount to unload: a state update per character
                      every 60ms, repainting gradient-clipped text with a
                      drop-shadow ~16x a second while the hero sat several
                      screens above the viewport.
                    */
                    startOnVisible
                  />
                </div>
              </div>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-8 text-gray-400 text-base md:text-lg lg:text-xl leading-relaxed max-w-[500px] font-normal"
            >
              {t("hero.description")}
            </motion.p>

            {/* CTA Gravity Point Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
              className="mt-12 w-full flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:gap-6"
            >
              {/* Primary: Contact */}
              <a
                href="#contact"
                className="group relative flex items-center gap-6 px-7 md:px-9 py-5 bg-gradient-to-r from-[color-mix(in_oklab,var(--zone-a-1)_20%,transparent)] to-[color-mix(in_oklab,var(--zone-a-2)_20%,transparent)] hover:from-[color-mix(in_oklab,var(--zone-a-1)_38%,transparent)] hover:to-[color-mix(in_oklab,var(--zone-a-2)_38%,transparent)] border border-white/10 hover:border-[color-mix(in_oklab,var(--zone-a-1)_50%,transparent)] transition-all duration-300 rounded-xl overflow-hidden shadow-lg"
              >
                {/* Metallic Hardware Shine */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-[color-mix(in_oklab,var(--zone-a-1)_20%,transparent)] opacity-50 group-hover:opacity-100 transition-opacity" />
                
                <span className="relative z-10 text-white font-bold tracking-[0.2em] uppercase flex items-center gap-3 text-sm md:text-base">
                  {t("hero.role") ? t("hero.cta_contact") : "Contact"}
                  <div className="w-1 h-6 flex items-center justify-center">
                    <div className="w-[1px] h-4 bg-white/30 group-hover:h-6 group-hover:bg-[var(--zone-a-1)] transition-all duration-500" />
                  </div>
                  <svg className="w-5 h-5 group-hover:translate-y-2 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </span>
                
                {/* Tech Accents (Corners) */}
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[color-mix(in_oklab,var(--zone-a-1)_30%,transparent)] rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[color-mix(in_oklab,var(--zone-a-2)_30%,transparent)] rounded-bl-xl" />
              </a>

              {/* Secondary: Projects */}
              <a
                href="#projects"
                className="group relative flex items-center gap-4 px-7 md:px-9 py-5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 rounded-xl overflow-hidden"
              >
                <span className="relative z-10 text-white/70 group-hover:text-white font-bold tracking-[0.2em] uppercase flex items-center gap-2.5 text-sm md:text-base transition-colors">
                  {t("hero.cta_projects")}
                  <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                
                {/* Subtle border shine */}
                <div className="absolute inset-0 border border-white/0 group-hover:border-white/10 rounded-xl transition-all" />
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
