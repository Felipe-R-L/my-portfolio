import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

import type { WorkItem } from "../data/work";
import "./WorkCase.css";

/**
 * The details of one piece of work, opened from its card: the problem, what
 * I built, where it stands today, what it is built with, and every screen.
 * A native modal dialog, so focus, Escape and the backdrop come for free.
 */
export function WorkCase({ item, onClose }: { item: WorkItem | null; onClose: () => void }) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (item && !dialog.open) dialog.showModal?.();
    if (!item && dialog.open) dialog.close();
    // the page behind stays still while the details are open
    document.documentElement.style.overflow = item ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [item]);

  const base = item ? `work.items.${item.id}` : "";
  const name = item ? t(`${base}.title`) : "";
  const screens = item ? [item.image, ...(item.gallery ?? [])] : [];

  return (
    <dialog
      ref={ref}
      className="case"
      aria-labelledby="case-title"
      data-lenis-prevent=""
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // a click on the backdrop
      }}
    >
      {item && (
        <article className="case-body">
          <button type="button" className="case-close" onClick={onClose} aria-label={t("work.case.close")}>
            <X size={20} aria-hidden="true" />
          </button>
          <span className="case-kind">{t(`work.kind.${item.kind}`)}</span>
          <h2 id="case-title" className="case-title">
            {name}
          </h2>

          <div className="case-screens">
            {screens.map((s, i) => (
              <figure key={s.src} className={`case-screen${item.image.lockup && i === 0 ? " case-screen--lockup" : ""}`}>
                <img src={s.src} srcSet={s.srcSet} sizes="(max-width: 767px) 92vw, 60vw" alt="" loading="lazy" decoding="async" />
              </figure>
            ))}
          </div>

          <dl className="case-text">
            <div>
              <dt>{t("work.case.problem")}</dt>
              <dd>{t(`${base}.case.problem`)}</dd>
            </div>
            <div>
              <dt>{t("work.case.built")}</dt>
              <dd>{t(`${base}.case.built`)}</dd>
            </div>
            {item.hasNow && (
              <div>
                <dt>{t("work.case.now")}</dt>
                <dd>{t(`${base}.case.now`)}</dd>
              </div>
            )}
            <div>
              <dt>{t("work.case.stack")}</dt>
              <dd>
                <ul className="case-stack">
                  {item.stack.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
          {item.illustrative && <p className="case-note">{t(`${base}.note`)}</p>}

          <a className="case-link" href={item.href} target="_blank" rel="noreferrer" aria-label={t("work.visit_aria", { name })}>
            {item.loginRequired ? t("work.visit_login") : t("work.visit")}
          </a>
        </article>
      )}
    </dialog>
  );
}
