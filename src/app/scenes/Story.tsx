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

/** The night sky of an astronomy olympiad: orbits round a star (in focus or
    under the pointer it takes its colours: a warm star, coloured planets). */
function Orbit() {
  return (
    <svg viewBox="0 0 320 200">
      <circle className="story-glow" cx="160" cy="100" r="34" />
      <ellipse cx="160" cy="100" rx="140" ry="52" />
      <ellipse cx="160" cy="100" rx="96" ry="36" />
      <ellipse cx="160" cy="100" rx="52" ry="20" />
      <circle className="story-star" cx="160" cy="100" r="7" />
      <circle className="story-planet story-planet--a" cx="300" cy="100" r="5" />
      <circle className="story-planet story-planet--b" cx="112" cy="75" r="4" />
      <circle className="story-planet story-planet--c" cx="190" cy="118" r="3" />
      <circle className="story-planet story-planet--d" cx="40" cy="78" r="2.5" />
    </svg>
  );
}

/** The first program everyone writes (it takes an editor's colours). */
function Code() {
  return (
    <pre className="story-code">
      <span>
        <b className="tk-type">int</b> <b className="tk-fn">main</b>() {"{"}
      </span>
      <span>
        {"  "}
        <b className="tk-fn">printf</b>(<b className="tk-str">"Hello, world"</b>);
      </span>
      <span>
        {"  "}
        <b className="tk-key">return</b> <b className="tk-num">0</b>;
      </span>
      <span>
        {"}"}
        <i className="story-caret" />
      </span>
    </pre>
  );
}

/** A silver medal on its ribbon, drawn (no photo of the medal itself): it
    catches the light when the chapter is in focus or under the pointer. */
function Medal() {
  return (
    <svg viewBox="0 0 320 200">
      <defs>
        <linearGradient id="medal-silver" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2f5f8" />
          <stop offset="0.5" stopColor="#a9b3bc" />
          <stop offset="1" stopColor="#dfe5ea" />
        </linearGradient>
        <linearGradient id="medal-shine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="0.65" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id="medal-disc">
          <circle cx="160" cy="124" r="52" />
        </clipPath>
      </defs>
      <path className="story-ribbon story-ribbon--l" d="M118 0h34l26 82h-30z" />
      <path className="story-ribbon story-ribbon--r" d="M202 0h-34l-26 82h30z" />
      <circle className="story-medal" cx="160" cy="124" r="52" fill="url(#medal-silver)" />
      <circle cx="160" cy="124" r="42" fill="none" stroke="#7d8892" strokeWidth="1.5" />
      <path
        d="M160 98l7.6 15.4 17 2.5-12.3 12 2.9 16.9-15.2-8-15.2 8 2.9-16.9-12.3-12 17-2.5z"
        fill="#8c97a1"
      />
      <text x="160" y="162" textAnchor="middle" fontSize="10" letterSpacing="2" fill="#6b7680" fontFamily="ui-monospace, monospace">
        OBA
      </text>
      <g clipPath="url(#medal-disc)">
        <rect className="story-shine" x="60" y="60" width="200" height="130" fill="url(#medal-shine)" />
      </g>
    </svg>
  );
}

/** The chapter's picture: a photo (with the institution's mark, where there
    is one), or a drawing where no photo fits. */
function ChapterImage({ chapter }: { chapter: StoryChapter }) {
  const { t } = useTranslation();
  const img = chapter.image!;
  if ("figure" in img) {
    return (
      <figure className={`story-media story-media--${img.figure}`} aria-hidden="true">
        {img.figure === "orbit" ? <Orbit /> : img.figure === "medal" ? <Medal /> : <Code />}
      </figure>
    );
  }
  return (
    <figure className="story-media">
      <img
        src={img.src}
        srcSet={img.srcSet}
        sizes="(max-width: 767px) 90vw, 26vw"
        alt={t(`story.chapters.${chapter.id}.alt`)}
        loading="lazy"
        decoding="async"
      />
      {chapter.badge && (
        <span className="story-badge">
          <img src={chapter.badge} alt={t(`story.chapters.${chapter.id}.badge`)} loading="lazy" decoding="async" />
        </span>
      )}
    </figure>
  );
}

/** The same program, run: the card shows the code, the background what it
    printed (the terminal of a first class). */
function Terminal() {
  return (
    <pre className="story-term">
      <span>
        <b className="tm-prompt">$</b> ./hello
      </span>
      <span className="tm-out">Hello, world</span>
      <span>
        <b className="tm-prompt">$</b> <i className="story-caret" />
      </span>
    </pre>
  );
}

