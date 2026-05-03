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
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 md:pt-40 pb-20 md:pb-28 overflow-hidden px-6">
      {/* Deep space Apple-style glowing orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1000px] h-[500px] opacity-60 pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/4 w-72 md:w-96 h-72 md:h-96 bg-blue-600/40 rounded-full mix-blend-screen filter blur-[80px] md:blur-[120px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.6, 0.4],
            x: [0, 30, -20, 0],
            y: [0, -20, 10, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="max-w-7xl mx-auto w-full z-10 relative flex-1 flex flex-col justify-start">
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
              className="text-blue-400 text-[10px] md:text-xs lg:text-sm font-bold uppercase tracking-[0.5em] md:tracking-[0.8em] mb-4"
            >
              {t("hero.role")}
            </motion.span>
            <h1 className="text-[14vw] md:text-[12vw] lg:text-[10rem] font-bold text-white tracking-tighter leading-[0.9] uppercase flex flex-col md:flex-row items-center lg:items-start md:gap-x-8">
              <span className="text-white">FELIPE</span>
              <span className="text-white">RODRIGUES</span>
            </h1>
          </div>
        </motion.div>

        {/* 2. The Unified Hero Content (Photo + Pitch) */}
        <div className="relative w-full flex flex-col lg:flex-row items-center lg:items-start justify-between gap-10 lg:gap-20">
          {/* Profile Image - Left Side */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="relative z-20 w-full max-w-[240px] md:max-w-[400px] lg:max-w-[450px] flex-shrink-0"
          >
            <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full" />
            <div className="relative aspect-square w-full rounded-[2.5rem] md:rounded-[4.5rem] overflow-hidden border border-white/10 shadow-2xl group">
              <img
                src="/assets/profile/profile.webp"
                alt="Felipe Rodrigues Leone - Full-Stack Developer"
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
            className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left"
          >
            <div className="flex flex-col gap-0 w-full">
              <h2 className="text-2xl md:text-5xl lg:text-[4rem] font-light text-white/50 tracking-tight uppercase leading-none">
                {t("hero.title_part1")}
              </h2>
              <div className="flex items-center justify-center lg:justify-start gap-4 py-4 md:py-6 overflow-visible">
                <div className="w-full max-w-full md:max-w-[600px] lg:max-w-[800px] overflow-visible">
                  <TextType
                    text={
                      Array.isArray(titleVariants)
                        ? titleVariants
                        : ["Solutions", "Experiences", "Ideas"]
                    }
                    className="text-3xl md:text-7xl lg:text-[7rem] font-bold tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-400 drop-shadow-2xl whitespace-nowrap leading-relaxed"
                    typingSpeed={60}
                    pauseDuration={2000}
                    showCursor={true}
                    cursorClassName="bg-blue-500"
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
              className="mt-12 flex flex-wrap gap-6"
            >
              {/* Primary: Contact */}
              <a
                href="#contact"
                className="group relative flex items-center gap-6 px-10 md:px-12 py-5 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/40 hover:to-purple-600/40 border border-white/10 hover:border-blue-500/50 transition-all duration-300 rounded-xl overflow-hidden shadow-lg hover:shadow-blue-500/20"
              >
                {/* Metallic Hardware Shine */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-blue-500/20 opacity-50 group-hover:opacity-100 transition-opacity" />
                
                <span className="relative z-10 text-white font-bold tracking-[0.3em] uppercase flex items-center gap-4 text-sm md:text-base">
                  {t("hero.role") ? t("hero.cta_contact") : "Contact"}
                  <div className="w-1 h-6 flex items-center justify-center">
                    <div className="w-[1px] h-4 bg-white/30 group-hover:h-6 group-hover:bg-blue-400 transition-all duration-500" />
                  </div>
                  <svg className="w-5 h-5 group-hover:translate-y-2 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </span>
                
                {/* Tech Accents (Corners) */}
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-500/30 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-purple-500/30 rounded-bl-xl" />
              </a>

              {/* Secondary: Projects */}
              <a
                href="#projects"
                className="group relative flex items-center gap-4 px-10 md:px-12 py-5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 rounded-xl overflow-hidden"
              >
                <span className="relative z-10 text-white/70 group-hover:text-white font-bold tracking-[0.3em] uppercase flex items-center gap-3 text-sm md:text-base transition-colors">
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
