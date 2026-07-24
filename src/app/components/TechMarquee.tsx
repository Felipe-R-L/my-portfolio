import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

import { frontendLogos, backendLogos, type TechLogo } from "../data/techStack";
import { useIsMobile } from "../hooks/useIsMobile";

/** Rendered logo box: h-16 on mobile, h-20 from md up. */
const LOGO_SIZE = 80;

function LogoRow({
  logos,
  repetitions,
  x,
  className,
}: {
  logos: TechLogo[];
  repetitions: number;
  x: ReturnType<typeof useTransform<number, number>>;
  className?: string;
}) {
  return (
    <motion.div style={{ x }} className={`flex gap-16 whitespace-nowrap px-4 ${className ?? ""}`}>
      {Array.from({ length: repetitions }, (_, rep) =>
        logos.map((logo) => (
          <div key={`${rep}-${logo.title}`} className="flex-shrink-0 group">
            <img
              src={logo.src}
              alt={logo.title}
              /* Explicit dimensions reserve layout space and keep CLS at zero. */
              width={LOGO_SIZE}
              height={LOGO_SIZE}
              loading="lazy"
              decoding="async"
              /* The row is decorative repetition — only the first pass needs
                 to be announced, the rest are duplicates for screen readers. */
              aria-hidden={rep > 0 ? "true" : undefined}
              /* Fifteen full-colour brand marks directly under his name were the
                 loudest band on the page and pulled against the two-zone palette.
                 They run desaturated and regain their own colours on hover. */
              className="h-16 md:h-20 w-auto object-contain grayscale opacity-60 transition-all duration-500 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 motion-reduce:transition-none"
            />
          </div>
        )),
      )}
    </motion.div>
  );
}

export default function TechMarquee() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Rounded for the same reason as the ScrollReveal words: Lenis settles on
  // fractional scroll positions, and a fractional translate leaves the logos
  // shimmering between two device pixels as the scroll comes to rest.
  const x1 = useTransform(scrollYProgress, (p) => Math.round(p * -1000));
  const x2 = useTransform(scrollYProgress, (p) => Math.round(-1000 + p * 1000));

  // Each logo occupies ~144px (80px box + 64px gap). Enough repetitions to
  // cover the widest viewport plus the 1000px scroll travel, and no more —
  // the previous 8x/4x produced 80 DOM nodes of the same 15 images.
  const frontendRepetitions = isMobile ? 3 : 5;
  const backendRepetitions = isMobile ? 2 : 4;

  return (
    <section
      ref={containerRef}
      className="py-16 md:py-20 overflow-hidden bg-transparent relative z-10"
      aria-label="Technology stack"
    >
      <div className="flex flex-col gap-12">
        <LogoRow logos={frontendLogos} repetitions={frontendRepetitions} x={x1} />
        <LogoRow
          logos={backendLogos}
          repetitions={backendRepetitions}
          x={x2}
          className="ml-[-500px] md:ml-[-1000px]"
        />
      </div>
    </section>
  );
}
