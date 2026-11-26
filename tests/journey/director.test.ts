import { describe, it, expect } from "vitest";
import { frameAt, layerMix, FIRST_APPROACH_FROM, type Beat, type Box } from "../../src/app/journey/director";

const slotA: Box = { x: 600, y: 160, w: 760, h: 475 };
const slotB: Box = { x: 40, y: 120, w: 700, h: 437.5 };
const beat = (content: string, start: number, end: number, slot: Box, arrive = 0.5): Beat => ({
  content,
  start,
  end,
  arrive,
  gesture: "rack",
  slot: () => slot,
});
const beats = [beat("ds", 1000, 2000, slotA), beat("sb", 2000, 3000, slotA), beat("off", 3000, 4000, slotB)];

describe("the director", () => {
  it("hides the frame before the first beat and after the last", () => {
    expect(frameAt(999, beats).visible).toBe(false);
    expect(frameAt(4000, beats).visible).toBe(false);
  });

  it("brings the first destination out of the distance", () => {
    const s = frameAt(1000, beats);
    expect(s.visible && s.approach).toBeCloseTo(FIRST_APPROACH_FROM);
    const settled = frameAt(1600, beats);
    expect(settled.visible && settled.approach).toBe(1);
  });

  it("holds still once arrived", () => {
    const a = frameAt(1600, beats);
    const b = frameAt(1999, beats);
    // the frame and its picture hold; only the shot's own camera (t) moves on
    const still = (s: typeof a) => (s.visible ? { ...s, t: 0 } : s);
    expect(still(a)).toEqual(still(b));
    expect(a.visible && a.prev).toBeNull();
  });

  it("changes content inside the same slot without moving the frame", () => {
    const s = frameAt(2250, beats);
    if (!s.visible) throw new Error("hidden");
    expect(s.box).toEqual(slotA);
    expect(s.prev).toBe("ds");
    expect(s.content).toBe("sb");
    expect(s.mix).toBeCloseTo(0.5);
  });

  it("travels between slots, and lands exactly", () => {
    const mid = frameAt(3250, beats);
    if (!mid.visible) throw new Error("hidden");
    expect(mid.box.x).toBeLessThan(slotA.x);
    expect(mid.box.x).toBeGreaterThan(slotB.x);
    const end = frameAt(3500, beats);
    expect(end.visible && end.box).toEqual(slotB);
  });

  it("is a function of the scroll alone: the same position gives the same frame both ways", () => {
    const path = [1000, 1400, 2100, 2600, 3100, 3900];
    const fwd = path.map((y) => frameAt(y, beats));
    const back = [...path].reverse().map((y) => frameAt(y, beats)).reverse();
    expect(fwd).toEqual(back);
  });

  it("is off between scenes, and arrives fresh after a gap", () => {
    const gapped = [beat("a", 0, 1000, slotB), beat("ds", 3000, 4000, slotA)]
    expect(frameAt(2000, gapped).visible).toBe(false)
    const s = frameAt(3000, gapped)
    if (!s.visible) throw new Error("hidden")
    // no flight from a slot that has long left the screen
    expect(s.prev).toBeNull()
    expect(s.box).toEqual(slotA)
    expect(s.approach).toBeCloseTo(FIRST_APPROACH_FROM)
  });

  it("racks focus smoothly and cuts cleanly", () => {
    const r0 = layerMix("rack", 0);
    const r1 = layerMix("rack", 1);
    expect(r0.inSharp).toBe(0);
    expect(r1.inSharp).toBe(1);
    expect(r1.inScale).toBeCloseTo(1);
    expect(r1.outOpacity).toBeCloseTo(0);
    expect(layerMix("cut", 0.49).inOpacity).toBe(0);
    expect(layerMix("cut", 0.5).inOpacity).toBe(1);
  });
});
