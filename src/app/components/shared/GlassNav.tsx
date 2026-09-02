import { useEffect, useId, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Menu, X } from "lucide-react";
import { cn } from "../../utils/cn";

export interface GlassNavItem {
  /** Stable React key, also used to build the mobile panel's focus target. */
  id: string;
  href: string;
  label: string;
  /**
   * Called from the link's onClick. Leave undefined for a plain link that
   * should navigate normally (e.g. leaving the page). When provided, it is
   * responsible for calling `preventDefault()` itself if it wants to take
   * over navigation — GlassNav never assumes that for you.
   */
  onSelect?: (event: ReactMouseEvent<HTMLAnchorElement>) => void;
}

export interface GlassNavLanguage {
  code: string;
  label: string;
}

export interface GlassNavEntrance {
  duration: number;
  delay: number;
}

export interface GlassNavProps {
  items: GlassNavItem[];
  languages: GlassNavLanguage[];
  activeLanguage: string;
  onLanguageChange: (code: string) => void;
  /** Visible + accessible label for the collapsed toggle, e.g. "Menu". */
  openLabel: string;
  /** Visible + accessible label for the expanded toggle, e.g. "Close". */
  closeLabel: string;
  entrance?: GlassNavEntrance;
}

// Reused verbatim from the original floating pill: a cheap backdrop blur
// reads as frosted glass over the moving starfield. A GlassSurface (SVG
// displacement filter) was tried here before and rejected — every browser
// on iOS is WebKit, whose supportsSVGFilters() rejects WebKit outright, so
// it always fell back to this same backdrop blur while adding an SVG filter
// whose height would now be animating, which is exactly what produced a
// rendering glitch.
const GLASS =
  "border border-white/[0.14] bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16)]";

const DEFAULT_ENTRANCE: GlassNavEntrance = { duration: 0.8, delay: 1.5 };

// Mobile pill geometry. Every value maps 1:1 to a Tailwind spacing class
// (h-11 = 44px, h-14 = 56px, my-2 = 16px + 1px border) so the animated
// height always matches what's actually laid out beneath it.
const CLOSED_HEIGHT = 56;
const ITEM_HEIGHT = 44;
const LANGUAGE_ROW_HEIGHT = 44;
const DIVIDER_SPACE = 17;
const CONTENT_PADDING = 16;
const CLOSED_RADIUS = 28;
const OPEN_RADIUS = 32;

function openHeightFor(itemCount: number) {
  return CONTENT_PADDING + itemCount * ITEM_HEIGHT + DIVIDER_SPACE + LANGUAGE_ROW_HEIGHT + CLOSED_HEIGHT;
}

/**
 * Shared nav pill for both the homepage and the blog.
 *
 * Desktop (md and up) renders the original top-centred floating pill
 * verbatim. Below md it renders a completely different presentation: a
 * bottom-anchored pill that expands upward in place, so it stays legible
 * and tappable on a phone instead of shrinking five links into a 9px strip.
 */
