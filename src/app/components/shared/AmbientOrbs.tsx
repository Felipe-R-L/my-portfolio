import { motion } from "motion/react";
import { cn } from "../../utils/cn";
import { useIsMobile } from "../../hooks/useIsMobile";

/**
 * The large blurred colour orbs behind each section.
 *
 * On mobile these are rendered static: a 150px blur on a 40rem element is one
 * of the most expensive paints on the page, and animating it forces a repaint
 * of that whole area every frame.
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
          <motion.div
            key={idx}
            className={cn("absolute rounded-full", orb.className)}
            animate={{ x: orb.x ?? [0, 20, -10, 0], y: orb.y ?? [0, -15, 10, 0] }}
            transition={{
              duration: orb.duration ?? 15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: orb.delay ?? 0,
            }}
          />
        ),
      )}
    </div>
  );
}
