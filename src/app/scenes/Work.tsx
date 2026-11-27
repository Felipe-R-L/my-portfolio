import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { WORK, type WorkItem } from "../data/work";
import { boxOf, pageTop, registerBeats } from "../journey/beats";
import { InlineFrame } from "../journey/InlineFrame";
import { registerPassages } from "../scroll/glide";
import type { Box } from "../journey/director";
import { SCROLL } from "../motion/tokens";
import { ScrollTrigger } from "../scroll/gsap";
import { clamp01 } from "../scroll/math";
import { useJourneyMode } from "../journey/useJourneyMode";
import { sound } from "../audio/sound";
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
  // phone: the picture is in the page
  const inline = document.querySelector<HTMLElement>(`.dest-phone .fi[data-content="${id}"]`);
  if (inline) {
    const r = inline.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  }
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
  // the next project sliding into place
  const heard = useRef(current);
  useEffect(() => {
    if (current === heard.current) return;
    sound.play("slide", { pan: current > heard.current ? 0.25 : -0.25 });
    heard.current = current;
  }, [current]);

  // The keyboard reaches every project, not only the one on stage: focusing a
  // project that is not showing takes the page to where it rests, mid-hold.
  const focusProject = (i: number) => {
    const track = trackRef.current;
    if (mode !== "scroll" || !track) return;
    const vh = window.innerHeight;
    const beatPx = (SCROLL.destination.approach + SCROLL.destination.hold) * vh;
    const base = pageTop(track);
    // already resting on this project: stay
    const y = window.scrollY;
    if (y >= base + (i + ARRIVE) * beatPx && y <= base + (i + 1) * beatPx) return;
    window.scrollTo({ top: base + (i + (ARRIVE + 1) / 2) * beatPx, behavior: "instant" as ScrollBehavior });
  };

  // The frame's beats, one per destination (wide screens; a phone has the
  // pictures in the cards' slot, see InlineFrame).
  useLayoutEffect(() => {
    if (mode !== "scroll") return;
    // Changes never left half done (scroll/glide.ts): the first arrival out
    // of the story, then each card turning into the next.
    const offPassages = registerPassages("destinos", () => {
      const track = trackRef.current;
      if (!track) return [];
      const vh = window.innerHeight;
      const beatPx = (SCROLL.destination.approach + SCROLL.destination.hold) * vh;
      const top = pageTop(track);
      return WORK.flatMap((_, i) => [
        // the first takes in the hero's stage going up as this one rises
        i === 0
          ? { from: top - vh, to: top + ARRIVE * beatPx, duration: 1.5 }
          : { from: top + i * beatPx, to: top + (i + ARRIVE) * beatPx },
        // each project then holds, read on a still stage
        { from: top + (i + ARRIVE) * beatPx, to: top + (i + 1) * beatPx, hold: true },
      ]);
    });
    const offBeats = registerBeats("destinos", () => {
      const slot = () => boxOf(slotRef.current);
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
        // the first comes into focus out of the story; between projects the cards change places
        gesture: i === 0 ? ("rack" as const) : ("swap" as const),
        slot,
      }));
    });
    return () => {
      offPassages();
      offBeats();
    };
  }, [mode]);

  // Wide: the words follow the scroll through the track.
  useLayoutEffect(() => {
    if (mode !== "scroll") return;
    const track = trackRef.current;
    const list = listRef.current;
    if (!track || !list) return;
    const items = [...list.querySelectorAll<HTMLElement>("[data-dest]")];
    const curtains = [...(slotRef.current?.querySelectorAll<HTMLElement>("[data-curtain]") ?? [])];
    const ghosts = [...(slotRef.current?.querySelectorAll<HTMLElement>("[data-ghost]") ?? [])];
    const ease = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2);
    const marks = [...(sectionRef.current?.querySelectorAll<HTMLElement>("[data-index]") ?? [])];
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
        // The change, as cards in space (Felipe, after a sliding curtain: a 3D
        // card changing places). The screen that leaves turns and falls back
        // to the left; the next one's title card comes out of the depth on
        // the right to the front, holds, and carries on towards the reader as
        // it opens on the new screen. Even a hurried scroll sees the name.
        // (a glide lands on the very end: a hair short of 1 is at rest)
        const moving = i > 0 && arrive > 0.001 && arrive < 0.999;
        const swap = ease(clamp01(arrive / 0.55));
        const pass = ease(clamp01((arrive - 0.68) / 0.32));
        // drawn in depth order: the old card is nearer until they cross
        const nearer = swap < 0.5 ? "ghost" : "curtain";
        ghosts.forEach((el, k) => {
          const on = moving && k === i - 1 && arrive < 0.6;
          el.style.visibility = on ? "visible" : "hidden";
          if (!on) return;
          el.style.zIndex = nearer === "ghost" ? "2" : "1";
          el.style.opacity = (1 - clamp01((arrive - 0.2) / 0.35)).toFixed(3);
          el.style.transform = `translate3d(${(-36 * swap).toFixed(2)}%, 0, ${(-560 * swap).toFixed(1)}px) rotateY(${(30 * swap).toFixed(2)}deg)`;
        });
        curtains.forEach((el, k) => {
          const on = moving && k === i;
          el.style.visibility = on ? "visible" : "hidden";
          if (!on) return;
          const back = 1 - swap;
          el.style.zIndex = nearer === "curtain" ? "2" : "1";
          el.style.opacity = (clamp01(arrive / 0.18) * (1 - pass)).toFixed(3);
          el.style.transform = `translate3d(${(36 * back).toFixed(2)}%, 0, ${(-560 * back + 260 * pass).toFixed(1)}px) rotateY(${(-30 * back).toFixed(2)}deg)`;
        });
        // The index over the picture: where we are among the projects.
        marks.forEach((el, k) => {
          // filled by the arrival, so it is whole by the time the project rests
          el.style.setProperty("--p", (k < i ? 1 : k === i ? arrive : 0).toFixed(4));
          el.dataset.on = k === i ? "true" : "false";
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
      const showing = document.querySelector<HTMLElement>(mode === "swipe" ? ".dest-phone .fi" : ".jf")?.dataset.content;
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
          <button type="button" className="dest-open" onClick={() => onOpenCase?.(w, frameBox(w.id))}>
            {t("work.case.open")}
            <span className="sr-only">{t("work.case.open_sr", { name })}</span>
          </button>
          <a className="dest-link" href={w.href} target="_blank" rel="noreferrer">
            {w.loginRequired ? t("work.visit_login") : t("work.visit")}
            <span className="sr-only">{t("work.visit_sr", { name })}</span>
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
              <span className="edge-print" aria-hidden="true">{t("journey.edge", { n: "02" })}</span>
            </header>
            <ol ref={listRef} className="dest-list">
              {WORK.map((w, i) => (
                <li key={w.id} className="dest-item" data-dest={w.id} data-current={i === current ? "true" : "false"} data-focus-handled="" onFocus={() => focusProject(i)}>
                  {text(w, i)}
                </li>
              ))}
            </ol>
            <div ref={slotRef} className="dest-slot" data-frame-slot="destinos" {...openOnClick}>
              <ol className="dest-index" aria-hidden="true">
                {WORK.map((w, i) => (
                  <li key={w.id} data-index={w.id} data-on={i === 0 ? "true" : "false"}>
                    <span className="dest-index-n">{count(i)}</span>
                    {t(`work.items.${w.id}.title`)}
                  </li>
                ))}
              </ol>
              {WORK.map((w) => (
                <div key={w.id} className="dest-ghost" data-ghost={w.id} aria-hidden="true">
                  <img src={w.video?.card?.poster ?? w.image.src} alt="" loading="lazy" decoding="async" />
                </div>
              ))}
              {WORK.map((w, i) => (
                <div key={w.id} className="dest-curtain" data-curtain={w.id} aria-hidden="true">
                  <span className="dest-curtain-count">
                    {count(i)}
                    <span>/{total}</span>
                  </span>
                  <span className="dest-curtain-kind">{t(`work.kind.${w.kind}`)}</span>
                  <span className="dest-curtain-name">{t(`work.items.${w.id}.title`)}</span>
                </div>
              ))}
            </div>
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
              <span className="edge-print" aria-hidden="true">{t("journey.edge", { n: "02" })}</span>
          </header>
          <div ref={slotRef} className="dest-slot" data-frame-slot="destinos" {...openOnClick}>
            <InlineFrame ids={WORK.map((w) => w.id)} current={WORK[current].id} />
          </div>
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
              <span className="edge-print" aria-hidden="true">{t("journey.edge", { n: "02" })}</span>
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
