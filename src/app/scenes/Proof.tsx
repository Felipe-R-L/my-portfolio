import { useLayoutEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { boxOf, pageTop, registerBeats } from "../journey/beats";
import type { Box } from "../journey/director";
import { useJourneyMode } from "../journey/useJourneyMode";
import { SCROLL } from "../motion/tokens";
import { WORK } from "../data/work";
import "./Proof.css";

/** The three facts, in the order they are read. Prose: `telemetria.entries.<id>`. */
export const ENTRIES = ["since", "offline", "training"] as const;

const STILL = {
  src: "/assets/projects/dallas-sync-op-1440.webp",
  srcSet: "/assets/projects/dallas-sync-op-720.webp 720w, /assets/projects/dallas-sync-op-1440.webp 1440w",
};

/**
 * Em uso: does it really work? Facts, not counters: Dallas Sync in
 * production at the Dallas Motel since September 2026, the front desk working
 * with no internet, and a training mode apart from the real data, with the
 * recording as the proof.
 *
 * T3, from the destinations: a change of light with the camera locked off.
 * The frame does not move (it holds the exact box both stages give it) while
 * the last destination's words leave, this chapter's come in, the cold light
 * of the screens goes out and the picture cuts to the front desk.
 */
export function Proof() {
  const { t } = useTranslation();
  const mode = useJourneyMode();
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (mode === "list") return;
    return registerBeats("telemetria", () => {
      const slot = slotRef.current;
      if (!slot) return [];
      const vh = window.innerHeight;
      if (mode === "swipe") {
        const live = () => boxOf(slotRef.current);
        const top = pageTop(slot);
        return [{ content: "offline", start: top - vh, end: top + slot.offsetHeight, arrive: 0, gesture: "cut" as const, slot: live }];
      }
      const track = trackRef.current;
      const stage = stageRef.current;
      const dest = document.querySelector(".dest-track");
      if (!track || !stage) return [];
      const stuck = pageTop(track);
      // where the slot sits once the stage is stuck: the same box the
      // destinations' stage gives the frame, so nothing moves across T3
      const s = slot.getBoundingClientRect();
      const st = stage.getBoundingClientRect();
      const held: Box = { x: s.left, y: s.top - st.top, w: s.width, h: s.height };
      // T3 starts where the destinations let the frame go
      const from = dest ? pageTop(dest) + dest.getBoundingClientRect().height - vh : stuck - vh;
      const hold = SCROLL.light * vh;
      return [
        { content: "offline", start: from, end: stuck, arrive: 1, gesture: "cut" as const, travel: false, slot: () => held },
        // then the facts are read; Como funciona takes the frame from the held box (T4)
        { content: "offline", start: stuck, end: stuck + hold, arrive: 0, gesture: "cut" as const, slot: () => held },
      ];
    });
  }, [mode]);

  const log = (
    <dl className="log">
      {ENTRIES.map((id) => (
        <div key={id} className="log-entry">
          <dt className="log-label">{t(`telemetria.entries.${id}.label`)}</dt>
          <dd className="log-text">{t(`telemetria.entries.${id}.text`)}</dd>
        </div>
      ))}
    </dl>
  );
  const head = (
    <h2 id="proof-title" className="proof-title">
      {t("telemetria.title")}
    </h2>
  );
  // The note says what the frame really shows: the recording once it exists,
  // until then a still of the system in training mode.
  const recorded = !!WORK.find((w) => w.id === "dallas_sync")?.video?.detail;
  const note = <p className="proof-note">{t(recorded ? "telemetria.video_note" : "telemetria.still_note")}</p>;

  return (
    <section
      id="proof"
      className="proof"
      data-journey="telemetria"
      data-mode={mode}
      aria-labelledby="proof-title"
      style={{ ["--hold" as string]: `${SCROLL.light * 100}svh` }}
    >
      {mode === "scroll" && (
        <div ref={trackRef} className="proof-track">
          <div ref={stageRef} className="proof-stage">
            <div className="proof-words">
              {head}
              {log}
            </div>
            <div className="proof-side">
              <div ref={slotRef} className="proof-slot" data-frame-slot="telemetria" />
              {note}
            </div>
          </div>
        </div>
      )}
      {mode === "swipe" && (
        <div className="proof-phone">
          {head}
          <div ref={slotRef} className="proof-slot" data-frame-slot="telemetria" />
          {note}
          {log}
        </div>
      )}
      {mode === "list" && (
        <div className="proof-plain">
          {head}
          <img className="proof-still" src={STILL.src} srcSet={STILL.srcSet} sizes="(max-width: 767px) 92vw, 60vw" alt="" loading="lazy" decoding="async" />
          {note}
          {log}
        </div>
      )}
    </section>
  );
}
