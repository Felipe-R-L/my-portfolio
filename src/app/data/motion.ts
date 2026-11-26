import { center, type ClipMeta, type Rect } from "../components/motion/clip";

/**
 * How each recorded clip is presented (Felipe, 2026-11-26). Every moment comes from the clip's own marks
 * and boxes (scripts/capture), so a new take keeps the motion in step.
 *
 * camera  every project: the screen sits tilted like a device on a desk, the
 *         camera dives into each gesture where the hand clicks (Dallas Sync:
 *         the plate, the confirm, the room whose clock starts; the shop: the
 *         variant and its price, the cart, Pix; the motel: from the hero down
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
    // product, its variant and price, into the cart, then Pix (from where the hand clicked)
    camera: ({ marks: M, boxes: B, clicks: C, duration: end }) => {
      const cart = center(B.cartItem);
      const pickup = center(B.pickup);
      const pix = center(B.pixOption);
      const name = center(B.name);
      return [
        { t: 0, ...HOME },
        { t: C[0] - 0.45, rx: 0, ry: 0, s: 1.25, x: 229, y: 457 },
        { t: C[0] + 0.5, ...FLAT },
        { t: C[1] - 0.6, rx: 0, ry: 0, s: 1.5, x: 1116, y: 330 },
        { t: M.variant + 0.2, rx: 0, ry: 0, s: 1.5, x: 1116, y: 330 },
        { t: C[2] - 0.2, rx: 0, ry: 0, s: 1.4, x: 1001, y: 560 },
        { t: C[2] + 0.7, ...FLAT },
        { t: C[3] - 0.3, rx: 0, ry: 0, s: 1.3, x: 1312, y: 120 },
        { t: C[3] + 1.0, ...FLAT },
        { t: M.cart - 0.2, rx: 0, ry: 0, s: 1.45, x: (cart.x + pickup.x) / 2, y: (cart.y + pickup.y) / 2 + 40 },
        { t: C[4] + 0.6, rx: 0, ry: 0, s: 1.45, x: (cart.x + pickup.x) / 2, y: (cart.y + pickup.y) / 2 + 40 },
        { t: C[5] - 0.2, rx: 0, ry: 0, s: 1.4, x: 1090, y: 480 },
        { t: C[6] - 0.4, rx: 0, ry: 0, s: 1.55, ...pix },
        { t: C[7] - 0.4, rx: 0, ry: 0, s: 1.6, x: name.x + 120, y: name.y - 60 },
        { t: end - 0.3, rx: 0, ry: 0, s: 1.6, x: name.x + 120, y: name.y - 60 },
        { t: end + 1.2, ...HOME },
      ];
    },
    captions: ({ marks: M, clicks: C, duration: end }) => [
      { from: C[1] - 0.4, to: C[2] - 0.1, key: "variant" },
      { from: M.cart, to: C[5], key: "cart" },
      { from: C[6] - 0.2, to: end + 0.6, key: "pix" },
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
