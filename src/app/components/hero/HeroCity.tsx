import { useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useIsMobile } from "../../hooks/useIsMobile";

import { About } from "../About";
import { LiquidReveal } from "./LiquidReveal";
import { Credits, FIRST, LAST, Letters } from "./HeroParts";
import "./HeroCity.css";

/**
 * The city inside the name, then the person, then who he is.
 *
 * One pinned scene, played by scrolling:
 *
 * 1. FELIPE in solid white; RODRIGUES is a row of windows onto the Campinas
 *    skyline, seen from the top of the Patriani building. Only buildings: the
 *    person is kept for later. The windows are a dark sheet with white letters
 *    blended with `multiply` over the photo, so the page stays dark around the
 *    letters and nothing competes with the name.
 * 2. The camera flies through the stem of the I. Scaling the sheet grows that
 *    window while the photo underneath stays put, until the skyline fills the
 *    screen.
 * 3. The camera pulls back. The skyline was never a separate picture: it is
 *    the empty left corner of the rooftop portrait, magnified. Pulling back
 *    on the same photo brings the person into frame with no cut.
 * 4. The photo holds and comes alive (see LiquidReveal): the pointer pours
 *    its colour back in like oil on water, and the person shifts in depth
 *    in front of the city. Who I am settles at the foot of the frame like a
 *    caption.
 * 5. The exit: the picture pulls back into a framed photo in the middle of
 *    the dark page, then is left behind as the page scrolls on.
 *
 * Reduced motion: no zoom, no camera move and no bubbles; the sheet dissolves
 * over the final framing.
 */

/** Scroll length of the scene, as a multiple of the viewport height. */
const TRACK_DESKTOP = 3.4;
const TRACK_PHONE = 3.15;

/** How far the camera flies into the I. Scale grows exponentially with
    progress, which reads as a constant speed of approach. */
const ZOOM_MAX = 90;
const ZOOM_FROM = 0.023;
const ZOOM_TO = 0.275;

/**
 * The photo the whole scene is shot on, per device: the asset's size in
 * pixels, the corner of it that is only buildings (where the scene starts),
 * and where the camera ends up. Coordinates are in asset pixels.
 */
type Rect = { x: number; y: number; w: number; h: number };
type Shot = {
  src: string;
  /** The same frame in colour, any resolution, same aspect. */
  color: string;
  /** The person cut out: white is him. Same aspect. */
  matte: string;
  width: number;
  height: number;
  start: Rect;
  /** Final framing for a given viewport size. */
  end: (vw: number, vh: number) => Rect;
};

const SHOT_WIDE: Shot = {
  src: "/assets/profile/scene-wide-3400.webp",
  color: "/assets/profile/scene-wide-color.webp",
  matte: "/assets/profile/scene-wide-matte.webp",
  width: 3400,
  height: 2125,
  // Left third of the frame: horizon high, dense blocks, the railing low.
  start: { x: 0, y: 93, w: 1141, h: 900 },
  end: () => ({ x: 0, y: 0, w: 3400, h: 2125 }),
};

const SHOT_TALL: Shot = {
  src: "/assets/profile/scene-tall-1800.webp",
  color: "/assets/profile/scene-tall-color.webp",
  matte: "/assets/profile/scene-tall-matte.webp",
  width: 1800,
  height: 2185,
  // Lower-left corner: blocks and the railing, clear of the arm.
  start: { x: 0, y: 1075, w: 323, h: 1025 },
  // Centred on the person, head in the upper third, so the about caption
  // at the foot of the frame sits over the shirt, not the face.
  end: (vw, vh) => {
    const h = 1589;
    const w = (h * vw) / vh;
    return { x: 826 - w / 2, y: 576, w, h };
  },
};

/** Scale and centre that make `r` cover a vw x vh viewport. */
function cover(r: Rect, vw: number, vh: number) {
  const s = Math.max(vw / r.w, vh / r.h);
  return { s, cx: r.x + r.w / 2, cy: r.y + r.h / 2 };
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** When the camera pulls back, over scene progress; after it, the photo
    holds and the blueprint can be revealed. */
const PULL_FROM = 0.32;
const PULL_TO = 0.565;
const HOLD_FROM = 0.58;
/** The exit: the photo pulls back into a framed picture in the middle of
    the dark page, and is left behind as the page scrolls on. */
const EXIT_FROM = 0.8;
const EXIT_TO = 0.95;
const FRAME_DESKTOP = 0.46;
const FRAME_PHONE = 0.74;
/** Corner radius of the finished frame, in screen pixels. */
const FRAME_RADIUS = 18;

function useStageSize(stageRef: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ w: 1440, h: 900 });
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => setSize({ w: stage.clientWidth, h: stage.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [stageRef]);
  return size;
}

