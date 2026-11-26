import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { ScrollTrigger, gsap } from "../scroll/gsap";
import { useScene } from "../scroll/useScene";
import { useTilt } from "../scroll/useTilt";
import "./Process.css";

const STEPS = ["talk", "draft", "build", "launch"] as const;

/** One line drawing per step, traced as the line reaches it: a speech
    bubble, a sketched page, blocks going up, a launch. */
const ICONS: Record<(typeof STEPS)[number], string[]> = {
  talk: ["M8 12h40v24H26l-10 9v-9H8z", "M16 22h24", "M16 28h14"],
  draft: ["M12 6h26l8 8v36H12z", "M38 6v8h8", "M19 24h20", "M19 31h20", "M19 38h12"],
  build: ["M6 50h44", "M10 50V36h12v14", "M22 50V24h12v26", "M34 50V12h12v38"],
  launch: ["M10 46L44 12", "M24 12h20v20", "M10 30v16h16"],
};

/**
 * Scene 6, how it works: four steps on a line that draws itself once the
 * steps are on screen, each step turning up, a card in 3D, as the line
 * reaches it. The line is
 * horizontal on a wide screen and vertical on a phone, where it stops at
 * the last step's marker.
 */
export function Process() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const [lit, setLit] = useState(0);
  const [done, setDone] = useState(false);
  useTilt(sectionRef);

  useScene(sectionRef, ({ reduced, isPhone }) => {
    const fill = sectionRef.current!.querySelector<HTMLElement>(".process-fill")!;
    if (reduced) {
      setLit(STEPS.length);
      setDone(true);
      return;
    }
    const track = sectionRef.current!.querySelector<HTMLElement>(".process-track")!;
    // On a phone the line runs down the left; it ends at the last marker
    // (0.45rem from the top of the last step, plus half the marker).
    const fitTail = () => {
      if (!isPhone) return;
      const last = track.querySelector<HTMLElement>(".process-step:last-child");
      if (last) track.style.setProperty("--line-tail", `${Math.max(0, last.offsetHeight - 13)}px`);
    };
    fitTail();
    const axis = isPhone ? "scaleY" : "scaleX";
    const show = (p: number) => {
      gsap.set(fill, { [axis]: p });
      // a step lights once the line has reached its marker
      setLit(Math.min(STEPS.length, Math.floor(p * STEPS.length + 0.15)));
      setDone(p >= 0.999);
    };
    show(0);
    // Once the steps are well on screen, the line draws itself, at its own
    // pace, never tied to the scroll. On a phone each step plays as it comes
    // into view, since the four are never on screen together.
    const clock = { p: 0 };
    const play = (to: number) =>
      gsap.to(clock, { p: to, duration: 0.9 * STEPS.length * Math.max(0.25, to - clock.p), ease: "none", overwrite: true, onUpdate: () => show(clock.p) });
    if (isPhone) {
      track.querySelectorAll<HTMLElement>(".process-step").forEach((step, i) =>
        ScrollTrigger.create({
          trigger: step,
          start: "center 70%",
          once: true,
          onEnter: () => {
            fitTail();
            if (clock.p < (i + 1) / STEPS.length) play((i + 1) / STEPS.length);
          },
        }),
      );
    } else {
      ScrollTrigger.create({
        trigger: track,
        start: "bottom 85%",
        // scrolled past before it finished: never leave half the steps unlit
        end: "bottom top",
        onEnter: () => play(1),
        onLeave: () => {
          gsap.killTweensOf(clock);
          clock.p = 1;
          show(1);
        },
      });
    }
  });

  return (
    <section ref={sectionRef} id="process" className="process" data-journey="plano" data-done={done ? "true" : "false"} aria-labelledby="process-title">
      <div className="process-head">
        <h2 id="process-title" className="process-title">
          {t("process.title")}
        </h2>
        <p className="process-lead">{t("process.lead")}</p>
      </div>

      <div className="process-track">
      <div className="process-line" aria-hidden="true">
        <span className="process-fill" />
      </div>

      <ol className="process-steps">
        {STEPS.map((s, i) => (
          <li key={s} className="process-step" data-step={s} data-lit={i < lit ? "true" : "false"} style={{ ["--n" as string]: i }}>
            <span className="process-marker" aria-hidden="true" />
            <div className="process-card" data-tilt="">
            <span className="process-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
            <svg className="process-icon" viewBox="0 0 56 56" aria-hidden="true">
              {ICONS[s].map((d, k) => (
                <path key={k} d={d} pathLength={1} style={{ ["--k" as string]: k }} />
              ))}
            </svg>
            <h3 className="process-step-title">{t(`process.steps.${s}.title`)}</h3>
            <p className="process-step-text">{t(`process.steps.${s}.description`)}</p>
            {s === "draft" && <p className="process-gate">{t("process.gate")}</p>}
            </div>
          </li>
        ))}
      </ol>
      </div>
    </section>
  );
}
