import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { MOTION, type CameraKey } from "../../data/motion";
import type { ProjectVideoSources } from "../../data/work";
import { CLIP_DIR, clickAt, cursorAt, loadClip, type ClipMeta } from "./clip";
import "./MotionShot.css";

const W = 1440;
const H = 900;
/** The last frame holds this long before the loop starts again. */
const HOLD = 1.2;

const ease = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2);
const out = (u: number) => 1 - (1 - u) ** 3;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const seg = (t: number, a: number, b: number, f = ease) => f(clamp01((t - a) / (b - a)));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** The camera between its keys, eased. */
function cameraAt(keys: CameraKey[], t: number): CameraKey {
  if (t <= keys[0].t) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (t <= b.t) {
      const k = ease(clamp01((t - a.t) / Math.max(0.001, b.t - a.t)));
      return { t, rx: lerp(a.rx, b.rx, k), ry: lerp(a.ry, b.ry, k), s: lerp(a.s, b.s, k), x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) };
    }
  }
  return keys[keys.length - 1];
}

/**
 * Creating a <video> costs a dropped frame or two (the element and its
 * decoder, measured at 50-80 ms with a slow CPU), so the clips that are near
 * are created ahead of time, one at a time, and only while the page is still:
 * a reader pausing on a chapter never sees it. If nobody pauses, a clip is
 * created when it plays, as before.
 */
const warmQueue: (() => void)[] = [];
let lastScroll = 0;
let warming = false;
function whenStill(job: () => void) {
  warmQueue.push(job);
  if (warming) return;
  warming = true;
  addEventListener("scroll", () => (lastScroll = performance.now()), { passive: true });
  const check = () => {
    if (warmQueue.length === 0) {
      warming = false;
      return;
    }
    if (performance.now() - lastScroll > 400 && document.visibilityState === "visible") warmQueue.shift()?.();
    setTimeout(check, 250);
  };
  setTimeout(check, 250);
}

function useStillOnly(): boolean {
  const [still, setStill] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const conn = (navigator as { connection?: { saveData?: boolean } }).connection;
    const update = () => setStill(!!mq?.matches || !!conn?.saveData);
    update();
    mq?.addEventListener?.("change", update);
    return () => mq?.removeEventListener?.("change", update);
  }, []);
  return still;
}

/**
 * A project's recorded screen, presented with motion (data/motion.ts): the
 * video plays inside a screen the camera moves, the hand is drawn over it
 * from its recorded path (smooth at the display's rate, whatever the video's),
 * with the caption of each moment. Everything is driven by the video's own
 * clock and moves by transform and opacity only.
 *
 * It fetches nothing heavy until `active`; it pauses when not. With reduced
 * motion or data saving it is the poster, laid out as the motion rests.
 */
