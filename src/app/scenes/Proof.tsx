import { useRef } from "react";
import { useTranslation } from "react-i18next";

import { ScrollTrigger, gsap } from "../scroll/gsap";
import { countAt, span } from "../scroll/math";
import { useScene } from "../scroll/useScene";
import { useTilt } from "../scroll/useTilt";
import "./Proof.css";

/** The OMD figures (LinkedIn, confirmed by Felipe on 2026-11-24). */
export const PROOF = [
  { id: "empresas", value: 31, prefix: "", suffix: "" },
  { id: "maquinas", value: 92, prefix: "", suffix: "" },
  { id: "consulta", value: 2, prefix: "<\u2009", suffix: "\u2009s" },
] as const;

/**
 * Scene 5, the proof: once the figures are well inside the screen, they
 * count up on their own, once, at their own pace, never tied to the scroll
 * (tied to it, they ran before anyone was looking). With reduced motion they
 * simply show their final values.
 */
export function Proof() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  useTilt(sectionRef, 5);

  useScene(sectionRef, ({ reduced }) => {
    if (reduced) return;
    const root = sectionRef.current!;
    const nums = [...root.querySelectorAll<HTMLElement>("[data-count]")];
    const show = (p: number) =>
      nums.forEach((el, i) => {
        // each figure starts a little after the previous one
        const local = span(p, i * 0.08, 0.6 + i * 0.08);
        const n = countAt(local, Number(el.dataset.count));
        el.textContent = String(n);
        const fig = el.closest<HTMLElement>(".proof-figure")!;
        // one square per company, one dot per machine, lit as the count climbs
        fig.querySelectorAll<HTMLElement>(".proof-unit").forEach((u, k) => {
          u.dataset.on = k < n ? "true" : "false";
        });
        // the report: a 30 s bar that shrinks to the 2 s it takes now
        const bar = fig.querySelector<HTMLElement>(".proof-bar-now");
        if (bar) bar.style.transform = `scaleX(${1 - local * (1 - 2 / 30)})`;
      });
    show(0);
    const clock = { p: 0 };
    ScrollTrigger.create({
      trigger: root.querySelector(".proof-figures"),
      // the whole row of figures on screen, a little above the middle
      start: "bottom 85%",
      once: true,
      onEnter: () =>
        gsap.to(clock, { p: 1, duration: 2.4, ease: "none", onUpdate: () => show(clock.p) }),
    });
  });

  return (
    <section ref={sectionRef} id="proof" className="proof" data-journey="telemetria" aria-labelledby="proof-title">
      <div className="proof-head">
        <h2 id="proof-title" className="proof-title">
          {t("proof.title")}
        </h2>
        <p className="proof-lead">{t("proof.lead")}</p>
      </div>
      <dl className="proof-figures">
        {PROOF.map((f) => (
          <div key={f.id} className="proof-figure" data-tilt="">
            <dt className="proof-label">{t(`proof.items.${f.id}`)}</dt>
            <dd className="proof-value">
              {f.prefix && <span className="proof-affix">{f.prefix}</span>}
              <span data-count={f.value}>{f.value}</span>
              {f.suffix && <span className="proof-affix">{f.suffix}</span>}
            </dd>
            <dd className={`proof-viz proof-viz--${f.id}`} aria-hidden="true">
              {f.id === "consulta" ? (
                <>
                  <span className="proof-bar">
                    <span className="proof-bar-was" />
                    <span className="proof-bar-tag">30 s</span>
                  </span>
                  <span className="proof-bar">
                    <span className="proof-bar-now" />
                    <span className="proof-bar-tag">2 s</span>
                  </span>
                </>
              ) : (
                Array.from({ length: f.value }, (_, k) => <span key={k} className="proof-unit" data-on="true" />)
              )}
            </dd>
          </div>
        ))}
      </dl>
      <p className="proof-foot">{t("proof.agrishow")}</p>
    </section>
  );
}
