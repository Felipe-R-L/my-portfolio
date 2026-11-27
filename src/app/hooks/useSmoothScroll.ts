import { useEffect, useRef } from "react";
import Lenis from "lenis";
import type { VirtualScrollData } from "lenis";

import { gsap, ScrollTrigger } from "../scroll/gsap";
import { isJumping } from "../scroll/jump";
import { UNDER_EVENT, underCurve, durationFor, holdAhead, speedFor, holds, passages, playTarget, settleDuration, settleTarget, type Passage } from "../scroll/glide";

/** A wheel event this long after the previous one, or clearly stronger than
    it, starts a new gesture; anything else is the same gesture's tail (a
    trackpad's inertia), which must not count as the visitor insisting. */
const GESTURE_GAP_MS = 140;
/** The scrollbar and the keys: how long the page must be still, and the
    pointer up, before a half-done change is finished. */
const SETTLE_IDLE_MS = 220;
/** How hard the visitor scrolls sets the playback speed, like a video's:
    the wheel's travel over the last quarter second, in screens. Up to CALM
    (a notch, an easy swipe) everything plays at 1x; a hard flick or a spun
    wheel, at HARD and beyond, plays at MAX_SPEED. In between, a straight
    ramp. The speed holds while the gesture lasts (its inertia included) and
    comes back to 1x once it has been quiet for SPEED_HOLD_MS. */
const SPEED_WINDOW_MS = 250;
const CALM_SCREENS = 0.35;
const HARD_SCREENS = 1.6;
const MAX_SPEED = 2.5;
const SPEED_HOLD_MS = 400;
/** The wheel's own smoothing: at 1x, and at full speed (a shorter tail, the
    inertia of a fast scroll cut down too). */
const LERP_CALM = 0.12;
const LERP_FAST = 0.25;
/** Engaging the next change before this one has run down, like a gear
    taken before the revs drop: a gesture the same way in the last ENGAGE_SHARE
    of a change's time (or one still pushing, at least ACTIVE_PX per event,
    rather than inertia dying away) carries the page into the next change
    without a stop. */
const ENGAGE_SHARE = 0.4;
const ACTIVE_PX = 6;
/** Insisting halves what is left of the change, down to this. */
const FASTEST_S = 0.35;

/** Sine curves: their fastest moment is about 1.6x the average speed. A
    cubic peaks at 3x, and the camera and the cards read as a jolt. */
/** The beat a change with a sea in it waits after the one before has come
    to rest, however hard the visitor keeps scrolling. */
const SEA_BREATH_MS = 650;
const easeInOut = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const easeOut = (t: number) => Math.sin((t * Math.PI) / 2);
/** Half straight, half sine: moving from the first frame, peak at 1.3x. */
const softInOut = (t: number) => 0.5 * t + 0.5 * easeInOut(t);

type Play = { passage: Passage; to: number; dir: number; start: number; dur: number; speed: number };

/**
 * Lenis smooth scrolling on desktop, driven by GSAP's ticker so ScrollTrigger
 * and Lenis read the same frame. Off on phones (native touch scrolling) and
 * for visitors who asked for reduced motion.
 *
 * It also plays the passages (scroll/glide.ts), so no change is ever left
 * half done, while the visitor keeps the pace: a harder scroll plays the
 * changes faster (and cuts the inertia short), like speeding up a video;
 * insisting hurries the change under way; turning back reverses it;
 * the scrollbar and the keys stay in their hand.
 */
