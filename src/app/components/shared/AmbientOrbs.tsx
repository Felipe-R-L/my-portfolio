import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { cn } from "../../utils/cn";
import { useIsMobile } from "../../hooks/useIsMobile";

/**
 * The large blurred colour orbs behind each section.
 *
 * On mobile these are rendered static: a 150px blur on a 40rem element is one
 * of the most expensive paints on the page, and animating it forces a repaint
 * of that whole area every frame.
 *
 * On desktop the same hazard applies, and it was live. Motion animates `x`/`y`
 * as separate named values, which it cannot hand to the compositor, so it wrote
 * a fractional inline transform from the main thread every frame. Unpromoted,
 * that invalidated the enclosing section layer across the union of the old and
 * new blurred bounds — a 720px orb with a 150px blur rasterises as 1560x1560 —
 * and Skia re-ran the Gaussian each time. Measured on an Intel laptop iGPU: six
 * orbs held the page to 30fps; promoting them restored 60fps, and even 48
 * promoted orbs stayed at 60. Promotion, not orb count, is the variable.
 *
 * So each animated orb now gets `will-change: transform` while it is moving,
 * and stops moving entirely once it leaves the viewport. Four of the seven were
 * animating off-screen at any given scroll position.
 */
export interface Orb {
  className: string;
  /** Movement path; ignored on mobile and under reduced-motion. */
  x?: number[];
  y?: number[];
  duration?: number;
  delay?: number;
}

interface AmbientOrbsProps {
  orbs: Orb[];
  className?: string;
}

export function AmbientOrbs({ orbs, className }: AmbientOrbsProps) {
  const isMobile = useIsMobile();

  // No `overflow-hidden` on the wrapper: the orbs are deliberately larger than
  // their section and bleed past its edges. Clipping them would put a hard seam
  // across a 150px blur. `inset-0` inside the `relative` section reproduces the
  // exact positioning context they had when they were direct children.
  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)} aria-hidden="true">
      {orbs.map((orb, idx) =>
        isMobile ? (
          <div key={idx} className={cn("absolute rounded-full", orb.className)} />
        ) : (
          <AnimatedOrb key={idx} orb={orb} />
        ),
      )}
    </div>
  );
}

function AnimatedOrb({ orb }: { orb: Orb }) {
  const ref = useRef<HTMLDivElement>(null);
  // `amount: 0` so the orb starts moving as soon as any part of it is on
  // screen. These bleed well past their section, so anything stricter would
  // visibly snap them into motion.
  const inView = useInView(ref, { amount: 0 });

  return (
    <motion.div
      ref={ref}
      className={cn("absolute rounded-full", orb.className)}
      style={{ willChange: inView ? "transform" : "auto" }}
      animate={
        inView ? { x: orb.x ?? [0, 20, -10, 0], y: orb.y ?? [0, -15, 10, 0] } : { x: 0, y: 0 }
      }
      transition={
        inView
          ? {
              duration: orb.duration ?? 15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: orb.delay ?? 0,
            }
          : { duration: 0 }
      }
    />
  );
}
