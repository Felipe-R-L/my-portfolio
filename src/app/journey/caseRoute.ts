import { useCallback, useEffect, useState } from "react";

import { workBySlug, type WorkItem } from "../data/work";
import type { Box } from "./director";

/**
 * The case route: /work/<slug>. A case is a layer over the journey, never a
 * page of its own in the app: the journey underneath does not scroll while
 * it is open, so closing it (the button, Escape or the browser's back) puts
 * the visitor back on the exact pixel they left. A direct visit to the
 * address (a link sent on WhatsApp) gets static HTML from the build
 * (scripts/fan-out.mjs) and opens the same layer over the journey.
 */
const PREFIX = "/work/";

export function slugFromPath(path: string): string | null {
  if (!path.startsWith(PREFIX)) return null;
  const slug = path.slice(PREFIX.length).replace(/\/$/, "");
  return workBySlug(slug) ? slug : null;
}

export type CaseState = {
  item: WorkItem | null;
  /** Where the picture was on screen when the case was opened (T2 starts there). */
  from: Box | null;
  open: (item: WorkItem, from: Box | null) => void;
  close: () => void;
};

export function useCaseRoute(): CaseState {
  const initial = typeof window === "undefined" ? null : slugFromPath(window.location.pathname);
  const [slug, setSlug] = useState<string | null>(initial);
  const [from, setFrom] = useState<Box | null>(null);
  // a direct visit has no journey state to return to: closing goes to the work
  const [direct] = useState(initial !== null);

  useEffect(() => {
    const onPop = () => setSlug(slugFromPath(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const open = useCallback((item: WorkItem, box: Box | null) => {
    setFrom(box);
    setSlug(item.slug);
    window.history.pushState({ case: item.slug }, "", `${PREFIX}${item.slug}`);
  }, []);

  const close = useCallback(() => {
    if (window.history.state?.case) {
      // opened from the journey: going back restores the address and the place
      window.history.back();
      return;
    }
    setSlug(null);
    window.history.replaceState(null, "", direct ? "/#projects" : "/");
    if (direct) document.getElementById("projects")?.scrollIntoView();
  }, [direct]);

  return { item: slug ? workBySlug(slug) ?? null : null, from, open, close };
}
