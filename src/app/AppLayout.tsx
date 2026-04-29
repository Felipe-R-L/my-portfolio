import React from "react";
import { motion } from "motion/react";
import { SpaceBackground } from "./components/SpaceBackground";
import { Hero } from "./components/Hero";
import { About } from "./components/About";
import { Experience } from "./components/Experience";
import { Projects } from "./components/Projects";
import FluidGlass from "./components/react-bits/FluidGlass";
import GradientText from "./components/react-bits/GradientText";
import { useSmoothScroll } from "./hooks/useSmoothScroll";

export default function AppLayout() {
  const lenisRef = useSmoothScroll();
  return (
    <div className="min-h-screen bg-[#030305] text-gray-100 selection:bg-blue-500/30 selection:text-white">
      <SpaceBackground />
      
      {/* Cinematic gradient overlay on top of background. Made subtle so the bright Apple-style glassmorphism pops */}
      <div className="fixed inset-0 pointer-events-none z-[1] bg-gradient-to-b from-[#030305]/10 via-[#030305]/30 to-[#030305]/80" />

      {/* Floating frosted navigation pill */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.5, ease: "easeOut" }}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-8 py-3 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-center gap-8">
          {["About", "Experience", "Projects"].map((item, idx) => (
            <motion.a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-xs font-medium uppercase tracking-[0.2em] text-white/60 hover:text-white transition-colors relative group"
              whileHover={{ y: -1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              onClick={(e) => {
                e.preventDefault();
                lenisRef.current?.scrollTo(`#${item.toLowerCase()}`, { duration: 1.2 });
              }}
            >
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-full transition-all duration-300" />
            </motion.a>
          ))}
        </div>
      </motion.nav>
      
      <main className="relative z-10 w-full overflow-x-hidden">
        <Hero />
        <div id="about"><About /></div>
        <div id="experience"><Experience /></div>
        <div id="projects"><Projects /></div>
        
        <footer className="py-16 text-center border-t border-white/5 relative z-10 mt-20">
          <FluidGlass
            mode="lens"
            blurAmount={14}
            tintColor="rgba(100, 120, 255, 0.06)"
            tintOpacity={0.4}
            containerClassName="bg-black/20 backdrop-blur-md py-8"
          >
            <p className="text-gray-500 font-medium text-sm tracking-widest uppercase">
              © {new Date().getFullYear()}{" "}
              <GradientText
                colors={["#6b7280", "#60a5fa", "#8b5cf6", "#6b7280"]}
                animationSpeed={10}
              >
                Felipe Rodrigues Leone
              </GradientText>
              . Built for the future.
            </p>
          </FluidGlass>
        </footer>
      </main>
    </div>
  );
}
