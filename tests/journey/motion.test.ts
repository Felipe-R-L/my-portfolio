import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { cursorAt, clickAt, type ClipMeta } from "../../src/app/components/motion/clip";
import { MOTION } from "../../src/app/data/motion";
import { WORK } from "../../src/app/data/work";

const DIR = new URL("../../public/assets/projects/video/", import.meta.url);
const meta = (name: string): ClipMeta => JSON.parse(readFileSync(new URL(`${name}.json`, DIR), "utf8"));

describe("the drawn hand", () => {
  const m: ClipMeta = {
    duration: 4,
    size: [1440, 900],
    cursor: [[0, 100, 100], [1, 100, 100], [1.03, 130, 100], [1.06, 160, 100], [3, 500, 500]],
    clicks: [2],
    marks: {},
    boxes: {},
  };
  it("glides between samples of one movement", () => {
    expect(cursorAt(m, 1.045).x).toBeCloseTo(145);
  });
  it("rests where it stopped across a pause, instead of drifting", () => {
    expect(cursorAt(m, 2)).toEqual({ x: 160, y: 100 });
  });
  it("presses for a moment on each click", () => {
    expect(clickAt(m, 1.9)).toBe(-1);
    expect(clickAt(m, 2.3)).toBeCloseTo(0.5);
  });
});

describe("the motion of each clip", () => {
  it("presents every project with a recorded clip that has its spec", () => {
    for (const w of WORK) {
      expect(w.motion, w.id).toBeTruthy();
      expect(MOTION[w.motion!], w.motion).toBeTruthy();
      expect(existsSync(new URL(`${w.motion}.json`, DIR)), w.motion).toBe(true);
    }
  });

  it("reads only marks, boxes and stills the take recorded, and keeps every moment inside the clip", () => {
    for (const [name, spec] of Object.entries(MOTION)) {
      const m = meta(name);
      if (spec.mode === "camera") {
        const keys = spec.camera(m);
        for (const k of keys) for (const v of Object.values(k)) expect(Number.isFinite(v), `${name} camera`).toBe(true);
        for (let i = 1; i < keys.length; i++) expect(keys[i].t, `${name} keys in order`).toBeGreaterThanOrEqual(keys[i - 1].t);
        for (const c of spec.captions(m)) expect(c.from < c.to && c.from >= 0, `${name} caption ${c.key}`).toBe(true);
      }
      if (spec.mode === "crops") {
        for (const c of spec.crops(m)) {
          expect(Number.isFinite(c.at) && c.at >= 0 && c.at < m.duration, `${name} crop ${c.key} at ${c.at}`).toBe(true);
          expect(existsSync(new URL(`${name}-${c.still}.webp`, DIR)), `${name} still ${c.still}`).toBe(true);
          expect(c.rect.x >= 0 && c.rect.y >= 0 && c.rect.x + c.rect.w <= 1440 && c.rect.y + c.rect.h <= 900, `${name} rect`).toBe(true);
        }
      }
    }
  });

  it("has the words for every caption and crop, in both languages", async () => {
    const pt = (await import("../../src/app/i18n/locales/pt.json")).default as Record<string, any>;
    const en = (await import("../../src/app/i18n/locales/en.json")).default as Record<string, any>;
    for (const w of WORK) {
      const spec = MOTION[w.motion!];
      const m = meta(w.motion!);
      const keys = spec.mode === "camera" ? spec.captions(m).map((c) => c.key) : spec.mode === "crops" ? spec.crops(m).map((c) => c.key) : [];
      for (const bundle of [pt, en]) for (const k of keys) expect(bundle.work.items[w.id].motion?.[k], `${w.id}.motion.${k}`).toBeTruthy();
    }
  });
});