function useZoomOrigin(stageRef: React.RefObject<HTMLElement | null>) {
  const [origin, setOrigin] = useState("50% 75%");

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    // Measured on the front layer's (invisible) surname: same layout as the
    // windows layer, never scaled. offsetLeft/Top ignore transforms, so the
    // rise animation does not skew it.
    const target = stage.querySelector<HTMLElement>("[data-measure] [data-zoom-target]");
    if (!target) return;

    const measure = () => {
      let x = target.offsetWidth / 2;
      let y = target.offsetHeight * 0.55;
      let el: HTMLElement | null = target;
      while (el && el !== stage) {
        x += el.offsetLeft;
        y += el.offsetTop;
        el = el.offsetParent as HTMLElement | null;
      }
      setOrigin(`${Math.round(x)}px ${Math.round(y)}px`);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [stageRef]);

  return origin;
}

/**
 * Scene progress, 0 at the top of the page and 1 when the track has scrolled
 * through. Derived from window scroll and measured geometry on purpose: a
 * targeted useScroll lets motion hand opacity to a native ScrollTimeline,
 * which measures the track wrong inside a sticky scene and leaves layers
 * stuck half-visible. A derived value is never handed off.
 */
function useSceneProgress(
  sectionRef: React.RefObject<HTMLElement | null>,
  trackRef: React.RefObject<HTMLElement | null>,
) {
  const geom = useRef({ start: 0, length: 1 });
  useLayoutEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;
    const measure = () => {
      geom.current = {
        start: section.getBoundingClientRect().top + window.scrollY,
        length: Math.max(1, track.offsetHeight),
      };
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(section);
    return () => ro.disconnect();
  }, [sectionRef, trackRef]);

  const { scrollY } = useScroll();
  return useTransform(scrollY, (y) =>
    Math.min(1, Math.max(0, (y - geom.current.start) / geom.current.length)),
  );
}

/** The name laid out identically in every layer; `show` picks which word
    this layer draws. */
function NameLayout({ show, measure = false }: { show: "first" | "last"; measure?: boolean }) {
  return (
    <div className="hero-frame">
      <div className="hero-name" aria-hidden="true" {...(measure ? { "data-measure": "" } : {})}>
        <span className={`hero-line ${show === "first" ? "" : "city-ghost"}`}>
          <span className="hero-word">
            <Letters word={FIRST} offset={0} />
          </span>
        </span>
        <span className={`hero-line hero-line--last ${show === "last" ? "" : "city-ghost"}`}>
          <span className="hero-word">
            <Letters word={LAST} offset={FIRST.length} markI />
          </span>
        </span>
      </div>
      {/* Every layer reserves the credits' height so the name sits at the
          same place; only the front layer shows them. */}
      <Credits className={show === "first" ? "" : "city-ghost"} />
    </div>
  );
}

