import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { WORK, type WorkItem } from "../data/work";
import { boxOf, notify, pageTop, registerBeats } from "../journey/beats";
import type { Box } from "../journey/director";
import { SCROLL } from "../motion/tokens";
import { ScrollTrigger } from "../scroll/gsap";
import { clamp01 } from "../scroll/math";
import { useJourneyMode } from "../journey/useJourneyMode";
import "./Work.css";

/** Share of a destination's scroll spent arriving; the rest holds still. */
const ARRIVE = SCROLL.destination.approach / (SCROLL.destination.approach + SCROLL.destination.hold);

/**
 * Destinos: what Felipe has built, one destination at a time.
 *
 * - Wide screens: a tall track with a sticky stage. Each destination is a
 *   beat of the journey's frame (see journey/director.ts): it arrives out of
 *   the depth of the previous one, racking into focus, then holds while its
 *   words are read. The words change through a mask, line by line.
 * - Phones: the frame sits at the top of the scene and the destinations
 *   are a native horizontal swipe; swiping changes what the frame shows.
 * - Reduced motion: a plain list, each with its own picture, no frame.
 */
/** Where the journey's frame is now, if it is showing this destination. */
function frameBox(id: string): Box | null {
  const jf = document.querySelector<HTMLElement>(".jf");
  const box = document.querySelector(".jf-box");
  if (!jf || !box || jf.dataset.visible !== "true" || jf.dataset.content !== id) return null;
  const r = box.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}

