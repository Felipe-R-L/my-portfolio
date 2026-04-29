import React, { useRef, useState, ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from "motion/react";
import { cn } from "../../utils/cn";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}

export function GlassCard({ children, className, glowColor = "rgba(120, 150, 255, 0.25)" }: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"]);
  const brightness = useTransform(mouseYSpring, [-0.5, 0.5], [1.2, 0.8]);

  const bgX = useTransform(x, [-0.5, 0.5], ["0%", "100%"]);
  const bgY = useTransform(y, [-0.5, 0.5], ["0%", "100%"]);
  const backgroundTemplate = useMotionTemplate`radial-gradient(800px circle at ${bgX} ${bgY}, ${glowColor}, transparent 40%)`;
  
  const filterBrightness = useMotionTemplate`brightness(${brightness})`;
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: isHovered ? rotateX : 0,
        rotateY: isHovered ? rotateY : 0,
        filter: isHovered ? filterBrightness : "brightness(1)",
        transformStyle: "preserve-3d",
      }}
      className={cn(
        "relative rounded-3xl border border-white/20 bg-white/[0.03] shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-3xl p-8 transition-all duration-500 ease-out",
        "before:absolute before:inset-0 before:-z-10 before:rounded-3xl before:bg-gradient-to-br before:from-white/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500",
        className
      )}
    >
      <motion.div
        className="absolute inset-0 z-0 rounded-3xl opacity-0 transition-opacity duration-500 pointer-events-none"
        style={{
          opacity: isHovered ? 1 : 0,
          background: isHovered ? backgroundTemplate : `radial-gradient(800px circle at 50% 50%, ${glowColor}, transparent 40%)`,
        }}
      />
      {/* Specular highlight border for glass effect */}
      <div className="absolute inset-0 rounded-3xl border border-white/10 [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none" />
      
      <div className="relative z-10" style={{ transform: "translateZ(40px)" }}>
        {children}
      </div>
    </motion.div>
  );
}
