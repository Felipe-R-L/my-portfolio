import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { sound } from "../audio/sound";
import { SeaWash } from "../components/hero/SeaWash";
import type { Camera } from "../components/hero/camera";
import { media } from "../media";
import { UNDER_EVENT } from "../scroll/glide";
import { createSignal } from "../scroll/signal";
import "./TalkSea.css";

/** The last frame of Diamante's flight: what the sea leaves behind it, the
    Contato's own background (AmbientLight). */
const END = { src: media("diamante-end-2400.webp"), width: 2400, height: 1350 };

/**
 * The sea again, closing the film (Felipe, 2026-11-27, in place of the pull
 * back over the city): from the last shot of Como funciona the same wave as
 * the opening comes up over the page, covers it, and goes back leaving the
 * invitation over Diamante. The page itself crosses to the Contato while the
 * screen is covered (the "retorno" passage plays `under` it), so nothing is
 * seen scrolling. Over the page, under the nav.
 *
 * Mounted once the visitor nears Como funciona (the water is fetched then).
 */
export function TalkSea() {
  const wash = useMemo(() => createSignal(0), []);
  const camera = useMemo(() => createSignal<Camera>({ x: 0, y: 0, scale: 1 }), []);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const plano = document.querySelector(".plano-track");
    if (!plano || !("IntersectionObserver" in window)) {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "100% 0px" });
    io.observe(plano);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    // Diamante's last frame, covering the screen, under the shallows
    const fit = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scale = Math.max(vw / END.width, vh / END.height);
      camera.set({ scale, x: (vw - END.width * scale) / 2, y: (vh - END.height * scale) / 2 });
    };
    fit();
    window.addEventListener("resize", fit);

    let tween: gsap.core.Tween | null = null;
    const onUnder = (e: Event) => {
      const { seconds } = (e as CustomEvent<{ dir: number; seconds: number }>).detail;
      tween?.kill();
      const s = { w: 0 };
      let was = 0;
      wash.set(0);
      sound.play("wave");
      tween = gsap.to(s, {
        w: 1,
        duration: seconds,
        ease: "none",
        onUpdate: () => {
          if (was < 0.54 && s.w >= 0.54) sound.play("shore");
          was = s.w;
          wash.set(s.w);
        },
        // gone: the canvas hides itself at 1 (SeaWash draws only inside 0..1)
        onComplete: () => wash.set(1),
      });
    };
    window.addEventListener(UNDER_EVENT, onUnder);
    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener(UNDER_EVENT, onUnder);
      tween?.kill();
    };
  }, [wash, camera]);

  if (!near) return null;
  return createPortal(
    <div className="talk-sea" aria-hidden="true">
      <SeaWash wash={wash} camera={camera} portraitSrc={END.src} portraitSize={END} phone={false} />
    </div>,
    document.body,
  );
}
