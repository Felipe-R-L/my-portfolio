import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";

import { SeaWash, seaPhase, waterSource } from "../../src/app/components/hero/SeaWash";
import { SHOT_WIDE } from "../../src/app/components/hero/camera";
import { createSignal } from "../../src/app/scroll/signal";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
// jsdom has no WebGL: the sea simply stays out of sight
HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;

describe("the sea in the hero", () => {
  it("is drawn only while it is crossing, never at rest on either side", () => {
    expect(seaPhase(0).on).toBe(false);
    expect(seaPhase(1).on).toBe(false);
    expect(seaPhase(0.3).on).toBe(true);
  });

  it("rises over Diamante, then goes back off the portrait", () => {
    expect(seaPhase(0.2)).toMatchObject({ after: false, fall: 0 });
    expect(seaPhase(0.46).rise).toBeCloseTo(1);
    expect(seaPhase(0.7)).toMatchObject({ after: true, rise: 1 });
    expect(seaPhase(1).fall).toBeCloseTo(1);
    expect(seaPhase(0.1).rise).toBeLessThan(seaPhase(0.3).rise);
  });

  it("starts hidden from assistive tech and from sight", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() =>
      root.render(
        <SeaWash wash={createSignal(0)} camera={createSignal({ scale: 1, x: 0, y: 0 })} portraitSrc="/p.jpg" portraitSize={{ width: SHOT_WIDE.width, height: SHOT_WIDE.height }} phone={false} />,
      ),
    );
    const canvas = container.querySelector("canvas.city-sea") as HTMLCanvasElement;
    expect(canvas.getAttribute("aria-hidden")).toBe("true");
    expect(canvas.style.visibility).toBe("hidden");
    act(() => root.unmount());
    container.remove();
  });

  it("plays the light AV1 sea where it can, the H.264 one elsewhere", () => {
    const av1 = (t: string) => (t.includes("av01") ? "probably" : "");
    expect(waterSource(false, av1)).toBe("/assets/sb/sea-1440.av1.mp4");
    expect(waterSource(true, av1)).toBe("/assets/sb/sea-1080.av1.mp4");
    expect(waterSource(false, () => "")).toBe("/assets/sb/sea-1080.h264.mp4");
  });
});
