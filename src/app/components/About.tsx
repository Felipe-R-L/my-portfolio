import React from "react";
import { motion } from "motion/react";
import SpotlightCard from "./react-bits/SpotlightCard";
import BorderGlow from "./react-bits/BorderGlow";
import TiltedCard from "./react-bits/TiltedCard";
import FluidGlass from "./react-bits/FluidGlass";
import ScrollReveal from "./react-bits/ScrollReveal";
import SplitText from "./react-bits/SplitText";
import { Code2, Globe2, Layers, Cpu } from "lucide-react";

export function About() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const skills = [
    {
      icon: Layers,
      title: "Clean Architecture",
      glowColor: "rgba(59, 130, 246, 0.5)",
      spotlightColor: "rgba(59, 130, 246, 0.15)",
      iconBg: "bg-blue-500/20",
      iconBorder: "border-blue-400/30",
      iconShadow: "shadow-[0_0_20px_rgba(59,130,246,0.3)]",
      iconColor: "text-blue-300",
    },
    {
      icon: Cpu,
      title: "DevOps & Cloud",
      glowColor: "rgba(168, 85, 247, 0.5)",
      spotlightColor: "rgba(168, 85, 247, 0.15)",
      iconBg: "bg-purple-500/20",
      iconBorder: "border-purple-400/30",
      iconShadow: "shadow-[0_0_20px_rgba(168,85,247,0.3)]",
      iconColor: "text-purple-300",
    },
    {
      icon: Code2,
      title: "Fullstack Expert",
      glowColor: "rgba(16, 185, 129, 0.5)",
      spotlightColor: "rgba(16, 185, 129, 0.15)",
      iconBg: "bg-emerald-500/20",
      iconBorder: "border-emerald-400/30",
      iconShadow: "shadow-[0_0_20px_rgba(16,185,129,0.3)]",
      iconColor: "text-emerald-300",
    },
    {
      icon: Globe2,
      title: "English (C2)",
      glowColor: "rgba(249, 115, 22, 0.5)",
      spotlightColor: "rgba(249, 115, 22, 0.15)",
      iconBg: "bg-orange-500/20",
      iconBorder: "border-orange-400/30",
      iconShadow: "shadow-[0_0_20px_rgba(249,115,22,0.3)]",
      iconColor: "text-orange-300",
    },
  ];

  return (
    <section className="relative py-32 px-6 max-w-6xl mx-auto z-10">
      {/* Heavy colorful deep space ambient glows for Apple style glassmorphism */}
      <motion.div
        className="absolute top-0 right-0 w-[45rem] h-[45rem] bg-orange-500/10 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none"
        animate={{ x: [0, 20, -10, 0], y: [0, -15, 10, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-cyan-600/10 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none"
        animate={{ x: [0, -20, 15, 0], y: [0, 10, -15, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <motion.div variants={itemVariants} className="mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tighter uppercase">
            <SplitText
              text="System Architecture."
              delay={30}
              animationFrom={{ opacity: 0, transform: "translate3d(0, 30px, 0)" }}
              animationTo={{ opacity: 1, transform: "translate3d(0, 0, 0)" }}
            />
            {" "}
            <span className="text-white/40">
              <SplitText
                text="Human Impact."
                delay={30}
                animationFrom={{ opacity: 0, transform: "translate3d(0, 30px, 0)" }}
                animationTo={{ opacity: 1, transform: "translate3d(0, 0, 0)" }}
              />
            </span>
          </h2>
          <motion.div
            className="w-24 h-1 bg-blue-500/50 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)]"
            initial={{ width: 0 }}
            whileInView={{ width: 96 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div variants={itemVariants}>
            <FluidGlass
              mode="lens"
              blurAmount={16}
              tintColor="rgba(100, 130, 255, 0.08)"
              tintOpacity={0.5}
              borderRadius="1.5rem"
              className="space-y-8 text-lg md:text-xl text-gray-300 leading-relaxed font-light"
              containerClassName="rounded-3xl p-8 md:p-10 border border-white/5 bg-white/[0.02]"
            >
              <ScrollReveal baseOpacity={0.15} blurStrength={3}>
                I am a Software Developer focused on engineering high-impact solutions. Currently, I am actively building the OMDfarm platform, driving innovation within the agribusiness industry.
              </ScrollReveal>
              <ScrollReveal baseOpacity={0.15} blurStrength={3}>
                My expertise spans the entire development lifecycle—from early architecture and strategic planning to full-stack implementation and DevOps operations. I believe in software that outlives its initial requirements.
              </ScrollReveal>
              <ScrollReveal baseOpacity={0.15} blurStrength={3}>
                I am a strong advocate for clean code and robust architectural patterns such as Domain-Driven Design (DDD) and Clean Architecture, ensuring long-term code maintainability and scalability. Proficient in English (C2).
              </ScrollReveal>
            </FluidGlass>
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-6 relative z-10">
            {skills.map((skill, idx) => {
              const Icon = skill.icon;
              return (
                <TiltedCard
                  key={idx}
                  rotateAmplitude={12}
                  scaleOnHover={1.04}
                  containerClassName="h-full"
                  className="h-full"
                >
                  <BorderGlow
                    glowColor={skill.glowColor}
                    spread={250}
                    borderWidth={1}
                    className="h-full"
                  >
                    <SpotlightCard
                      spotlightColor={skill.spotlightColor}
                      className="p-8 text-center space-y-5 flex flex-col items-center justify-center h-full"
                    >
                      <motion.div
                        whileHover={{ scale: 1.15, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        className={`w-16 h-16 rounded-2xl ${skill.iconBg} flex items-center justify-center border ${skill.iconBorder} ${skill.iconShadow}`}
                      >
                        <Icon className={`w-8 h-8 ${skill.iconColor}`} />
                      </motion.div>
                      <h3 className="text-white font-bold tracking-wide uppercase text-sm md:text-base">{skill.title}</h3>
                    </SpotlightCard>
                  </BorderGlow>
                </TiltedCard>
              );
            })}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
