import React from "react";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import SplitText from "../react-bits/SplitText";
import { cn } from "../../utils/cn";

/**
 * The heading block (pulsing icon → split text → glowing dot → split text →
 * animated underline) was copy-pasted across About, Projects, Experience,
 * Services and Contact with only colours and sizes differing.
 *
 * Accents are zones, not hues: cold where the page talks about who he is, warm
 * where it talks about what he delivers. The temperature change is what tells
 * the reader the subject changed.
 */
export type Accent = "cold" | "warm";

const ACCENTS: Record<Accent, { icon: string; dot: string; bar: string }> = {
  cold: {
    icon: "text-[var(--zone-a-1)]",
    dot: "bg-[var(--zone-a-1)] shadow-[0_0_15px_color-mix(in_oklab,var(--zone-a-1)_70%,transparent)]",
    bar: "bg-[color-mix(in_oklab,var(--zone-a-1)_60%,transparent)] shadow-[0_0_15px_color-mix(in_oklab,var(--zone-a-1)_55%,transparent)]",
  },
  warm: {
    icon: "text-[var(--zone-b-1)]",
    dot: "bg-[var(--zone-b-1)] shadow-[0_0_15px_color-mix(in_oklab,var(--zone-b-1)_70%,transparent)]",
    bar: "bg-[color-mix(in_oklab,var(--zone-b-1)_60%,transparent)] shadow-[0_0_15px_color-mix(in_oklab,var(--zone-b-1)_55%,transparent)]",
  },
};

const SPLIT_FROM = { opacity: 0, transform: "translate3d(0, 30px, 0)" };
const SPLIT_TO = { opacity: 1, transform: "translate3d(0, 0, 0)" };

interface SectionHeadingProps {
  icon: LucideIcon;
  /** Sizing classes for the icon, e.g. "w-16 h-16". */
  iconClassName?: string;
  accent?: Accent;
  /** How the icon animates: a slow opacity pulse or a gentle rocking motion. */
  iconMotion?: "pulse" | "rock";
  title: string;
  /** Rendered dimmed after the glowing dot. Omit for a single-line heading. */
  subtitle?: string;
  align?: "left" | "center";
  showBar?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const PULSE = {
  animate: { opacity: [0.4, 1, 0.4] },
  transition: { duration: 2, repeat: Infinity, ease: "easeInOut" as const },
};

const ROCK = {
  animate: { rotate: [0, 10, -10, 0] },
  transition: { duration: 4, repeat: Infinity, ease: "easeInOut" as const },
};

export function SectionHeading({
  icon: Icon,
  iconClassName = "w-12 h-12 md:w-14 md:h-14",
  accent = "cold",
  iconMotion = "pulse",
  title,
  subtitle,
  align = "left",
  showBar = true,
  className,
  children,
}: SectionHeadingProps) {
  const colors = ACCENTS[accent];
  const motionProps = iconMotion === "rock" ? ROCK : PULSE;

  return (
    <div
      className={cn(
        "rhythm-block relative z-10",
        align === "center" && "text-center",
        className,
      )}
    >
      <h2
        className={cn(
          "text-3xl md:text-5xl font-bold text-white mb-4 tracking-tighter uppercase flex items-center flex-wrap gap-y-3",
          align === "center" && "justify-center",
        )}
      >
        <motion.span
          aria-hidden="true"
          animate={motionProps.animate}
          transition={motionProps.transition}
          className={cn("mr-4 inline-flex", colors.icon)}
        >
          <Icon className={iconClassName} />
        </motion.span>

        <SplitText text={title} delay={30} animationFrom={SPLIT_FROM} animationTo={SPLIT_TO} />

        {subtitle && (
          <>
            <motion.span
              aria-hidden="true"
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.1 }}
              className={cn("mx-3 md:mx-6 w-2.5 h-2.5 rounded-full", colors.dot)}
            />
            <span className="text-white/40">
              <SplitText
                text={subtitle}
                delay={30}
                animationFrom={SPLIT_FROM}
                animationTo={SPLIT_TO}
              />
            </span>
          </>
        )}
      </h2>

      {showBar && (
        <motion.div
          aria-hidden="true"
          className={cn(
            "w-24 h-1 rounded-full",
            colors.bar,
            align === "center" && "mx-auto",
          )}
          initial={{ width: 0 }}
          whileInView={{ width: 96 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
        />
      )}

      {children}
    </div>
  );
}