export function HeroCity() {
  const reduce = useReducedMotion() ?? false;
  const isMobile = useIsMobile();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const origin = useZoomOrigin(stageRef);
  const p = useSceneProgress(sectionRef, trackRef);

  const sheetScale = useTransform(p, (v) => {
    if (reduce) return 1;
    const k = Math.min(1, Math.max(0, (v - ZOOM_FROM) / (ZOOM_TO - ZOOM_FROM)));
    return Math.pow(ZOOM_MAX, k);
  });
  const sheetOpacity = useTransform(p, reduce ? [0.04, 0.23] : [0.23, 0.29], [1, 0]);
  const frontOpacity = useTransform(p, [0.004, 0.054], [1, 0]);
  const frontY = useTransform(p, [0, 0.06], ["0vh", reduce ? "0vh" : "-5vh"]);
  const frontEvents = useTransform(p, (v) => (v > 0.04 ? "none" : "auto"));

  // The camera: one photo, from the empty corner of buildings to the person.
  const shot = isMobile ? SHOT_TALL : SHOT_WIDE;
  const size = useStageSize(stageRef);
  const camera = useTransform(p, (v) => {
    const a = cover(shot.start, size.w, size.h);
    const b = cover(shot.end(size.w, size.h), size.w, size.h);
    const q = reduce ? 1 : easeInOut(Math.min(1, Math.max(0, (v - PULL_FROM) / (PULL_TO - PULL_FROM))));
    // Scale moves geometrically so the pull-back keeps a constant speed.
    const s = a.s * Math.pow(b.s / a.s, q);
    const cx = a.cx + (b.cx - a.cx) * q;
    const cy = a.cy + (b.cy - a.cy) * q;
    return { s, x: size.w / 2 - cx * s, y: size.h / 2 - cy * s };
  });
  const photoX = useTransform(camera, (c) => c.x);
  const photoY = useTransform(camera, (c) => c.y);
  const photoScale = useTransform(camera, (c) => c.s);
  // The foot of the photo darkens for the about caption, which settles in
  // once the photo holds.
  const shadeOpacity = useTransform(p, [0.566, 0.66, 0.8, 0.9], [0, 1, 1, 0.3]);
  const aboutOpacity = useTransform(p, [0.61, 0.69, 0.8, 0.84], [0, 1, 1, 0]);
  const aboutY = useTransform(p, [0.61, 0.69, 0.8, 0.84], reduce ? [0, 0, 0, 0] : [24, 0, 0, -24]);
  const aboutEvents = useTransform(p, (v) => (v > 0.63 && v < 0.82 ? "auto" : "none"));
  // The exit: the whole picture scales down into a frame, corners rounding
  // as it goes, the radius compensated for the scale so it lands at a fixed
  // size on screen.
  const frameScale = useTransform(p, (v) => {
    if (reduce) return 1;
    const k = Math.min(1, Math.max(0, (v - EXIT_FROM) / (EXIT_TO - EXIT_FROM)));
    const target = isMobile ? FRAME_PHONE : FRAME_DESKTOP;
    return 1 - (1 - target) * easeInOut(k);
  });
  const frameRadius = useTransform(frameScale, (sc) =>
    sc >= 0.999 ? "0px" : `${(FRAME_RADIUS * (1 - sc)) / (1 - (isMobile ? FRAME_PHONE : FRAME_DESKTOP)) / sc}px`,
  );
  const revealActive = useTransform(p, (v) => !reduce && v >= HOLD_FROM);

  return (
    <section
      ref={sectionRef}
      className="city"
      aria-label="Felipe Rodrigues"
      style={{
        ["--track-desktop" as string]: `${TRACK_DESKTOP * 100}svh`,
        ["--track-phone" as string]: `${TRACK_PHONE * 100}svh`,
      }}
    >
      <div ref={stageRef} className="city-stage">
        {/* The picture: photo, colour reveal and shade, scaled as one into
            a frame on the way out. */}
        <motion.div className="city-frame" style={{ scale: frameScale, borderRadius: frameRadius }}>
          {/* The whole scene is shot on this one photo; the camera moves over
              it. LCP element: index.html preloads both device versions. */}
          <motion.img
            key={shot.src}
            className="city-photo"
            src={shot.src}
            alt=""
            aria-hidden="true"
            width={shot.width}
            height={shot.height}
            style={{
              width: shot.width,
              height: shot.height,
              x: photoX,
              y: photoY,
              scale: photoScale,
            }}
            {...{ fetchpriority: "high" }}
            decoding="async"
          />

          <LiquidReveal
            bwSrc={shot.src}
            colorSrc={shot.color}
            matteSrc={shot.matte}
            width={shot.width}
            height={shot.height}
            camera={camera}
            active={revealActive}
            phone={isMobile}
          />

          <motion.div className="city-shade" style={{ opacity: shadeOpacity }} aria-hidden="true" />
        </motion.div>

        {/* The dark sheet with the surname cut as windows. */}
        <motion.div
          className="city-sheet"
          style={{ scale: sheetScale, opacity: sheetOpacity, transformOrigin: origin }}
          aria-hidden="true"
        >
          <NameLayout show="last" />
        </motion.div>

        {/* FELIPE, the credits, and the real heading for assistive tech. */}
        <motion.div
          className="city-front"
          style={{ opacity: frontOpacity, y: frontY, pointerEvents: frontEvents }}
        >
          <h1 className="sr-only">Felipe Rodrigues</h1>
          <NameLayout show="first" measure />
        </motion.div>

        {/* Who I am, as the caption of the photo. */}
        <motion.div
          className="city-about"
          data-no-reveal=""
          style={{ opacity: aboutOpacity, y: aboutY, pointerEvents: aboutEvents }}
        >
          <About overlay />
        </motion.div>

      </div>

      <div ref={trackRef} className="city-track" aria-hidden="true">
        {/* Where the nav's "Sobre" lands: the caption is in (progress 0.7). */}
        <span id="about" className="city-anchor" />
      </div>
    </section>
  );
}
