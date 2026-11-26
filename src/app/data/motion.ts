import { center, type ClipMeta, type Rect } from "../components/motion/clip";

/**
 * How each recorded clip is presented (Felipe, 2026-11-26). Every moment comes from the clip's own marks
 * and boxes (scripts/capture), so a new take keeps the motion in step.
 *
 * camera  every project: the screen sits tilted like a device on a desk, the
 *         camera dives into each gesture where the hand clicks (Dallas Sync:
 *         the plate, the confirm, the room whose clock starts; the shop: its
 *         opening screen, the carousel, a product into the cart; the motel: from the hero down
 *         its page, the day's tabs, the story, the menu) and settles back for the loop. Felipe, after
 *         seeing a crops version for the shop and the motel: the camera
 *         everywhere, the crops read far and small.
 * plain   Em uso: the camera holds still (the chapter's idea); only the hand.
 *
 * Words: `work.items.<id>.motion.<key>`.
 */
export type CameraKey = { t: number; rx: number; ry: number; s: number; x: number; y: number };
export type Caption = { from: number; to: number; key: string };
export type MotionSpec =
  | {
      mode: "camera";
      camera: (m: ClipMeta) => CameraKey[];
      captions: (m: ClipMeta) => Caption[];
      /** The caption at the top, where the bottom of the screen is what matters. */
      captionTop?: boolean;
      /** A ring drawn around something on screen, for a while. */
      ring?: (m: ClipMeta) => { rect: Rect; from: number; to: number } | null;
    }
  | { mode: "plain" };

const MID = { x: 720, y: 450 };
const HOME = { rx: 13, ry: -19, s: 0.8, ...MID };
const FLAT = { rx: 0, ry: 0, s: 1, ...MID };

export const MOTION: Record<string, MotionSpec> = {
  "dallas-sync-card": {
    mode: "camera",
    camera: ({ marks: M, boxes: B, duration: end }) => {
      const room = center(B.room);
      const plate = center(B.plate);
      const confirm = center(B.confirm);
      const after = center(B.roomAfter ?? B.room);
      return [
        { t: 0, ...HOME },
        { t: M.modal - 0.25, rx: 8, ry: -12, s: 0.88, ...room },
        { t: M.modal + 0.6, ...FLAT },
        { t: M.typing - 0.5, ...FLAT },
        { t: M.typing, rx: 0, ry: 0, s: 1.7, ...plate },
        { t: M.typed, rx: 0, ry: 0, s: 1.7, ...plate },
        { t: M.confirm - 0.15, rx: 0, ry: 0, s: 1.45, ...confirm },
        { t: M.confirm + 0.55, rx: 0, ry: 0, s: 0.94, ...MID },
        { t: M.occupied, ...FLAT },
        { t: M.occupied + 0.8, rx: 0, ry: 0, s: 1.28, ...after },
        { t: end - 1.0, rx: 0, ry: 0, s: 1.28, ...after },
        { t: end + 1.2, ...HOME },
      ];
    },
    captions: ({ marks: M, duration: end }) => [
      { from: 0.2, to: M.modal + 0.4, key: "map" },
      { from: M.typing - 0.2, to: M.confirm, key: "plate" },
      { from: M.occupied + 0.6, to: end + 0.6, key: "clock" },
    ],
    ring: ({ marks: M, boxes: B, duration: end }) => ({ rect: B.roomAfter ?? B.room, from: M.occupied + 0.6, to: end + 0.6 }),
  },

  "secret-detail": {
    mode: "camera",
    // the opening screen, its carousel, the catalogue, a product into the
    // cart: few keys, far apart, one smooth curve through them
    camera: ({ marks: M, boxes: B, duration: end }) => {
      const show = center(B.showcase);
      const card = center(B.card);
      const toast = center(B.toast);
      const near = (p: { x: number; y: number }, s: number) => ({ rx: 0, ry: 0, s, x: p.x, y: p.y });
      return [
        { t: 0, ...HOME },
        { t: M.hero, ...FLAT },
        { t: M.hero + 1.0, ...near(show, 1.3) },
        { t: M.carousel, ...near(show, 1.3) },
        { t: M.carousel + 1.4, ...FLAT },
        { t: M.hover - 1.2, ...FLAT },
        { t: M.hover, ...near({ x: card.x + 120, y: card.y + 90 }, 1.35) },
        { t: M.added - 0.3, ...near({ x: (card.x + toast.x) / 2 + 60, y: (card.y + toast.y) / 2 + 40 }, 1.3) },
        { t: end, ...near({ x: (card.x + toast.x) / 2 + 60, y: (card.y + toast.y) / 2 + 40 }, 1.3) },
        { t: end + 1.2, ...HOME },
      ];
    },
    captions: ({ marks: M, duration: end }) => [
      { from: 0.3, to: M.hero + 0.6, key: "front" },
      { from: M.hero + 1.0, to: M.carousel + 0.6, key: "carousel" },
      { from: M.hover - 0.8, to: M.added - 0.5, key: "catalogue" },
      { from: M.added - 0.2, to: end + 0.6, key: "cart" },
    ],
  },

  "dallas-motel-detail": {
    mode: "camera",
    // from the hero down the page: few keys, far apart, so the camera never
    // stops and starts (each pair of keys eases in and out). It leans in on
    // the day's tabs as the hand picks the weekend, rides the scroll flat
    // through the story, and comes a little closer to the menu.
    camera: ({ marks: M, boxes: B, duration: end }) => {
      const tabs = center(B.tabs);
      const menu = center(B.menu);
      return [
        { t: 0, ...HOME },
        { t: M.hero, ...FLAT },
        { t: M.suites - 0.3, ...FLAT },
        { t: M.suites + 0.6, rx: 0, ry: 0, s: 1.36, x: tabs.x - 250, y: tabs.y + 200 },
        { t: M.weekend + 0.2, rx: 0, ry: 0, s: 1.36, x: tabs.x - 250, y: tabs.y + 200 },
        { t: M.weekend + 1.6, ...FLAT },
        { t: M.menu - 0.6, ...FLAT },
        { t: M.menu + 0.6, rx: 0, ry: 0, s: 1.12, ...menu },
        { t: end, rx: 0, ry: 0, s: 1.12, ...menu },
        { t: end + 1.2, ...HOME },
      ];
    },
    captions: ({ marks: M, duration: end }) => [
      { from: 0.3, to: M.suites - 0.6, key: "hero" },
      { from: M.suites - 0.1, to: M.weekend + 1.0, key: "days" },
      { from: M.weekend + 2.6, to: M.legacy + 1.6, key: "legacy" },
      { from: M.menu - 0.3, to: end + 0.6, key: "menu" },
    ],
  },

  "dallas-sync-offline": { mode: "plain" },
};
