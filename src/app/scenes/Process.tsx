import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { ScrollTrigger, gsap } from "../scroll/gsap";
import { useScene } from "../scroll/useScene";
import "./Process.css";

const STEPS = ["talk", "draft", "build", "launch"] as const;

/**
 * Scene 6, how it works: four steps on a line that draws itself as the page
 * scrolls, each step lighting up as the line reaches it. The line is
 * horizontal on a wide screen and vertical on a phone, and it ends pointing
 * at the conversation that closes the page.
 */
export function Process() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const [lit, setLit] = useState(0);
  const [done, setDone] = useState(false);

  useScene(sectionRef, ({ reduced, isPhone }) => {
    const fill = sectionRef.current!.querySelector<HTMLElement>(".process-fill")!;
    if (reduced) {
      setLit(STEPS.length);
      setDone(true);
      return;
    }
    const axis = isPhone ? "scaleY" : "scaleX";
    const show = (p: number) => {
      gsap.set(fill, { [axis]: p });
      // a step lights once the line has reached its marker
      setLit(Math.min(STEPS.length, Math.floor(p * STEPS.length + 0.15)));
      setDone(p >= 0.999);
    };
    show(0);
    ScrollTrigger.create({
      trigger: sectionRef.current!.querySelector(".process-track"),
      start: "top 75%",
      end: isPhone ? "bottom 55%" : "top 25%",
      scrub: true,
      onUpdate: (self) => show(self.progress),
      onRefresh: (self) => show(self.progress),
    });
  });

  return (
    <section ref={sectionRef} id="process" className="process" data-done={done ? "true" : "false"} aria-labelledby="process-title">
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
          <li key={s} className="process-step" data-step={s} data-lit={i < lit ? "true" : "false"}>
            <span className="process-marker" aria-hidden="true" />
            <h3 className="process-step-title">{t(`process.steps.${s}.title`)}</h3>
            <p className="process-step-text">{t(`process.steps.${s}.description`)}</p>
            {s === "draft" && <p className="process-gate">{t("process.gate")}</p>}
          </li>
        ))}
      </ol>
      </div>
      <span className="process-end" data-process-end="" aria-hidden="true" />
    </section>
  );
}
