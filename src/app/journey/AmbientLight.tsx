import { CHAPTERS, type ChapterId } from "./chapters";
import "./AmbientLight.css";

/**
 * The light of each chapter, behind everything. One painted layer per
 * chapter, all static; changing chapter crossfades two of them (opacity only,
 * on the compositor). The opening keeps the light the page always had.
 * Decorative: out of the accessibility tree.
 */
export function AmbientLight({ active }: { active: ChapterId }) {
  return (
    <div className="ambient" aria-hidden="true">
      {CHAPTERS.map((c) => (
        <div key={c.id} className={`ambient-layer ambient--${c.id}`} data-on={c.id === active ? "true" : "false"} />
      ))}
    </div>
  );
}
