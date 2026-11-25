import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";

import { gsap } from "../../scroll/gsap";
import { span } from "../../scroll/math";
import { createSignal } from "../../scroll/signal";
import { useScene } from "../../scroll/useScene";
import { Story } from "../../scenes/Story";
import { LiquidReveal } from "./LiquidReveal";
import { Credits, FIRST, LAST, Letters } from "./HeroParts";
import { SHOT_TALL, SHOT_WIDE, cameraAt, easeInOut, type Camera } from "./camera";
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
/** Desktop only: the story plays on in the same pinned stage, for this many
    more screens, with the framed photo moved aside. */
const STORY_TRACK = 2.8;
/** Story beats, over story progress: the frame moves aside, then leaves. */
const ASIDE_TO = 0.1;
const LEAVE_FROM = 0.9;
/** The frame beside the story: scale, the sides cropped to a portrait (in
    fractions of the frame's width) and its left edge (fraction of vw). */
const ASIDE_SCALE = 0.52;
const ASIDE_CROP_L = 0.32;
const ASIDE_CROP_R = 0.24;
/** The foot of the photo is mostly black shirt; the portrait drops it. */
const ASIDE_CROP_B = 0.12;
const ASIDE_LEFT = 0.05;

/** How far the camera flies into the I. Scale grows exponentially with
    progress, which reads as a constant speed of approach. */
const ZOOM_MAX = 90;
const ZOOM_FROM = 0.023;
const ZOOM_TO = 0.275;

/** When the camera pulls back, over scene progress; after it, the photo
    holds and the colour can be revealed. */
const PULL_FROM = 0.32;
const PULL_TO = 0.565;
const HOLD_FROM = 0.58;
/** The exit: the photo pulls back into a framed picture in the middle of
    the dark page, and is left behind as the page scrolls on. */
