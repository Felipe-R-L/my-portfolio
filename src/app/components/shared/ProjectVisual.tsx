import { ArchDiagram } from "./ArchDiagram";
import { eyebrow } from "./cardType";

type Visual =
  | { kind: "shot"; src: string; srcSet: string }
  | { kind: "lockup"; src: string }
  | { kind: "arch" };

/**
 * Three ways to fill the slot a screenshot would occupy, because three of the
 * five projects have no public screen. None of them fabricates a interface:
 * a real capture, the product's own brand mark, or the architecture itself.
 */
export function ProjectVisual({
  visual,
  alt,
  sizes,
  note,
  tKey,
  fit = "cover",
}: {
  visual: Visual;
  alt: string;
  sizes: string;
  /** Explains the absence on the lockup variant, e.g. "internal platform". */
  note?: string;
  /** i18n prefix for the architecture copy. Only the `arch` variant reads it. */
  tKey?: string;
  /**
   * `cover` for the short, wide slot on a compact card, where the capture is
   * much wider than the slot and cropping the bottom is the right call.
   * `framed` for the tall slot beside a text column, where cover would have to
   * scale the 16:10 capture up to fill the height and would slice the site's
   * own headline off at both edges.
   */
  fit?: "cover" | "framed";
}) {
  if (visual.kind === "arch") return <ArchDiagram tKey={tKey ?? ""} />;

  if (visual.kind === "lockup") {
    return (
      <div className="h-full grid place-items-center bg-[#07070c] p-6 text-center">
        <div>
          <img
            src={visual.src}
            alt={alt}
            width={334}
            height={107}
            loading="lazy"
            decoding="async"
            className="w-[min(230px,62%)] h-auto mx-auto"
          />
          {note && (
            <p className={`mt-5 ${eyebrow}`}>{note}</p>
          )}
        </div>
      </div>
    );
  }

  const img = (
    <img
      src={visual.src}
      srcSet={visual.srcSet}
      sizes={sizes}
      alt={alt}
      width={720}
      height={450}
      loading="lazy"
      decoding="async"
      className={
        fit === "framed"
          ? "max-w-full max-h-full w-auto h-auto object-contain block rounded-lg border border-white/10 shadow-2xl"
          : /* `object-top` keeps the hero of the captured site visible. Centring
               it cropped to the middle of a full-page screenshot, which read as
               noise. Height comes from the wrapper so each card sizes its slot. */
            "w-full h-full object-cover object-top block"
      }
    />
  );

  if (fit === "framed") {
    return <div className="h-full grid place-items-center p-5 md:p-7">{img}</div>;
  }

  return img;
}
