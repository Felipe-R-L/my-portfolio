import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { ProjectVideo } from "../components/ProjectVideo";
import { ScrollTrigger } from "../scroll/gsap";
import { collectBeats, onBeatsChange } from "./beats";
import { FRAME_CONTENTS } from "./contents";
import { frameAt, layerMix, type Beat, type FrameState } from "./director";
import "./JourneyFrame.css";

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
  const [shown, setShown] = useState<string | null>(null);

  useLayoutEffect(() => {
    let beats: Beat[] = [];
    let raf = 0;
    let last: FrameState | null = null;
    let lastShown: string | null = null;

    const apply = () => {
      raf = 0;
      const root = rootRef.current;
      const box = boxRef.current;
      if (!root || !box) return;
      const s = frameAt(window.scrollY, beats);
      if (!s.visible) {
        if (last?.visible !== false) root.dataset.visible = "false";
        last = s;
        if (lastShown !== null) setShown((lastShown = null));
        return;
      }
      root.dataset.visible = "true";
      const vw = window.innerWidth;
      const scale = (s.box.w / vw) * s.approach;
      // scale about the slot's centre during the first approach
      const x = s.box.x + (s.box.w * (1 - s.approach)) / 2;
      const y = s.box.y + (s.box.h * (1 - s.approach)) / 2;
      box.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;

      const m = layerMix(s.gesture, s.mix);
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

    rebuild();
    const offBeats = onBeatsChange(rebuild);
    ScrollTrigger.addEventListener("refresh", rebuild);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", rebuild);
    // images and fonts arriving change the page's height, and with it every
    // beat's scroll offsets; re-measure whenever that happens
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(rebuild) : null;
    ro?.observe(document.body);
    return () => {
      ro?.disconnect();
      offBeats();
      ScrollTrigger.removeEventListener("refresh", rebuild);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", rebuild);
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
            <img className="jf-blur" src={c.blur} alt="" decoding="async" />
            <ProjectVideo className="jf-sharp" sources={c.video} image={c.image} active={shown === c.id} wide />
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
