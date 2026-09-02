import { Suspense, lazy } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";

import { Hero } from "./components/Hero";
import TechMarquee from "./components/TechMarquee";
import { About } from "./components/About";
import { Experience } from "./components/Experience";
import { Services } from "./components/Services";
import { Projects } from "./components/Projects";
import { Contact } from "./components/Contact";
import { StarField } from "./components/shared/StarField";
import { SocialLinks } from "./components/shared/SocialLinks";
import GradientText from "./components/react-bits/GradientText";
import { useSmoothScroll } from "./hooks/useSmoothScroll";
import { useIsMobile } from "./hooks/useIsMobile";

const LazyGalaxy = lazy(() => import("./components/react-bits/Galaxy"));
const LazyFluidGlass = lazy(() => import("./components/react-bits/FluidGlass"));

const NAV_ITEMS = [
  { id: "about", key: "nav.about" },
  { id: "projects", key: "nav.projects" },
  { id: "experience", key: "nav.experience" },
  { id: "services", key: "nav.services" },
  { href: "/blog", key: "nav.blog" },
] as const;

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "pt", label: "Português" },
] as const;

export default function AppLayout() {
  const lenisRef = useSmoothScroll();
  const { t, i18n } = useTranslation();
  const isReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  // The WebGL starfield is the heaviest thing on the page and is barely
  // perceptible on a phone screen, so mobile and reduced-motion users get the
  // static CSS starfield instead.
  const useWebGLBackground = !isMobile && !isReducedMotion;

  return (
    <div className="bg-[#030305] min-h-screen font-sans selection:bg-blue-500/30 selection:text-blue-200 overflow-x-hidden">
      {/* 1. Global background: WebGL galaxy on pointer devices, static CSS elsewhere.
             Decorative only, so it stays out of the accessibility tree. */}
      <div className="fixed inset-0 z-0" aria-hidden="true">
        {useWebGLBackground ? (
          <Suspense fallback={<StarField />}>
            <LazyGalaxy
              mouseRepulsion
              mouseInteraction
              density={0.3}
              glowIntensity={0.2}
              numLayers={4}
              repulsionStrength={0.2}
              saturation={0.2}
              hueShift={240}
            />
          </Suspense>
        ) : (
          <StarField />
        )}
      </div>

      {/* Cinematic gradient overlay on top of background. Made subtle so the bright Apple-style glassmorphism pops */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-[1] bg-gradient-to-b from-[#030305]/10 via-[#030305]/30 to-[#030305]/80"
      />

      {/* Floating frosted navigation pill */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.5, ease: "easeOut" }}
        className="fixed top-4 md:top-6 left-1/2 -translate-x-1/2 z-50 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-[40px] w-[calc(100%-1.5rem)] md:w-max"
      >
        {/*
          Was a GlassSurface, whose SVG displacement filter smeared a mirrored
          copy of the page content through the pill — it read as a rendering
          glitch rather than as glass. A backdrop blur is cheaper and actually
          looks like frosted glass over a moving starfield.
        */}
        <div className="rounded-[40px] border border-white/[0.14] bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150 px-4 md:px-8 py-2.5 md:py-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16)]">
          <div className="flex items-center gap-3 md:gap-8">
            <div className="flex items-center gap-3 md:gap-8">
              {NAV_ITEMS.map((item) => {
                const linkClassName =
                  "text-[9px] md:text-xs font-medium uppercase tracking-[0.05em] md:tracking-[0.2em] text-white/60 hover:text-white transition-colors relative group whitespace-nowrap";
                const underline = (
                  <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-gradient-to-r from-[var(--zone-a-1)] to-[var(--zone-a-2)] group-hover:w-full transition-all duration-300" />
                );

                if ("href" in item) {
                  return (
                    <a key={item.key} href={item.href} className={linkClassName}>
                      {t(item.key)}
                      {underline}
                    </a>
                  );
                }

                return (
                  <motion.a
                    key={item.id}
                    href={`#${item.id}`}
                    className={linkClassName}
                    whileHover={{ y: -1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    onClick={(e) => {
                      e.preventDefault();
                      lenisRef.current?.scrollTo(`#${item.id}`, { duration: 1.2 });
                    }}
                  >
                    {t(item.key)}
                    {underline}
                  </motion.a>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5 md:gap-3 pl-3 md:pl-6 border-l border-white/10 h-4">
              {LANGUAGES.map((lang) => {
                const isActive = i18n.language.startsWith(lang.code);
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => i18n.changeLanguage(lang.code)}
                    lang={lang.code}
                    title={lang.label}
                    aria-pressed={isActive}
                    className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
                      isActive ? "text-[var(--zone-a-1)]" : "text-white/50 hover:text-white/80"
                    }`}
                  >
                    {lang.code}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.nav>

      <main className="relative z-10 w-full overflow-x-hidden">
        {/* Each section now owns its own scroll target, so the wrapper divs that
            used to carry these ids would have duplicated them. */}
        <Hero />
        <TechMarquee />
        <About />
        <Projects />
        <Experience />
        <Services />
        <Contact />

        <footer className="relative z-10 mt-16 px-[var(--gutter)] pb-20">
          <Suspense
            fallback={
              <div className="bg-white/[0.03] border border-white/10 rounded-[3rem] py-16 px-4 text-center" />
            }
          >
            <LazyFluidGlass
              mode="lens"
              containerClassName="bg-white/[0.03] border border-white/10 rounded-[3rem] py-16 px-4 text-center"
            >
              <div className="flex flex-col items-center gap-8">
                <SocialLinks variant="footer" />

                {/* Raised from text-gray-500/opacity-50 to clear WCAG AA on #030305 */}
                <p className="text-gray-400 font-medium text-sm tracking-wide md:tracking-widest uppercase flex flex-col lg:flex-row items-center justify-center gap-2 md:gap-4">
                  <span>© {new Date().getFullYear()}</span>
                  <GradientText
                    colors={["#9ca3af", "#4c8dff", "#8b5cf6", "#9ca3af"]}
                    animationSpeed={10}
                  >
                    Felipe Rodrigues Leone
                  </GradientText>
                  <span className="hidden lg:inline opacity-50" aria-hidden="true">
                    •
                  </span>
                  <span>{t("footer.built_for_future")}</span>
                </p>
              </div>
            </LazyFluidGlass>
          </Suspense>
        </footer>
      </main>
    </div>
  );
}
