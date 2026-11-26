import { useEffect, useLayoutEffect, useRef, useState, type MutableRefObject } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import type Lenis from "lenis";

import { ProjectVideo } from "../components/ProjectVideo";
import type { WorkItem } from "../data/work";
import type { Box } from "../journey/director";
import { useJourneyMode } from "../journey/useJourneyMode";
import { DURATION, EASE } from "../motion/tokens";
import "./CaseLayer.css";

/** Where the journey's frame is now, if it is showing this work. */
function frameBoxFor(id: string): Box | null {
  const jf = document.querySelector<HTMLElement>(".jf");
  const box = document.querySelector(".jf-box");
  if (!jf || !box || jf.dataset.visible !== "true" || jf.dataset.content !== id) return null;
  const r = box.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}

/** The transform that puts `to` exactly over `from` (uniform scale, 16:10). */
function flipFrom(from: Box, to: DOMRect) {
  const s = from.w / to.width;
  return `translate(${from.x - to.left}px, ${from.y - to.top}px) scale(${s})`;
}

/**
 * The surface: a destination's case, told as a problem solved. It opens over
 * the journey, which does not move underneath, at /work/<slug>.
 *
 * T2: the picture grows out of the journey's frame into the case's opening
 * picture (a FLIP, the frame never cuts) while the light ground rises from
 * the bottom; closing plays it back into the frame. On a phone the case is a
 * sheet that rises from the bottom and a swipe down closes it. With reduced
 * motion it is a short fade.
 */
export function CaseLayer({
  item,
  from,
  onClose,
  lenisRef,
}: {
  item: WorkItem | null;
  from: Box | null;
  onClose: () => void;
  lenisRef?: MutableRefObject<Lenis | null>;
}) {
  const { t } = useTranslation();
  const mode = useJourneyMode();
  const [shown, setShown] = useState<WorkItem | null>(item);
  const rootRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const opener = useRef<Element | null>(null);
  const drag = useRef<number | null>(null);

  // keep the case on screen while it plays its way out
  useEffect(() => {
    if (item) setShown(item);
  }, [item]);

  // the journey holds still underneath
  useEffect(() => {
    if (!shown) return;
    opener.current = document.activeElement;
    lenisRef?.current?.stop();
    document.documentElement.style.overflow = "hidden";
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      lenisRef?.current?.start();
      document.documentElement.style.overflow = "";
      (opener.current as HTMLElement | null)?.focus?.({ preventScroll: true });
    };
  }, [shown, lenisRef]);

  // T2 in
  useLayoutEffect(() => {
    const root = rootRef.current;
    const media = mediaRef.current;
    if (!item || !root || !media) return;
    const opts = { duration: DURATION.flip * 1000, easing: EASE.arrive.css, fill: "backwards" as const };
    if (mode === "list") {
      root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: DURATION.fade * 1000, fill: "backwards" });
      return;
    }
    if (mode === "swipe") {
      root.animate([{ transform: "translateY(100%)" }, { transform: "translateY(0)" }], opts);
      return;
    }
    root.animate([{ clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0 0 0 0)" }], opts);
    if (from) media.animate([{ transform: flipFrom(from, media.getBoundingClientRect()) }, { transform: "none" }], opts);
  }, [item, from, mode]);

  // T2 out: back into the frame, then gone
  useEffect(() => {
    if (item || !shown) return;
    const root = rootRef.current;
    const media = mediaRef.current;
    if (!root || !media) {
      setShown(null);
      return;
    }
    const opts = { duration: DURATION.flip * 1000 * 0.8, easing: EASE.leave.css, fill: "forwards" as const };
    let done: Promise<unknown>;
    if (mode === "list") done = root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: DURATION.fade * 1000, fill: "forwards" }).finished;
    else if (mode === "swipe") done = root.animate([{ transform: "translateY(0)" }, { transform: "translateY(100%)" }], opts).finished;
    else {
      // the frame is underneath again: the page did not move
      const back = frameBoxFor(shown.id);
      const anims = [root.animate([{ clipPath: "inset(0 0 0 0)" }, { clipPath: "inset(100% 0 0 0)" }], opts)];
      if (back) anims.push(media.animate([{ transform: "none" }, { transform: flipFrom(back, media.getBoundingClientRect()) }], opts));
      done = Promise.all(anims.map((a) => a.finished));
    }
    done.then(() => setShown(null)).catch(() => setShown(null));
  }, [item, shown, mode]);

  useEffect(() => {
    if (!shown) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown, onClose]);

  if (!shown) return null;
  const base = `work.items.${shown.id}`;
  const name = t(`${base}.title`);

  return (
    <div
      ref={rootRef}
      className="caselayer"
      data-mode={mode}
      role="dialog"
      aria-modal="true"
      aria-labelledby="case-title"
      data-lenis-prevent=""
    >
      <article className="case-sheet">
        {/* phone: a swipe down on the handle closes the sheet */}
        <div
          className="case-handle"
          aria-hidden="true"
          onPointerDown={(e) => (drag.current = e.clientY)}
          onPointerUp={(e) => {
            if (drag.current !== null && e.clientY - drag.current > 80) onClose();
            drag.current = null;
          }}
        />
        <button ref={closeRef} type="button" className="case-back" onClick={onClose}>
          <ArrowLeft size={18} aria-hidden="true" />
          {t("work.case.back")}
        </button>

        <div ref={mediaRef} className="case-media">
          <ProjectVideo sources={shown.video?.detail ?? shown.video?.card} image={shown.image} active wide />
        </div>
        {shown.illustrative && <p className="case-note">{t(`${base}.note`)}</p>}

        <header className="case-head">
          <span className="case-kind">{t(`work.kind.${shown.kind}`)}</span>
          <h2 id="case-title" className="case-title">
            {name}
          </h2>
        </header>

        <dl className="case-parts">
          {shown.parts.map((part) => (
            <div key={part} className="case-part">
              <dt>{t(`work.case.${part}`)}</dt>
              <dd>{t(`${base}.case.${part}`)}</dd>
            </div>
          ))}
        </dl>

        {shown.gallery && (
          <div className="case-gallery">
            {shown.gallery.map((g) => (
              <img key={g.src} src={g.src} srcSet={g.srcSet} sizes="(max-width: 767px) 92vw, 64rem" alt="" loading="lazy" decoding="async" />
            ))}
          </div>
        )}

        <footer className="case-foot">
          <div className="case-stack">
            <span className="case-stack-label">{t("work.case.stack")}</span>
            <ul>
              {shown.stack.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <a className="case-live" href={shown.href} target="_blank" rel="noreferrer" aria-label={t("work.visit_aria", { name })}>
            {shown.loginRequired ? t("work.visit_login") : t("work.visit")}
          </a>
        </footer>
      </article>
    </div>
  );
}
