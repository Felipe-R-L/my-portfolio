/**
 * Where scenes hand their beats to the frame. A scene registers a builder
 * that reads its own layout (scroll offsets, slots) and returns its beats;
 * the frame calls every builder again whenever the layout may have changed
 * (ScrollTrigger refresh, resize, a scene asking for it), so beats are never
 * stale and never hold measurements of their own.
 */
import type { Beat, Box } from "./director";

type Builder = () => Beat[];

const builders = new Map<string, Builder>();
const listeners = new Set<() => void>();

export function registerBeats(key: string, build: Builder): () => void {
  builders.set(key, build);
  notify();
  return () => {
    builders.delete(key);
    notify();
  };
}

/** Ask the frame to rebuild every scene's beats (e.g. a phone swipe changed
    which destination a beat shows). */
export function notify(): void {
  listeners.forEach((fn) => fn());
}

export function onBeatsChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function collectBeats(): Beat[] {
  return [...builders.values()].flatMap((b) => b()).sort((a, b) => a.start - b.start);
}

/** A slot's live box in the viewport. */
export function boxOf(el: Element | null): Box {
  const r = el?.getBoundingClientRect();
  return r ? { x: r.left, y: r.top, w: r.width, h: r.height } : { x: 0, y: 0, w: 0, h: 0 };
}

/** An element's top in page scroll pixels. */
export function pageTop(el: Element): number {
  return el.getBoundingClientRect().top + window.scrollY;
}
