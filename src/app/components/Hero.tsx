import React from "react";
import { motion } from "motion/react";
import SplitText from "./react-bits/SplitText";
import GradientText from "./react-bits/GradientText";
import LogoLoop from "./react-bits/LogoLoop";

const techLogos = [
  { src: "https://cdn.simpleicons.org/react/61DAFB", title: "React" },
  { src: "https://cdn.simpleicons.org/nextdotjs/white", title: "Next.js" },
  { src: "https://cdn.simpleicons.org/typescript/3178C6", title: "TypeScript" },
  { src: "https://cdn.simpleicons.org/tailwindcss/06B6D4", title: "Tailwind CSS" },
  { src: "https://cdn.simpleicons.org/angular/DD0031", title: "Angular" },
  { src: "https://cdn.simpleicons.org/nestjs/E0234E", title: "NestJS" },
  { src: "https://cdn.simpleicons.org/java/007396", title: "Java" },
  { src: "https://cdn.simpleicons.org/postgresql/4169E1", title: "PostgreSQL" },
  { src: "https://cdn.simpleicons.org/docker/2496ED", title: "Docker" }
];

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

      <div className="max-w-7xl mx-auto w-full text-center z-10 relative flex-1 flex flex-col justify-center mt-12">
        
        {/* Top Tag - absolute on desktop, relative on mobile to flow naturally */}
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

        {/* Text and Image Container */}
        <div className="relative w-full flex flex-col items-center justify-center min-h-[400px] md:min-h-[500px]">
          
          {/* Main Typography behind the image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
            className="z-10 relative w-full flex flex-col items-center justify-center space-y-4"
          >
            <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-[10rem] font-bold text-white tracking-tighter leading-[0.9] filter drop-shadow-[0_0_40px_rgba(255,255,255,0.15)] uppercase w-full">
              <SplitText
                text="FELIPE RODRIGUES"
                className="inline-block"
                delay={30}
                animationFrom={{ opacity: 0, transform: "translate3d(0, 50px, 0) rotateX(90deg)" }}
                animationTo={{ opacity: 1, transform: "translate3d(0, 0, 0) rotateX(0deg)" }}
              />
            </h1>
            <div className="flex items-center justify-center gap-6 md:gap-12 w-full max-w-5xl">
              <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-[7rem] font-light text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-200 tracking-widest uppercase">
                SOFTWARE
              </h2>
              <GradientText
                colors={["#60a5fa", "#818cf8", "#a78bfa", "#c084fc", "#60a5fa"]}
                animationSpeed={6}
                className="text-3xl sm:text-4xl md:text-6xl lg:text-[7rem] font-bold tracking-widest uppercase font-light drop-shadow-lg"
              >
                DEVELOPER
              </GradientText>
            </div>
          </motion.div>

          {/* Profile Image overlapping text */}
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, delay: 0.8, ease: "easeOut" }}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[140%] flex items-end justify-center z-20 pointer-events-none"
          >
            <img 
              src="/assets/profile/profile3.png" 
              alt="Felipe Rodrigues Leone" 
              className="w-auto h-full max-h-[85vh] object-contain object-bottom drop-shadow-[0_30px_60px_rgba(0,0,0,0.9)] filter grayscale hover:grayscale-0 transition-all duration-700 pointer-events-auto cursor-pointer"
            />
          </motion.div>
        </div>

        {/* Small bio bottom left */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute bottom-0 left-4 md:left-10 z-30 max-w-[280px] text-left hidden lg:block"
        >
          <p className="text-gray-400 font-light text-sm md:text-base leading-relaxed backdrop-blur-md bg-black/20 p-5 rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            Hey there! I'm a full-stack developer working globally, building scalable architectures and premium experiences.
          </p>
        </motion.div>
      </div>

      {/* LogoLoop Bar anchored to the bottom */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 1.2, ease: "easeOut" }}
        className="absolute bottom-0 left-0 w-full bg-[#030305]/80 backdrop-blur-xl border-t border-white/5 py-4 z-40"
      >
        <LogoLoop
          logos={techLogos}
          speed={80}
          direction="left"
          logoHeight={36}
          gap={64}
          hoverSpeed={20}
          scaleOnHover
          fadeOut
          fadeOutColor="#030305"
          ariaLabel="Technologies"
        />
      </motion.div>
    </section>
  );
}
