import React, { useRef, useEffect, useState, type ReactNode, type CSSProperties } from "react";
import "./ScrollReveal.css";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  containerClassName?: string;
  rotationEnd?: string;
  wordAnimationEnd?: string;
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = "",
  enableBlur = true,
  baseOpacity = 0.1,
  baseRotation = 3,
  blurStrength = 4,
  containerClassName = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      // Calculate progress: 0 when element enters bottom, 1 when it hits middle-top
      const elementTop = rect.top;
      const elementHeight = rect.height;
      const start = viewportHeight;
      const end = viewportHeight * 0.2;
      const raw = 1 - (elementTop - end) / (start - end);
      setProgress(Math.max(0, Math.min(1, raw)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const words =
    typeof children === "string"
      ? children.split(" ")
      : [children];

  return (
    <div ref={containerRef} className={`scroll-reveal-container ${containerClassName}`}>
      <span className={`scroll-reveal-text ${className}`}>
        {words.map((word, i) => {
          const wordProgress = Math.max(
            0,
            Math.min(1, (progress - i / (words.length * 1.5)) * (words.length * 1.2))
          );

          const opacity = baseOpacity + wordProgress * (1 - baseOpacity);
          const rotation = baseRotation - wordProgress * baseRotation;
          const blur = enableBlur
            ? blurStrength - wordProgress * blurStrength
            : 0;

          const wordStyle: CSSProperties = {
            opacity,
            transform: `translateY(${(1 - wordProgress) * 10}px) rotate(${rotation}deg)`,
            filter: blur > 0.1 ? `blur(${blur}px)` : "none",
            transition: "all 0.1s ease-out",
          };

          return (
            <span key={i} className="scroll-reveal-word" style={wordStyle}>
              {typeof word === "string" ? word : word}
              {i < words.length - 1 ? "\u00A0" : ""}
            </span>
          );
        })}
      </span>
    </div>
  );
};

export default ScrollReveal;
