import { useEffect, type RefObject } from "react";

/**
 * Cards that lean towards the pointer, in 3D. Every `[data-tilt]` inside
 * `root` gets `--rx`, `--ry` (degrees) and `--gx`, `--gy` (the glare's
 * position, in %) while a mouse is over it; the CSS decides what to do with
 * them. Touch and reduced motion get nothing: the cards simply stay flat.
 */
export function useTilt(root: RefObject<HTMLElement | null>, maxDeg = 7) {
  useEffect(() => {
    const el = root.current;
    if (!el || typeof window === "undefined" || !window.matchMedia) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const onMove = (e: PointerEvent) => {
      const card = (e.target as Element | null)?.closest?.<HTMLElement>("[data-tilt]");
      if (!card || !el.contains(card)) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      card.style.setProperty("--ry", `${((x - 0.5) * 2 * maxDeg).toFixed(2)}deg`);
      card.style.setProperty("--rx", `${((0.5 - y) * 2 * maxDeg).toFixed(2)}deg`);
      card.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
      card.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
      card.dataset.tilting = "true";
    };
    const onLeave = (e: PointerEvent) => {
      const card = (e.target as Element | null)?.closest?.<HTMLElement>("[data-tilt]");
      if (!card) return;
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
      card.dataset.tilting = "false";
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerout", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerout", onLeave);
    };
  }, [root, maxDeg]);
}
