import { motion } from "motion/react";
import { socialLinks } from "../../data/techStack";
import { cn } from "../../utils/cn";

interface SocialLinksProps {
  /** "footer" = bare icons, "panel" = padded glass tiles. */
  variant?: "footer" | "panel";
  className?: string;
}

const VARIANTS = {
  footer: {
    link: "text-gray-500 hover:text-white transition-colors",
    img: "w-6 h-6",
    size: 24,
    hover: { scale: 1.2, y: -2 },
  },
  panel: {
    link: "p-4 rounded-2xl bg-white/[0.03] border border-white/5 transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20",
    img: "w-7 h-7",
    size: 28,
    hover: { y: -5, scale: 1.05 },
  },
} as const;

export function SocialLinks({ variant = "footer", className }: SocialLinksProps) {
  const v = VARIANTS[variant];

  return (
    <div className={cn("flex", variant === "footer" ? "gap-6" : "gap-4", className)}>
      {socialLinks.map((social) => (
        <motion.a
          key={social.label}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          className={v.link}
          whileHover={v.hover}
          whileTap={{ scale: 0.95 }}
          aria-label={`Visit my ${social.label} profile`}
        >
          <img
            src={social.icon}
            alt=""
            aria-hidden="true"
            width={v.size}
            height={v.size}
            loading="lazy"
            decoding="async"
            className={v.img}
          />
        </motion.a>
      ))}
    </div>
  );
}
