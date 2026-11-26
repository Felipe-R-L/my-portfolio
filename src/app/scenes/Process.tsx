import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { pageTop, registerBeats } from "../journey/beats";
import type { Box } from "../journey/director";
import { useJourneyMode } from "../journey/useJourneyMode";
import { SCROLL } from "../motion/tokens";
import { clamp01 } from "../scroll/math";
import "./Process.css";

/** The three steps, in order. Prose: `plano.steps.<id>`; no step promises a deadline. */
export const STEPS = ["talk", "proposal", "start"] as const;

/**
 * The scenery behind the line: Diamante, a white town on the Calabrian coast
 * (Eugenio Magurno, CC BY-SA 3.0, via Wikimedia Commons; credited in the
 * footer). Dimmed under the words, it pans sideways with the scroll, so the
 * travel along the line reads as a travel along the coast.
 */
const SCENERY = {
  src: "/assets/story/diamante-c-1200.webp",
  srcSet: "/assets/story/diamante-c-1200.webp 1200w, /assets/story/diamante-c-2400.webp 2400w",
};

/** The frame, pulled all the way back: the "you are here" marker. 16:10. */
const MARKER = { w: 56, h: 35 };

/**
 * Como funciona: what working together looks like, in three steps.
 *
 * T4, from Em uso: the camera pulls back. The frame shrinks from the front
 * desk's screen to a small marker that lands on the start of a line with three
 * stops, and the scroll becomes a sideways travel along it, the marker riding
 * with it. On a phone the line runs down the screen and the marker rides it
 * with the thumb. With reduced motion, the steps simply stand on the line.
 */
