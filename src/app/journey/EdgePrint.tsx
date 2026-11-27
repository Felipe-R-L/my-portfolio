import { useTranslation } from "react-i18next";

/** Where Diamante is: the same coordinates as the hero's travel stamp. */
export const DIAMANTE_COORDS = "39°40′ N · 15°49′ E";

/**
 * The film's edge print under each chapter's title: "FRL 2026 · DIAMANTE 400
 * · 0N" and where the film was shot. On a phone the coordinates take a line
 * of their own (the print never wraps mid-word).
 */
export function EdgePrint({ n }: { n: string }) {
  const { t } = useTranslation();
  return (
    <span className="edge-print" aria-hidden="true">
      <span>{t("journey.edge", { n })}</span>
      <span className="edge-coords">{DIAMANTE_COORDS}</span>
    </span>
  );
}
