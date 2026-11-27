/**
 * Diamante never stops: the first part of the flight (pulling back from the
 * old town to the whole coast) hands over to the rest (in towards the
 * point, over the roofs, a boat out to sea), which hands back to the first.
 * Each picks up where the other leaves off, and they dissolve into each
 * other (HeroCity.css). The second is fetched only once the first is well
 * under way, so it never competes with the first frame.
 */
export function placeLoop(stage: HTMLElement): () => void {
  const vids = Array.from(stage.querySelectorAll<HTMLVideoElement>(".city-place-video"));
  if (vids.length < 2) return () => {};
  const [first, rest] = vids;
  let disposed = false;

  const warm = () => {
    if (rest.preload !== "auto") {
      rest.preload = "auto";
      rest.load();
    }
  };
  const onTime = () => {
    if (first.duration && first.currentTime / first.duration > 0.4) warm();
  };
  const hand = (from: HTMLVideoElement, to: HTMLVideoElement) => () => {
    if (disposed) return;
    warm();
    to.currentTime = 0;
    void to.play().catch(() => {});
    to.removeAttribute("data-off");
    from.setAttribute("data-off", "");
  };
  const toRest = hand(first, rest);
  const toFirst = hand(rest, first);
  first.addEventListener("timeupdate", onTime);
  first.addEventListener("ended", toRest);
  rest.addEventListener("ended", toFirst);
  return () => {
    disposed = true;
    first.removeEventListener("timeupdate", onTime);
    first.removeEventListener("ended", toRest);
    rest.removeEventListener("ended", toFirst);
  };
}

/** The part of the flight on screen now. */
export function placeVideoOn(stage: HTMLElement): HTMLVideoElement | null {
  return stage.querySelector<HTMLVideoElement>(".city-place-video:not([data-off])");
}
