import { Suspense, lazy, useMemo } from "react";
import { motion, Variants } from "motion/react";
import { Cpu } from "lucide-react";
import { useTranslation } from "react-i18next";

import ScrollReveal from "./react-bits/ScrollReveal";
import { Section } from "./shared/Section";
import { SectionHeading } from "./shared/SectionHeading";
import { AmbientOrbs, type Orb } from "./shared/AmbientOrbs";

const LazyFluidGlass = lazy(() => import("./react-bits/FluidGlass"));

const ORBS: Orb[] = [
  {
    className:
      "top-0 right-0 w-[20rem] md:w-[45rem] h-[20rem] md:h-[45rem] bg-[color-mix(in_oklab,var(--zone-a-2)_10%,transparent)] mix-blend-screen filter blur-[60px] md:blur-[150px]",
    duration: 15,
  },
  {
    className:
      "bottom-0 left-0 w-[18rem] md:w-[40rem] h-[18rem] md:h-[40rem] bg-[color-mix(in_oklab,var(--zone-a-1)_10%,transparent)] mix-blend-screen filter blur-[60px] md:blur-[150px]",
    x: [0, -20, 15, 0],
    y: [0, 10, -15, 0],
    duration: 18,
    delay: 3,
  },
];

/**
 * Four identical icon-plus-label squares took half the viewport and said
 * nothing the label did not already say. A typographic list carries the same
 * four claims plus the evidence for each, in less space.
 */
const SKILLS = ["clean_arch", "devops", "fullstack", "english"] as const;

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

export function About() {
  const { t } = useTranslation();

  const lensContent = useMemo(
    () => (
      <div className="space-y-6 md:space-y-8 flex flex-col justify-between h-full py-4">
        {["trustworthy", "collaborative", "dedicated"].map((key) => (
          <div key={key} className="h-1/3 flex items-center justify-center">
            <span className="text-2xl md:text-5xl font-black tracking-widest text-[var(--zone-a-1)] drop-shadow-[0_0_15px_color-mix(in_oklab,var(--zone-a-1)_50%,transparent)]">
              {t(`about.revealed.${key}`)}
            </span>
          </div>
        ))}
      </div>
    ),
    [t],
  );

  return (
    <Section id="about">
      <AmbientOrbs orbs={ORBS} />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <motion.div variants={itemVariants}>
          <SectionHeading
            icon={Cpu}
            accent="cold"
            title={t("about.title_part1")}
            subtitle={t("about.title_part2")}
          />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-14 items-center">
          <motion.div variants={itemVariants}>
            <Suspense
              fallback={
                <div className="rounded-3xl border border-white/5 bg-white/[0.02] h-64 md:h-80" />
              }
            >
              <LazyFluidGlass
                mode="lens"
                blurAmount={2}
                tintColor="rgba(100, 130, 255, 0.08)"
                tintOpacity={0.5}
                borderRadius="1.5rem"
                className="space-y-6 text-lg md:text-xl leading-relaxed font-light p-7 md:p-9"
                containerClassName="rounded-3xl border border-white/5 bg-white/[0.02]"
                revealedChildren={lensContent}
              >
                <div className="space-y-6 text-gray-300">
                  {/*
                    baseOpacity was 0.15 with a 3px blur, which left the most
                    important copy on the page unreadable for most of the scroll.
                    The reveal survives; the floor is now legible on its own.
                  */}
                  <ScrollReveal baseOpacity={0.45} blurStrength={1.5}>
                    {t("about.bio_p1")}
                  </ScrollReveal>
                  <ScrollReveal baseOpacity={0.45} blurStrength={1.5}>
                    {t("about.bio_p2")}
                  </ScrollReveal>
                </div>
              </LazyFluidGlass>
            </Suspense>
          </motion.div>

          <motion.div variants={itemVariants} className="relative z-10">
            <h3 className="text-[11px] font-medium uppercase tracking-[0.22em] text-gray-400 mb-5">
              {t("about.skills_title")}
            </h3>
            <dl className="flex flex-col">
              {SKILLS.map((skill) => (
                <div
                  key={skill}
                  className="py-4 border-t border-white/10 first:border-t-0 first:pt-0"
                >
                  <dt className="text-lg md:text-xl font-bold text-white tracking-tight">
                    {t(`about.skills.${skill}.title`)}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-400 leading-relaxed font-light">
                    {t(`about.skills.${skill}.proof`)}
                  </dd>
                </div>
              ))}
            </dl>
          </motion.div>
        </div>
      </motion.div>
    </Section>
  );
}
