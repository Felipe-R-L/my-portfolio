import { describe, expect, it } from "vitest";

import { SYNTHS, render } from "../../src/app/audio/synth";

describe("the page's own sounds", () => {
  it("are short, never clip, and come out the same every time", () => {
    for (const name of SYNTHS) {
      const a = render(name, 48000);
      // the woosh (a page flown through) is the one long breath
      expect(a.length / 48000).toBeLessThan(name === "woosh" ? 0.8 : 0.4);
      let peak = 0;
      for (const v of a) peak = Math.max(peak, Math.abs(v));
      expect(peak).toBeCloseTo(0.9, 5);
      expect(render(name, 48000)).toEqual(a);
    }
  });

  it("fade out to silence, no click at the end", () => {
    for (const name of SYNTHS) {
      const a = render(name, 48000);
      const tail = a.slice(-48);
      expect(Math.max(...tail.map(Math.abs))).toBeLessThan(0.05);
    }
  });
});
