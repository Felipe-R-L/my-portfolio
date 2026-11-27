// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import { PACE_EVENT, currentPace, mergePassages, playDuration, playTarget, segmentEase, setPace, settleDuration, settleTarget, underCurve } from "../../src/app/scroll/glide";

const list = mergePassages([
  { from: 100, to: 200 },
  { from: 300, to: 400 },
  { from: 400, to: 500 },
]);

describe("passages", () => {
  it("keeps touching passages apart and merges overlapping ones", () => {
    expect(list).toHaveLength(3);
    expect(mergePassages([{ from: 0, to: 100 }, { from: 50, to: 150 }])).toEqual([{ from: 0, to: 150 }]);
  });

  it("keeps the gentle curve of a passage it merges", () => {
    expect(mergePassages([{ from: 0, to: 100, duration: 4.6, soft: true }, { from: 50, to: 150 }])).toEqual([{ from: 0, to: 150, duration: 4.6, soft: true }]);
  });

  it("lets the wheel through outside a change", () => {
    expect(playTarget(list, 0, 50)).toBeNull();
    expect(playTarget(list, 250, 30)).toBeNull();
    expect(playTarget(list, 250, -30)).toBeNull();
  });

  it("plays a change through as a gesture enters it, either way", () => {
    expect(playTarget(list, 90, 20)?.to).toBe(200);
    expect(playTarget(list, 210, -20)?.to).toBe(100);
    expect(playTarget(list, 150, -1)?.to).toBe(100);
  });

  it("finishes a change the scrollbar left half done, the way it was going", () => {
    expect(settleTarget(list, 120, 1)).toBe(200);
    expect(settleTarget(list, 180, -1)).toBe(100);
    expect(settleTarget(list, 130, 0)).toBe(100);
    expect(settleTarget(list, 200, 1)).toBeNull();
  });

  it("plays at a pace that can be followed, never long enough to hold anyone", () => {
    expect(playDuration(10, 900)).toBe(0.75);
    expect(playDuration(5000, 900)).toBe(1.5);
    expect(settleDuration(10, 900)).toBe(0.45);
    expect(settleDuration(5000, 900)).toBe(0.9);
  });
});

describe("a passage's own time", () => {
  it("plays a camera move for its own duration, less when entered partway", async () => {
    const { durationFor } = await import("../../src/app/scroll/glide");
    const dive = { from: 0, to: 1000, duration: 1.9 };
    expect(durationFor(dive, 1000, 900)).toBe(1.9);
    expect(durationFor(dive, 500, 900)).toBeCloseTo(0.95);
    expect(durationFor({ from: 0, to: 630 }, 630, 900)).toBeCloseTo(1.01, 2);
  });
});

describe("holds", () => {
  it("are crossed from either edge, in the gesture's direction", async () => {
    const { holdAhead } = await import("../../src/app/scroll/glide");
    const hs = [{ from: 200, to: 300, hold: true }];
    expect(holdAhead(hs, 200, 1)).toBe(300);
    expect(holdAhead(hs, 250, 1)).toBe(300);
    expect(holdAhead(hs, 300, -1)).toBe(200);
    expect(holdAhead(hs, 300, 1)).toBeNull();
    expect(holdAhead(hs, 200, -1)).toBeNull();
  });
});

describe("sensitivity", () => {
  it("scales a change's speed-up, never its pace at 1x", async () => {
    const { speedFor } = await import("../../src/app/scroll/glide");
    expect(speedFor({ from: 0, to: 1 }, 2.5)).toBe(2.5);
    expect(speedFor({ from: 0, to: 1, sensitivity: 0.5 }, 2.5)).toBe(1.75);
    // a change with its own clock inside (the hero's sea) or under a cover
    // always plays at its own time
    expect(speedFor({ from: 0, to: 1, whole: true }, 2.5)).toBe(1);
    expect(speedFor({ from: 0, to: 1, under: true }, 2.5)).toBe(1);
    expect(speedFor({ from: 0, to: 1, sensitivity: 1.6 }, 2.5)).toBeCloseTo(3.4);
    expect(speedFor({ from: 0, to: 1, sensitivity: 1.6 }, 1)).toBe(1);
  });
});

describe("segmentEase", () => {
  const ease = (t: number) => t * t;
  it("hurrying keeps the same curve from where it is", () => {
    const seg = segmentEase(ease, 0.5, 1);
    expect(seg(0)).toBeCloseTo(0);
    expect(seg(1)).toBeCloseTo(1);
    // halfway through the rest of the time: u = 0.75
    expect(seg(0.5)).toBeCloseTo((0.5625 - 0.25) / 0.75);
  });
  it("turning back plays the curve backwards", () => {
    const seg = segmentEase(ease, 0.5, 0);
    expect(seg(0)).toBeCloseTo(0);
    expect(seg(1)).toBeCloseTo(1);
    expect(seg(0.5)).toBeCloseTo((0.25 - 0.0625) / 0.25);
  });
  it("a still stretch (under a cover, before it covers) moves straight", () => {
    const seg = segmentEase(underCurve, 0.1, 0);
    expect(seg(0.5)).toBe(0.5);
  });
});

describe("pace", () => {
  it("tells the seas when it changes, once", () => {
    const seen: number[] = [];
    const on = (e: Event) => seen.push((e as CustomEvent<{ pace: number }>).detail.pace);
    window.addEventListener(PACE_EVENT, on);
    setPace(3);
    setPace(3);
    expect(currentPace()).toBe(3);
    setPace(1);
    window.removeEventListener(PACE_EVENT, on);
    expect(seen).toEqual([3, 1]);
  });
});
