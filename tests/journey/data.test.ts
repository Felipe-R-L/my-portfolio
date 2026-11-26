import { describe, it, expect } from "vitest";
import pt from "../../src/app/i18n/locales/pt.json";
import en from "../../src/app/i18n/locales/en.json";
import { AVAILABILITY, PROJECT_KINDS } from "../../src/app/data/contact";
import { PERSONAL_MEDIA } from "../../src/app/data/media";
import { WORK, workBySlug } from "../../src/app/data/work";

describe("switches Felipe turns on himself", () => {
  it("ships availability off", () => {
    expect(AVAILABILITY.enabled).toBe(false);
  });

  it("ships personal photography and film off, with nothing listed", () => {
    expect(PERSONAL_MEDIA.enabled).toBe(false);
    expect(PERSONAL_MEDIA.photos).toHaveLength(0);
    expect(PERSONAL_MEDIA.reel).toBeNull();
  });
});

describe("the journey's copy", () => {
  it("has a chip and its WhatsApp message for every project kind, in both languages", () => {
    for (const bundle of [pt, en]) {
      const chips = bundle.talk.chips as Record<string, { label: string; message: string }>;
      for (const kind of PROJECT_KINDS) {
        expect(chips[kind]?.label, kind).toBeTruthy();
        expect(chips[kind]?.message, kind).toBeTruthy();
      }
    }
  });

  it("states facts only: no counters, no deadlines in days, no clichés", () => {
    for (const bundle of [pt, en]) {
      const text = JSON.stringify({ p: bundle.plano, c: bundle.talk.chips });
      // the steps describe what happens, never how many days it takes
      expect(text).not.toMatch(/\b\d+\s*(dias?|days?|semanas?|weeks?)\b/i);
      // whole words: the olympiad's real name ("Astronáutica") is a fact, not a cliché
      expect(JSON.stringify(bundle)).not.toMatch(/\b(decolar|decolagem|foguete|rocket|astronauta?)\b|take off/i);
      // the voice rules: no em dash in what the homepage shows (the recruiter
      // version's `experience` copy is parked and out of scope)
      const home = { hero: bundle.hero, story: bundle.story, work: bundle.work, plano: bundle.plano, talk: bundle.talk, contact: bundle.contact, journey: bundle.journey };
      expect(JSON.stringify(home)).not.toContain("—");
    }
  });
});

describe("destinations", () => {
  it("each has a unique address for its case", () => {
    const slugs = WORK.map((w) => w.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const w of WORK) expect(workBySlug(w.slug)).toBe(w);
  });
});
