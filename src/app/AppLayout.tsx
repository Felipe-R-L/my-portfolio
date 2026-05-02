import React from "react";
import { motion } from "motion/react";
import Galaxy from "./components/react-bits/Galaxy";
import { Hero } from "./components/Hero";
import { About } from "./components/About";
import { Experience } from "./components/Experience";
import { Projects } from "./components/Projects";
import { Contact } from "./components/Contact";
import { Github, Linkedin } from "lucide-react";
import GlassSurface from "./components/react-bits/GlassSurface";
import FluidGlass from "./components/react-bits/FluidGlass";
import GradientText from "./components/react-bits/GradientText";
import { useSmoothScroll } from "./hooks/useSmoothScroll";

const XIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.49h2.039L6.486 3.24H4.298l13.311 17.403z" />
  </svg>
);

export default function AppLayout() {
  const lenisRef = useSmoothScroll();
  return (
    <div className="min-h-screen bg-[#030305] text-gray-100 selection:bg-blue-500/30 selection:text-white">
      <div className="fixed inset-0 z-0">
        <Galaxy
          mouseRepulsion={true}
          mouseInteraction={true}
          density={0.3}
          glowIntensity={0.2}
          repulsionStrength={0.2}
          saturation={0.2}
          hueShift={240}
        />
      </div>

      {/* Cinematic gradient overlay on top of background. Made subtle so the bright Apple-style glassmorphism pops */}
      <div className="fixed inset-0 pointer-events-none z-[1] bg-gradient-to-b from-[#030305]/10 via-[#030305]/30 to-[#030305]/80" />

      {/* Floating frosted navigation pill */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.5, ease: "easeOut" }}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-[40px]"
      >
        <GlassSurface
          width="max-content"
          height="auto"
          borderRadius={40}
          className="px-8 py-3"
          displace={0.1}
          distortionScale={-180}
          redOffset={0}
          greenOffset={0}
          blueOffset={10}
          brightness={30}
          opacity={0.83}
          mixBlendMode="screen"
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
                  lenisRef.current?.scrollTo(`#${item.toLowerCase()}`, {
                    duration: 1.2,
                  });
                }}
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-full transition-all duration-300" />
              </motion.a>
            ))}
          </div>
        </GlassSurface>
      </motion.nav>

      <main className="relative z-10 w-full overflow-x-hidden">
        <Hero />
        <div id="about">
          <About />
        </div>
        <div id="experience">
          <Experience />
        </div>
        <div id="projects">
          <Projects />
        </div>
        <div id="contact">
          <Contact />
        </div>

        <footer className="relative z-10 mt-20 px-6 pb-20">
          <FluidGlass
            mode="lens"
            containerClassName="bg-white/[0.03] border border-white/10 rounded-[3rem] py-16 px-4 text-center"
          >
            <div className="flex flex-col items-center gap-8">
              <div className="flex gap-6">
                {[
                  {
                    icon: Github,
                    href: "https://github.com/Felipe-R-L",
                    label: "GitHub",
                  },
                  {
                    icon: Linkedin,
                    href: "https://linkedin.com/in/felipeleone",
                    label: "LinkedIn",
                  },
                  {
                    icon: XIcon,
                    href: "https://x.com/felipeleone",
                    label: "X",
                  },
                ].map((social, idx) => (
                  <motion.a
                    key={idx}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-white transition-colors"
                    whileHover={{ scale: 1.2, y: -2 }}
                  >
                    <social.icon className="w-6 h-6" />
                  </motion.a>
                ))}
              </div>

              <p className="text-gray-500 font-medium text-sm tracking-widest uppercase flex flex-col md:flex-row items-center justify-center gap-2">
                <span>© {new Date().getFullYear()}</span>
                <GradientText
                  colors={["#6b7280", "#60a5fa", "#8b5cf6", "#6b7280"]}
                  animationSpeed={10}
                >
                  Felipe Rodrigues Leone
                </GradientText>
                <span>• Built for the future.</span>
              </p>
            </div>
          </FluidGlass>
        </footer>
      </main>
    </div>
  );
}