export function GlassNav({
  items,
  languages,
  activeLanguage,
  onLanguageChange,
  openLabel,
  closeLabel,
  entrance = DEFAULT_ENTRANCE,
}: GlassNavProps) {
  const [open, setOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const panelId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const wasOpenRef = useRef(false);

  // Body scroll lock while the panel is open, restored on close/unmount.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Close on Escape and on any tap outside the pill.
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const handlePointerDown = (event: Event) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  // Move focus into the panel on open, back to the toggle on close.
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      firstLinkRef.current?.focus();
    } else if (!open && wasOpenRef.current) {
      toggleRef.current?.focus();
    }
    wasOpenRef.current = open;
  }, [open]);

  const handleItemClick = (item: GlassNavItem) => (event: ReactMouseEvent<HTMLAnchorElement>) => {
    item.onSelect?.(event);
    setOpen(false);
  };

  const underline = (
    <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-gradient-to-r from-[var(--zone-a-1)] to-[var(--zone-a-2)] group-hover:w-full transition-all duration-300" />
  );

  const linkClassName =
    "text-[9px] md:text-xs font-medium uppercase tracking-[0.05em] md:tracking-[0.2em] text-white/60 hover:text-white transition-colors relative group whitespace-nowrap";

  const openHeight = openHeightFor(items.length);
  const panelTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 300, damping: 30 };

  return (
    <>
      {/* Desktop: the original floating pill, unchanged, hidden below md. */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: entrance.duration, delay: entrance.delay, ease: "easeOut" }}
        className="hidden md:block fixed top-6 left-1/2 -translate-x-1/2 z-50 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-[40px] w-max"
      >
        <div className={cn("rounded-[40px] px-8 py-3", GLASS)}>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-8">
              {items.map((item) =>
                item.onSelect ? (
                  <motion.a
                    key={item.id}
                    href={item.href}
                    className={linkClassName}
                    whileHover={{ y: -1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    onClick={(event) => item.onSelect?.(event)}
                  >
                    {item.label}
                    {underline}
                  </motion.a>
                ) : (
                  <a key={item.id} href={item.href} className={linkClassName}>
                    {item.label}
                    {underline}
                  </a>
                ),
              )}
            </div>

            <div className="flex items-center gap-3 pl-6 border-l border-white/10 h-4">
              {languages.map((lang) => {
                const isActive = activeLanguage.startsWith(lang.code);
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => onLanguageChange(lang.code)}
                    lang={lang.code}
                    title={lang.label}
                    aria-pressed={isActive}
                    className={`text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
                      isActive ? "text-[var(--zone-a-1)]" : "text-white/50 hover:text-white/80"
                    }`}
                  >
                    {lang.code}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile: bottom-anchored pill that expands upward in place. */}
      <nav
        ref={rootRef}
        aria-label="Primary"
        className="md:hidden fixed inset-x-3 bottom-4 z-50"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: entrance.duration, delay: entrance.delay, ease: "easeOut" }}
          className="shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        >
          <motion.div
            animate={{ height: open ? openHeight : CLOSED_HEIGHT, borderRadius: open ? OPEN_RADIUS : CLOSED_RADIUS }}
            transition={panelTransition}
            className={cn("flex flex-col justify-end overflow-hidden", GLASS)}
          >
            <div
              id={panelId}
              className={cn("flex flex-col py-2 px-2", !open && "invisible")}
              aria-hidden={!open}
            >
              {items.map((item, index) => (
                <a
                  key={item.id}
                  ref={index === 0 ? firstLinkRef : undefined}
                  href={item.href}
                  onClick={handleItemClick(item)}
                  className="flex h-11 shrink-0 items-center rounded-2xl px-3 text-[17px] font-medium text-white/80 transition-colors hover:bg-white/5 hover:text-white"
                >
                  {item.label}
                </a>
              ))}

              <div className="my-2 border-t border-white/10" />

              <div className="flex h-11 shrink-0 items-center justify-center gap-3">
                {languages.map((lang) => {
                  const isActive = activeLanguage.startsWith(lang.code);
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => onLanguageChange(lang.code)}
                      lang={lang.code}
                      title={lang.label}
                      aria-pressed={isActive}
                      className={cn(
                        "min-h-[44px] min-w-[44px] rounded-full px-4 text-sm font-bold uppercase tracking-widest transition-colors duration-300",
                        isActive ? "bg-white/10 text-[var(--zone-a-1)]" : "text-white/50 hover:text-white/80",
                      )}
                    >
                      {lang.code}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls={panelId}
              aria-label={open ? closeLabel : openLabel}
              className="flex h-14 min-h-[44px] shrink-0 items-center justify-between gap-2 px-5"
            >
              <span className="flex items-center gap-2 text-[17px] font-medium text-white">
                {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
                {open ? closeLabel : openLabel}
              </span>
              <span className="text-[13px] font-bold uppercase tracking-widest text-white/50" aria-hidden="true">
                {activeLanguage.slice(0, 2)}
              </span>
            </button>
          </motion.div>
        </motion.div>
      </nav>
    </>
  );
}
