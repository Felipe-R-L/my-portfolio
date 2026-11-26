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
 * Two chapters have a place for their light, behind the frame so they never
 * cover it as it crosses, and fetched only near them, never with the page:
 *
 * plano    a topographic map (generated: scripts/assets/topo.mjs), panning
 *          sideways with the travel along the line (`--plano-pan`, Process);
 * retorno  Diamante, a white town on the Calabrian coast (Eugenio Magurno,
 *          CC BY-SA 3.0, via Wikimedia Commons; credited in the footer),
 *          behind the invitation.
 */
const SCENERY: Partial<Record<ChapterId, { src: string; srcSet: string; near: ChapterId[] }>> = {
  plano: {
    src: "/assets/plano/topo-1200.webp",
    srcSet: "/assets/plano/topo-1200.webp 1200w, /assets/plano/topo-2400.webp 2400w",
    near: ["destinos", "plano", "retorno"],
  },
  retorno: {
    src: "/assets/story/diamante-c-1200.webp",
    srcSet: "/assets/story/diamante-c-1200.webp 1200w, /assets/story/diamante-c-2400.webp 2400w",
    near: ["plano", "retorno"],
  },
};

export function AmbientLight({ active }: { active: ChapterId }) {
  // once a chapter with a place is near, its picture stays loaded
  const [loaded, setLoaded] = useState<Partial<Record<ChapterId, true>>>({});
  useEffect(() => {
    for (const [id, sc] of Object.entries(SCENERY)) {
      if (sc?.near.includes(active)) setLoaded((l) => (l[id as ChapterId] ? l : { ...l, [id]: true }));
    }
  }, [active]);
  return (
    <div className="ambient" aria-hidden="true">
      {CHAPTERS.map((c) => (
        <div key={c.id} className={`ambient-layer ambient--${c.id}`} data-on={c.id === active ? "true" : "false"}>
          {SCENERY[c.id] && loaded[c.id] && (
            <img className={`ambient-scenery ambient-scenery--${c.id}`} src={SCENERY[c.id]!.src} srcSet={SCENERY[c.id]!.srcSet} sizes="130vw" alt="" decoding="async" />
          )}
        </div>
      ))}
    </div>
  );
}
