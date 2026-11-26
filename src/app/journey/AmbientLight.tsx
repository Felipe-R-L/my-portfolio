import { useEffect, useState } from "react";

import { CHAPTERS, type ChapterId } from "./chapters";
import "./AmbientLight.css";

/**
 * The light of each chapter, behind everything. One painted layer per
 * chapter, all static; changing chapter crossfades two of them (opacity only,
 * on the compositor). The opening keeps the light the page always had.
 * Decorative: out of the accessibility tree.
 */
/**
 * Como funciona's light is a place: Diamante, a white town on the Calabrian
 * coast (Eugenio Magurno, CC BY-SA 3.0, via Wikimedia Commons; credited in the
 * footer), dimmed, panning sideways with the travel along the line
 * (`--plano-pan`, set by Process). It lives here, behind the frame, so it
 * never covers the frame as it crosses. Fetched once the visitor reaches the
 * chapters around it, never with the page.
 */
const SCENERY = {
  src: "/assets/story/diamante-c-1200.webp",
  srcSet: "/assets/story/diamante-c-1200.webp 1200w, /assets/story/diamante-c-2400.webp 2400w",
};
const NEAR: ChapterId[] = ["telemetria", "plano", "retorno"];

export function AmbientLight({ active }: { active: ChapterId }) {
  const [scenery, setScenery] = useState(false);
  useEffect(() => {
    if (NEAR.includes(active)) setScenery(true);
  }, [active]);
  return (
    <div className="ambient" aria-hidden="true">
      {CHAPTERS.map((c) => (
        <div key={c.id} className={`ambient-layer ambient--${c.id}`} data-on={c.id === active ? "true" : "false"}>
          {c.id === "plano" && scenery && <img className="ambient-scenery" src={SCENERY.src} srcSet={SCENERY.srcSet} sizes="130vw" alt="" decoding="async" />}
        </div>
      ))}
    </div>
  );
}