export function MotionShot({
  clip,
  sources,
  textBase,
  active,
  warm,
  wide,
  className,
}: {
  clip: string;
  sources: ProjectVideoSources;
  /** i18n base for the captions: `work.items.<id>.motion`. */
  textBase: string;
  active: boolean;
  /** Near: create the video ahead of time, while the page is still. */
  warm?: boolean;
  wide?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const spec = MOTION[clip] ?? { mode: "plain" as const };
  const still = useStillOnly();
  const [meta, setMeta] = useState<ClipMeta | null>(null);
  const [armed, setArmed] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const capRef = useRef<HTMLDivElement>(null);
  const playable = !still;

  useEffect(() => {
    let live = true;
    loadClip(clip).then((m) => live && setMeta(m));
    return () => {
      live = false;
    };
  }, [clip]);

  useEffect(() => {
    if (!playable || armed) return;
    if (active) {
      setArmed(true);
      return;
    }
    if (!warm) return;
    let live = true;
    whenStill(() => live && setArmed(true));
    return () => {
      live = false;
    };
  }, [active, warm, playable, armed]);

  // the world in the video's pixels, scaled to the box; text keeps a floor size
  useLayoutEffect(() => {
    const root = rootRef.current;
    const world = worldRef.current;
    if (!root || !world) return;
    const fit = () => {
      const k = root.clientWidth / W || 1;
      world.style.transform = `scale(${k})`;
      root.style.setProperty("--fs", String(Math.max(1, 0.42 / k)));
    };
    fit();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(fit);
    ro?.observe(root);
    return () => ro?.disconnect();
  }, []);

  const plan = useMemo(() => {
    if (!meta) return null;
    if (spec.mode === "camera") return { keys: spec.camera(meta), captions: spec.captions(meta), ring: spec.ring?.(meta) ?? null };
    return { keys: null, captions: [], ring: null };
  }, [meta, spec]);

  // one frame of the composition at time `tm` (seconds on the video's clock)
  const render = (tm: number, rest = false) => {
    const screen = screenRef.current;
    if (!screen || !meta || !plan) return;
    const end = meta.duration;
    if (plan.keys) {
      const c = rest ? { rx: 0, ry: 0, s: 1, x: W / 2, y: H / 2 } : { ...cameraAt(plan.keys, tm) };
      // zoomed in, the view never runs past the screen's edge
      if (c.s >= 1) {
        c.x = Math.min(Math.max(c.x, W / (2 * c.s)), W - W / (2 * c.s));
        c.y = Math.min(Math.max(c.y, H / (2 * c.s)), H - H / (2 * c.s));
      }
      screen.style.transform = `translate(${W / 2}px, ${H / 2}px) rotateX(${c.rx}deg) rotateY(${c.ry}deg) scale(${c.s}) translate(${-c.x}px, ${-c.y}px)`;
    }
    // the hand
    const cur = cursorRef.current;
    if (cur) {
      const p = cursorAt(meta, Math.min(tm, end));
      const press = clickAt(meta, tm);
      const hidden = rest || tm > end + 0.2;
      cur.style.opacity = hidden ? "0" : "1";
      cur.style.transform = `translate(${p.x - 4}px, ${p.y - 3}px) scale(${press >= 0 && press < 0.22 ? 0.86 : 1})`;
      const pulse = pulseRef.current;
      if (pulse) {
        pulse.style.opacity = !hidden && press >= 0 ? String(1 - press) : "0";
        pulse.style.transform = `translate(${p.x}px, ${p.y}px) scale(${0.4 + Math.max(0, press) * 0.9})`;
      }
    }
    const ring = ringRef.current;
    if (ring && plan.ring) {
      const k = rest ? 0 : seg(tm, plan.ring.from, plan.ring.from + 0.5, out) * (1 - seg(tm, plan.ring.to, plan.ring.to + 0.4));
      ring.style.opacity = String(k);
      ring.style.transform = `scale(${lerp(1.06, 1, k)})`;
    }
    const cap = capRef.current;
    if (cap) {
      const now = rest ? null : plan.captions.find((c) => tm >= c.from && tm < c.to);
      if (now) {
        const k = seg(tm, now.from, now.from + 0.4, out) * (1 - seg(tm, now.to - 0.3, now.to));
        const text = t(`${textBase}.${now.key}`);
        if (cap.textContent !== text) cap.textContent = text;
        cap.style.opacity = String(k);
        cap.style.transform = `translateY(${(1 - k) * 14}px)`;
      } else cap.style.opacity = "0";
    }
  };

  // the clock: the video's time while it plays, then a held last frame, then the loop
  useEffect(() => {
    const v = videoRef.current;
    if (!meta || !plan) return;
    if (!armed || !v) {
      render(0, !playable);
      return;
    }
    let raf = 0;
    let holdFrom = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (v.ended || holdFrom) {
        if (!holdFrom) holdFrom = performance.now();
        const held = (performance.now() - holdFrom) / 1000;
        render(meta.duration + held);
        if (held >= HOLD) {
          holdFrom = 0;
          v.currentTime = 0;
          void v.play()?.catch(() => {});
        }
        return;
      }
      render(v.currentTime);
    };
    if (active) {
      v.muted = true;
      void v.play()?.catch(() => {});
      raf = requestAnimationFrame(tick);
    } else {
      v.pause();
    }
    return () => cancelAnimationFrame(raf);
    // render reads refs; it changes with meta, plan and the language only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, armed, meta, plan, playable]);

  const file = wide ? sources.w1440 : sources.w720;
  const showVideo = armed && playable;

  return (
    <div ref={rootRef} className={`ms ${className ?? ""}`} data-mode={spec.mode} aria-hidden="true">
      <div ref={worldRef} className="ms-world">
        <div ref={screenRef} className="ms-screen">
          {showVideo ? (
            <video ref={videoRef} poster={sources.poster} muted playsInline preload="auto">
              {file.webm && <source src={file.webm} type="video/webm" />}
              <source src={file.mp4} type="video/mp4" />
            </video>
          ) : (
            <img src={sources.poster} alt="" decoding="async" loading="lazy" draggable={false} />
          )}
          {plan?.ring && (
            <div
              ref={ringRef}
              className="ms-ring"
              style={{ left: plan.ring.rect.x - 10, top: plan.ring.rect.y - 10, width: plan.ring.rect.w + 20, height: plan.ring.rect.h + 20 }}
            />
          )}
          {spec.mode !== "plain" || showVideo ? (
            <>
              <div ref={pulseRef} className="ms-pulse" />
              <div ref={cursorRef} className="ms-cursor">
                <svg viewBox="0 0 22 22" aria-hidden="true">
                  <path d="M3 2l15 8.2-6.6 1.6L8 18.5z" />
                </svg>
              </div>
            </>
          ) : null}
        </div>
        {plan && plan.captions.length > 0 && (
          <div ref={capRef} className="ms-cap" data-at={spec.mode === "camera" && spec.captionTop ? "top" : "bottom"} />
        )}
      </div>
    </div>
  );
}