const EXIT_FROM = 0.8;
const EXIT_TO = 0.95;
const FRAME_DESKTOP = 0.46;
const FRAME_PHONE = 0.66;
/** Corner radius of the finished frame, in screen pixels. */
const FRAME_RADIUS = 18;

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useLayoutEffect(() => {
    const mql = window.matchMedia(REDUCED_QUERY);
    setReduced(mql.matches);
    const on = () => setReduced(mql.matches);
    mql.addEventListener("change", on);
    return () => mql.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** Where the fly-through aims: the middle of the I's stem, measured on the
    front layer's invisible surname (same layout, never scaled). offsetLeft
    and offsetTop ignore transforms, so the rise animation does not skew it. */
function measureZoomOrigin(stage: HTMLElement): string {
  const target = stage.querySelector<HTMLElement>("[data-measure] [data-zoom-target]");
  if (!target) return "50% 75%";
  let x = target.offsetWidth / 2;
  let y = target.offsetHeight * 0.55;
  let el: HTMLElement | null = target;
  while (el && el !== stage) {
    x += el.offsetLeft;
    y += el.offsetTop;
    el = el.offsetParent as HTMLElement | null;
  }
  return `${Math.round(x)}px ${Math.round(y)}px`;
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
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const shot = isMobile ? SHOT_TALL : SHOT_WIDE;

  // Written by the scroll timeline every frame, read by the WebGL reveal.
  const camera = useMemo(() => createSignal<Camera>({ x: 0, y: 0, scale: 1 }), []);
  const revealActive = useMemo(() => createSignal(false), []);
  const storyProgress = useMemo(() => createSignal(0), []);
  // On a phone, or with reduced motion, the story is a list after the scene.
  const storyInStage = !isMobile && !reduce;
  const trackDesktop = TRACK_DESKTOP + (storyInStage ? STORY_TRACK : 0);

  useScene(
    sectionRef,
    () => {
      const stage = stageRef.current!;
      const q = <T extends Element>(sel: string) => stage.querySelector<T>(sel)!;
      const photo = q<HTMLImageElement>(".city-photo");
      const frame = q<HTMLDivElement>(".city-frame");
      const sheet = q<HTMLDivElement>(".city-sheet");
      const front = q<HTMLDivElement>(".city-front");
      const frameTarget = isMobile ? FRAME_PHONE : FRAME_DESKTOP;

      let vw = stage.clientWidth;
      let vh = stage.clientHeight;
      let progress = 0;

      // The non-linear parts: the fly-through, the camera and the exit.
      const render = (p: number) => {
        progress = p;
        const zoom = reduce ? 1 : Math.pow(ZOOM_MAX, span(p, ZOOM_FROM, ZOOM_TO));
        gsap.set(sheet, { scale: zoom });

        // Reduced motion: no camera move. The skyline stays behind the name
        // until the sheet has gone, then the portrait is simply there.
        const pull = reduce ? (p < 0.23 ? 0 : 1) : span(p, PULL_FROM, PULL_TO);
        const c = cameraAt(pull, shot, vw, vh);
        camera.set(c);
        // Inside the letters the shadows of the buildings would eat the
        // letterforms; the photo is lifted there and settles as the name goes.
        const lift = 1 - span(p, 0.23, 0.29);
        gsap.set(photo, {
          x: c.x,
          y: c.y,
          scale: c.scale,
          filter: lift > 0 ? `brightness(${1 + 0.2 * lift}) contrast(${1 - 0.14 * lift})` : "none",
        });

        const k = reduce ? (p >= EXIT_FROM ? 1 : 0) : easeInOut(span(p, EXIT_FROM, EXIT_TO));
        const sc = 1 - (1 - frameTarget) * k;
        // radius compensated for the scale, so it lands at a fixed size on screen
        const radius = sc >= 0.999 ? 0 : (FRAME_RADIUS * (1 - sc)) / (1 - frameTarget) / sc;
        gsap.set(frame, { scale: sc, borderRadius: radius, x: 0, clipPath: "none", opacity: 1 });

        // stays on into the story: switching it off would clear the ink at once
        revealActive.set(!reduce && p >= HOLD_FROM);
        front.style.pointerEvents = p > 0.04 ? "none" : "auto";
      };

      const measure = () => {
        vw = stage.clientWidth;
        vh = stage.clientHeight;
        sheet.style.transformOrigin = measureZoomOrigin(stage);
        render(progress);
      };
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(stage);
      document.fonts?.ready.then(measure);

      // The story: the framed photo moves aside to the left, cropped to a
      // portrait, and stays while the chapters pass; then it leaves.
      const renderStory = (ps: number) => {
        storyProgress.set(ps);
        if (ps <= 0) return;
        const a = easeInOut(span(ps, 0, ASIDE_TO));
        const leave = span(ps, LEAVE_FROM, 1);
        const sc = FRAME_DESKTOP + (ASIDE_SCALE - FRAME_DESKTOP) * a;
        const cropL = ASIDE_CROP_L * a;
        const cropR = ASIDE_CROP_R * a;
        // left edge of what shows, before moving: the frame is scaled about its centre
        const shownLeft = vw / 2 - (sc * vw) / 2 + sc * cropL * vw;
        const x = (ASIDE_LEFT * vw - shownLeft) * a;
        const r = FRAME_RADIUS / sc;
        gsap.set(frame, {
          scale: sc * (1 - 0.06 * leave),
          x,
          borderRadius: r,
          clipPath: `inset(0% ${cropR * 100}% ${ASIDE_CROP_B * a * 100}% ${cropL * 100}% round ${r}px)`,
          opacity: 1 - leave,
        });
      };

      const heroLength = () => (isMobile ? TRACK_PHONE : TRACK_DESKTOP) * stage.clientHeight;
      if (storyInStage) {
        gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: () => `top+=${heroLength()} top`,
            end: "bottom bottom",
            scrub: true,
            onUpdate: (self) => renderStory(self.progress),
            onRefresh: (self) => renderStory(self.progress),
          },
        });
      }

      // The linear bands, placed on a timeline whose length is the scene (1).
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: () => `+=${heroLength()}`,
          scrub: true,
          onUpdate: (self) => {
            render(self.progress);
            if (storyInStage && storyProgress.get() > 0) renderStory(storyProgress.get());
          },
          onRefresh: (self) => render(self.progress),
        },
      });
      tl.to({}, { duration: 1 }, 0);
      const band = (el: Element, from: number, to: number, a: gsap.TweenVars, b: gsap.TweenVars) =>
        tl.fromTo(el, a, { ...b, duration: to - from, immediateRender: false }, from);

      // Reduced motion: the sheet does not dissolve, it is simply gone.
      if (reduce) tl.set(sheet, { opacity: 0 }, 0.23).set(sheet, { opacity: 1 }, 0);
      else band(sheet, 0.23, 0.29, { opacity: 1 }, { opacity: 0 });
      if (reduce) tl.set(front, { opacity: 0 }, 0.23).set(front, { opacity: 1 }, 0);
      else band(front, 0.004, 0.054, { opacity: 1 }, { opacity: 0 });
      if (!reduce) band(front, 0, 0.06, { y: "0vh" }, { y: "-5vh" });
      return () => ro.disconnect();
    },
    [isMobile, reduce],
  );

  return (
    <>
    <section
      ref={sectionRef}
      className="city"
      aria-label="Felipe Rodrigues"
      style={{
        ["--track-desktop" as string]: `${trackDesktop * 100}svh`,
        ["--track-phone" as string]: `${TRACK_PHONE * 100}svh`,
      }}
    >
      <div ref={stageRef} className="city-stage">
        {/* The picture: photo, colour reveal, scaled as one into
            a frame on the way out. */}
        <div className="city-frame" data-scene-frame="">
          {/* The whole scene is shot on this one photo; the camera moves over
              it. LCP element: index.html preloads both device versions. */}
          <img
            key={shot.src}
            className="city-photo"
            src={shot.src}
            alt=""
            aria-hidden="true"
            width={shot.width}
            height={shot.height}
            style={{ width: shot.width, height: shot.height }}
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
            face={shot.face}
          />
        </div>

        {/* The dark sheet with the surname cut as windows. */}
        <div className="city-sheet" aria-hidden="true">
          <NameLayout show="last" />
        </div>

        {/* FELIPE, the credits, and the real heading for assistive tech. */}
        <div className="city-front">
          <h1 className="sr-only">Felipe Rodrigues</h1>
          <NameLayout show="first" measure />
        </div>

        {storyInStage && <Story mode="rail" progress={storyProgress} />}
      </div>

      <div className="city-track" aria-hidden="true">
        {/* Where the nav's "Sobre" lands: the story, once the photo has moved aside. */}
        {storyInStage && (
          <span
            id="about"
            className="city-anchor"
            style={{ top: `calc(${TRACK_DESKTOP * 100 + STORY_TRACK * 100 * 0.12}svh - 100svh)` }}
          />
        )}
      </div>
    </section>
    {!storyInStage && <Story mode="list" />}
    </>
  );
}
