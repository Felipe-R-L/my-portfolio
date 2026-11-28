import { describe, it, expect } from "vitest";
import {
  CHAPTERS,
  FULL,
  chapterIndex,
  counterScale,
  frameTransform,
  journeyProgress,
  lerpRect,
  radiusFor,
} from "../../src/app/journey/chapters";
import { DURATION, SCROLL } from "../../src/app/motion/tokens";

describe("chapters", () => {
  it("keeps the anchors the blog already links to", () => {
    expect(CHAPTERS.map((c) => c.anchor)).toEqual(["about", "projects", "process", "gallery", "contact"]);
  });

  it("weighs every chapter the same on the rail", () => {
    expect(journeyProgress("partida", 0)).toBe(0);
    expect(journeyProgress("destinos", 0)).toBeCloseTo(1 / 5);
    expect(journeyProgress("retorno", 1)).toBe(1);
    // clamped inside a chapter, so a pin overshoot never jumps ahead
    expect(journeyProgress("destinos", 1.4)).toBeCloseTo(2 / 5);
  });

  it("only moves forward as the scroll moves forward", () => {
    let prev = -1;
    for (const c of CHAPTERS) {
      for (let i = 0; i <= 10; i++) {
        const p = journeyProgress(c.id, i / 10);
        expect(p).toBeGreaterThanOrEqual(prev);
        prev = p;
      }
    }
    expect(chapterIndex("plano")).toBe(2);
  });
});

describe("the frame", () => {
  const aside = { x: 0.05, y: 0.14, w: 0.25, h: 0.72 };

  it("interpolates the same both ways, so a reverse scrub never jumps", () => {
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const fwd = lerpRect(FULL, aside, t);
      const back = lerpRect(aside, FULL, 1 - t);
      for (const k of ["x", "y", "w", "h"] as const) expect(fwd[k]).toBeCloseTo(back[k], 10);
    }
  });

  it("clamps outside its band", () => {
    expect(lerpRect(FULL, aside, -0.5)).toEqual(FULL);
    expect(lerpRect(FULL, aside, 2)).toEqual(aside);
  });

  it("maps a rect to a transform in pixels", () => {
    const t = frameTransform(aside, 1440, 900);
    expect(t.x).toBeCloseTo(72);
    expect(t.y).toBeCloseTo(126);
    expect([t.sx, t.sy]).toEqual([0.25, 0.72]);
  });

  it("counter-scales the content so it is never squashed", () => {
    const { sx, sy } = counterScale(0.25, 0.72);
    // the content's net scale is the same on both axes
    expect(0.25 * sx).toBeCloseTo(0.72 * sy, 10);
    // and it covers the frame
    expect(0.25 * sx).toBeGreaterThanOrEqual(0.25);
    expect(0.72 * sy).toBeGreaterThanOrEqual(0.72);
  });

  it("keeps the corner radius constant on screen", () => {
    const { rx, ry } = radiusFor(18, 0.25, 0.72);
    expect(rx * 0.25).toBeCloseTo(18);
    expect(ry * 0.72).toBeCloseTo(18);
  });
});

describe("motion tokens", () => {
  it("gives every pinned passage a positive length", () => {
    const lengths = [SCROLL.story, SCROLL.tilt, SCROLL.light, SCROLL.pullBack, SCROLL.track, SCROLL.finale, SCROLL.destination.approach, SCROLL.destination.hold];
    lengths.forEach((l) => expect(l).toBeGreaterThan(0));
  });

  it("keeps reduced-motion cuts short", () => {
    expect(DURATION.cut).toBeLessThanOrEqual(0.2);
    expect(DURATION.fade).toBeLessThanOrEqual(0.2);
  });
});
