import React, { useRef, useState, type ReactNode, type CSSProperties } from "react";
import "./BorderGlow.css";

interface BorderGlowProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  borderRadius?: string;
  borderWidth?: number;
  spread?: number;
  style?: CSSProperties;
}

const BorderGlow: React.FC<BorderGlowProps> = ({
  children,
  className = "",
  glowColor = "rgba(120, 130, 255, 0.6)",
  borderRadius = "1.5rem",
  borderWidth = 1,
  spread = 200,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`border-glow-container ${className}`}
      style={{
        borderRadius,
        ...style,
      }}
    >
      {/* Glow border overlay */}
      <div
        className="border-glow-effect"
        style={{
          opacity,
          background: `radial-gradient(${spread}px circle at ${position.x}px ${position.y}px, ${glowColor}, transparent 40%)`,
          borderRadius,
          inset: `-${borderWidth}px`,
        }}
      />
      {/* Inner content with masking */}
      <div
        className="border-glow-inner"
        style={{
          borderRadius,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default BorderGlow;
