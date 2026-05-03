import React, { useRef, useState, type ReactNode } from "react";
import "./SpotlightCard.css";

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
}

const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = "",
  spotlightColor = "rgba(255, 255, 255, 0.25)",
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile || !divRef.current || isFocused) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    if (isMobile) return;
    setIsFocused(true);
    setOpacity(1);
  };

  const handleBlur = () => {
    if (isMobile) return;
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    if (isMobile) return;
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`spotlight-card ${className}`}
    >
      {!isMobile && (
        <div
          className="spotlight-card-gradient"
          style={{
            opacity,
            background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
          }}
        />
      )}
      {children}
    </div>
  );
};

export default SpotlightCard;
