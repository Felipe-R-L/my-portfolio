/**
 * The work carousel, in order: Dallas Sync first, since it closes the story's
 * last chapter. Prose lives in i18n under `work.items.<id>`.
 */
export type WorkKind = "sistema" | "site" | "loja" | "omd";

export type WorkItem = {
  id: "dallas_sync" | "dallas_motel" | "secret" | "omdfarm" | "eco360";
  kind: WorkKind;
  image: { src: string; srcSet?: string; lockup?: boolean };
  href: string;
  loginRequired?: boolean;
  /** The screens are illustrations, and the card says so. */
  illustrative?: boolean;
  /** More screens: the card cycles through them, the details show them all. */
  gallery?: readonly { src: string; srcSet?: string }[];
  /** What it is built with, shown in the details. */
  stack: readonly string[];
  /** The details have a "today" paragraph (`work.items.<id>.case.now`). */
  hasNow?: boolean;
};

const P = "/assets/projects";

export const WORK: readonly WorkItem[] = [
  {
    id: "dallas_sync",
    kind: "sistema",
    image: { src: `${P}/dallas-sync-1440.webp`, srcSet: `${P}/dallas-sync-720.webp 720w, ${P}/dallas-sync-1440.webp 1440w` },
    href: "https://dallassync.com.br",
    loginRequired: true,
    illustrative: true,
    gallery: [{ src: `${P}/dallas-sync-op-1440.webp`, srcSet: `${P}/dallas-sync-op-720.webp 720w, ${P}/dallas-sync-op-1440.webp 1440w` }],
    stack: ["React 19", "NestJS 11", "PostgreSQL", "Drizzle", "Dexie", "Better Auth", "Turborepo"],
    hasNow: true,
  },
  {
    id: "dallas_motel",
    kind: "site",
    image: { src: `${P}/dallas.webp`, srcSet: `${P}/dallas-720.webp 720w, ${P}/dallas.webp 1919w` },
    href: "https://jrdallasmotel.com.br",
    stack: ["React 18", "Vite", "Supabase"],
  },
  {
    id: "secret",
    kind: "loja",
    image: { src: `${P}/secret.webp`, srcSet: `${P}/secret-720.webp 720w, ${P}/secret.webp 1919w` },
    href: "https://secret-boutique.com.br",
    stack: ["Next.js 16", "Supabase", "Mercado Pago"],
  },
  {
    id: "omdfarm",
    kind: "omd",
    image: { src: `${P}/omdfarm-720.webp` },
    href: "https://www.omdfarm.com.br",
    stack: ["Nx", "NestJS", "Prisma", "Angular 21", "MQTT", "BullMQ", "Terraform"],
    hasNow: true,
  },
  {
    id: "eco360",
    kind: "omd",
    image: { src: `${P}/eco360-logo.webp`, lockup: true },
    href: "https://gestaoeco360.com.br",
    stack: ["Turborepo", "NestJS 11", "Drizzle", "TimescaleDB", "React 19", "Terraform"],
  },
];
