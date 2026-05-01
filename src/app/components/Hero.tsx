import React from "react";
import { motion } from "motion/react";
import SplitText from "./react-bits/SplitText";
import GradientText from "./react-bits/GradientText";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden px-6">
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
        <motion.div
          className="absolute bottom-0 right-1/4 w-[28rem] h-[28rem] bg-indigo-600/40 rounded-full mix-blend-screen filter blur-[120px]"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.4, 0.55, 0.4],
            x: [0, -25, 15, 0],
            y: [0, 15, -25, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute top-1/4 right-1/3 w-80 h-80 bg-purple-600/30 rounded-full mix-blend-screen filter blur-[100px]"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 20, -30, 0],
            y: [0, -30, 20, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <div className="max-w-5xl mx-auto text-center z-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.4)] mb-8">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <h2 className="text-blue-100 font-medium tracking-widest text-xs uppercase">
              Software Developer | Angular, NestJS, TypeScript, Java
            </h2>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
        >
          <h1 className="text-5xl md:text-7xl lg:text-[7rem] font-bold text-white tracking-tighter leading-[1.1] mb-8 filter drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]">
            <SplitText
              text="FELIPE RODRIGUES"
              className="inline"
              delay={40}
              animationFrom={{ opacity: 0, transform: "translate3d(0, 50px, 0) rotateX(90deg)" }}
              animationTo={{ opacity: 1, transform: "translate3d(0, 0, 0) rotateX(0deg)" }}
            />
            <br />
            <GradientText
              colors={["#60a5fa", "#818cf8", "#a78bfa", "#c084fc", "#60a5fa"]}
              animationSpeed={6}
              className="text-5xl md:text-7xl lg:text-[7rem] font-bold tracking-tighter"
            >
              <SplitText
                text="LEONE"
                className="inline"
                delay={50}
                animationFrom={{ opacity: 0, transform: "translate3d(0, 50px, 0) rotateX(-90deg)" }}
                animationTo={{ opacity: 1, transform: "translate3d(0, 0, 0) rotateX(0deg)" }}
              />
            </GradientText>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="text-xl md:text-2xl text-gray-300 font-light max-w-2xl mx-auto backdrop-blur-sm"
        >
          Building scalable architectures and premium experiences.
        </motion.p>

        {/* Animated scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="mt-20 flex flex-col items-center"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2 mb-4"
          >
            <motion.div
              animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-1 h-2 bg-blue-400/80 rounded-full"
            />
          </motion.div>
          <div className="w-[1px] h-24 bg-gradient-to-b from-blue-500/80 via-purple-500/50 to-transparent mx-auto" />
        </motion.div>
      </div>
    </section>
  );
}
