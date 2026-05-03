import React, {
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import "./TiltedCard.css";

interface TiltedCardProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  rotateAmplitude?: number;
  scaleOnHover?: number;
  showTooltip?: boolean;
  tooltipText?: string;
  tooltipPosition?: "top" | "bottom";
  displayOverlayContent?: boolean;
  overlayContent?: ReactNode;
  style?: CSSProperties;
}

const TiltedCard: React.FC<TiltedCardProps> = ({
  children,
  className = "",
  containerClassName = "",
  rotateAmplitude = 14,
  scaleOnHover = 1.05,
  showTooltip = false,
  tooltipText = "Hover me",
  tooltipPosition = "top",
  displayOverlayContent = false,
  overlayContent,
  style,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [transformStyle, setTransformStyle] = useState("");
  const [tooltipStyle, setTooltipStyle] = useState<CSSProperties>({});
  const [isHovering, setIsHovering] = useState(false);

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cardWidth = rect.width;
    const cardHeight = rect.height;
    const centerX = rect.left + cardWidth / 2;
    const centerY = rect.top + cardHeight / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    const rotateXVal = (mouseY / (cardHeight / 2)) * -rotateAmplitude;
    const rotateYVal = (mouseX / (cardWidth / 2)) * rotateAmplitude;

    setTransformStyle(
      `perspective(1000px) rotateX(${rotateXVal}deg) rotateY(${rotateYVal}deg) scale3d(${scaleOnHover}, ${scaleOnHover}, ${scaleOnHover})`,
    );

    if (showTooltip) {
      setTooltipStyle({
        left: `${e.clientX - rect.left}px`,
        top: tooltipPosition === "top" ? "-2rem" : "calc(100% + 0.5rem)",
      });
    }
  };

  const handleMouseEnter = () => {
    if (isMobile) return;
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    setIsHovering(false);
    setTransformStyle(
      `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
    );
  };

  return (
    <div className={`tilted-card-container ${containerClassName}`}>
      <div
        ref={ref}
        className={`tilted-card ${className}`}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: !isMobile ? transformStyle : undefined,
          ...style,
        }}
      >
        {children}
        {displayOverlayContent && overlayContent && (
          <div
            className="tilted-card-overlay"
            style={{ opacity: !isMobile && isHovering ? 1 : 0 }}
          >
            {overlayContent}
          </div>
        )}
      </div>
      {showTooltip && isHovering && !isMobile && (
        <div className="tilted-card-tooltip" style={tooltipStyle}>
          {tooltipText}
        </div>
      )}
    </div>
  );
};

export default TiltedCard;
