import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { WORK } from "../data/work";
import { Draggable, ScrollTrigger, gsap } from "../scroll/gsap";
import { useScene } from "../scroll/useScene";
import "./Work.css";

/**
 * Scene 4, the work, in black and white, where the piece in focus takes its
 * colour back, the same gesture as the hero's reveal. On a wide screen the
 * section is pinned and the page's own scroll carries the cards sideways; the
 * arrows scroll the page to a card. On a phone (and with reduced motion) it is
 * a carousel you drag, which never fights the vertical scroll. Scrolling past
 * it turns everything back to black and white.
 */
export function Work() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [focus, setFocus] = useState(0);
  const [out, setOut] = useState(false);
  const goTo = useRef<(i: number) => void>(() => {});

  useScene(sectionRef, ({ reduced, isPhone }) => {
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

    // The scene is one screen tall: the picture gets the height the
    // heading and the tallest caption leave, so no caption is ever cut.
    const fit = () => {
      for (let pass = 0; pass < 2; pass++) {
        const metas = [...track.querySelectorAll<HTMLElement>(".work-meta")];
        const meta = Math.max(0, ...metas.map((m) => m.offsetHeight));
        const room = viewport.clientHeight - meta - 12;
        const h = Math.max(140, Math.min(room, (window.innerWidth * 0.62) / 1.6));
        track.style.setProperty("--shot-h", `${Math.round(h)}px`);
      }
    };
    // only the wide layout is one screen tall
    if (!isPhone) {
      fit();
      ScrollTrigger.addEventListener("refreshInit", fit);
    }
    const offFit = () => ScrollTrigger.removeEventListener("refreshInit", fit);

    // Wide screens: the page scroll drives the cards.
    if (!isPhone && !reduced) {
      // a card's width of scroll per card, so each one has time to be read
      const travel = () => -minX() * 1.4;
      const st = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: () => `+=${travel()}`,
        pin: true,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const x = minX() * self.progress;
          gsap.set(track, { x });
          setFocus(nearest(x));
        },
        onRefresh: (self) => gsap.set(track, { x: minX() * self.progress }),
      });
      goTo.current = (i: number) => {
        const target = Math.max(0, Math.min(WORK.length - 1, i));
        const m = minX();
        const p = m === 0 ? 0 : xFor(target) / m;
        window.scrollTo({ top: st.start + p * (st.end - st.start), behavior: "smooth" });
      };
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: () => `top+=${travel()} top`,
        end: "+=1",
        onEnter: () => setOut(true),
        onLeaveBack: () => setOut(false),
      });
      return offFit;
    }

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
      offFit();
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
