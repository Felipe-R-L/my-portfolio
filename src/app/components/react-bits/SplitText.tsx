import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import "./SplitText.css";

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  animationFrom?: Record<string, string | number>;
  animationTo?: Record<string, string | number>;
  easing?: string;
  threshold?: number;
  rootMargin?: string;
  textAlign?: "left" | "center" | "right";
  onLetterAnimationComplete?: () => void;
}

const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = "",
  delay = 50,
  animationFrom = { opacity: 0, transform: "translate3d(0, 40px, 0)" },
  animationTo = { opacity: 1, transform: "translate3d(0, 0, 0)" },
  easing = "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  threshold = 0.1,
  rootMargin = "-100px",
  textAlign = "center",
  onLetterAnimationComplete,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [completedIndexes, setCompletedIndexes] = useState<Set<number>>(
    new Set(),
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const letters = useMemo(() => {
    return text.split("").map((char, i) => ({
      char: char === " " ? "\u00A0" : char,
      index: i,
    }));
  }, [text]);

  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLSpanElement>, idx: number) => {
      // Only trigger once per element by checking a specific property
      if (e.propertyName === "transform" || e.propertyName === "opacity") {
        setCompletedIndexes((prev) => {
          if (prev.has(idx)) return prev;
          const next = new Set(prev);
          next.add(idx);
          return next;
        });
        if (idx === letters.length - 1 && onLetterAnimationComplete) {
          onLetterAnimationComplete();
        }
      }
    },
    [letters.length, onLetterAnimationComplete],
  );

  return (
    <span
      ref={ref}
      className={`split-text ${className}`}
      style={{ textAlign, display: "inline-block" }}
    >
      {/*
        `aria-label` on a plain <span> is ignored by the accessibility tree and
        flagged by axe (aria-prohibited-attr). Exposing the real string in a
        visually-hidden node and hiding the per-letter spans gives assistive
        tech the whole word instead of a stream of single characters.
      */}
      <span className="sr-only">{text}</span>
      {letters.map(({ char, index }) => (
        <span
          key={index}
          className="split-text-letter"
          style={{
            ...(isVisible ? animationTo : animationFrom),
            transform: completedIndexes.has(index)
              ? "none"
              : isVisible
                ? (animationTo.transform as string)
                : (animationFrom.transform as string),
            transition: completedIndexes.has(index)
              ? "none"
              : `all 0.6s ${easing} ${index * delay}ms`,
            display: "inline-block",
          }}
          onTransitionEnd={(e) => handleTransitionEnd(e, index)}
          aria-hidden="true"
        >
          {char}
        </span>
      ))}
    </span>
  );
};

export default SplitText;
