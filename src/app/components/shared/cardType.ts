/**
 * One type scale for every project card.
 *
 * The three card shapes — an OMD product row, the featured project, and a
 * compact project — had drifted into three separate scales. Titles ran at 36px,
 * 30px and 20px for the same job; body copy was 16px/gray-300 in the wide cards
 * and 14px/gray-400 in the compact ones, so his own projects literally rendered
 * dimmer and smaller than his employer's; and the 11px uppercase micro-label
 * appeared with six different tracking values and two weights.
 *
 * The roles below are named for their job, not their size, and a card composes
 * from them instead of inventing its own values.
 *
 * The cascade is 48 (section) → 32 (employer) → 28 (stat) → 24 (project name)
 * → 16/15 (body) → 11 (label). A project's name is one size everywhere: the
 * difference between a featured card and a compact one is already carried by
 * width, image area and body size, so the title does not need to restate it.
 */

/**
 * 11px uppercase micro-label: category, contribution, status, stat label.
 * `eyebrowShape` carries no colour, for the few labels that take a zone accent
 * instead of the default grey.
 */
export const eyebrowShape = "text-[11px] font-medium uppercase tracking-[0.15em]";
export const eyebrow = `${eyebrowShape} text-gray-400`;

/** The employer, which has to outrank the products nested inside it. */
export const employerName =
  "text-[1.75rem] md:text-[2rem] font-bold text-white tracking-[-0.035em] leading-[1.1]";

/** A project or product name, identical in every card. */
export const cardTitle = "text-2xl font-bold text-white tracking-[-0.025em] leading-[1.15]";

/**
 * A published figure. Larger than the title it sits under, because in a card
 * that has evidence the evidence is what the eye should land on — and a
 * tabular number under an uppercase label is never mistaken for a heading.
 */
export const statValue =
  "text-2xl md:text-[1.75rem] font-bold text-white tracking-[-0.03em] tabular-nums leading-[1.15]";

/**
 * Card prose. Light weight on a dark ground needs the extra leading and the
 * brighter grey to stay comfortable; 15px is the floor at which 300 weight
 * still holds up here.
 */
export const bodyLead =
  "text-[15px] md:text-base text-gray-300 font-light leading-[1.7]";
export const bodyCompact =
  "text-sm md:text-[15px] text-gray-300 font-light leading-[1.7]";

/** Attribution under a stat row. Sentence case is what separates it from the
 *  uppercase labels directly above it. */
export const footnote = "text-[11px] text-gray-400 leading-relaxed";

/** Padding and internal gap for each tier. */
export const leadBox = "p-6 md:p-8 flex flex-col justify-center gap-4";
export const compactBox = "p-6 flex flex-col flex-1 gap-3";
