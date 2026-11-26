/**
 * The director: where the journey's frame is, and what it shows, as a pure
 * function of the page's scroll position.
 *
 * Scenes describe *beats*: a stretch of page scroll during which the frame
 * sits in a slot (a box in the layout, see `data-frame-slot`) and shows one
 * piece of content. A beat starts with its arrival, the first `arrive`
 * fraction of it, in which the frame comes from where the previous beat left
 * it and the content changes with the beat's gesture; the rest of the beat
 * holds still. Nothing here keeps state, so scrolling back, jumping from the
 * nav or resizing all land on the same frame for the same position.
 */
import { clamp01 } from "../scroll/math";
import { easeInOut } from "../components/hero/camera";

/** A box in viewport pixels. */
export type Box = { x: number; y: number; w: number; h: number };

/** How the content changes when a beat arrives. */
export type Gesture =
  /** From depth into focus: the new picture comes forward out of a blur while
      the old one sinks back and darkens. */
  | "rack"
  /** A straight cut, halfway through the arrival. */
  | "cut";

export type Beat = {
  /** Content id (see journey/contents.ts). */
  content: string;
  /** Page scroll (px) where the beat starts and ends. */
  start: number;
  end: number;
  /** Fraction of the beat spent arriving (0 = no arrival, a hard switch). */
  arrive: number;
  gesture: Gesture;
  /** Where the frame sits, read live so a slot that scrolls is followed. */
  slot: () => Box;
  /** false: the frame does not travel from the previous beat's slot, it is
      already where this beat holds it (a locked-off camera). */
  travel?: boolean;
};

export type FrameState =
  | { visible: false }
  | {
      visible: true;
      box: Box;
      content: string;
      /** The content being left behind during an arrival, else null. */
      prev: string | null;
      /** Arrival progress of `content` over `prev`, 0..1 (1 = settled). */
      mix: number;
      /** Progress through the whole beat, 0..1: drives a shot's own camera
          move inside the frame (see contents.ts `drift`). */
      t: number;
      gesture: Gesture;
      /** The frame's own scale for the very first arrival, out of the
          distance (1 otherwise). */
      approach: number;
    };

export function lerpBox(a: Box, b: Box, t: number): Box {
  const k = clamp01(t);
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, w: a.w + (b.w - a.w) * k, h: a.h + (b.h - a.h) * k };
}

/** How far the first destination starts, as a fraction of its final size. */
export const FIRST_APPROACH_FROM = 0.72;

/** Two beats measured from different elements (a scene's track, the next
    scene's stage, svh against rounded heights) can miss each other by a
    pixel or two; within this they count as touching. */
export const TOUCH_PX = 4;

export function frameAt(scroll: number, beats: readonly Beat[]): FrameState {
  if (beats.length === 0 || scroll < beats[0].start) return { visible: false };
  // the beat in effect: the last one that has started
  let i = 0;
  for (let k = 0; k < beats.length; k++) if (scroll >= beats[k].start) i = k;
  const beat = beats[i];
  // past its end with no beat following on: the frame is off between scenes
  if (scroll >= beat.end) return { visible: false };

  const t = clamp01((scroll - beat.start) / Math.max(1, beat.end - beat.start));
  const mix = beat.arrive > 0 ? clamp01(t / beat.arrive) : 1;
  // a beat only comes *from* the previous one when they touch; after a gap
  // the frame arrives fresh, out of the distance
  const before = i > 0 ? beats[i - 1] : null;
  const prev = before && Math.abs(before.end - beat.start) <= TOUCH_PX ? before : null;
  const here = beat.slot();
  const e = easeInOut(mix);
  const box = prev && mix < 1 && beat.travel !== false ? lerpBox(prev.slot(), here, e) : here;
  return {
    visible: true,
    box,
    content: beat.content,
    prev: prev && mix < 1 && prev.content !== beat.content ? prev.content : null,
    mix,
    t,
    gesture: beat.gesture,
    approach: prev ? 1 : FIRST_APPROACH_FROM + (1 - FIRST_APPROACH_FROM) * e,
  };
}

/** Opacity and scale of the incoming and outgoing pictures at arrival `mix`. */
export function layerMix(gesture: Gesture, mix: number) {
  if (gesture === "cut") {
    const on = mix >= 0.5 ? 1 : 0;
    return { inOpacity: on, inScale: 1, inSharp: 1, outOpacity: 1 - on, outScale: 1, outDim: 0 };
  }
  const e = easeInOut(mix);
  return {
    // the new picture is there from the start, blurred and a little too
    // close; it settles as it sharpens
    inOpacity: Math.min(1, mix * 3),
    inScale: 1.12 - 0.12 * e,
    inSharp: e,
    // the old one recedes and goes dark
    outOpacity: 1 - e,
    outScale: 1 - 0.1 * e,
    outDim: 0.6 * e,
  };
}
