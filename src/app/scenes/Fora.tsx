import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MutableRefObject } from "react";
import { useTranslation } from "react-i18next";
import type Lenis from "lenis";

import { GALLERY, PHOTOS, columnsOf, photoSrc, type GalleryItem } from "../data/gallery";
import { media } from "../media";
import { EdgePrint } from "../journey/EdgePrint";
import "./Fora.css";

/** How many columns the mosaic has at this width. */
function columnsFor(w: number): number {
  // a phone keeps two narrow columns: one would be fourteen screens long
  return w < 1000 ? 2 : 3;
}

function useColumns(): number {
  const [n, setN] = useState(() => (typeof window === "undefined" ? 3 : columnsFor(window.innerWidth)));
  useEffect(() => {
    const on = () => setN(columnsFor(window.innerWidth));
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return n;
}

/** The mosaic's columns: half the screen up to 1000px, then a third of 1200px. */
const SIZES = "(max-width: 999px) 50vw, 400px";

/**
 * Fora do código: the life outside work, as Felipe's own photos in a mosaic,
 * between Como funciona and the invitation (T5 starts at its end, Talk).
 * Each photo keeps its own proportions, its place, its day and its exposure
 * under it, in the film's edge print; a click opens it big.
 */
export function Fora({ lenisRef }: { lenisRef?: MutableRefObject<Lenis | null> }) {
  const { t } = useTranslation();
  const cols = useColumns();
  const [open, setOpen] = useState<number | null>(null);
  const rootRef = useRef<HTMLElement>(null);

  // frames come up as they enter, once; armed only by script, so without it
  // (or with reduced motion) every frame is simply there
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const frames = [...root.querySelectorAll<HTMLElement>(".fora-frame")];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).dataset.in = "true";
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    frames.forEach((f) => {
      if (f.dataset.in !== "true") f.dataset.armed = "true";
      io.observe(f);
    });
    return () => io.disconnect();
  }, [cols]);

  return (
    <section ref={rootRef} id="gallery" className="fora" data-journey="fora" aria-labelledby="fora-title">
      <header className="fora-head">
        <div className="fora-copy">
          <h2 id="fora-title" className="fora-title">
            {t("fora.title")}
          </h2>
          <EdgePrint n="04" />
        </div>
        <p className="fora-lead">{t("fora.lead")}</p>
      </header>

      <div className="fora-mosaic">
        {columnsOf(GALLERY, cols).map((ids, c) => (
          <div key={c} className="fora-col">
            {ids.map((i) => (
              <Frame key={GALLERY[i].key} item={GALLERY[i]} n={i + 1} onOpen={() => setOpen(PHOTOS.indexOf(GALLERY[i]))} />
            ))}
          </div>
        ))}
      </div>

      <Lightbox at={open} onChange={setOpen} lenisRef={lenisRef} />
    </section>
  );
}

function Caption({ item, n }: { item: GalleryItem; n: number }) {
  return (
    <figcaption className="fora-cap">
      <span className="fora-cap-1">
        <span>{item.place?.toUpperCase() ?? ""}</span>
        <span>{item.date}</span>
      </span>
      <span className="fora-cap-2">
        <span>{item.exposure}</span>
        <span>{String(n).padStart(2, "0")}</span>
      </span>
    </figcaption>
  );
}

function Frame({ item, n, onOpen }: { item: GalleryItem; n: number; onOpen: () => void }) {
  const { t } = useTranslation();
  const title = t(`fora.photos.${item.key}`);
  return (
    <figure className="fora-frame" style={{ ["--r" as string]: item.ratio }}>
      {item.video ? (
        <div className="fora-shot">
          <Loop item={item} />
        </div>
      ) : (
        <button type="button" className="fora-shot" onClick={onOpen} aria-label={t("fora.open", { title })}>
          <picture>
            <source type="image/avif" srcSet={`${photoSrc(item.key, 800, "avif")} 800w, ${photoSrc(item.key, 1600, "avif")} 1600w`} sizes={SIZES} />
            <img
              src={photoSrc(item.key, 800, "webp")}
              srcSet={`${photoSrc(item.key, 800, "webp")} 800w, ${photoSrc(item.key, 1600, "webp")} 1600w`}
              sizes={SIZES}
              alt={title}
              loading="lazy"
              decoding="async"
            />
          </picture>
        </button>
      )}
      <Caption item={item} n={n} />
    </figure>
  );
}

/** The clip: muted, looping, and playing only while it is on screen. */
function Loop({ item }: { item: GalleryItem }) {
  const { t } = useTranslation();
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  const vid = item.video!;
  return (
    <video ref={ref} muted loop playsInline preload="none" poster={media(vid.poster)} aria-label={t(`fora.photos.${item.key}`)}>
      <source src={media(vid.webm)} type="video/webm" />
      <source src={media(vid.mp4)} type="video/mp4" />
    </video>
  );
}

/** The photo big, over the page: arrows or the keys to page through, Esc or a click outside to close. */
function Lightbox({
  at,
  onChange,
  lenisRef,
}: {
  at: number | null;
  onChange: (i: number | null) => void;
  lenisRef?: MutableRefObject<Lenis | null>;
}) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const item = at === null ? null : PHOTOS[at];

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (at !== null && !d.open) {
      d.showModal?.();
      lenisRef?.current?.stop();
    } else if (at === null && d.open) {
      d.close();
    }
  }, [at, lenisRef]);

  const close = useCallback(() => onChange(null), [onChange]);
  const step = useCallback(
    (k: number) => {
      if (at === null) return;
      onChange((at + k + PHOTOS.length) % PHOTOS.length);
    },
    [at, onChange],
  );

  return (
    <dialog
      ref={ref}
      className="fora-box"
      data-lenis-prevent=""
      aria-label={item ? t(`fora.photos.${item.key}`) : undefined}
      onClose={() => {
        lenisRef?.current?.start();
        close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") step(1);
        else if (e.key === "ArrowLeft") step(-1);
      }}
    >
      {item && (
        <figure className="fora-box-fig">
          <picture>
            <source type="image/avif" srcSet={`${photoSrc(item.key, 1600, "avif")} 1600w`} sizes="92vw" />
            <img src={photoSrc(item.key, 1600, "webp")} alt={t(`fora.photos.${item.key}`)} decoding="async" style={{ aspectRatio: item.ratio }} />
          </picture>
          <figcaption className="fora-box-cap">
            <span className="fora-box-title">{t(`fora.photos.${item.key}`)}</span>
            <span className="fora-box-meta">{[item.place, item.date, item.exposure, item.camera].filter(Boolean).join(" · ")}</span>
          </figcaption>
        </figure>
      )}
      <div className="fora-box-nav">
        <button type="button" onClick={() => step(-1)} aria-label={t("fora.prev")}>
          ←
        </button>
        <span className="fora-box-count">{at === null ? "" : t("fora.count", { n: at + 1, total: PHOTOS.length })}</span>
        <button type="button" onClick={() => step(1)} aria-label={t("fora.next")}>
          →
        </button>
      </div>
      <button type="button" className="fora-box-close" onClick={close} aria-label={t("fora.close")}>
        ×
      </button>
    </dialog>
  );
}
