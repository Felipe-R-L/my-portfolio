import React from "react";
import { motion } from "motion/react";
import Galaxy from "./components/react-bits/Galaxy";
import { Hero } from "./components/Hero";
import TechMarquee from "./components/TechMarquee";
import { About } from "./components/About";
import { Experience } from "./components/Experience";
import { Services } from "./components/Services";
import { Projects } from "./components/Projects";
import { Contact } from "./components/Contact";
import GlassSurface from "./components/react-bits/GlassSurface";
import FluidGlass from "./components/react-bits/FluidGlass";
import GradientText from "./components/react-bits/GradientText";
import { useTranslation } from "react-i18next";
import { useSmoothScroll } from "./hooks/useSmoothScroll";

export default function AppLayout() {
  const lenisRef = useSmoothScroll();
  const { t, i18n } = useTranslation();

  const navItems = [
    { id: "about", key: "nav.about" },
    { id: "projects", key: "nav.projects" },
    { id: "experience", key: "nav.experience" },
    { id: "services", key: "nav.services" },
  ];

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
        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-[40px] w-[calc(100%-2rem)] md:w-max"
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
          <div className="flex items-center gap-4 md:gap-8">
            <div className="flex items-center gap-4 md:gap-8">
              {navItems.map((item) => (
                <motion.a
                  key={item.id}
                  href={`#${item.id}`}
                  className="text-[10px] md:text-xs font-medium uppercase tracking-[0.1em] md:tracking-[0.2em] text-white/60 hover:text-white transition-colors relative group"
                  whileHover={{ y: -1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  onClick={(e) => {
                    e.preventDefault();
                    lenisRef.current?.scrollTo(`#${item.id}`, {
                      duration: 1.2,
                    });
                  }}
                >
                  {t(item.key)}
                  <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-full transition-all duration-300" />
                </motion.a>
              ))}
            </div>

            <div className="flex items-center gap-2 md:gap-3 pl-4 md:pl-6 border-l border-white/10 h-4">
              {["en", "pt"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => i18n.changeLanguage(lang)}
                  className={`text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
                    i18n.language.startsWith(lang)
                      ? "text-blue-400"
                      : "text-white/30 hover:text-white/60"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </GlassSurface>
      </motion.nav>

      <main className="relative z-10 w-full overflow-x-hidden">
        <Hero />
        <TechMarquee />
        <div id="about">
          <About />
        </div>
        <div id="projects">
          <Projects />
        </div>
        <div id="experience">
          <Experience />
        </div>
        <div id="services">
          <Services />
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
                    icon: "https://cdn.simpleicons.org/github/white",
                    href: "https://github.com/Felipe-R-L",
                    label: "GitHub",
                  },
                  {
                    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/linkedin/linkedin-original.svg",
                    href: "https://linkedin.com/in/felipe-rodrigues-leone",
                    label: "LinkedIn",
                  },
                  {
                    icon: "https://cdn.simpleicons.org/x/white",
                    href: "https://x.com/rfelipe_jpg",
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
                    <img src={social.icon} alt={social.label} className="w-6 h-6" />
                  </motion.a>
                ))}
              </div>

              <p className="text-gray-500 font-medium text-sm tracking-wide md:tracking-widest uppercase flex flex-col lg:flex-row items-center justify-center gap-2 md:gap-4">
                <span className="opacity-50">© {new Date().getFullYear()}</span>
                <GradientText
                  colors={["#6b7280", "#60a5fa", "#8b5cf6", "#6b7280"]}
                  animationSpeed={10}
                >
                  Felipe Rodrigues Leone
                </GradientText>
                <span className="hidden lg:inline opacity-30">•</span>
                <span className="opacity-50">{t("footer.built_for_future")}</span>
              </p>
            </div>
          </FluidGlass>
        </footer>
      </main>
    </div>
  );
}
