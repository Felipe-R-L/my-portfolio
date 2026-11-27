import { Fragment, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";

import { gsap } from "../../scroll/gsap";
import { span } from "../../scroll/math";
import { createSignal } from "../../scroll/signal";
import { useScene } from "../../scroll/useScene";
import { RAIL_ENTER_TO, RAIL_TRAVEL_FROM, RAIL_TRAVEL_TO, Story, railStops } from "../../scenes/Story";
import { STORY } from "../../data/story";
import { registerPassages } from "../../scroll/glide";
import { SeaWash, seaPhase } from "./SeaWash";
import { Credits, Letters, NAME } from "./HeroParts";
import { placeHtml } from "./shell";
import { SHOT_TALL, SHOT_WIDE, cameraAt, easeInOut, type Camera } from "./camera";
import { FRAME_RADIUS, SCROLL } from "../../motion/tokens";
import { useTranslation } from "react-i18next";
import { sound } from "../../audio/sound";
import "./HeroCity.css";

/**
 * Diamante, then the person, then who he is.
 *
 * One pinned scene, played by scrolling:
 *
 * 1. The name, solid, over Diamante (the town in Calabria the family came
 *    from): the drone pulls back from the old town, film grain over it and a
 *    travel stamp in the corner. Only scenery: no family story.
 * 2. The sea comes (see SeaWash): it rises from below over the town and the
 *    name, the camera dipping towards it and the name rising on its nearer
 *    plane until the water takes it; it fills the screen and goes back
 *    down, and the portrait, in colour, comes out of it and settles.
 * 3. The photo holds.
 * 4. The exit: the picture pulls back into a framed photo in the middle of
 *    the dark page, then is left behind as the page scrolls on.
 *
 * Reduced motion: no sea and no camera move; Diamante and the name give
 * way to the portrait at once.
 */

/** Scroll length of the scene, as a multiple of the viewport height. */
const TRACK_DESKTOP = SCROLL.hero.desktop;
const TRACK_PHONE = SCROLL.hero.phone;
const TRACK_REDUCED = SCROLL.hero.reduced;
/** Desktop only: the story plays on in the same pinned stage, for this many
    more screens, with the framed photo moved aside. */
const STORY_TRACK = SCROLL.story;
/** Desktop: the stretch after the hero, in screens. It runs the chapters
    beside the portrait, and ends with T1: the portrait back in the middle, the
    camera tilting up off the city into the night. */
const TILT_TRACK = SCROLL.tilt;
const AFTER_HERO = STORY_TRACK + TILT_TRACK;
/** Where each phase ends, as story progress. */
const CHAPTERS_END = STORY_TRACK / AFTER_HERO;
/** Story beat, over story progress: the frame moves aside, and stays there
    until the released stage carries it off the top. */
const ASIDE_TO = 0.05;
/** The frame beside the story: scale, the sides cropped to a portrait (in
    fractions of the frame's width) and its left edge (fraction of vw). */
const ASIDE_SCALE = 0.52;
const ASIDE_CROP_L = 0.32;
const ASIDE_CROP_R = 0.24;
/** The foot of the photo is mostly black shirt; the portrait drops it. */
const ASIDE_CROP_B = 0.2;
const ASIDE_LEFT = 0.05;

/** The sea, over scene progress: it comes in from OPEN_FROM, covers the
    screen halfway and is gone by OPEN_TO, leaving the portrait. */
const OPEN_FROM = 0.01;
const OPEN_TO = 0.42;
/** The exit: the photo pulls back into a framed picture in the middle of
    the dark page, and is left behind as the page scrolls on. */
const EXIT_FROM = 0.8;
const EXIT_TO = 0.95;
const FRAME_DESKTOP = 0.46;
const FRAME_PHONE = 0.66;

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

/** The name and the credits. The static shell (shell.ts) writes the same
    markup into index.html, so mounting moves nothing. */
export function NameLayout() {
  let offset = 0;
  return (
    <div className="hero-frame">
      <div className="hero-name" aria-hidden="true">
        {NAME.lines.map((words, i) => (
          <span key={i} className={`hero-line${i > 0 ? " hero-line--next" : ""}`}>
            {words.map((w, j) => {
              const start = offset;
              offset += w.text.length;
              return (
                <Fragment key={w.text}>
                  {j > 0 && " "}
                  <span className={`hero-word${w.em ? " hero-word--em" : ""}`}>
                    <Letters word={w.text} offset={start} />
                  </span>
                </Fragment>
              );
            })}
          </span>
        ))}
      </div>
      <Credits />
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
  // How far the sea has come and gone (0..1), read by SeaWash.
  const wash = useMemo(() => createSignal(0), []);
  const storyProgress = useMemo(() => createSignal(0), []);
  // On a phone, or with reduced motion, the story is a list after the scene.
  const storyInStage = !isMobile && !reduce;
  // Reduced motion: nothing plays, so the scene is barely longer than a screen.
  const trackDesktop = reduce ? TRACK_REDUCED : TRACK_DESKTOP + (storyInStage ? AFTER_HERO : 0);
  const { t } = useTranslation();

  useScene(
    sectionRef,
    () => {
      const stage = stageRef.current!;
      const q = <T extends Element>(sel: string) => stage.querySelector<T>(sel)!;
      const photo = q<HTMLImageElement>(".city-photo");
      const frame = q<HTMLDivElement>(".city-frame");
      const place = q<HTMLDivElement>(".city-place");
      const stamp = stage.querySelector<HTMLDivElement>(".hero-stamp");
      const front = q<HTMLDivElement>(".city-front");
      const ring = stage.querySelector<HTMLDivElement>(".city-ring");
      const frameTarget = isMobile ? FRAME_PHONE : FRAME_DESKTOP;

      let vw = stage.clientWidth;
      let vh = stage.clientHeight;
      let progress = 0;

      // The non-linear parts: the window, the camera and the exit.
      const render = (p: number) => {
        progress = p;
        // Reduced motion: no sea. Diamante and the name hold, then the
        // portrait is simply there.
        const w = reduce ? (p < 0.23 ? 0 : 1) : span(p, OPEN_FROM, OPEN_TO);
        // Sound (only with it on): the wind over Diamante, gone under the
        // sea; the wave as it starts to come in and as it goes back; a
        // shutter once the portrait has settled.
        const was = wash.get();
        if (!reduce) {
          if (was < 0.02 && w >= 0.02) sound.play("wave");
          if (was < 0.54 && w >= 0.54) sound.play("shore");
          if (was > 0.46 && w <= 0.46) sound.play("wave", { volume: 0.7 });
        }
        if (w >= 1 && was < 1 && was > 0.6) sound.play("frame");
        sound.level("wind", w < 0.5 ? 1 - seaPhase(w).rise : 0);
        wash.set(w);
        // the sea covers the screen at the middle of the wash: Diamante and
        // the name under it before, the portrait after
        const { rise, fall, after } = seaPhase(w);

        // The camera on the portrait: it comes out of the water a little
        // close and settles back to its own framing as the sea goes.
        const c0 = cameraAt(1, shot, vw, vh);
        const z = after ? 1 + 0.12 * (1 - fall) : 1.12;
        const scale = c0.scale * z;
        const fx = c0.x + shot.face.x * c0.scale;
        const fy = c0.y + shot.face.y * c0.scale;
        const c = { scale, x: fx - shot.face.x * scale, y: fy - shot.face.y * scale };
        camera.set(c);
        gsap.set(photo, { x: c.x, y: c.y, scale: c.scale });

        // Diamante: the camera dips towards the sea as it comes.
        place.style.setProperty("--drain", "0");
        place.style.setProperty("--open", String(rise));
        place.style.visibility = after ? "hidden" : "visible";
        front.style.visibility = after ? "hidden" : "visible";
        if (stamp) stamp.style.opacity = String(reduce ? (w > 0 ? 0 : 1) : 1 - span(p, 0.008, 0.07));
        frame.style.visibility = after ? "visible" : "hidden";

        // Phone and reduced motion: the portrait stays whole until the page
        // carries it off; shrunk to a frame it only sat alone in the dark,
        // since the story after it is a list with no place for it.
        const k = !storyInStage ? 0 : easeInOut(span(p, EXIT_FROM, EXIT_TO));
        const sc = 1 - (1 - frameTarget) * k;
        // radius compensated for the scale, so it lands at a fixed size on screen
        const radius = sc >= 0.999 ? 0 : (FRAME_RADIUS * (1 - sc)) / (1 - frameTarget) / sc;
        gsap.set(frame, { scale: sc, borderRadius: radius, x: 0, clipPath: "none", opacity: 1 });
        front.style.pointerEvents = p > 0.04 ? "none" : "auto";
      };

      const measure = () => {
        vw = stage.clientWidth;
        vh = stage.clientHeight;
        render(progress);
      };
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(stage);
      document.fonts?.ready.then(measure);

      const night = stage.querySelector<HTMLDivElement>(".city-night");

      // The framed photo moved aside to the left, cropped to a portrait, by
      // `a` (0 = the framed picture in the middle, 1 = the portrait aside).
      // the portrait going aside for the chapters, or back: a card slid
      let lastAside = -1;
      const placeAside = (a: number) => {
        if (lastAside >= 0 && (lastAside - 0.5) * (a - 0.5) < 0) sound.play("slide", { pan: -0.3 });
        lastAside = a;
        const sc = FRAME_DESKTOP + (ASIDE_SCALE - FRAME_DESKTOP) * a;
        const cropL = ASIDE_CROP_L * a;
        const cropR = ASIDE_CROP_R * a;
        // left edge of what shows, before moving: the frame is scaled about its centre
        const shownLeft = vw / 2 - (sc * vw) / 2 + sc * cropL * vw;
        const x = (ASIDE_LEFT * vw - shownLeft) * a;
        const r = FRAME_RADIUS / sc;
        gsap.set(frame, {
          scale: sc,
          x,
          borderRadius: r,
          clipPath: `inset(0% ${cropR * 100}% ${ASIDE_CROP_B * a * 100}% ${cropL * 100}% round ${r}px)`,
          opacity: 1,
        });
        // A hairline traced around the portrait: his black shirt meets the
        // page's black at the bottom, and without it the frame has no edge.
        if (ring) {
          const left = vw / 2 + (cropL * vw - vw / 2) * sc + x;
          const right = vw / 2 + ((1 - cropR) * vw - vw / 2) * sc + x;
          const top = vh / 2 - (vh / 2) * sc;
          const bottom = vh / 2 + (vh * (1 - ASIDE_CROP_B * a) - vh / 2) * sc;
          gsap.set(ring, { left, top, width: right - left, height: bottom - top, opacity: a });
        }
      };

      const renderStory = (ps: number) => {
        const rail = stage.querySelector<HTMLDivElement>(".story-rail");
        const head = stage.querySelector<HTMLElement>(".story-head");
        const cEnd = cameraAt(1, shot, vw, vh);

        // The chapters, beside the portrait.
        if (ps < CHAPTERS_END) {
          const p2 = span(ps, 0, CHAPTERS_END);
          storyProgress.set(p2);
          placeAside(easeInOut(span(p2, 0, ASIDE_TO)));
          gsap.set(photo, { y: cEnd.y });
          if (night) night.style.opacity = "0";
          if (rail) rail.style.removeProperty("--out");
          head?.style.removeProperty("--out");
          return;
        }

        // T1: the portrait comes back to the middle and the stage, released,
        // carries it off the top while the first destination comes in below.
        // (A tilt up into the night used to follow; on screen it read as an
        // empty dark box and a screen of nothing before Destinos.)
        const k = span(ps, CHAPTERS_END, 1);
        storyProgress.set(1);
        placeAside(1 - easeInOut(span(k, 0, 0.6)));
        gsap.set(photo, { y: cEnd.y });
        if (night) night.style.opacity = "0";
        // the chapters slide off to the left as the portrait leaves its place
        if (rail) rail.style.setProperty("--out", String(easeInOut(span(k, 0, 0.4))));
        head?.style.setProperty("--out", String(easeInOut(span(k, 0, 0.25))));
        gsap.set(frame, { opacity: 1 });
      };

      const heroLength = () =>
        (reduce ? TRACK_REDUCED : isMobile ? TRACK_PHONE : TRACK_DESKTOP) * stage.clientHeight;
      // Desktop: changes never left half done (scroll/glide.ts). The dive
      // through the name and the pull-back to the portrait; the photo framing
      // itself and moving aside as the chapters come in; the rail between two
      // chapters; and T1, the portrait back in the middle as the stage lets go.
      const offPassages = storyInStage
        ? registerPassages("partida", () => {
            const section = sectionRef.current;
            if (!section) return [];
            const top = section.getBoundingClientRect().top + window.scrollY;
            const L = heroLength();
            const end = top + section.offsetHeight - stage.clientHeight;
            const storyFrom = top + L;
            const chapters = (end - storyFrom) * CHAPTERS_END;
            const at = (p2: number) => storyFrom + chapters * p2;
            // the rail rests where each card has come up against the portrait
            // (measured by the rail; evenly spaced until it has been)
            const legs = STORY.length - 1;
            const measured = railStops.current.length === STORY.length;
            // (the first card already rests beside the portrait, its
            // background lit, where the rail comes in: its stop is the start)
            const measuredStops = measured ? railStops.current.slice(1) : STORY.slice(1).map((_, j) => (j + 1) / legs);
            const stops = [...new Set([0, ...measuredStops, 1].map((u) => Math.round(u * 1e4) / 1e4))].sort((a, b) => a - b);
            const travelAt = (u: number) => at(RAIL_TRAVEL_FROM + (RAIL_TRAVEL_TO - RAIL_TRAVEL_FROM) * u);
            const rail = stops.slice(1).map((u, j) => ({ from: travelAt(stops[j]), to: travelAt(u) }));
            return [
              // seconds at 1x: the camera moves are given more time than their
              // scroll length would, the eye has a lot to follow in them
              { from: top, to: top + OPEN_TO * L, duration: 4.6, soft: true },
              // the portrait holding for the colour (poured by the pointer)
              { from: top + OPEN_TO * L, to: top + EXIT_FROM * L, hold: true },
              { from: top + EXIT_FROM * L, to: at(Math.max(ASIDE_TO, RAIL_ENTER_TO)), duration: 1.6 },
              { from: at(Math.max(ASIDE_TO, RAIL_ENTER_TO)), to: at(RAIL_TRAVEL_FROM), hold: true },
              // the cards keep up with a fast scroll more than the camera does
              ...rail.map((r) => ({ ...r, duration: 1.1, sensitivity: 1.6 })),
              { from: at(RAIL_TRAVEL_TO), to: storyFrom + chapters, hold: true },
              // T1 runs on into the first project's arrival (which starts at
              // `end`): the two merge into one change, so the page never
              // comes to rest on the portrait alone in the dark between them
              { from: storyFrom + chapters, to: end + 3, duration: 2.8 },
            ];
          })
        : null;

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
      // Phone: the scene follows the scroll through a short smoothing. On iOS
      // Chrome the scroll position jumps while the address bar collapses
      // (scrolling down), and a scene tied to it frame by frame trembled.
      const smooth = isMobile && !reduce;
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        ...(smooth ? { onUpdate: () => render(tl.progress()) } : {}),
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: () => `+=${heroLength()}`,
          scrub: smooth ? 0.35 : true,
          onUpdate: (self) => {
            if (smooth) return;
            render(self.progress);
            if (storyInStage && storyProgress.get() > 0) renderStory(storyProgress.get());
          },
          onRefresh: (self) => render(smooth ? tl.progress() : self.progress),
        },
      });
      tl.to({}, { duration: 1 }, 0);
      const band = (el: Element | NodeListOf<Element>, from: number, to: number, a: gsap.TweenVars, b: gsap.TweenVars) =>
        tl.fromTo(el, a, { ...b, duration: to - from, immediateRender: false }, from);

      if (reduce) tl.set(front, { opacity: 0 }, 0.23).set(front, { opacity: 1 }, 0);
      // the name is on a nearer plane than the town: it rises faster, and the
      // sea takes it
      else {
        band(front, OPEN_FROM, OPEN_FROM + (OPEN_TO - OPEN_FROM) * 0.5, { y: "0vh" }, { y: "-14vh" });
        // the pitch and the link sit low, where the sea arrives first: they
        // go before its rim reaches them, never seen cut by the foam
        const low = front.querySelectorAll(".hero-pitch, .hero-link");
        if (low.length) band(low, OPEN_FROM, OPEN_FROM + (OPEN_TO - OPEN_FROM) * 0.06, { opacity: 1 }, { opacity: 0 });
      }
      return () => {
        ro.disconnect();
        offPassages?.();
      };
    },
    [isMobile, reduce],
  );

  return (
    <>
    <section
      ref={sectionRef}
      className="city"
      data-journey="partida"
      aria-label={NAME.full}
      style={{
        ["--track-desktop" as string]: `${trackDesktop * 100}svh`,
        ["--track-phone" as string]: `${(reduce ? TRACK_REDUCED : TRACK_PHONE) * 100}svh`,
      }}
    >
      <div ref={stageRef} className="city-stage">
        {/* Diamante behind everything: the photo, the grain and the stamp
            (the same markup the static shell paints before React). */}
        <div className="city-place" aria-hidden="true" dangerouslySetInnerHTML={{ __html: placeHtml() }} />

        {/* The picture: photo, colour reveal, scaled as one into
            a frame on the way out. */}
        <div className="city-frame" data-scene-frame="">
          {/* The portrait the window opens onto; the camera moves over it.
              Diamante is the first paint (LCP); index.html preloads both. */}
          <img
            key={shot.src}
            className="city-photo"
            src={shot.color}
            alt=""
            aria-hidden="true"
            width={shot.width}
            height={shot.height}
            style={{ width: shot.width, height: shot.height }}
            decoding="async"
          />

          {/* the portrait in colour; the sea hands it over */}
          {/* T1: the night the camera tilts up into. */}
          {storyInStage && <div className="city-night" aria-hidden="true" />}
        </div>

        {storyInStage && <div className="city-ring" aria-hidden="true" />}

        {/* The name, the credits, and the real heading for assistive tech. */}
        <div className="city-front">
          <h1 className="sr-only">{NAME.full}</h1>
          <NameLayout />
        </div>

        {/* The sea between Diamante and the portrait, over everything. */}
        {!reduce && (
          <SeaWash
            wash={wash}
            camera={camera}
            portraitSrc={shot.color}
            portraitSize={{ width: shot.width, height: shot.height }}
            phone={isMobile}
          />
        )}

        {storyInStage && <Story mode="rail" progress={storyProgress} />}
      </div>

      <div className="city-track" aria-hidden="true">
        {/* Where the nav's "Sobre" lands: the story's opening. */}
        {storyInStage && (
          <span
            id="about"
            className="city-anchor"
            style={{ top: `calc(${TRACK_DESKTOP * 100}svh)` }}
          />
        )}
      </div>
    </section>
    {!storyInStage && <Story mode="list" />}
    </>
  );
}
