import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { ProjectVideo } from "../components/ProjectVideo";
import { MotionShot } from "../components/motion/MotionShot";
import { ScrollTrigger } from "../scroll/gsap";
import { collectBeats, onBeatsChange } from "./beats";
import { FRAME_CONTENTS } from "./contents";
import { frameAt, layerMix, type Beat, type FrameState } from "./director";
import "./JourneyFrame.css";

const DRIFT = new Map(FRAME_CONTENTS.filter((c) => c.drift).map((c) => [c.id, c.drift!]));

/**
 * The journey's frame: one fixed box, on screen from the first destination
 * on, which every scene places through its beats (see director.ts). The box
 * is a 16:10 panel scaled uniformly, so moving it is one transform and its
 * contents are never squashed; each picture inside is a layer that only
 * changes opacity and scale. Decorative to assistive tech: each scene says in
 * words what the frame shows.
 */
export function JourneyFrame() {
  const rootRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef(new Map<string, HTMLDivElement>());
  const shotRefs = useRef(new Map<string, HTMLDivElement>());
  const [shown, setShown] = useState<string | null>(null);
  // The layers sit inside the viewport, so lazy loading would fetch every
  // picture with the page and compete with the hero (LCP). Nothing is
  // fetched until the visitor is two screens from the first beat.
  const [near, setNear] = useState(false);

  useLayoutEffect(() => {
    let beats: Beat[] = [];
    let raf = 0;
    let last: FrameState | null = null;
    let lastShown: string | null = null;
    let nearRef = false;

    const apply = () => {
      raf = 0;
      const root = rootRef.current;
      const box = boxRef.current;
      if (!root || !box) return;
      if (!nearRef && beats.length && window.scrollY >= beats[0].start - 2 * window.innerHeight) {
        nearRef = true;
        setNear(true);
      }
      const s = frameAt(window.scrollY, beats);
      if (!s.visible) {
        if (last?.visible !== false) root.dataset.visible = "false";
        last = s;
        if (lastShown !== null) setShown((lastShown = null));
        return;
      }
      root.dataset.visible = "true";
      // what is showing, for the light the frame casts (see the CSS)
      if (root.dataset.content !== s.content) root.dataset.content = s.content;
      const vw = window.innerWidth;
      const scale = (s.box.w / vw) * s.approach;
      // scale about the slot's centre during the first approach
      const x = s.box.x + (s.box.w * (1 - s.approach)) / 2;
      const y = s.box.y + (s.box.h * (1 - s.approach)) / 2;
      box.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
      // edge and corner hold their size on screen, down to the marker's
      const inv = (1 / Math.max(scale, 0.02)).toFixed(3);
      if (box.style.getPropertyValue("--inv") !== inv) box.style.setProperty("--inv", inv);

      const m = layerMix(s.gesture, s.mix);
      const boxOpacity = s.prev ? m.box.toFixed(3) : "1";
      if (box.style.opacity !== boxOpacity) box.style.opacity = boxOpacity;
      layerRefs.current.forEach((el, id) => {
        const isIn = id === s.content;
        const isOut = id === s.prev;
        if (!isIn && !isOut) {
          if (el.dataset.on !== "false") el.dataset.on = "false";
          return;
        }
        el.dataset.on = "true";
        el.style.zIndex = isIn ? "2" : "1";
        el.style.opacity = String(isIn ? (s.prev ? m.inOpacity : 1) : m.outOpacity);
        el.style.transform = `scale(${isIn ? (s.prev ? m.inScale : 1) : m.outScale})`;
        el.style.setProperty("--sharp", String(isIn ? (s.prev ? m.inSharp : 1) : 1));
        el.style.setProperty("--dim", String(isOut ? m.outDim : 0));
        // the shot's own camera move, inside the frame
        const drift = DRIFT.get(id);
        const shot = shotRefs.current.get(id);
        if (drift && shot) {
          const d = drift(isIn ? s.t : 1);
          shot.style.transform = `translate3d(${d.x}%, ${d.y}%, 0) scale(${d.s})`;
        }
      });
      if (lastShown !== s.content) setShown((lastShown = s.content));
      last = s;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const rebuild = () => {
      beats = collectBeats();
      schedule();
    };

    // A phone's address bar showing or hiding changes only the height; the
    // beats are rebuilt by ScrollTrigger's refresh when it matters, and doing
    // it on every step of the bar made the frame jump (iOS Chrome).
    let lastW = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth === lastW && matchMedia("(pointer: coarse)").matches) return;
      lastW = window.innerWidth;
      rebuild();
    };

    rebuild();
    const offBeats = onBeatsChange(rebuild);
    ScrollTrigger.addEventListener("refresh", rebuild);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize);
    // images and fonts arriving change the page's height, and with it every
    // beat's scroll offsets; re-measure whenever that happens
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(rebuild) : null;
    ro?.observe(document.body);
    return () => {
      ro?.disconnect();
      offBeats();
      ScrollTrigger.removeEventListener("refresh", rebuild);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={rootRef} className="jf" data-visible="false" aria-hidden="true">
      <div ref={boxRef} className="jf-box">
        {FRAME_CONTENTS.map((c) => (
          <div
            key={c.id}
            className="jf-layer"
            data-on="false"
            ref={(el) => {
              if (el) layerRefs.current.set(c.id, el);
              else layerRefs.current.delete(c.id);
            }}
          >
            <div
              className="jf-shot"
              ref={(el) => {
                if (el) shotRefs.current.set(c.id, el);
                else shotRefs.current.delete(c.id);
              }}
            >
              {near && (
                <>
                  <img className="jf-blur" src={c.blur} alt="" decoding="async" />
                  {c.motion && c.video ? (
                    <MotionShot className="jf-sharp" clip={c.motion.clip} textBase={c.motion.text} sources={c.video} active={shown === c.id} warm wide />
                  ) : (
                    <ProjectVideo className="jf-sharp" sources={c.video} image={c.image} active={shown === c.id} wide />
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        <span className="jf-ring" />
      </div>
    </div>
  );
}

/** Keeps the frame's beats in step with layout changes React cannot see. */
export function useBeatsRefresh(deps: unknown[]) {
  useEffect(() => {
    ScrollTrigger.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
