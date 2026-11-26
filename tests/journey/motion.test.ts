import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { cameraAt, cursorAt, clickAt, type ClipMeta, type Pose } from "../../src/app/components/motion/clip";
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

describe("the camera's curve", () => {
  const at = (t: number, s: number, x = 720): Pose => ({ t, rx: 0, ry: 0, s, x, y: 450 });
  const keys = [at(0, 1), at(1, 1.2), at(2, 1.6), at(3, 1.6), at(4, 1)];

  it("goes through every key and never past one", () => {
    for (const k of keys) expect(cameraAt(keys, k.t).s).toBeCloseTo(k.s);
    for (let t = 0; t <= 4; t += 0.01) {
      const s = cameraAt(keys, t).s;
      expect(s).toBeGreaterThanOrEqual(1 - 1e-9);
      expect(s).toBeLessThanOrEqual(1.6 + 1e-9);
    }
  });

  it("keeps moving through a key on the way, instead of stopping at it", () => {
    const v = (cameraAt(keys, 1.01).s - cameraAt(keys, 0.99).s) / 0.02;
    expect(v).toBeGreaterThan(0.2);
  });

  it("holds perfectly still between two equal keys", () => {
    expect(cameraAt(keys, 2.3).s).toBeCloseTo(1.6, 9);
    expect(cameraAt(keys, 2.7).s).toBeCloseTo(1.6, 9);
  });

  it("changes smoothly, without a jump from one frame to the next", () => {
    let prev = cameraAt(keys, 0).s;
    for (let t = 1 / 60; t <= 4; t += 1 / 60) {
      const s = cameraAt(keys, t).s;
      expect(Math.abs(s - prev)).toBeLessThan(0.02);
      prev = s;
    }
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

  it("reads only marks and boxes the take recorded, with every key a number and in order", () => {
    for (const [name, spec] of Object.entries(MOTION)) {
      const m = meta(name);
      if (spec.mode === "camera") {
        const keys = spec.camera(m);
        for (const k of keys) for (const v of Object.values(k)) expect(Number.isFinite(v), `${name} camera`).toBe(true);
        for (let i = 1; i < keys.length; i++) expect(keys[i].t, `${name} keys in order`).toBeGreaterThanOrEqual(keys[i - 1].t);
        for (const c of spec.captions(m)) expect(c.from < c.to && c.from >= 0, `${name} caption ${c.key}`).toBe(true);
      }
    }
  });

  it("has the words for every caption and crop, in both languages", async () => {
    const pt = (await import("../../src/app/i18n/locales/pt.json")).default as Record<string, any>;
    const en = (await import("../../src/app/i18n/locales/en.json")).default as Record<string, any>;
    for (const w of WORK) {
      const spec = MOTION[w.motion!];
      const m = meta(w.motion!);
      const keys = spec.mode === "camera" ? spec.captions(m).map((c) => c.key) : [];
      for (const bundle of [pt, en]) for (const k of keys) expect(bundle.work.items[w.id].motion?.[k], `${w.id}.motion.${k}`).toBeTruthy();
    }
  });
});
