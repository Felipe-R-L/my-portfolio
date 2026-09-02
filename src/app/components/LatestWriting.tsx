import { Suspense, lazy } from "react";

/**
 * `virtual:posts` embeds the full rendered HTML of every article (see
 * plugins/vite-plugin-posts.mjs), which is fine for the blog entry but has no
 * business riding into the homepage's main chunk just so this teaser can read
 * a title and a summary. Loading the data-reading half of the section behind
 * a dynamic import gives it its own chunk, split off from `main`, mirroring
 * how AppLayout already lazy-loads Galaxy and FluidGlass.
 */
const LatestWritingContent = lazy(() => import("./LatestWritingContent"));

export function LatestWriting() {
  return (
    <Suspense fallback={null}>
      <LatestWritingContent />
    </Suspense>
  );
}
