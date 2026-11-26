/**
 * Every duration, easing and scroll length of the journey, in one place.
 *
 * Scroll lengths are in screens (1 = the viewport height) of page scroll that
 * a pinned passage consumes. Durations are in seconds (GSAP's unit) unless the
 * name says ms. Easings come in pairs: the GSAP name for timelines and the
 * CSS curve for transitions, so the two never drift apart.
 */

export const EASE = {
  /** Camera moves driven by scroll: no ease, the scroll is the ease. */
  scrub: "none",
  /** A move that arrives and settles (arrivals, the FLIP into a case). */
  arrive: { gsap: "power3.out", css: "cubic-bezier(0.22, 1, 0.36, 1)" },
  /** A move that leaves and lets go (departures, closing a case). */
  leave: { gsap: "power2.in", css: "cubic-bezier(0.55, 0, 1, 0.45)" },
  /** Both ends soft: light changes, the frame travelling between places. */
  travel: { gsap: "power2.inOut", css: "cubic-bezier(0.65, 0, 0.35, 1)" },
} as const;

export const DURATION = {
  /** The frame growing into a case (T2) and shrinking back. */
  flip: 0.7,
  /** Phone: the light change into the telemetry, fired on entry (T3). */
  lightChange: 0.6,
  /** Reduced motion: a chapter change is a cut to black this long… */
  cut: 0.15,
  /** …or, inside a layer, a fade this long. */
  fade: 0.12,
  /** The nav jumping to a chapter (Lenis scrollTo). */
  navJump: 1.2,
} as const;

/** Pinned scroll lengths, in screens. */
export const SCROLL = {
  /** The hero: dive through the name, pull back to the portrait, frame it. */
  hero: { desktop: 2.8, phone: 3.15, reduced: 1.2 },
  /** Desktop: the story plays on in the hero's pinned stage. */
  story: 6.4,
  /** The Diamante opening of the story: two shots and a cut. */
  origin: 1.6,
  /** T1, Partida → Destinos: the tilt up into the night. */
  tilt: 1.0,
  /** Each destination: its approach, then a still stretch to read it. */
  destination: { approach: 1.2, hold: 0.5 },
  /** T3, Destinos → Telemetria: the light change, camera locked off. */
  light: 0.8,
  /** T4: the frame pulls back into the marker, then tracks the 3 steps. */
  pullBack: 0.6,
  track: 1.5,
  /** T5, Plano de voo → Retorno: the final pull-back over the city. */
  finale: 1.2,
} as const;

/** Scroll pixels per pixel of sideways travel, so every rail resists alike. */
export const SCROLL_PER_PX = 1.5;

/** The frame's corner radius once it is a frame, in screen pixels. */
export const FRAME_RADIUS = 18;
