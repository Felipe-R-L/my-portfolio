import { Suspense, lazy } from "react";
import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";

import { Hero } from "./components/Hero";
import { Work } from "./scenes/Work";
import { Process } from "./components/Process";
import { LatestWriting } from "./components/LatestWriting";
import { Contact } from "./components/Contact";
import { StarField } from "./components/shared/StarField";
import { SocialLinks } from "./components/shared/SocialLinks";
import { GlassNav, type GlassNavItem } from "./components/shared/GlassNav";
import GradientText from "./components/react-bits/GradientText";
import { useSmoothScroll } from "./hooks/useSmoothScroll";
import { useHashScroll } from "./hooks/useHashScroll";

const LazyFluidGlass = lazy(() => import("./components/react-bits/FluidGlass"));

/**
 * This is the freelance and networking version of the homepage: the name, then
 * the portrait and who I am, then what I do for a business, proof, and how
 * working together goes. `Experience` and `TechMarquee` are kept for the
 * job-hunting version.
 */
const SECTION_IDS = ["about", "projects", "process"] as const;

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "pt", label: "Português" },
] as const;

export default function AppLayout() {
  const lenisRef = useSmoothScroll();
  // Honours `/#projects` and friends on arrival — links into the homepage from
  // the blog are cross-document, so nothing else would act on the fragment.
  useHashScroll(lenisRef);
  const { t, i18n } = useTranslation();

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

  return (
    <div className="bg-[#050608] min-h-screen font-sans selection:bg-blue-500/30 selection:text-blue-200 overflow-x-clip">
      {/* Global background: static CSS, decorative only. */}
      <div className="fixed inset-0 z-0" aria-hidden="true">
        <StarField />
      </div>

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

      <main className="relative z-10 w-full overflow-x-clip">
        {/* Each section now owns its own scroll target, so the wrapper divs that
            used to carry these ids would have duplicated them. */}
        {/* The hero; the story scene (who I am) follows it. */}
        <Hero />
        <Work />
        <Process />
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
