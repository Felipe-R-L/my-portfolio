import { useEffect, useRef, useState } from "react";

import type { ProjectVideoSources } from "../data/work";

/** True when the visitor asked for less motion or for data saving. */
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
 * A project's recorded loop: muted, inline, looping. It loads nothing until
 * it is `active` (the frame is showing it), pauses as soon as it is not, and
 * stays on its poster with reduced motion or with data saving on. Without
 * sources it is the still image, so a project with no recording yet still has
 * its picture.
 */
export function ProjectVideo({
  sources,
  image,
  active,
  wide,
  className,
}: {
  sources?: ProjectVideoSources;
  image: { src: string; srcSet?: string };
  active: boolean;
  /** Prefer the 1440 encode (a large frame on a dense screen). */
  wide?: boolean;
  className?: string;
}) {
  const still = useStillOnly();
  const ref = useRef<HTMLVideoElement>(null);
  // once loaded, keep the element so coming back does not refetch
  const [armed, setArmed] = useState(false);
  const playable = !!sources && !still;

  useEffect(() => {
    if (active && playable) setArmed(true);
  }, [active, playable]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active) v.play().catch(() => {});
    else v.pause();
  }, [active, armed]);

  if (!playable || !armed) {
    return (
      <img
        className={className}
        src={sources?.poster ?? image.src}
        srcSet={sources ? undefined : image.srcSet}
        sizes="(max-width: 767px) 100vw, 60vw"
        alt=""
        decoding="async"
        loading="lazy"
        draggable={false}
      />
    );
  }
  const file = wide ? sources.w1440 : sources.w720;
  return (
    <video ref={ref} className={className} poster={sources.poster} muted playsInline loop preload="auto" aria-hidden="true">
      {file.webm && <source src={file.webm} type="video/webm" />}
      <source src={file.mp4} type="video/mp4" />
    </video>
  );
}
