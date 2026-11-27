import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import type { Signal } from "../scroll/signal";
import { CHAPTERS, chapterIndex, type ChapterId } from "./chapters";
import "./ChapterRail.css";

/**
 * Where you are and how much is left: one tick per chapter, the current
 * chapter's number and name, and a hairline that fills as you go. The fill
 * follows the scroll every frame through a transform, never React.
 *
 * `variant="desk"` is the rail in the lower-left corner; `variant="pill"` is
 * the same information sized for the phone's nav pill.
 */
export function ChapterRail({
  active,
  progress,
  variant,
}: {
  active: ChapterId;
  progress: Signal<number>;
  variant: "desk" | "pill";
}) {
  const { t } = useTranslation();
  const fillRef = useRef<HTMLSpanElement>(null);
  const i = chapterIndex(active);
  const total = CHAPTERS.length;

  useEffect(() => {
    const paint = (p: number) => {
      // the desk rail stands up and fills upward; the pill's lies down
      if (fillRef.current) fillRef.current.style.transform = variant === "desk" ? `scaleY(${p})` : `scaleX(${p})`;
    };
    paint(progress.get());
    return progress.on("change", paint);
  }, [progress, variant]);

  const label = t(CHAPTERS[i].label);
  // the desk rail stands alone in the margin, so it is a landmark of its own;
  // the pill's lives inside the nav's button
  const Root = variant === "desk" ? "aside" : "div";
  return (
    <Root className={`rail rail--${variant}`} data-variant={variant} {...(variant === "desk" ? { "aria-label": t("journey.rail_label") } : {})}>
      <span className="rail-count" aria-hidden="true">
        {String(i + 1).padStart(2, "0")}
        <span className="rail-of">/{String(total).padStart(2, "0")}</span>
      </span>
      {/* key: the name re-enters on change, so a new chapter is noticed */}
      <span key={active} className="rail-name">
        {label}
      </span>
      <span className="rail-track" aria-hidden="true">
        {CHAPTERS.map((c, k) => (
          <span key={c.id} className="rail-tick" data-on={k <= i ? "true" : "false"} style={{ ["--k" as string]: k }} />
        ))}
        <span ref={fillRef} className="rail-fill" />
      </span>
      <span className="sr-only">{t("journey.where", { n: i + 1, total, name: label })}</span>
    </Root>
  );
}
