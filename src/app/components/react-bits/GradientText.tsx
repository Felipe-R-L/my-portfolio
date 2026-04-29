import React from "react";
import "./GradientText.css";

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  animationSpeed?: number;
  showBorder?: boolean;
}

const GradientText: React.FC<GradientTextProps> = ({
  children,
  className = "",
  colors = ["#6366f1", "#8b5cf6", "#ec4899", "#3b82f6", "#6366f1"],
  animationSpeed = 8,
  showBorder = false,
}) => {
  const gradientColors = colors.join(", ");

  return (
    <span
      className={`gradient-text-wrapper ${showBorder ? "gradient-text-border" : ""} ${className}`}
      style={
        {
          "--gradient-colors": gradientColors,
          "--animation-speed": `${animationSpeed}s`,
        } as React.CSSProperties
      }
    >
      <span className="gradient-text-inner">{children}</span>
    </span>
  );
};

export default GradientText;
