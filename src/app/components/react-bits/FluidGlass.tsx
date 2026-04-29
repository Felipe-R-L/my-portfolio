import React, { useRef, useEffect, useState, useCallback, type ReactNode, type CSSProperties } from "react";
import "./FluidGlass.css";

interface FluidGlassProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  mode?: "lens" | "bar" | "cube";
  blurAmount?: number;
  tintColor?: string;
  tintOpacity?: number;
  borderRadius?: string;
  style?: CSSProperties;
}

const FluidGlass: React.FC<FluidGlassProps> = ({
  children,
  className = "",
  containerClassName = "",
  mode = "lens",
  blurAmount = 20,
  tintColor = "rgba(255, 255, 255, 0.1)",
  tintOpacity = 0.4,
  borderRadius = "1.5rem",
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const rafRef = useRef<number | null>(null);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (rafRef.current) return;
      
      rafRef.current = requestAnimationFrame(() => {
        if (!containerRef.current) {
          rafRef.current = null;
          return;
        }
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
        rafRef.current = null;
      });
    },
    []
  );

  const handleMouseEnter = useCallback(() => setIsHovering(true), []);
  const handleMouseLeave = useCallback(() => setIsHovering(false), []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseenter", handleMouseEnter);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseenter", handleMouseEnter);
      el.removeEventListener("mouseleave", handleMouseLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [handleMouseMove, handleMouseEnter, handleMouseLeave]);

  const getGlassStyle = (): CSSProperties => {
    const base: CSSProperties = {
      position: "absolute",
      pointerEvents: "none",
      backdropFilter: `blur(${blurAmount}px)`,
      WebkitBackdropFilter: `blur(${blurAmount}px)`,
      background: tintColor,
      opacity: isHovering ? tintOpacity : 0,
      transition: isHovering
        ? "transform 0.1s ease-out, opacity 0.3s ease"
        : "opacity 0.4s ease",
      zIndex: 10,
      borderRadius,
    };

    if (mode === "lens") {
      const size = 180;
      return {
        ...base,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        left: `${mousePos.x - size / 2}px`,
        top: `${mousePos.y - size / 2}px`,
        border: "1px solid rgba(255, 255, 255, 0.2)",
        boxShadow: `
          0 0 30px rgba(255, 255, 255, 0.08),
          inset 0 0 30px rgba(255, 255, 255, 0.05)
        `,
      };
    }

    if (mode === "bar") {
      return {
        ...base,
        width: "100%",
        height: "80px",
        left: 0,
        top: `${mousePos.y - 40}px`,
        borderRadius: "0",
        borderTop: "1px solid rgba(255, 255, 255, 0.15)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.15)",
      };
    }

    // cube mode
    const cubeSize = 120;
    return {
      ...base,
      width: `${cubeSize}px`,
      height: `${cubeSize}px`,
      left: `${mousePos.x - cubeSize / 2}px`,
      top: `${mousePos.y - cubeSize / 2}px`,
      borderRadius: "1rem",
      border: "1px solid rgba(255, 255, 255, 0.15)",
      transform: `rotate(${(mousePos.x / 4) % 360}deg)`,
    };
  };

  return (
    <div
      ref={containerRef}
      className={`fluid-glass-container ${containerClassName}`}
      style={style}
    >
      <div ref={glassRef} className="fluid-glass-effect" style={getGlassStyle()} />
      <div className={`fluid-glass-content ${className}`}>{children}</div>
    </div>
  );
};

export default FluidGlass;
