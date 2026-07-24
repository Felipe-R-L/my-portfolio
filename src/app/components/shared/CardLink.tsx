import React from "react";
import { cn } from "../../utils/cn";

const BASE =
  "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium tracking-wide " +
  "border transition-colors duration-300 no-underline";

const TONES = {
  cold: "border-[color-mix(in_oklab,var(--zone-a-1)_42%,transparent)] bg-[color-mix(in_oklab,var(--zone-a-1)_14%,transparent)] text-[#b9d1ff] hover:bg-[color-mix(in_oklab,var(--zone-a-1)_24%,transparent)]",
  warm: "border-[color-mix(in_oklab,var(--zone-b-1)_42%,transparent)] bg-[color-mix(in_oklab,var(--zone-b-1)_13%,transparent)] text-[#ffd9a0] hover:bg-[color-mix(in_oklab,var(--zone-b-1)_22%,transparent)]",
  neutral: "border-white/15 bg-white/5 text-white hover:bg-white/[0.11]",
} as const;

export function CardLink({
  href,
  label,
  ariaLabel,
  tone = "neutral",
}: {
  href: string;
  label: string;
  ariaLabel?: string;
  tone?: keyof typeof TONES;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className={cn(BASE, TONES[tone])}
    >
      {label}
    </a>
  );
}

/**
 * A private repo or an undeployed product has nothing to link to. Rendering a
 * dead anchor would be a lie, so the state is a plain label that reads as a
 * fact about the project rather than a control the visitor failed to click.
 */
export function CardNote({ children }: { children: React.ReactNode }) {
  return (
    <span
      className={cn(
        BASE,
        "border-dashed border-white/10 text-gray-400 cursor-default select-none",
      )}
    >
      {children}
    </span>
  );
}