export function Process() {
  const { t } = useTranslation();
  const mode = useJourneyMode();
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const [reached, setReached] = useState(mode === "list" ? STEPS.length - 1 : 0);
  const reachedRef = useRef(reached);

  useLayoutEffect(() => {
    if (mode === "list") return;
    return registerBeats("plano", () => {
      const line = lineRef.current;
      if (!line) return [];
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      // where the marker sits along the line at progress k (0 = first stop, 1 = last)
      const markerAt = (k: number, lineBox: Box): Box =>
        mode === "swipe"
          ? { x: lineBox.x - MARKER.w / 2, y: lineBox.y + k * lineBox.h - MARKER.h / 2, w: MARKER.w, h: MARKER.h }
          : { x: lineBox.x + k * lineBox.w - MARKER.w / 2, y: lineBox.y - MARKER.h / 2, w: MARKER.w, h: MARKER.h };
      const reach = (i: number) => {
        if (i !== reachedRef.current) {
          reachedRef.current = i;
          setReached(i);
        }
      };
      // a stop is reached once the marker is on it
      const mark = (k: number) => reach(Math.min(STEPS.length - 1, Math.floor(k * (STEPS.length - 1) + 1e-6)));

      if (mode === "swipe") {
        // the marker rides the line down, held at the middle of the screen
        // between the first stop and the last; each stop sits at its step
        const stops = Array.from(line.children) as HTMLElement[];
        const center = (el: HTMLElement) => {
          const r = el.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        };
        const first = pageTop(stops[0]);
        const last = pageTop(stops[stops.length - 1]);
        const live = (): Box => {
          const ys = stops.map((el) => center(el).y);
          const y = Math.min(Math.max(vh / 2, ys[0]), ys[ys.length - 1]);
          const x = center(stops[0]).x;
          return { x: x - MARKER.w / 2, y: y - MARKER.h / 2, w: MARKER.w, h: MARKER.h };
        };
        return [{ content: "offline", start: first - vh / 2, end: last - vh / 2 + 1, arrive: 0, gesture: "cut" as const, slot: live }];
      }

      const track = trackRef.current;
      const stage = stageRef.current;
      if (!track || !stage) return [];
      const stuck = pageTop(track);
      // the line's box once the stage is stuck (relative to the stage, which then sits at the top)
      const l = line.getBoundingClientRect();
      const st = stage.getBoundingClientRect();
      const lineBox: Box = { x: l.left, y: l.top - st.top + l.height / 2, w: l.width, h: 0 };
      const travel = SCROLL.track * vh;
      // T4 starts where Em uso lets the frame go
      const proof = document.querySelector(".proof-track");
      const pullFrom = proof ? pageTop(proof) + proof.getBoundingClientRect().height - vh : stuck - vh;
      return [
        // T4: the pull-back, from the front desk's screen down to the marker at the first stop
        { content: "offline", start: pullFrom, end: stuck, arrive: 1, gesture: "cut" as const, slot: () => markerAt(0, lineBox) },
        // the travel along the line
        {
          content: "offline",
          start: stuck,
          end: stuck + travel,
          arrive: 0,
          gesture: "cut" as const,
          slot: () => {
            const k = clamp01((window.scrollY - stuck) / travel);
            mark(k);
            return markerAt(k, lineBox);
          },
        },
        // at the last stop it waits there while the next scene takes over (T5)
        {
          content: "offline",
          start: stuck + travel,
          end: stuck + travel + 0.5 * vh,
          arrive: 0,
          gesture: "cut" as const,
          slot: () => {
            mark(1);
            return markerAt(1, lineBox);
          },
        },
      ];
    });
  }, [mode]);

  // phone and reduced motion: the line runs down beside the steps, which are
  // not all the same height, so each stop is put level with its step's title
  const stepsRef = useRef<HTMLOListElement>(null);
  useLayoutEffect(() => {
    if (mode === "scroll") return;
    const line = lineRef.current;
    const list = stepsRef.current;
    if (!line || !list) return;
    const place = () => {
      const top = line.getBoundingClientRect().top;
      const ys = Array.from(list.querySelectorAll<HTMLElement>(".step-title")).map((el) => {
        const r = el.getBoundingClientRect();
        return r.top + r.height / 2 - top;
      });
      Array.from(line.children).forEach((stop, i) => (stop as HTMLElement).style.setProperty("--at", `${ys[i]}px`));
      line.style.setProperty("--from", `${ys[0]}px`);
      line.style.setProperty("--to", `${ys[ys.length - 1]}px`);
    };
    place();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(place);
    ro?.observe(list);
    // on a phone a stop is reached once it passes the middle of the screen,
    // where the marker rides, however fast the thumb goes past it
    const onScroll = () => {
      if (line.offsetHeight === 0) return; // not laid out
      const mid = window.innerHeight / 2 + 1;
      const n = Array.from(line.children).filter((el) => el.getBoundingClientRect().top <= mid).length;
      const i = Math.max(0, n - 1);
      if (i !== reachedRef.current) {
        reachedRef.current = i;
        setReached(i);
      }
    };
    if (mode === "swipe") {
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }
    return () => {
      ro?.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [mode]);

  // the pan: 0 as the stage arrives, 1 as it leaves (desktop only)
  useLayoutEffect(() => {
    if (mode !== "scroll") return;
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = track.getBoundingClientRect();
      const vh = window.innerHeight;
      track.style.setProperty("--pan", clamp01((vh - r.top) / (r.height + vh)).toFixed(4));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [mode]);

  const steps = (
    <ol ref={stepsRef} className="steps">
      {STEPS.map((id, i) => (
        <li key={id} className="step" data-reached={i <= reached ? "true" : "false"}>
          <span className="step-n" aria-hidden="true">
            {String(i + 1).padStart(2, "0")}
          </span>
          <h3 className="step-title">{t(`plano.steps.${id}.title`)}</h3>
          <p className="step-text">{t(`plano.steps.${id}.text`)}</p>
        </li>
      ))}
    </ol>
  );

  return (
    <section
      id="process"
      className="plano"
      data-journey="plano"
      data-mode={mode}
      aria-labelledby="process-title"
      style={{ ["--travel" as string]: `${SCROLL.track * 100}svh`, ["--stops" as string]: STEPS.length }}
    >
      <div ref={trackRef} className="plano-track">
        <div ref={stageRef} className="plano-stage">
          {/* the scenery: Diamante's coast, panned as the marker travels */}
          <div className="plano-scenery" aria-hidden="true">
            <img src={SCENERY.src} srcSet={SCENERY.srcSet} sizes="130vw" alt="" loading="lazy" decoding="async" />
          </div>
          <h2 id="process-title" className="plano-title">
            {t("plano.title")}
          </h2>
          <div className="plano-route">
            {/* the line the marker rides, with one stop per step */}
            <div ref={lineRef} className="plano-line" aria-hidden="true">
              {STEPS.map((id, i) => (
                <span key={id} className="plano-stop" data-reached={i <= reached ? "true" : "false"} />
              ))}
            </div>
            {steps}
          </div>
        </div>
      </div>
    </section>
  );
}
