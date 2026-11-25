import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { WORK } from "../data/work";
import { Draggable, ScrollTrigger, gsap } from "../scroll/gsap";
import { useScene } from "../scroll/useScene";
import "./Work.css";

/**
 * Scene 4, the work: a carousel you drag, in black and white, where the piece
 * in focus takes its colour back, the same gesture as the hero's reveal.
 * It is not pinned: dragging is sideways only and never fights the page's
 * vertical scroll. Scrolling past it turns everything back to black and white.
 */
export function Work() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [focus, setFocus] = useState(0);
  const [out, setOut] = useState(false);
  const goTo = useRef<(i: number) => void>(() => {});

  useScene(sectionRef, ({ reduced }) => {
    const viewport = viewportRef.current!;
    const track = trackRef.current!;
    const cards = () => [...track.querySelectorAll<HTMLElement>("[data-work]")];

    // x that puts card i at the start of the viewport, clamped to the track
    const minX = () => Math.min(0, viewport.clientWidth - track.scrollWidth);
    const xFor = (i: number) => Math.max(minX(), -(cards()[i]?.offsetLeft ?? 0) + (cards()[0]?.offsetLeft ?? 0));
    const nearest = (x: number) => {
      let best = 0;
      cards().forEach((_, i) => {
        if (Math.abs(xFor(i) - x) < Math.abs(xFor(best) - x)) best = i;
      });
      return best;
    };

    const [drag] = Draggable.create(track, {
      type: "x",
      lockAxis: true,
      allowNativeTouchScrolling: true,
      inertia: true,
      edgeResistance: 0.85,
      bounds: { minX: minX(), maxX: 0 },
      snap: (x: number) => xFor(nearest(x)),
      onDrag() {
        setFocus(nearest(this.x));
      },
      onThrowUpdate() {
        setFocus(nearest(this.x));
      },
    });

    goTo.current = (i: number) => {
      const target = Math.max(0, Math.min(WORK.length - 1, i));
      setFocus(target);
      gsap.to(track, {
        x: xFor(target),
        duration: reduced ? 0 : 0.7,
        ease: "power3.out",
        onUpdate: () => drag.update(),
      });
    };

    const onResize = () => {
      drag.applyBounds({ minX: minX(), maxX: 0 });
    };
    window.addEventListener("resize", onResize);

    // Leaving the scene: everything returns to black and white.
    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "bottom 55%",
      onEnter: () => setOut(true),
      onLeaveBack: () => setOut(false),
    });

    return () => {
      window.removeEventListener("resize", onResize);
      drag.kill();
    };
  });

  return (
    <section ref={sectionRef} id="projects" className="work" data-out={out ? "true" : "false"} aria-labelledby="work-title">
      <header className="work-head">
        <h2 id="work-title" className="work-title">
          {t("work.title")}
        </h2>
        <p className="work-lead">{t("work.lead")}</p>
        <div className="work-nav">
          <button type="button" className="work-arrow" onClick={() => goTo.current(focus - 1)} disabled={focus === 0} aria-label={t("work.prev")}>
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="work-arrow"
            onClick={() => goTo.current(focus + 1)}
            disabled={focus === WORK.length - 1}
            aria-label={t("work.next")}
          >
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div ref={viewportRef} className="work-viewport">
        <div ref={trackRef} className="work-track">
          {WORK.map((w, i) => {
            const name = t(`work.items.${w.id}.title`);
            return (
              <article
                key={w.id}
                className="work-card"
                data-work={w.id}
                data-focus={i === focus ? "true" : "false"}
                onPointerEnter={(e) => e.pointerType === "mouse" && setFocus(i)}
              >
                <figure className={`work-shot${w.image.lockup ? " work-shot--lockup" : ""}`}>
                  <img
                    src={w.image.src}
                    srcSet={w.image.srcSet}
                    sizes="(max-width: 767px) 82vw, 62vw"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                </figure>
                <div className="work-meta">
                  <span className="work-kind">{t(`work.kind.${w.kind}`)}</span>
                  <h3 className="work-name">{name}</h3>
                  <p className="work-result">{t(`work.items.${w.id}.result`)}</p>
                  {w.illustrative && <p className="work-note">{t(`work.items.${w.id}.note`)}</p>}
                  <a
                    className="work-link"
                    href={w.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={t("work.visit_aria", { name })}
                    onFocus={() => goTo.current(i)}
                  >
                    {w.loginRequired ? t("work.visit_login") : t("work.visit")}
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
