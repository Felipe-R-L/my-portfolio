/**
 * A value that changes every frame without re-rendering React: the scroll
 * timeline writes it, imperative readers (WebGL, transforms) read or follow it.
 */
export type Signal<T> = {
  get(): T;
  set(v: T): void;
  on(event: "change", fn: (v: T) => void): () => void;
};

export function createSignal<T>(initial: T): Signal<T> {
  let value = initial;
  const subs = new Set<(v: T) => void>();
  return {
    get: () => value,
    set(v) {
      if (Object.is(v, value)) return;
      value = v;
      subs.forEach((fn) => fn(v));
    },
    on(_event, fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}
