import { Suspense, lazy } from "react";
import type { MouseEvent } from "react";
import { useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";

import { Hero } from "./components/Hero";
import TechMarquee from "./components/TechMarquee";
import { About } from "./components/About";
import { Experience } from "./components/Experience";
import { Services } from "./components/Services";
import { Projects } from "./components/Projects";
import { LatestWriting } from "./components/LatestWriting";
import { Contact } from "./components/Contact";
import { StarField } from "./components/shared/StarField";
import { SocialLinks } from "./components/shared/SocialLinks";
import { GlassNav, type GlassNavItem } from "./components/shared/GlassNav";
import GradientText from "./components/react-bits/GradientText";
import { useSmoothScroll } from "./hooks/useSmoothScroll";
import { useIsMobile } from "./hooks/useIsMobile";

const LazyGalaxy = lazy(() => import("./components/react-bits/Galaxy"));
const LazyFluidGlass = lazy(() => import("./components/react-bits/FluidGlass"));

const SECTION_IDS = ["about", "projects", "experience", "services"] as const;

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "pt", label: "Português" },
] as const;

export default function AppLayout() {
  const lenisRef = useSmoothScroll();
  const { t, i18n } = useTranslation();
  const isReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  const navItems: GlassNavItem[] = [
    ...SECTION_IDS.map((id) => ({
      id,
      href: `#${id}`,
      label: t(`nav.${id}`),
      onSelect: (event: MouseEvent<HTMLAnchorElement>) => {
        const lenis = lenisRef.current;
        if (!lenis) return; // no Lenis (e.g. mobile): let the browser scroll natively
        event.preventDefault();
        lenis.scrollTo(`#${id}`, { duration: 1.2 });
      },
    })),
    { id: "blog", href: "/blog", label: t("nav.blog") },
  ];

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

      {/* Floating frosted navigation pill (desktop) / expanding bottom pill (mobile) */}
      <GlassNav
        items={navItems}
        languages={LANGUAGES}
        activeLanguage={i18n.language}
        onLanguageChange={(code) => i18n.changeLanguage(code)}
        openLabel={t("nav.menu_open")}
        closeLabel={t("nav.menu_close")}
        entrance={{ duration: 0.8, delay: 1.5 }}
      />

      <main className="relative z-10 w-full overflow-x-hidden">
        {/* Each section now owns its own scroll target, so the wrapper divs that
            used to carry these ids would have duplicated them. */}
        <Hero />
        <TechMarquee />
        <About />
        <Projects />
        <Experience />
        <Services />
        <LatestWriting />
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
