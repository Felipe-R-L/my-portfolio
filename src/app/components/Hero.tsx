import React from "react";
import { motion } from "motion/react";
import SplitText from "./react-bits/SplitText";
import GradientText from "./react-bits/GradientText";
export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-28 overflow-hidden px-6">
      {/* Deep space Apple-style glowing orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1000px] h-[500px] opacity-60 pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/40 rounded-full mix-blend-screen filter blur-[120px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.6, 0.4],
            x: [0, 30, -20, 0],
            y: [0, -20, 10, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="max-w-7xl mx-auto w-full z-10 relative flex-1 flex flex-col justify-center mt-12">
        {/* Top Tag */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="lg:absolute top-0 left-4 md:left-10 z-30 mb-8 lg:mb-0"
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-blue-100 font-medium tracking-widest text-xs md:text-sm uppercase text-left">
              Open for <br className="hidden lg:block" /> Freelance Works.
            </h2>
          </div>
        </motion.div>

        {/* Text and Image Container - Flex Row Layout */}
        <div className="relative w-full flex flex-col lg:flex-row-reverse items-center justify-between min-h-[400px] md:min-h-[500px] gap-12 mt-4 lg:mt-0 lg:px-10">
          {/* Main Typography - Right Side */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
            className="z-10 relative flex-1 flex flex-col items-start justify-center space-y-4 text-left w-full lg:pl-10"
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[8rem] font-bold text-white tracking-tighter leading-[0.9] filter drop-shadow-[0_0_40px_rgba(255,255,255,0.15)] uppercase">
              <SplitText
                text="FELIPE"
                className="block"
                delay={30}
                animationFrom={{
                  opacity: 0,
                  transform: "translate3d(0, 50px, 0) rotateX(90deg)",
                }}
                animationTo={{
                  opacity: 1,
                  transform: "translate3d(0, 0, 0) rotateX(0deg)",
                }}
              />
              <SplitText
                text="RODRIGUES"
                className="block text-gray-300"
                delay={30}
                animationFrom={{
                  opacity: 0,
                  transform: "translate3d(0, 50px, 0) rotateX(90deg)",
                }}
                animationTo={{
                  opacity: 1,
                  transform: "translate3d(0, 0, 0) rotateX(0deg)",
                }}
              />
            </h1>
            <div className="flex flex-wrap items-center gap-4 md:gap-6 w-full pt-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[4rem] font-light text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-200 tracking-widest uppercase">
                SOFTWARE
              </h2>
              <GradientText
                colors={["#60a5fa", "#818cf8", "#a78bfa", "#c084fc", "#60a5fa"]}
                animationSpeed={6}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-[4rem] font-bold tracking-widest uppercase font-light drop-shadow-lg"
              >
                DEVELOPER
              </GradientText>
            </div>
          </motion.div>

          {/* Profile Image - Left Side */}
          <motion.div
            initial={{ opacity: 0, x: -50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
            className="relative z-20 w-full max-w-[280px] md:max-w-[350px] lg:max-w-[400px] flex-shrink-0"
          >
            {/* Decorative background glow for the image */}
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />

            {/* Premium rounded avatar card */}
            <div className="relative aspect-square w-full rounded-[40px] md:rounded-[60px] overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group backdrop-blur-md bg-white/5">
              <img
                src="/assets/profile/profile.jpg"
                alt="Felipe Rodrigues Leone"
                className="w-full h-full object-cover transform group-hover:scale-105 pointer-events-auto cursor-pointer transition-transform duration-700"
              />
              {/* Subtle inner ring */}
              <div className="absolute inset-0 border border-white/10 rounded-[40px] md:rounded-[60px] pointer-events-none" />
            </div>
          </motion.div>
        </div>

        {/* Small bio bottom left */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute bottom-0 left-4 md:left-10 z-30 max-w-[320px] text-left hidden lg:block"
        >
          <p className="text-gray-400 font-light text-sm md:text-base leading-relaxed backdrop-blur-md bg-black/20 p-5 rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            Architecting high-performance SaaS platforms and scalable systems.
            Transforming complex data into premium, seamless digital experiences
            at OMDfarm.
          </p>
        </motion.div>
      </div>

    </section>
  );
}
