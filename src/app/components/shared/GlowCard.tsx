import React from "react";
import BorderGlow from "../react-bits/BorderGlow";
import SpotlightCard from "../react-bits/SpotlightCard";
import TiltedCard from "../react-bits/TiltedCard";
import { useIsMobile } from "../../hooks/useIsMobile";

/**
 * The TiltedCard → BorderGlow → SpotlightCard stack, repeated in About,
 * Projects, Experience, Services and Contact.
 *
 * All three effects are pointer-driven, so on mobile the tilt wrapper is
 * dropped entirely instead of mounting a component that can never fire.
 */
interface GlowCardProps {
  children: React.ReactNode;
  glowColor: string;
  spotlightColor?: string;
  /** Adds the 3D tilt wrapper on pointer devices. */
  tilt?: boolean;
  rotateAmplitude?: number;
  scaleOnHover?: number;
  glowRadius?: number;
  /** Extra props forwarded to BorderGlow for the richer About card variant. */
  borderGlowProps?: Record<string, unknown>;
  className?: string;
  contentClassName?: string;
}

export function GlowCard({
  children,
  glowColor,
  spotlightColor,
  tilt = false,
  rotateAmplitude = 12,
  scaleOnHover = 1.04,
  glowRadius = 300,
  borderGlowProps,
  className = "h-full",
  contentClassName,
}: GlowCardProps) {
  const isMobile = useIsMobile();

  const card = (
    <BorderGlow
      glowColor={glowColor}
      glowRadius={glowRadius}
      className={className}
      {...borderGlowProps}
    >
      <SpotlightCard spotlightColor={spotlightColor} className={contentClassName}>
        {children}
      </SpotlightCard>
    </BorderGlow>
  );

  if (!tilt || isMobile) return card;

  return (
    <TiltedCard
      rotateAmplitude={rotateAmplitude}
      scaleOnHover={scaleOnHover}
      containerClassName="h-full"
      className="h-full"
    >
      {card}
    </TiltedCard>
  );
}
