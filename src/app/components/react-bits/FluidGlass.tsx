import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
  type CSSProperties,
} from "react";
import "./FluidGlass.css";
import GlassSurface from "./GlassSurface";

interface FluidGlassProps {
  children: ReactNode;
  revealedChildren?: ReactNode; // Content revealed under the lens
  className?: string;
  containerClassName?: string;
  mode?: "lens" | "bar" | "cube";
  blurAmount?: number;
  tintColor?: string;
  tintOpacity?: number;
  borderRadius?: string;
  style?: CSSProperties;
}

const FluidGlassComponent: React.FC<FluidGlassProps> = ({
  children,
  revealedChildren,
  className = "",
  containerClassName = "",
  mode = "lens",
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const getEffectContainerStyle = (): CSSProperties => {
    const base: CSSProperties = {
      position: "absolute",
      pointerEvents: "none",
      opacity: isHovering ? 1 : 0,
      transition: isHovering ? "opacity 0.3s ease" : "opacity 0.4s ease",
      zIndex: 20,
      top: 0,
      left: 0,
    };

    if (mode === "lens") {
      const size = 180;
      return {
        ...base,
        width: `${size}px`,
        height: `${size}px`,
        transform: `translate3d(${mousePos.x - size / 2}px, ${mousePos.y - size / 2}px, 0)`,
      };
    }

    if (mode === "bar") {
      return {
        ...base,
        width: "100%",
        height: "120px",
        transform: `translate3d(0, ${mousePos.y - 60}px, 0)`,
      };
    }

    const cubeSize = 140;
    return {
      ...base,
      width: `${cubeSize}px`,
      height: `${cubeSize}px`,
      transform: `translate3d(${mousePos.x - cubeSize / 2}px, ${mousePos.y - cubeSize / 2}px, 0) rotate(${(mousePos.x / 4) % 360}deg)`,
    };
  };

  const getRevealClippedStyle = (): CSSProperties => {
    if (!revealedChildren || !isHovering) return { display: "none" };

    const base: CSSProperties = {
      position: "absolute",
      inset: 0,
      zIndex: 15,
      pointerEvents: "none",
    };

    if (mode === "lens") {
      const size = 180;
      return {
        ...base,
        clipPath: `circle(${size / 2}px at ${mousePos.x}px ${mousePos.y}px)`,
        WebkitClipPath: `circle(${size / 2}px at ${mousePos.x}px ${mousePos.y}px)`,
      };
    }

    if (mode === "bar") {
      const barHeight = 120;
      return {
        ...base,
        clipPath: `inset(${mousePos.y - barHeight / 2}px 0 ${-mousePos.y + barHeight / 2}px 0)`,
        WebkitClipPath: `inset(${mousePos.y - barHeight / 2}px 0 ${-mousePos.y + barHeight / 2}px 0)`,
      };
    }

    return base;
  };

  const getBaseClippedStyle = (): CSSProperties => {
    if (!revealedChildren || !isHovering) return {};

    const size = 180;
    const mask = `radial-gradient(circle ${size / 2}px at ${mousePos.x}px ${mousePos.y}px, transparent 99%, black 100%)`;

    return {
      maskImage: mask,
      WebkitMaskImage: mask,
    };
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`fluid-glass-container relative overflow-hidden ${isHovering ? "cursor-none" : ""} ${containerClassName}`}
      style={style}
    >
      {/* 1. The base content (Hidden under the lens) */}
      <div
        className={`fluid-glass-content ${className}`}
        style={getBaseClippedStyle()}
      >
        {children}
      </div>

      {/* 2. The revealed content under the lens (Clipped to the lens) */}
      {revealedChildren && (
        <div
          className={`fluid-glass-revealed ${className} pointer-events-none`}
          style={getRevealClippedStyle()}
        >
          {revealedChildren}
        </div>
      )}

      {/* 3. The visible effect (GlassSurface) - Provides distortion/refraction */}
      <div
        className="fluid-glass-effect-wrapper pointer-events-none"
        style={getEffectContainerStyle()}
      >
        <GlassSurface
          width={mode === "lens" ? 180 : "100%"}
          height={mode === "lens" ? 180 : mode === "bar" ? 120 : 140}
          borderRadius={mode === "lens" ? 90 : mode === "cube" ? 24 : 0}
          displace={0.3}
          distortionScale={10}
          redOffset={10}
          greenOffset={10}
          blueOffset={20}
          brightness={50}
          opacity={0.9}
          mixBlendMode="exclusion"
        />
      </div>
    </div>
  );
};

export default FluidGlassComponent;
