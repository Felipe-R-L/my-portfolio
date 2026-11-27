import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { pageTop, registerBeats } from "../journey/beats";
import { FRAME_CONTENTS } from "../journey/contents";
import { registerPassages } from "../scroll/glide";
import type { Box } from "../journey/director";
import { useJourneyMode } from "../journey/useJourneyMode";
import { SCROLL } from "../motion/tokens";
import { clamp01 } from "../scroll/math";
import { useLeave } from "../journey/useLeave";
import "./Process.css";

/** The four shots, in order. Prose: `plano.steps.<id>`; no step promises a deadline. */
export const STEPS = ["talk", "proposal", "build", "live"] as const;
type Step = (typeof STEPS)[number];

/** The last shot is the only one with a real project in it (Felipe,
    2026-11-26): the site is live. */
const LIVE_IMAGE = "/assets/projects/dallas-720.webp";

/** The frame, pulled all the way back: the "you are here" marker. 16:10. */
const MARKER = { w: 56, h: 35 };
/** What the marker shows on a phone: the front desk of Dallas Sync, still. */
const MARKER_SRC = FRAME_CONTENTS.find((c) => c.id === "offline")!.image.src;

/**
 * Como funciona: what working together looks like, as four shots on a strip
 * of film ("plano" is also a camera shot). Each frame holds something real:
 * the message the site's WhatsApp button writes, the outline of a written
 * proposal, a page being built block by block and a site that is live.
 *
 * T4, from the destinations: the camera pulls back. The frame shrinks from the front
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

  // Never left half done (scroll/glide.ts): T4's pull-back to the first
  // stop, and the marker between two stops.
  useLayoutEffect(() => {
    if (mode !== "scroll") return;
    return registerPassages("plano", () => {
      const track = trackRef.current;
      if (!track) return [];
      const vh = window.innerHeight;
      const stuck = pageTop(track);
      const travel = SCROLL.track * vh;
      const prev = document.querySelector(".dest-track");
      const pullFrom = prev ? pageTop(prev) + prev.getBoundingClientRect().height - vh : stuck - vh;
      const legs = STEPS.length - 1;
      return [
        { from: pullFrom, to: stuck, duration: 1.5 },
        ...Array.from({ length: legs }, (_, j) => ({ from: stuck + (travel * j) / legs, to: stuck + (travel * (j + 1)) / legs })),
        // the marker waits at the last stop until the stage lets go (T5)
        { from: stuck + travel, to: stuck + track.getBoundingClientRect().height - vh, hold: true },
      ];
    });
  }, [mode]);

  useLayoutEffect(() => {
    // a phone's marker rides the line in the page (.plano-rider), no frame
    if (mode !== "scroll") return;
    return registerBeats("plano", () => {
      const line = lineRef.current;
      if (!line) return [];
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      // where the marker sits along the line at progress k (0 = first stop, 1 = last)
      const markerAt = (k: number, lineBox: Box): Box => ({
        x: lineBox.x + k * lineBox.w - MARKER.w / 2,
        y: lineBox.y - MARKER.h / 2,
        w: MARKER.w,
        h: MARKER.h,
      });
      // how much of the line the marker has covered: the thread fills behind it
      const thread = (k: number) => {
        line.style.setProperty("--k", k.toFixed(4));
        line.style.setProperty("--len", `${line.offsetWidth}px`);
      };
      const reach = (i: number) => {
        if (i !== reachedRef.current) {
          reachedRef.current = i;
          setReached(i);
        }
      };
      // a stop is reached once the marker is on it
      const mark = (k: number) => reach(Math.min(STEPS.length - 1, Math.floor(k * (STEPS.length - 1) + 1e-6)));

      const track = trackRef.current;
      const stage = stageRef.current;
      if (!track || !stage) return [];
      const stuck = pageTop(track);
      // the line's box once the stage is stuck (relative to the stage, which then sits at the top)
      const l = line.getBoundingClientRect();
      const st = stage.getBoundingClientRect();
      const lineBox: Box = { x: l.left, y: l.top - st.top + l.height / 2, w: l.width, h: 0 };
      const travel = SCROLL.track * vh;
      // T4 starts where the destinations let the frame go
      const prev = document.querySelector(".dest-track");
      const pullFrom = prev ? pageTop(prev) + prev.getBoundingClientRect().height - vh : stuck - vh;
      return [
        // T4: the pull-back, cut to the front desk's screen, down to the marker at the first stop
        {
          content: "offline",
          start: pullFrom,
          end: stuck,
          arrive: 1,
          gesture: "cut" as const,
          slot: () => {
            thread(0);
            return markerAt(0, lineBox);
          },
        },
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
            thread(k);
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
            thread(1);
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
      line.querySelectorAll<HTMLElement>(".plano-stop").forEach((stop, i) => stop.style.setProperty("--at", `${ys[i]}px`));
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
      const ys = Array.from(line.querySelectorAll(".plano-stop")).map((el) => el.getBoundingClientRect().top);
      const n = ys.filter((y) => y <= mid).length;
      const i = Math.max(0, n - 1);
      line.style.setProperty("--k", clamp01((mid - ys[0]) / Math.max(1, ys[ys.length - 1] - ys[0])).toFixed(4));
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

  // T5 begins as the stage lets go: the steps leave before the city grows where they stand
  useLeave(trackRef, stageRef, mode === "scroll", 0.2);

  // what each frame of the strip shows
  const shot = (id: Step) => {
    if (id === "talk")
      return (
        <div className="shot-chat">
          <p className="shot-bubble">{t("talk.chips.sistema.message")}</p>
          <span className="shot-typing" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </div>
      );
    if (id === "proposal")
      return (
        <div className="shot-doc">
          <b>{t("plano.doc.title")}</b>
          <small>{t("plano.doc.build")}</small>
          <span className="m" />
          <span className="s" />
          <small>{t("plano.doc.out")}</small>
          <span className="s" />
          <small>{t("plano.doc.cost")}</small>
          <span className="xs" />
        </div>
      );
    if (id === "build")
      // a page going up in stages: the blocks already built are solid, the
      // rest still dashed, and they fill in once the marker reaches the shot
      return (
        <div className="shot-build" aria-hidden="true">
          <span className="shot-bar">
            <i />
            <i />
            <i />
          </span>
          <span className="shot-page">
            <span className="b nav" />
            <span className="b hero" />
            <span className="b c1" />
            <span className="b c2" />
            <span className="b c3" />
            <span className="b foot" />
          </span>
          <span className="shot-stages">
            <i />
            <i />
            <i />
            <i />
          </span>
        </div>
      );
    return (
      <>
        <img src={LIVE_IMAGE} alt="" loading="lazy" decoding="async" width={720} height={450} />
        <span className="shot-chip">
          <i aria-hidden="true" />
          {t("plano.steps.live.chip")}
        </span>
      </>
    );
  };

  const steps = (
    <ol ref={stepsRef} className="steps">
      {STEPS.map((id, i) => (
        <li key={id} className="step" data-reached={i <= reached ? "true" : "false"}>
          <div className="step-shot">{shot(id)}</div>
          <span className="step-n">{t("plano.shot", { n: i + 1 })}</span>
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
          <header className="plano-copy">
            <h2 id="process-title" className="plano-title">
              {t("plano.title")}
            </h2>
            <p className="plano-lead">{t("plano.lead")}</p>
          </header>
          <div className="plano-route">
            {/* the line the marker rides, with one stop per step */}
            <div ref={lineRef} className="plano-line" aria-hidden="true">
              {/* the thread: solid behind the marker, a soft light where it is */}
              <span className="plano-edge">{t("journey.edge", { n: "03" })}</span>
              <span className="plano-fill" />
              <span className="plano-head" />
              {STEPS.map((id, i) => (
                <span
                  key={id}
                  className="plano-stop"
                  data-reached={i <= reached ? "true" : "false"}
                  style={{ ["--x" as string]: `${(i / (STEPS.length - 1)) * 100}%` }}
                />
              ))}
              {/* phone: the marker, held at the middle of the screen by
                  sticky positioning between the first stop and the last */}
              {mode === "swipe" && (
                <span className="plano-rider">
                  <span className="plano-marker">
                    <img src={MARKER_SRC} alt="" decoding="async" loading="lazy" />
                  </span>
                </span>
              )}
            </div>
            {steps}
          </div>
        </div>
      </div>
    </section>
  );
}
