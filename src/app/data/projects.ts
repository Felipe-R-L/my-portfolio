/**
 * Facts that never get translated: stacks, URLs, images and the published
 * figures. The prose lives in the i18n bundles and is keyed by `id`.
 *
 * Nothing here comes from a private repository. The OMDfarm figures are the
 * ones OMD publishes on its own landing page, which is why they carry a
 * `source` string that the card is required to render next to them.
 */

export interface Metric {
  /** Rendered as-is; already formatted for display. */
  value: string;
  /** i18n key suffix under the product's `metrics` object. */
  labelKey: string;
}

export interface Product {
  id: string;
  /** Screenshot of a public page, or a brand lockup when there is no public page. */
  visual: { kind: "shot"; src: string; srcSet: string } | { kind: "lockup"; src: string };
  url: string;
  metrics?: Metric[];
  stack: readonly string[];
  /** Shown after `stack` as a single muted chip. */
  stackMore?: string;
}

export interface Project {
  id: string;
  visual: { kind: "shot"; src: string; srcSet: string } | { kind: "arch" };
  url?: string;
  repo?: string;
  stack: readonly string[];
  stackMore?: string;
  /** The lead project gets the wide layout; the rest sit in the compact row. */
  featured?: boolean;
}

const shot = (name: string) => ({
  kind: "shot" as const,
  src: `/assets/projects/${name}-720.webp`,
  srcSet: `/assets/projects/${name}-400.webp 400w, /assets/projects/${name}-720.webp 720w`,
});

/** Employer work. Lives in the Experience section, never duplicated in Projects. */
export const OMD_PRODUCTS: readonly Product[] = [
  {
    id: "omdfarm",
    visual: shot("omdfarm"),
    url: "https://www.omdfarm.com.br",
    metrics: [
      { value: "40M+", labelKey: "points" },
      { value: "87", labelKey: "machines" },
      { value: "274", labelKey: "days" },
    ],
    stack: ["Nx", "NestJS", "Prisma", "Angular 21", "MQTT", "BullMQ"],
    stackMore: "Terraform · Redis · ECharts",
  },
  {
    id: "eco360",
    visual: { kind: "lockup", src: "/assets/projects/eco360-logo.webp" },
    url: "https://gestaoeco360.com.br",
    stack: ["Turborepo", "NestJS 11", "Drizzle", "TimescaleDB", "React 19"],
    stackMore: "Terraform · CASL · OSRM",
  },
] as const;

/** Authored and freelance work. Lives in the Projects section. */
export const PROJECTS: readonly Project[] = [
  {
    id: "dallas_sync",
    visual: { kind: "arch" },
    stack: ["Turborepo", "NestJS 11", "Drizzle", "React 19", "Dexie"],
    stackMore: "CASL · Better Auth · RLS",
    featured: true,
  },
  {
    id: "secret",
    visual: shot("secret"),
    url: "https://secret-boutique.com.br",
    repo: "https://github.com/Felipe-R-L/secret-boutique-pwa",
    stack: ["Next.js 16", "Supabase", "Mercado Pago"],
  },
  {
    id: "dallas_motel",
    visual: shot("dallas"),
    url: "https://jrdallasmotel.com.br",
    repo: "https://github.com/Felipe-R-L/dallas-motel-landing-page",
    stack: ["React 18", "Vite", "Supabase"],
  },
] as const;
