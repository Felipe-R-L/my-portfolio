/**
 * Tech logos, self-hosted under /assets/tech.
 *
 * These used to be fetched from three separate CDNs (simpleicons, jsdelivr,
 * tigerdata) which cost three DNS+TLS handshakes, a third-party cookie and a
 * 1-day cache TTL. Serving them from our own origin removes all of that.
 */
export interface TechLogo {
  src: string;
  title: string;
}

export const frontendLogos: TechLogo[] = [
  { src: "/assets/tech/react.svg", title: "React" },
  { src: "/assets/tech/nextjs.svg", title: "Next.js" },
  { src: "/assets/tech/angular.svg", title: "Angular" },
  { src: "/assets/tech/tailwindcss.svg", title: "Tailwind CSS" },
  { src: "/assets/tech/sass.svg", title: "Sass" },
];

export const backendLogos: TechLogo[] = [
  { src: "/assets/tech/java.svg", title: "Java" },
  { src: "/assets/tech/typescript.svg", title: "TypeScript" },
  { src: "/assets/tech/nestjs.svg", title: "NestJS" },
  { src: "/assets/tech/nx.svg", title: "NX" },
  { src: "/assets/tech/prisma.svg", title: "Prisma ORM" },
  { src: "/assets/tech/timescaledb.svg", title: "TimescaleDB" },
  { src: "/assets/tech/postgresql.svg", title: "PostgreSQL" },
  { src: "/assets/tech/hivemq.svg", title: "HiveMQ" },
  { src: "/assets/tech/googlecloud.svg", title: "GCP" },
  { src: "/assets/tech/docker.svg", title: "Docker" },
];

export interface SocialLink {
  icon: string;
  href: string;
  label: string;
}

export const socialLinks: SocialLink[] = [
  {
    icon: "/assets/tech/github.svg",
    href: "https://github.com/Felipe-R-L",
    label: "GitHub",
  },
  {
    icon: "/assets/tech/linkedin.svg",
    href: "https://linkedin.com/in/felipe-rodrigues-leone",
    label: "LinkedIn",
  },
  {
    icon: "/assets/tech/x.svg",
    href: "https://x.com/rfelipe_jpg",
    label: "X",
  },
];
