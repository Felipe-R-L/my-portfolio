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
      const mark = (k: number) => {
        // a stop is reached once the marker is on it
        const i = Math.min(STEPS.length - 1, Math.floor(k * (STEPS.length - 1) + 1e-6));
        if (i !== reachedRef.current) {
          reachedRef.current = i;
          setReached(i);
        }
      };

      if (mode === "swipe") {
        // the marker rides the line down, held at the middle of the screen
        const top = pageTop(line);
        const h = line.offsetHeight;
        const live = (): Box => {
          const r = line.getBoundingClientRect();
          const k = clamp01((vh / 2 - r.top) / Math.max(1, r.height));
          mark(k);
          return markerAt(k, { x: r.left + r.width / 2, y: r.top, w: r.width, h: r.height });
        };
        return [{ content: "offline", start: top - vh / 2, end: top + h - vh / 2, arrive: 0, gesture: "cut" as const, slot: live }];
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

  const steps = (
    <ol className="steps">
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