/** What fills the space behind the rail for one chapter. */
function ChapterBackground({ chapter }: { chapter: StoryChapter }) {
  const bg = chapter.bg;
  if ("figure" in bg) {
    return <div className={`story-bg-figure story-bg-figure--${bg.figure}`}>{bg.figure === "orbit" ? <Orbit /> : <Terminal />}</div>;
  }
  return <img className="story-bg-img" src={bg.src} srcSet={bg.srcSet} sizes="80vw" alt="" loading="lazy" decoding="async" />;
}

function Chapters({ focus, past = focus }: { focus: number; past?: number }) {
  const { t } = useTranslation();
  return (
    <>
      {STORY.map((c, i) => (
        <article
          key={c.id}
          className={`story-chapter${c.seal ? " story-chapter--seal" : ""}`}
          data-chapter={c.id}
          data-focus={i === focus ? "true" : "false"}
          data-past={i < past ? "true" : "false"}
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
  const [past, setPast] = useState(0);
  const distance = useRef(0);
  // where each chapter starts and how wide it is, inside the track (measured)
  const spans = useRef<{ left: number; width: number }[]>([]);
  const bgRefs = useRef<(HTMLDivElement | null)[]>([]);

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
      // By where the chapters are, not by their index: a chapter steps out of
      // the way once its left edge reaches the portrait. (Reads first,
      // writes after: no layout is forced.)
      const ring = document.querySelector(".city-ring")?.getBoundingClientRect();
      const railLeft = rail.getBoundingClientRect().left;
      const edge = (ring && ring.width > 0 ? ring.right : railLeft) + 24;
      const shift = railLeft + x + (1 - enter) * 80;
      let firstIn = spans.current.length;
      spans.current.forEach((c, i) => {
        if (shift + c.left >= edge && firstIn === spans.current.length) firstIn = i;
      });
      track.style.transform = `translate3d(${x + (1 - enter) * 80}px, 0, 0)`;
      // the backgrounds follow the cards, measured from the portrait: a
      // chapter's background is all there while its card is the first one
      // beside the portrait, and it has turned into the next one's by the
      // time the card slips behind (the first card starts at the portrait,
      // so OBA's sky is the opening). They slide at a third of the cards'
      // speed and settle as they come in; the last one lands with the end.
      const step = spans.current.length > 1 ? spans.current[1].left - spans.current[0].left : window.innerWidth / 3;
      const lead = spans.current.length ? railLeft + spans.current[0].left - edge : 0;
      const geo = (-x - lead) / step + 0.5;
      const at = Math.min(STORY.length - 1, Math.max(0, geo, span(p, TRAVEL_FROM, TRAVEL_TO) * (STORY.length - 1)));
      bgRefs.current.forEach((el, i) => {
        if (!el) return;
        const off = (i - at) * step;
        // a plateau, then the morph in the middle half of the way
        const w = Math.min(1, Math.max(0, 1.5 - 2 * Math.abs(i - at)));
        el.style.opacity = (w * enter).toFixed(3);
        el.style.transform = `translate3d(${(off * 0.3).toFixed(1)}px, 0, 0) scale(${(1.08 - 0.08 * w).toFixed(4)})`;
      });
      // before anything is laid out (or with no layout at all) the index rules
      if (spans.current.some((c) => c.width > 0)) {
        setPast(firstIn);
        // the card in focus is the one whose background is up, unless it
        // has already slid behind the portrait
        setFocus(Math.min(STORY.length - 1, Math.max(firstIn, Math.round(at))));
      } else {
        const i = chapterAt(span(p, TRAVEL_FROM, TRAVEL_TO), STORY.length);
        setPast(i);
        setFocus(i);
      }
    };
    const measure = () => {
      spans.current = Array.from(track.querySelectorAll<HTMLElement>(".story-chapter")).map((el) => ({ left: el.offsetLeft, width: el.offsetWidth }));
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
      <div className="story-bg" aria-hidden="true">
        {STORY.map((c, i) => (
          <div key={c.id} ref={(el) => (bgRefs.current[i] = el)} className="story-bg-layer" data-bg={c.id}>
            <ChapterBackground chapter={c} />
          </div>
        ))}
      </div>
      <div ref={trackRef} className="story-track">
        <Chapters focus={focus} past={past} />
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
    <section id="about" className="story-list" data-journey="partida" aria-labelledby="story-title">
      <h2 id="story-title" className="sr-only">
        {t("story.title")}
      </h2>
      <div ref={listRef} className="story-list-items">
        <Chapters focus={focus} />
      </div>
    </section>
  );
}
