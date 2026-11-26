import { describe, it, expect, beforeAll } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import pt from "../../src/app/i18n/locales/pt.json";
import en from "../../src/app/i18n/locales/en.json";
import { heroShellHtml, nameFrontHtml } from "../../src/app/components/hero/shell";

const copy = (l: typeof pt) => ({ description: l.hero.description, cta: l.hero.cta_projects });
// The shell marks its text for the language swap; React's markup has no marks.
const unmark = (html: string) => html.replace(/ data-shell="[^"]*"/g, "");

// GSAP registers ScrollTrigger on import and asks for matchMedia, which
// jsdom lacks; the layout under test never reaches GSAP itself.
window.matchMedia ??= ((q: string) => ({
  matches: false, media: q, onchange: null,
  addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;

let NameLayout: typeof import("../../src/app/components/hero/HeroCity").NameLayout;

describe("hero shell", () => {
  beforeAll(async () => {
    ({ NameLayout } = await import("../../src/app/components/hero/HeroCity"));
    await i18n.use(initReactI18next).init({
      lng: "en",
      resources: { en: { translation: en }, pt: { translation: pt } },
      interpolation: { escapeValue: false },
    });
  });

  it("is the same markup React renders for the name, so mounting moves nothing", async () => {
    for (const [lng, locale] of [["en", en], ["pt", pt]] as const) {
      await i18n.changeLanguage(lng);
      const react = renderToStaticMarkup(<NameLayout />);
      expect(unmark(nameFrontHtml(copy(locale)))).toBe(react);
    }
  });

  it("carries both languages and picks one before the first paint", () => {
    const html = heroShellHtml({ pt: copy(pt), en: copy(en) });
    expect(html).toContain(JSON.stringify(pt.hero.description).slice(1, 20));
    expect(html).toContain('<h1 class="sr-only">Felipe Rodrigues Leone</h1>');
    expect(html).toContain("i18nextLng");
    // Diamante and the stamp paint with the name, before any JS
    expect(html).toContain("torrione-2000.webp");
    expect(html).toContain("BENVENUTI A DIAMANTE");
    // nothing in the copy can close the inline script early
    expect(html.match(/<\/script>/g)).toHaveLength(1);
  });
});
