import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { STORY, chapterAt, type StoryChapter } from "../data/story";
import { span, timelineDistance } from "../scroll/math";
import type { Signal } from "../scroll/signal";
import "./Story.css";

/**
 * Scene 3, who I am, told as a timeline in the editorial voice of the page.
 *
 * - `rail` (desktop): drawn inside the hero's pinned stage, to the right of
 *   the framed photo, and moved sideways by the scene's scroll progress.
 * - `list` (phones, reduced motion): the same chapters as a vertical list in
 *   the page's normal flow.
 */
export function Story(props: { mode: "rail"; progress: Signal<number> } | { mode: "list" }) {
  return props.mode === "rail" ? <StoryRail progress={props.progress} /> : <StoryList />;
}

/** Rail beats, over story progress: the rail enters once the photo has
    moved aside (HeroCity's ASIDE_TO is 0.1), travels, then leaves. */
const ENTER_FROM = 0.03;
const ENTER_TO = 0.08;
const TRAVEL_FROM = 0.19;
const TRAVEL_TO = 0.85;

/** The chapter's picture: a photo, or a drawing where no photo fits. */
function ChapterImage({ chapter }: { chapter: StoryChapter }) {
  const { t } = useTranslation();
  const img = chapter.image!;
  if ("figure" in img) {
    return (
      <figure className={`story-media story-media--${img.figure}`} aria-hidden="true">
        {img.figure === "orbit" ? (
          // the night sky of an astronomy olympiad: orbits round a star
          <svg viewBox="0 0 320 200">
            <ellipse cx="160" cy="100" rx="140" ry="52" />
            <ellipse cx="160" cy="100" rx="96" ry="36" />
            <ellipse cx="160" cy="100" rx="52" ry="20" />
            <circle className="story-star" cx="160" cy="100" r="7" />
            <circle className="story-planet" cx="300" cy="100" r="5" />
            <circle className="story-planet" cx="112" cy="75" r="4" />
            <circle className="story-planet" cx="190" cy="118" r="3" />
          </svg>
        ) : (
          // the first program everyone writes
          <pre className="story-code">
            <span>{"int main() {"}</span>
            <span>{'  printf("Hello, world");'}</span>
            <span>{"  return 0;"}</span>
            <span>{"}"}</span>
          </pre>
        )}
      </figure>
    );
  }
  return (
    <figure className="story-media">
      <img
        src={img.src}
        srcSet={img.srcSet}
        sizes="(max-width: 767px) 90vw, 24vw"
        alt={t(`story.chapters.${chapter.id}.alt`)}
        loading="lazy"
        decoding="async"
      />
    </figure>
  );
}

function Chapters({ focus }: { focus: number }) {
  const { t } = useTranslation();
  return (
    <>
      {STORY.map((c, i) => (
        <article
          key={c.id}
          className={`story-chapter${c.seal ? " story-chapter--seal" : ""}`}
          data-chapter={c.id}
          data-focus={i === focus ? "true" : "false"}
          data-past={i < focus ? "true" : "false"}
        >
          {/* "Today" is its own title; a year label would only repeat it. */}
          {c.id !== "hoje" ? (
            <span className="story-year">{c.year}</span>
          ) : (
            <span className="story-year story-year--blank" aria-hidden="true">
              ·
            </span>
          )}
          {c.image && <ChapterImage chapter={c} />}
          <h3 className="story-title">{t(`story.chapters.${c.id}.title`)}</h3>
          <p className="story-text">{t(`story.chapters.${c.id}.text`)}</p>
        </article>
      ))}
    </>
  );
}

function StoryRail({ progress }: { progress: Signal<number> }) {
  const { t } = useTranslation();
  const railRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [focus, setFocus] = useState(0);
  const distance = useRef(0);

  useLayoutEffect(() => {
    const rail = railRef.current;
    const track = trackRef.current;
    if (!rail || !track) return;
    const apply = (p: number) => {
      const enter = span(p, ENTER_FROM, ENTER_TO);
      // No fade on the way out: the last chapter stays lit and the stage,
      // released by its sticky parent, carries it off the top of the screen.
      rail.style.opacity = String(enter);
      rail.style.visibility = p <= 0 ? "hidden" : "visible";
      const x = -distance.current * span(p, TRAVEL_FROM, TRAVEL_TO);
      track.style.transform = `translate3d(${x + (1 - enter) * 80}px, 0, 0)`;
      setFocus(chapterAt(span(p, TRAVEL_FROM, TRAVEL_TO), STORY.length));
    };
    const measure = () => {
      distance.current = timelineDistance(track.scrollWidth, rail.clientWidth);
      apply(progress.get());
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(rail);
    ro.observe(track);
    const off = progress.on("change", apply);
    return () => {
      off();
      ro.disconnect();
    };
  }, [progress]);

  return (
    <div ref={railRef} className="story-rail" data-no-reveal="">
      <h2 className="sr-only">{t("story.title")}</h2>
      <div ref={trackRef} className="story-track">
        <Chapters focus={focus} />
      </div>
    </div>
  );
}

function StoryList() {
  const { t } = useTranslation();
  const [focus, setFocus] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  // On a phone the chapter nearest the middle of the screen is the one in focus.
  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof IntersectionObserver === "undefined") return;
    const items = [...list.querySelectorAll<HTMLElement>("[data-chapter]")];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setFocus(items.indexOf(e.target as HTMLElement));
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section id="about" className="story-list" aria-labelledby="story-title">
      <h2 id="story-title" className="sr-only">
        {t("story.title")}
      </h2>
      <div ref={listRef} className="story-list-items">
        <Chapters focus={focus} />
      </div>
    </section>
  );
}
