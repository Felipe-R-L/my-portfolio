import React from "react";
import { motion } from "motion/react";
import SpotlightCard from "./react-bits/SpotlightCard";
import BorderGlow from "./react-bits/BorderGlow";
import SplitText from "./react-bits/SplitText";
import {
  Database,
  Map,
  Radio,
  LineChart,
  Server,
  MonitorSmartphone,
  BrainCircuit,
  Terminal,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import MobileCarousel from "./ui/MobileCarousel";

export function Experience() {
  const { t } = useTranslation();

  const experiences = [
    {
      id: "omd",
      glow: "rgba(59, 130, 246, 0.5)",
      spotlightColor: "rgba(59, 130, 246, 0.12)",
      accentColor: "from-blue-400 via-indigo-400 to-purple-400",
      highlights: [
        { icon: Database, key: "h1" },
        { icon: Map, key: "h2" },
        { icon: Radio, key: "h3" },
        { icon: LineChart, key: "h4" },
      ],
    },
    {
      id: "consulting",
      glow: "rgba(168, 85, 247, 0.5)",
      spotlightColor: "rgba(168, 85, 247, 0.12)",
      accentColor: "from-purple-400 via-pink-400 to-rose-400",
      highlights: [
        { icon: BrainCircuit, key: "h1" },
        { icon: Server, key: "h2" },
        { icon: MonitorSmartphone, key: "h3" },
      ],
    },
  ];

  return (
    <section className="relative py-32 px-6 max-w-6xl mx-auto z-10">
      {/* Ambient orbs */}
      <motion.div
        className="absolute top-1/2 left-0 -translate-y-1/2 w-[30rem] h-[30rem] bg-blue-600/20 rounded-full mix-blend-screen filter blur-[130px] pointer-events-none"
        animate={{ x: [0, 25, -15, 0], y: [0, -20, 15, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/4 right-0 w-[40rem] h-[40rem] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none"
        animate={{ x: [0, -30, 20, 0], y: [0, 15, -25, 0] }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />

      <div className="mb-20 relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tighter uppercase flex items-center flex-wrap gap-y-4">
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="mr-4 text-blue-500"
          >
            <Terminal className="h-20 w-20" />
          </motion.div>

          <SplitText
            text={t("experience.title_part1")}
            delay={30}
            animationFrom={{ opacity: 0, transform: "translate3d(0, 30px, 0)" }}
            animationTo={{ opacity: 1, transform: "translate3d(0, 0, 0)" }}
          />

          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
              delay: 0.1,
            }}
            className="mx-4 md:mx-8 w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.8)]"
          />

          <span className="text-white/40">
            <SplitText
              text={t("experience.title_part2")}
              delay={30}
              animationFrom={{
                opacity: 0,
                transform: "translate3d(0, 30px, 0)",
              }}
              animationTo={{ opacity: 1, transform: "translate3d(0, 0, 0)" }}
            />
          </span>
        </h2>
        <motion.div
          className="w-24 h-1 bg-purple-500/50 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.6)]"
          initial={{ width: 0 }}
          whileInView={{ width: 96 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
        />
      </div>

      <div className="space-y-12 relative z-10">
        {experiences.map((exp, idx) => (
          <motion.div
            key={exp.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: idx * 0.1 }}
          >
            <BorderGlow glowColor={exp.glow} glowRadius={300}>
              <SpotlightCard
                spotlightColor={exp.spotlightColor}
                className="p-8 md:p-12"
              >
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b border-white/10 pb-8">
                  <div>
                    <motion.h3
                      className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    >
                      {t(`experience.${exp.id}.company`)}
                    </motion.h3>
                    <motion.p
                      className={`text-xl md:text-2xl text-transparent bg-clip-text bg-gradient-to-r ${exp.accentColor} font-bold uppercase tracking-wide`}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      {t(`experience.${exp.id}.role`)}
                    </motion.p>
                  </div>
                </div>

                <motion.p
                  className="text-gray-300 text-lg md:text-xl mb-10 leading-relaxed font-light"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  {t(`experience.${exp.id}.description`)}
                </motion.p>

                {/* Desktop Highlights Grid */}
                <div className="hidden md:grid md:grid-cols-2 gap-6">
                  {exp.highlights.map((highlight, hIdx) => (
                    <ExperienceHighlight key={hIdx} highlight={highlight} hIdx={hIdx} expId={exp.id} t={t} />
                  ))}
                </div>

                {/* Mobile Highlights Carousel */}
                <div className="md:hidden -mx-8">
                  <MobileCarousel showDots={true} itemClassName="w-[80vw]">
                    {exp.highlights.map((highlight, hIdx) => (
                      <ExperienceHighlight key={hIdx} highlight={highlight} hIdx={hIdx} expId={exp.id} t={t} />
                    ))}
                  </MobileCarousel>
                </div>
              </SpotlightCard>
            </BorderGlow>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

const ExperienceHighlight = React.memo(({ highlight, hIdx, expId, t }: { highlight: any, hIdx: number, expId: string, t: any }) => {
  const Icon = highlight.icon;
  return (
    <motion.div
      className="flex items-start space-x-5 p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300 shadow-inner group h-full"
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.4, delay: 0.4 + hIdx * 0.05 }}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <motion.div
        className="mt-1 p-3 rounded-xl bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
        whileHover={{ rotate: 10, scale: 1.1 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25,
        }}
      >
        <Icon className="w-6 h-6 text-blue-300 group-hover:text-blue-200 transition-colors" />
      </motion.div>
      <p className="text-gray-400 leading-relaxed text-sm md:text-base font-light group-hover:text-gray-300 transition-colors">
        {t(`experience.${expId}.${highlight.key}`)}
      </p>
    </motion.div>
  );
});
