import { describe, expect, it, beforeEach, vi } from "vitest";

describe("sound", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
    delete (window as unknown as { AudioContext?: unknown }).AudioContext;
  });

  it("is off by default and creates no audio", async () => {
    const ctor = vi.fn();
    (window as unknown as { AudioContext: unknown }).AudioContext = ctor;
    const { sound } = await import("../../src/app/audio/sound");
    expect(sound.on).toBe(false);
    sound.play("wave");
    expect(ctor).not.toHaveBeenCalled();
  });

  it("remembers the visitor's choice", async () => {
    const { sound } = await import("../../src/app/audio/sound");
    const seen: boolean[] = [];
    sound.subscribe((v) => seen.push(v));
    sound.set(true);
    expect(localStorage.getItem("frl-sound")).toBe("on");
    sound.set(false);
    expect(localStorage.getItem("frl-sound")).toBe("off");
    expect(seen).toEqual([true, false]);
  });

  it("a loop's level asked before sound is on starts nothing", async () => {
    const ctor = vi.fn();
    (window as unknown as { AudioContext: unknown }).AudioContext = ctor;
    const { sound } = await import("../../src/app/audio/sound");
    sound.level("wind", 1);
    sound.level("wind", 0.5);
    expect(ctor).not.toHaveBeenCalled();
  });
});
