import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

const frontendLogos = [
  { src: "https://cdn.simpleicons.org/react/61DAFB", title: "React" },
  { src: "https://cdn.simpleicons.org/nextdotjs/white", title: "Next.js" },
  { src: "https://cdn.simpleicons.org/angular/DD0031", title: "Angular" },
  {
    src: "https://cdn.simpleicons.org/tailwindcss/06B6D4",
    title: "Tailwind CSS",
  },
  { src: "https://cdn.simpleicons.org/sass/CC6699", title: "Sass" },
];

const backendLogos = [
  {
    src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg",
    title: "Java",
  },
  { src: "https://cdn.simpleicons.org/typescript/3178C6", title: "TypeScript" },
  { src: "https://cdn.simpleicons.org/nestjs/E0234E", title: "NestJS" },
  { src: "https://cdn.simpleicons.org/nx/white", title: "NX" },
  { src: "https://cdn.simpleicons.org/prisma/white", title: "Prisma ORM" },
  {
    src: "https://assets.tigerdata.com/timescale-web/brand/tiger-data/flat-logos/logo-badge-yellow.svg",
    title: "TimescaleDB",
  },
  { src: "https://cdn.simpleicons.org/postgresql/4169E1", title: "PostgreSQL" },
  { src: "https://cdn.simpleicons.org/hivemq/FFEE00", title: "HiveMQ" },
  {
    src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/googlecloud/googlecloud-original.svg",
    title: "GCP",
  },
  { src: "https://cdn.simpleicons.org/docker/2496ED", title: "Docker" },
];

export default function TechMarquee() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const x1 = useTransform(scrollYProgress, [0, 1], [0, -1000]);
  const x2 = useTransform(scrollYProgress, [0, 1], [-1000, 0]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  
  // Frontend has 5 logos, Backend has 10. 
  // We need Frontend to repeat more to avoid gaps.
  const frontendRepetitions = isMobile ? 4 : 8; 
  const backendRepetitions = isMobile ? 2 : 4;

  const frontendDisplay = Array(frontendRepetitions).fill(frontendLogos).flat();
  const backendDisplay = Array(backendRepetitions).fill(backendLogos).flat();

  return (
    <section
      ref={containerRef}
      className="py-24 overflow-hidden bg-transparent relative z-10"
    >
      <div className="flex flex-col gap-12">
        {/* Frontend Row */}
        <motion.div
          style={{ x: x1 }}
          className="flex gap-16 whitespace-nowrap px-4"
        >
          {frontendDisplay.map((logo, idx) => (
            <div key={idx} className="flex-shrink-0 group">
              <img
                src={logo.src}
                alt={logo.title}
                className="h-16 md:h-20 w-auto object-contain transition-transform duration-500 group-hover:scale-110"
              />
            </div>
          ))}
        </motion.div>

        {/* Backend Row */}
        <motion.div
          style={{ x: x2 }}
          className="flex gap-16 whitespace-nowrap px-4 ml-[-500px] md:ml-[-1000px]"
        >
          {backendDisplay.map((logo, idx) => (
            <div key={idx} className="flex-shrink-0 group">
              <img
                src={logo.src}
                alt={logo.title}
                className="h-16 md:h-20 w-auto object-contain transition-transform duration-500 group-hover:scale-110"
              />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