export function Work({ onOpenCase }: { onOpenCase?: (item: WorkItem, from: Box | null) => void }) {
  const { t } = useTranslation();
  const mode = useJourneyMode();
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const swipeRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const currentRef = useRef(0);
  currentRef.current = current;

  // The frame's beats: one per destination on a wide screen, one for the
  // whole scene on a phone (its content follows the swipe).
  useLayoutEffect(() => {
    if (mode === "list") return;
    return registerBeats("destinos", () => {
      const slot = () => boxOf(slotRef.current);
      if (mode === "swipe") {
        const s = slotRef.current;
        if (!s) return [];
        const top = pageTop(s);
        return [
          {
            content: WORK[currentRef.current].id,
            start: top - window.innerHeight,
            end: top + s.offsetHeight,
            arrive: 0,
            gesture: "rack",
            slot,
          },
        ];
      }
      const track = trackRef.current;
      if (!track) return [];
      const vh = window.innerHeight;
      const beatPx = (SCROLL.destination.approach + SCROLL.destination.hold) * vh;
      const top = pageTop(track);
      return WORK.map((w, i) => ({
        content: w.id,
        // the first destination starts arriving while the stage is still
        // rising into view
        start: i === 0 ? top - 0.5 * vh : top + i * beatPx,
        // the last one ends as the stage lets go: Em uso takes the frame from there (T3)
        end: top + (i + 1) * beatPx,
        arrive: i === 0 ? (0.5 * vh + ARRIVE * beatPx) / (0.5 * vh + beatPx) : ARRIVE,
        gesture: "rack" as const,
        slot,
      }));
    });
  }, [mode]);

  // Phone: a swipe changes the frame's content.
  useEffect(() => {
    if (mode === "swipe") notify();
  }, [mode, current]);

  // Wide: the words follow the scroll through the track.
  useLayoutEffect(() => {
    if (mode !== "scroll") return;
    const track = trackRef.current;
    const list = listRef.current;
    if (!track || !list) return;
    const items = [...list.querySelectorAll<HTMLElement>("[data-dest]")];
    const st = ScrollTrigger.create({
      trigger: track,
      start: "top top",
      end: () => `+=${WORK.length * (SCROLL.destination.approach + SCROLL.destination.hold) * window.innerHeight}`,
      onUpdate: (self) => {
        const at = self.progress * WORK.length;
        const i = Math.min(WORK.length - 1, Math.floor(at));
        const local = at - i;
        const arrive = clamp01(local / ARRIVE);
        // A cut, not a dissolve: the previous words leave in the first half
        // of the arrival, the new ones come in the second.
        const leave = clamp01(arrive * 2);
        const enter = clamp01(arrive * 2 - 1);
        items.forEach((el, k) => {
          const v = k === i ? (i === 0 ? 1 : enter) : k === i - 1 ? 1 - leave : 0;
          el.style.setProperty("--in", v.toFixed(4));
          el.style.setProperty("--dir", k < i ? "-1" : "1");
        });
        if (i !== currentRef.current) setCurrent(i);
      },
    });
    return () => st.kill();
  }, [mode]);

  // Phone: which card is centred in the swipe.
  useEffect(() => {
    if (mode !== "swipe") return;
    const sc = swipeRef.current;
    if (!sc || typeof IntersectionObserver === "undefined") return;
    const cards = [...sc.querySelectorAll<HTMLElement>("[data-dest]")];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setCurrent(cards.indexOf(e.target as HTMLElement));
      },
      { root: sc, threshold: 0.6 },
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [mode]);

  const count = (i: number) => `${String(i + 1).padStart(2, "0")}`;
  const total = String(WORK.length).padStart(2, "0");

  // the picture opens the case too (a pointer convenience: the "see details"
  // button is the way in for the keyboard and for assistive tech)
  const openOnClick = {
    onClick: () => {
      // what the frame shows, which between two destinations can lag the text
      const showing = document.querySelector<HTMLElement>(".jf")?.dataset.content;
      const w = WORK.find((x) => x.id === showing) ?? WORK[currentRef.current];
      if (w) onOpenCase?.(w, frameBox(w.id));
    },
    "data-hint": t("work.case.open_hint"),
  };

  const text = (w: WorkItem, i: number) => {
    const name = t(`work.items.${w.id}.title`);
    return (
      <>
        <p className="dest-count" aria-hidden="true">
          <span className="dest-mask">
            <span>{count(i)}</span>
          </span>
          <span className="dest-of">/{total}</span>
        </p>
        <p className="dest-kind">
          <span className="dest-mask">
            <span>{t(`work.kind.${w.kind}`)}</span>
          </span>
        </p>
        <h3 className="dest-name">
          <span className="dest-mask">
            <span>{name}</span>
          </span>
        </h3>
        <p className="dest-result">{t(`work.items.${w.id}.result`)}</p>
        {w.illustrative && <p className="dest-note">{t(`work.items.${w.id}.note`)}</p>}
        <div className="dest-actions">
          <button type="button" className="dest-open" onClick={() => onOpenCase?.(w, frameBox(w.id))} aria-label={t("work.case.open_aria", { name })}>
            {t("work.case.open")}
          </button>
          <a className="dest-link" href={w.href} target="_blank" rel="noreferrer" aria-label={t("work.visit_aria", { name })}>
            {w.loginRequired ? t("work.visit_login") : t("work.visit")}
          </a>
        </div>
      </>
    );
  };

  return (
    <section
      ref={sectionRef}
      id="projects"
      className="dest"
      data-journey="destinos"
      data-mode={mode}
      aria-labelledby="work-title"
      style={{ ["--beats" as string]: WORK.length, ["--beat-h" as string]: `${(SCROLL.destination.approach + SCROLL.destination.hold) * 100}svh` }}
    >
      {mode === "scroll" && (
        <div ref={trackRef} className="dest-track">
          <div className="dest-stage">
            <header className="dest-head">
              <h2 id="work-title" className="dest-title">
                {t("work.title")}
              </h2>
              <p className="dest-lead">{t("work.lead")}</p>
            </header>
            <ol ref={listRef} className="dest-list">
              {WORK.map((w, i) => (
                <li key={w.id} className="dest-item" data-dest={w.id} data-current={i === current ? "true" : "false"} {...(i !== current ? { inert: "" } : {})}>
                  {text(w, i)}
                </li>
              ))}
            </ol>
            <div ref={slotRef} className="dest-slot" data-frame-slot="destinos" {...openOnClick} />
          </div>
        </div>
      )}

      {mode === "swipe" && (
        <div className="dest-phone">
          <header className="dest-head">
            <h2 id="work-title" className="dest-title">
              {t("work.title")}
            </h2>
            <p className="dest-lead">{t("work.lead")}</p>
          </header>
          <div ref={slotRef} className="dest-slot" data-frame-slot="destinos" {...openOnClick} />
          <div ref={swipeRef} className="dest-swipe">
            {WORK.map((w, i) => (
              <article key={w.id} className="dest-card" data-dest={w.id} data-current={i === current ? "true" : "false"}>
                {text(w, i)}
              </article>
            ))}
          </div>
        </div>
      )}

      {mode === "list" && (
        <div className="dest-plain">
          <header className="dest-head">
            <h2 id="work-title" className="dest-title">
              {t("work.title")}
            </h2>
            <p className="dest-lead">{t("work.lead")}</p>
          </header>
          {WORK.map((w, i) => (
            <article key={w.id} className="dest-card" data-dest={w.id}>
              <img className="dest-still" onClick={() => onOpenCase?.(w, null)} src={w.image.src} srcSet={w.image.srcSet} sizes="(max-width: 767px) 92vw, 60vw" alt="" loading="lazy" decoding="async" />
              {text(w, i)}
            </article>
          ))}
        </div>
      )}

    </section>
  );
}
