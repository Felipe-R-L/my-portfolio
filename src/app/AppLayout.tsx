import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";

import { Hero } from "./components/Hero";
import { Work } from "./scenes/Work";
import { Proof } from "./scenes/Proof";
import { Process } from "./scenes/Process";
import { Talk } from "./scenes/Talk";
import { GlassNav, type GlassNavItem } from "./components/shared/GlassNav";
import { useSmoothScroll } from "./hooks/useSmoothScroll";
import { useHashScroll } from "./hooks/useHashScroll";
import { CHAPTERS } from "./journey/chapters";
import { useJourney } from "./journey/useJourney";
import { AmbientLight } from "./journey/AmbientLight";
import { ChapterRail } from "./journey/ChapterRail";
import { JourneyFrame } from "./journey/JourneyFrame";
import { useCaseRoute } from "./journey/caseRoute";
import { CaseLayer } from "./scenes/CaseLayer";
import { DURATION } from "./motion/tokens";

/**
 * The homepage, for business owners: seven scenes in one take. The name and
 * the city, the portrait, the story, the work, the proof, how it works, and
 * the conversation that closes the page. `src/app/recruiter/` keeps the pieces
 * of a future version for recruiters.
 */
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
  const journey = useJourney();
  const caseRoute = useCaseRoute();

  const navItems: GlassNavItem[] = [
    // One item per chapter, in the journey's order, landing on its anchor.
    ...CHAPTERS.map((c) => ({
      id: c.id,
      href: `#${c.anchor}`,
      label: t(c.label),
      onSelect: (event: MouseEvent<HTMLAnchorElement>) => {
        const lenis = lenisRef.current;
        if (!lenis) return; // no Lenis (e.g. mobile): let the browser scroll natively
        event.preventDefault();
        lenis.scrollTo(`#${c.anchor}`, { duration: DURATION.navJump });
      },
    })),
    { id: "blog", href: "/blog", label: t("nav.blog") },
  ];

  return (
    <div className="bg-[#050608] min-h-screen font-sans selection:bg-blue-500/30 selection:text-blue-200 overflow-x-clip">
      {/* The light of the chapter in view, behind everything. */}
      <div className="fixed inset-0 z-0" aria-hidden="true">
        <AmbientLight active={journey.active} />
      </div>

      {/* The thread of the journey: one frame that every chapter places. */}
      <JourneyFrame />

      {/* Where you are and how much is left (desktop; the phone shows it in the nav pill). */}
      <ChapterRail variant="desk" active={journey.active} progress={journey.progress} />

      {/* Floating frosted navigation pill (desktop) / expanding bottom pill (mobile) */}
      <GlassNav
        items={navItems}
        languages={LANGUAGES}
        activeLanguage={i18n.language}
        onLanguageChange={(code) => i18n.changeLanguage(code)}
        openLabel={t("nav.menu_open")}
        closeLabel={t("nav.menu_close")}
        entrance={{ duration: 0.8, delay: 1.5 }}
        activeId={journey.active}
        status={<ChapterRail variant="pill" active={journey.active} progress={journey.progress} />}
      />

      <main className="relative z-10 w-full overflow-x-clip">
        {/* Each section now owns its own scroll target, so the wrapper divs that
            used to carry these ids would have duplicated them. */}
        {/* The hero; the story scene (who I am) follows it. */}
        <Hero />
        <Work onOpenCase={caseRoute.open} />
        <Proof />
        <Process />
        <Talk />
      </main>

      {/* The surface: a destination's case, over the journey (/work/<slug>). */}
      <CaseLayer item={caseRoute.item} from={caseRoute.from} onClose={caseRoute.close} lenisRef={lenisRef} />
    </div>
  );
}
