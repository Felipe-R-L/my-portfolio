import { useEffect, useRef, useState } from "react";

import { ProjectVideo } from "../components/ProjectVideo";
import { MotionShot } from "../components/motion/MotionShot";
import { FRAME_CONTENTS } from "./contents";
import "./InlineFrame.css";

/**
 * The journey's frame on a phone: the same pictures, in the flow of the page.
 *
 * On a phone the fixed frame was placed by script after every scroll, and on
 * iOS the page scrolls before any script runs, so the picture trailed its card
 * by a frame and trembled while the address bar collapsed. Here it is part of
 * the card and scrolls with it natively. Changing `current` (a swipe) racks
 * the new picture in over the old one.
 */
export function InlineFrame({ ids, current }: { ids: readonly string[]; current: string }) {
  const ref = useRef<HTMLDivElement>(null);
  // fetch nothing until a screen away; play only while on screen
  const [near, setNear] = useState(false);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setNear(true);
      setSeen(true);
      return;
    }
    const nearIo = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "100% 0px" });
    const seenIo = new IntersectionObserver(([e]) => setSeen(e.isIntersecting));
    nearIo.observe(el);
    seenIo.observe(el);
    return () => {
      nearIo.disconnect();
      seenIo.disconnect();
    };
  }, []);

  const contents = FRAME_CONTENTS.filter((c) => ids.includes(c.id));
  return (
    <div ref={ref} className="fi" data-content={current} aria-hidden="true">
      {contents.map((c) => {
        const on = c.id === current;
        return (
          <div key={c.id} className="fi-layer" data-on={on ? "true" : "false"}>
            <div className="jf-shot">
              {near && (
                <>
                  <img className="jf-blur" src={c.blur} alt="" decoding="async" />
                  {c.motion && c.video ? (
                    <MotionShot className="jf-sharp" clip={c.motion.clip} textBase={c.motion.text} sources={c.video} active={on && seen} warm wide />
                  ) : (
                    <ProjectVideo className="jf-sharp" sources={c.video} image={c.image} active={on && seen} wide />
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
      <span className="fi-ring" />
    </div>
  );
}
