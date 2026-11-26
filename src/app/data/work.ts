/**
 * The destinations of the journey, in the order the visitor reaches them:
 * Dallas Sync first, since it closes the story's last chapter. Prose lives
 * in i18n under `work.items.<id>`; the case reads `work.items.<id>.case.<part>`
 * for every part in CASE_PARTS (the ones a project has).
 */
export type WorkKind = "sistema" | "site" | "loja";

/** The case, told as a problem solved, in this order. */
export const CASE_PARTS = ["context", "problem", "decision", "result", "now"] as const;
export type CasePart = (typeof CASE_PARTS)[number];

/** One encoding of a loop: H.264 for everyone, VP9 where it is smaller. */
export type VideoFile = { mp4: string; webm?: string };
/** A project video at two widths, with the still shown before it plays,
    with reduced motion and with data saving on. */
export type ProjectVideoSources = { poster: string; w720: VideoFile; w1440: VideoFile };

export type WorkItem = {
  id: "dallas_sync" | "secret" | "dallas_motel";
  /** The case's address: /work/<slug>. */
  slug: string;
  kind: WorkKind;
  /** `ratio`: width / height of the screen, so the case shows it whole. */
  image: { src: string; srcSet?: string; lockup?: boolean; ratio?: number };
  href: string;
  loginRequired?: boolean;
  /** The screens are illustrations, and the card says so. */
  illustrative?: boolean;
  /** More screens: the card cycles through them, the details show them all. */
  gallery?: readonly { src: string; srcSet?: string }[];
  /** What it is built with, shown at the end of the case, never as its subject. */
  stack: readonly string[];
  /** The case parts this project has (CASE_PARTS order). */
  parts: readonly CasePart[];
  /** Recorded loops: the card's, and the longer one inside the case. Absent
      until captured; the image stands in. */
  video?: { card?: ProjectVideoSources; detail?: ProjectVideoSources };
};

const P = "/assets/projects";
const V = `${P}/video`;

/**
 * A recorded loop (scripts/capture): its poster and H.264 at two widths, plus
 * VP9 only where it came out smaller (the long scrolls; on the flat UI takes
 * H.264 wins and the webm was dropped).
 */
const clip = (name: string, webm = false): ProjectVideoSources => ({
  poster: `${V}/${name}-poster.webp`,
  w720: { mp4: `${V}/${name}-720.mp4`, ...(webm && { webm: `${V}/${name}-720.webm` }) },
  w1440: { mp4: `${V}/${name}-1440.mp4`, ...(webm && { webm: `${V}/${name}-1440.webm` }) },
});

export const WORK: readonly WorkItem[] = [
  {
    id: "dallas_sync",
    slug: "dallas-sync",
    kind: "sistema",
    image: { src: `${P}/dallas-sync-1440.webp`, srcSet: `${P}/dallas-sync-720.webp 720w, ${P}/dallas-sync-1440.webp 1440w`, ratio: 1440 / 780 },
    href: "https://dallassync.com.br",
    loginRequired: true,
    illustrative: true,
    gallery: [{ src: `${P}/dallas-sync-op-1440.webp`, srcSet: `${P}/dallas-sync-op-720.webp 720w, ${P}/dallas-sync-op-1440.webp 1440w` }],
    stack: ["React 19", "NestJS 11", "PostgreSQL", "Drizzle", "Dexie", "Better Auth", "Turborepo"],
    parts: ["context", "problem", "decision", "result", "now"],
    // the training organization, made-up data; the detail is recorded offline
    video: { card: clip("dallas-sync-card"), detail: clip("dallas-sync-offline") },
  },
  {
    id: "secret",
    slug: "secret-boutique",
    kind: "loja",
    image: { src: `${P}/secret.webp`, srcSet: `${P}/secret-720.webp 720w, ${P}/secret.webp 1919w`, ratio: 1919 / 976 },
    href: "https://secret-boutique.com.br",
    stack: ["Next.js 16", "Supabase", "Mercado Pago"],
    parts: ["context", "problem", "decision", "result"],
    // the open (SFW) catalogue; the detail stops at the Pix form, never submitted
    video: { card: clip("secret-card", true), detail: clip("secret-detail") },
  },
  {
    id: "dallas_motel",
    slug: "dallas-motel",
    kind: "site",
    image: { src: `${P}/dallas.webp`, srcSet: `${P}/dallas-720.webp 720w, ${P}/dallas.webp 1919w`, ratio: 1919 / 976 },
    href: "https://jrdallasmotel.com.br",
    stack: ["React", "TypeScript", "Vite", "Tailwind CSS", "Supabase", "Vercel"],
    parts: ["context", "problem", "decision", "result"],
    video: { card: clip("dallas-motel-card", true), detail: clip("dallas-motel-detail") },
  },
];

export function workBySlug(slug: string): WorkItem | undefined {
  return WORK.find((w) => w.slug === slug);
}
