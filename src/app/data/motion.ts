import { center, type ClipMeta, type Rect } from "../components/motion/clip";

/**
 * How each recorded clip is presented (Felipe, 2026-11-26: the approach that
 * works best for each project). Every moment comes from the clip's own marks
 * and boxes (scripts/capture), so a new take keeps the motion in step.
 *
 * camera  Dallas Sync: the screen sits tilted like a device on a desk, the
 *         camera dives into the gesture (the plate, the confirm) and pulls
 *         back to the room whose clock starts running.
 * crops   the shop and the motel's site: the screen steps aside and the
 *         details that convince come off it, enlarged, one after another.
 * plain   Em uso: the camera holds still (the chapter's idea); only the hand.
 *
 * Words: `work.items.<id>.motion.<key>`.
 */
export type CameraKey = { t: number; rx: number; ry: number; s: number; x: number; y: number };
export type Caption = { from: number; to: number; key: string };
export type Crop = { still: string; rect: Rect; at: number; key: string };
export type MotionSpec =
  | {
      mode: "camera";
      camera: (m: ClipMeta) => CameraKey[];
      captions: (m: ClipMeta) => Caption[];
      /** A ring drawn around something on screen, for a while. */
      ring?: (m: ClipMeta) => { rect: Rect; from: number; to: number } | null;
    }
  | { mode: "crops"; crops: (m: ClipMeta) => Crop[] }
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
    mode: "crops",
    crops: ({ marks: M, clicks }) => [
      // the variant chosen, with its own price above it
      { still: "variant", rect: { x: 760, y: 170, w: 570, h: 330 }, at: M.variant, key: "variant" },
      // the cart: one item, no account
      { still: "cart", rect: { x: 168, y: 82, w: 650, h: 120 }, at: M.cart + 0.3, key: "cart" },
      // Pix, the Mercado Pago step, and why it asks for a CPF (from the click on Pix)
      { still: "pix", rect: { x: 866, y: 352, w: 396, h: 210 }, at: (clicks.find((c) => c > M.cart + 3) ?? M.pix - 3) + 0.5, key: "pix" },
    ],
  },

  "dallas-motel-detail": {
    mode: "crops",
    crops: ({ marks: M }) => {
      // the first suite's total, as the day changes
      const rect = { x: 104, y: 748, w: 372, h: 86 };
      return [
        { still: "weekday", rect, at: M.weekday + 0.4, key: "weekday" },
        { still: "weekend", rect, at: M.weekend, key: "weekend" },
        { still: "holiday", rect, at: M.holiday, key: "holiday" },
      ];
    },
  },

  "dallas-sync-offline": { mode: "plain" },
};
