import { useRef } from "react";
import { useTranslation } from "react-i18next";

import { ScrollTrigger } from "../scroll/gsap";
import { countAt, span } from "../scroll/math";
import { useScene } from "../scroll/useScene";
import "./Proof.css";

/** The OMD figures (LinkedIn, confirmed by Felipe on 2026-11-24). */
export const PROOF = [
  { id: "empresas", value: 31, prefix: "", suffix: "" },
  { id: "maquinas", value: 92, prefix: "", suffix: "" },
  { id: "consulta", value: 2, prefix: "< ", suffix: " s" },
] as const;

/**
 * Scene 5, the proof: the numbers count up as the section crosses the
 * screen. No pin; with reduced motion they simply show their final values.
 */
export function Proof() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);

  useScene(sectionRef, ({ reduced }) => {
    if (reduced) return;
    const nums = [...sectionRef.current!.querySelectorAll<HTMLElement>("[data-count]")];
    const show = (p: number) =>
      nums.forEach((el, i) => {
        // each figure starts a little after the previous one
        const local = span(p, i * 0.08, 0.6 + i * 0.08);
        el.textContent = String(countAt(local, Number(el.dataset.count)));
      });
    show(0);
    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top 85%",
      end: "center 45%",
      scrub: true,
      onUpdate: (self) => show(self.progress),
      onRefresh: (self) => show(self.progress),
    });
  });

  return (
    <section ref={sectionRef} className="proof" aria-labelledby="proof-title">
      <div className="proof-head">
        <h2 id="proof-title" className="proof-title">
          {t("proof.title")}
        </h2>
        <p className="proof-lead">{t("proof.lead")}</p>
      </div>
      <dl className="proof-figures">
        {PROOF.map((f) => (
          <div key={f.id} className="proof-figure">
            <dt className="proof-label">{t(`proof.items.${f.id}`)}</dt>
            <dd className="proof-value">
              {f.prefix}
              <span data-count={f.value}>{f.value}</span>
              {f.suffix}
            </dd>
          </div>
        ))}
      </dl>
      <p className="proof-foot">{t("proof.agrishow")}</p>
    </section>
  );
}
