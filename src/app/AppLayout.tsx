import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";

import { Hero } from "./components/Hero";
import { Work } from "./scenes/Work";
import { Proof } from "./scenes/Proof";
import { Process } from "./scenes/Process";
import { Talk } from "./scenes/Talk";
import { StarField } from "./components/shared/StarField";
import { GlassNav, type GlassNavItem } from "./components/shared/GlassNav";
import { useSmoothScroll } from "./hooks/useSmoothScroll";
import { useHashScroll } from "./hooks/useHashScroll";

/**
 * The homepage, for business owners: seven scenes in one take. The name and
 * the city, the portrait, the story, the work, the proof, how it works, and
 * the conversation that closes the page. `src/app/recruiter/` keeps the pieces
 * of a future version for recruiters.
 */
const SECTION_IDS = ["about", "projects", "process", "contact"] as const;

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
        <Proof />
        <Process />
        <Talk />
      </main>
    </div>
  );
}
