import { useRef, type ReactNode } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "motion/react";
import "./ScrollReveal.css";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  containerClassName?: string;
}

/**
 * Reveals copy word by word as it scrolls into view.
 *
 * The previous version called `setProgress` from a `scroll` listener, so every
 * scroll frame re-rendered the whole subtree, and each word carried
 * `transition: all 0.1s` over a value that changed every ~16ms — the transition
 * was permanently chasing a moving target, which showed up as words jittering
 * up and down while scrolling. Driving the words from MotionValues keeps the
 * work off React entirely: no re-render, no transition fighting the scroll.
 */
function Word({
  progress,
  index,
  total,
  baseOpacity,
  baseRotation,
  blurStrength,
  enableBlur,
  children,
}: {
  progress: MotionValue<number>;
  index: number;
  total: number;
  baseOpacity: number;
  baseRotation: number;
  blurStrength: number;
  enableBlur: boolean;
  children: ReactNode;
}) {
  // Same stagger the original used, expressed as an input range instead of
  // being recomputed in JS on every frame.
  const start = index / (total * 1.5);
  const end = start + 1 / (total * 1.2);

  const eased = useTransform(progress, [start, end], [0, 1], { clamp: true });

  /*
   * Everything derived from scroll is quantised.
   *
   * Lenis approaches its target asymptotically, so the last stretch of a smooth
   * scroll moves by fractions of a pixel across many frames. Feeding those
   * fractions straight into a transform makes the text sit between two device
   * pixels and get re-rasterised with different antialiasing every frame — it
   * reads as the words vibrating just as the scroll settles, instead of coming
   * to rest. Whole-pixel offsets have nothing left to dither between.
   */
  const opacity = useTransform(eased, (v) => Math.round((baseOpacity + v * (1 - baseOpacity)) * 100) / 100);
  const y = useTransform(eased, (v) => Math.round((1 - v) * 10));
  const rotate = useTransform(eased, (v) => {
    const deg = baseRotation - v * baseRotation;
    // Sub-degree rotation on text is the worst offender: snap it out entirely.
    return deg < 0.3 ? 0 : Math.round(deg * 2) / 2;
  });
  const filter = useTransform(eased, (v) => {
    if (!enableBlur) return "none";
    const blur = blurStrength - v * blurStrength;
    // Half-pixel steps: a blur radius that changes every frame forces a
    // re-rasterisation of the glyph on every one of them.
    return blur > 0.5 ? `blur(${Math.round(blur * 2) / 2}px)` : "none";
  });

  return (
    <motion.span className="scroll-reveal-word" style={{ opacity, y, rotate, filter }}>
      {children}
    </motion.span>
  );
}

export default function ScrollReveal({
  children,
  className = "",
  enableBlur = true,
  baseOpacity = 0.45,
  baseRotation = 3,
  blurStrength = 2,
  containerClassName = "",
}: ScrollRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  // Matches the old hand-rolled range: 0 when the block's top sits at the
  // bottom of the viewport, 1 when it reaches 20% from the top.
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "start 0.2"],
  });

  const words = typeof children === "string" ? children.split(" ") : null;

  if (!words || prefersReduced) {
    return (
      <div ref={containerRef} className={`scroll-reveal-container ${containerClassName}`}>
        <span className={`scroll-reveal-text ${className}`}>{children}</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`scroll-reveal-container ${containerClassName}`}>
      <span className={`scroll-reveal-text ${className}`}>
        {words.map((word, i) => (
          <Word
            key={i}
            progress={scrollYProgress}
            index={i}
            total={words.length}
            baseOpacity={baseOpacity}
            baseRotation={baseRotation}
            blurStrength={blurStrength}
            enableBlur={enableBlur}
          >
            {word}
            {/* Words are flex items, so a plain trailing space would collapse. */}
            {i < words.length - 1 ? "\u00A0" : ""}
          </Word>
        ))}
      </span>
    </div>
  );
}