export function useSmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const isPhone = window.matchMedia("(max-width: 767px)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isPhone || reduced) return;

    let play: Play | null = null;
    let tailUntil = 0;
    /** When the last change came to rest (for the seas' breath before them). */
    let endedAt = 0;
    /** The next change is engaged: it starts as this one lands, at the speed
        this one arrives with (px/s). */
    let engaged: { dir: number; v: number } | null = null;
    let speed = 1;
    let speedUntil = 0;
    const recent: { t: number; abs: number }[] = [];
    let lastWheel = 0;
    let lastAbs = 0;
    let settleTimer = 0;
    let pointerDown = false;
    const vh = () => window.innerHeight;
    /** The speed now: what the gesture set, back to 1x once it has calmed. */
    const currentSpeed = (lenis: Lenis) => {
      if (performance.now() > speedUntil && speed !== 1) {
        speed = 1;
        applyLerp(lenis);
      }
      return speed;
    };
    const applyLerp = (lenis: Lenis) => {
      lenis.options.lerp = LERP_CALM + ((LERP_FAST - LERP_CALM) * (speed - 1)) / (MAX_SPEED - 1);
    };

    const run = (lenis: Lenis, p: Omit<Play, "start" | "speed">, easing: (t: number) => number) => {
      play = { ...p, start: performance.now(), speed: speedFor(p.passage, speed) };
      if (p.passage.under) window.dispatchEvent(new CustomEvent(UNDER_EVENT, { detail: { dir: p.dir, seconds: p.dur } }));
      if (import.meta.env.DEV) {
        const w = window as unknown as { __glideLog?: unknown[] };
        (w.__glideLog ??= []).push({ from: Math.round(lenis.animatedScroll), to: Math.round(p.to), dur: +p.dur.toFixed(2), speed: +speedFor(p.passage, speed).toFixed(2) });
      }
      lenis.scrollTo(p.to, {
        duration: p.dur,
        easing,
        force: true,
        onComplete: () => {
          play = null;
          endedAt = performance.now();
          const e = engaged;
          engaged = null;
          if (e && advance(lenis, e.dir, e.dir * 2, e.v)) return;
          tailUntil = performance.now() + GESTURE_GAP_MS;
        },
      });
    };

    /**
     * From where the page is, into the change a move by `delta` reaches: a
     * hold in between is crossed at once (nothing on screen moves across it).
     * With `v`, the page is already moving at v px/s (an engaged change):
     * the change starts at that speed and eases out, so the two join without
     * a stop. False if there is no change to play.
     */
    const advance = (lenis: Lenis, dir: number, delta: number, v?: number): boolean => {
      const across = holdAhead(holds(), lenis.targetScroll, dir);
      if (across !== null) {
        lenis.scrollTo(across, { immediate: true, force: true });
        delta = dir * Math.max(Math.abs(delta), 2);
      }
      const hit = playTarget(passages(), lenis.targetScroll, delta);
      if (!hit) return across !== null;
      // a change under a cover or on its own clock (the seas) is never
      // carried into by the momentum of the one before: it waits for a
      // gesture of its own, so the last shot before it is seen and heard
      if (v !== undefined && (hit.passage.under || hit.passage.whole)) return across !== null;
      // and not on the heels of it either: the shot before is given a beat
      // to land (lit, its shutter heard) before the sea takes the screen
      if ((hit.passage.under || hit.passage.whole) && performance.now() - endedAt < SEA_BREATH_MS) return true;
      const d = Math.abs(hit.to - lenis.animatedScroll);
      const base = durationFor(hit.passage, hit.to - lenis.animatedScroll, vh()) / speedFor(hit.passage, speed);
      if (v && v > 0 && !hit.passage.under && !hit.passage.whole) {
        // an ease-out starts at pi/2 times its average speed: match the
        // speed the page arrives with, within reason
        const joined = Math.min(base, Math.max(0.6 * base, (Math.PI / 2) * (d / v)));
        run(lenis, { ...hit, dir, dur: joined }, easeOut);
      } else run(lenis, { ...hit, dir, dur: base }, hit.passage.under ? underCurve : hit.passage.soft ? softInOut : easeInOut);
      return true;
    };

    const onWheel = ({ deltaY, event }: VirtualScrollData): boolean => {
      const lenis = lenisRef.current;
      if (!lenis || lenis.isStopped || event.ctrlKey || !event.type.includes("wheel")) return true;
      // a scrolling layer of its own (the case page) keeps its scroll
      if (event.composedPath().some((n) => n instanceof HTMLElement && n.hasAttribute("data-lenis-prevent"))) return true;
      const dir = Math.sign(deltaY);
      if (!dir) return true;
      const now = performance.now();
      const abs = Math.abs(deltaY);
      const fresh = now - lastWheel > GESTURE_GAP_MS || abs > lastAbs * 1.5 + 2;
      lastWheel = now;
      lastAbs = abs;

      // How hard the visitor is scrolling sets the playback speed.
      recent.push({ t: now, abs });
      while (recent.length && now - recent[0].t > SPEED_WINDOW_MS) recent.shift();
      const travel = (recent.reduce((sum, r) => sum + r.abs, 0) * lenis.options.wheelMultiplier) / vh();
      const felt = 1 + (MAX_SPEED - 1) * Math.min(1, Math.max(0, (travel - CALM_SCREENS) / (HARD_SCREENS - CALM_SCREENS)));
      if (felt > 1.05) speedUntil = now + SPEED_HOLD_MS;
      speed = Math.max(felt, currentSpeed(lenis));
      applyLerp(lenis);

      const eat = () => {
        if (event.cancelable) event.preventDefault();
        return false;
      };

      // something else took the scroll over (a nav jump): forget the play
      if (play && !lenis.isScrolling) {
        play = null;
        engaged = null;
      }

      if (play) {
        const p = play;
        // under a cover (the sea), or with a clock of its own inside: it
        // runs its course at its own time
        if (p.passage.under || p.passage.whole) return eat();
        const left = Math.max(0, p.dur - (now - p.start) / 1000);
        // the gear taken before the revs drop: a push the same way in the
        // change's last stretch engages the next one; this one keeps its
        // speed to the end instead of settling, and the next takes it over
        const nextOwn = (() => {
          // (across a hold, if one waits in between)
          const n = playTarget(passages(), holdAhead(holds(), p.to, dir) ?? p.to, dir * 2);
          return !!n && (n.passage.under || n.passage.whole);
        })();
        if (dir === p.dir && !engaged && !nextOwn && (fresh || abs >= ACTIVE_PX) && left < ENGAGE_SHARE * p.dur) {
          const rest = Math.abs(p.to - lenis.animatedScroll);
          if (left > 0.05 && rest > 1) {
            engaged = { dir, v: rest / left };
            run(lenis, { ...p, dur: left }, (t) => t);
          } else engaged = { dir, v: 0 };
          return eat();
        }
        // a harder gesture under way: the rest of the change plays faster
        const asked = speedFor(p.passage, speed);
        if (dir === p.dir && asked > p.speed * 1.2 && !engaged) {
          if (left > 0.15) run(lenis, { ...p, dur: Math.max(0.15, (left * p.speed) / asked) }, easeOut);
          return eat();
        }
        if (!fresh) return eat();
        if (dir !== play.dir) {
          // turning back: the change reverses from where it is
          engaged = null;
          const to = dir > 0 ? play.passage.to : play.passage.from;
          run(lenis, { passage: play.passage, to, dir, dur: durationFor(play.passage, to - lenis.animatedScroll, vh()) / speedFor(play.passage, speed) }, easeOut);
          return eat();
        }
        // insisting: this change hurries along (the next one waits for a
        // gesture of its own: stacking them read as the page running away)
        if (engaged) return eat();
        if (left > FASTEST_S * 1.5) run(lenis, { ...play, dur: Math.max(FASTEST_S, left * 0.5) }, easeOut);
        return eat();
      }

      // after a change, only inertia dying away is eaten; a hand still
      // pushing goes on into the next one
      if (now < tailUntil && !fresh && abs < ACTIVE_PX) {
        tailUntil = now + GESTURE_GAP_MS;
        return eat();
      }

      return advance(lenis, dir, deltaY * lenis.options.wheelMultiplier) ? eat() : true;
    };

    // The scrollbar and the keys: the page follows the hand; once it is let
    // go inside a change, the change finishes the way it was going.
    const settle = () => {
      settleTimer = 0;
      const lenis = lenisRef.current;
      // (a nav jump flying the page through changes is not a hand letting go)
      if (!lenis || play || pointerDown || onScrollbar || lenis.isStopped || isJumping()) return;
      // still easing out from the wheel: look again once it has come to rest
      if (Math.abs(lenis.targetScroll - lenis.animatedScroll) > 2 && lenis.isScrolling) {
        settleLater(80);
        return;
      }
      // dev only: the capture script holds a change half done to shoot it
      if (import.meta.env.DEV && (window as unknown as { __glideHold?: boolean }).__glideHold) return;
      const to = settleTarget(passages(), lenis.targetScroll, moveDir);
      if (to === null) return;
      run(lenis, { passage: { from: to, to }, to, dir: Math.sign(to - lenis.animatedScroll), dur: settleDuration(to - lenis.animatedScroll, vh()) }, easeOut);
    };
    const settleLater = (ms = SETTLE_IDLE_MS) => {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settle, ms);
    };
    // Chrome tells the page nothing while the scrollbar's thumb is held, so
    // a pointer last seen over the scrollbar counts as holding it; the
    // change finishes once the pointer is back over the page.
    let onScrollbar = false;
    const onMove = (e: PointerEvent) => {
      const over = e.clientX >= document.documentElement.clientWidth;
      if (onScrollbar && !over) settleLater(120);
      onScrollbar = over;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    const onDown = () => (pointerDown = true);
    const onUp = () => {
      if (!pointerDown) return;
      pointerDown = false;
      settleLater(120);
    };
    window.addEventListener("pointerdown", onDown, true);
    window.addEventListener("pointerup", onUp, true);
    window.addEventListener("blur", onUp);

    const lenis = new Lenis({
      // A wheel notch moves 70% of the default: the scenes are scroll-driven,
      // and at full speed one flick skipped a whole chapter.
      lerp: LERP_CALM,
      wheelMultiplier: 1,
      smoothWheel: true,
      autoResize: true,
      virtualScroll: onWheel,
    });
    lenisRef.current = lenis;

    // the way the page last moved, by any means (Lenis keeps a direction for
    // its smooth scroll only)
    let moveDir = 0;
    let lastY = window.scrollY;
    lenis.on("scroll", () => {
      ScrollTrigger.update();
      const yNow = window.scrollY;
      if (yNow !== lastY) moveDir = Math.sign(yNow - lastY);
      lastY = yNow;
      if (lenis.isScrolling === "native") {
        // the hand has the page: whatever was playing gives way
        play = null;
        engaged = null;
        settleLater();
      }
    });
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      window.clearTimeout(settleTimer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("pointerup", onUp, true);
      window.removeEventListener("blur", onUp);
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return lenisRef;
}
