import { Suspense, lazy } from 'react'
import { useReducedMotion } from 'motion/react'
import { StarField } from '../app/components/shared/StarField'
import { useIsMobile } from '../app/hooks/useIsMobile'
import { useSmoothScroll } from '../app/hooks/useSmoothScroll'
import { BlogIndex } from './components/BlogIndex'
import { BlogNav } from './components/BlogNav'
import { ReadingProgress } from './components/ReadingProgress'
import { SceneListTOC } from './components/SceneListTOC'
import type { BlogData } from './main'

const LazyGalaxy = lazy(() => import('../app/components/react-bits/Galaxy'))

export function BlogChrome({ data }: { data: BlogData }) {
  useSmoothScroll()
  const isReducedMotion = useReducedMotion()
  const isMobile = useIsMobile()

  // Same rule as AppLayout: the WebGL starfield is the heaviest thing on the
  // page and barely perceptible on a phone.
  const useWebGL = !isMobile && !isReducedMotion

  return (
    <>
      <div className="fixed inset-0 z-0" aria-hidden="true">
        {useWebGL ? (
          <Suspense fallback={<StarField />}>
            <LazyGalaxy
              mouseRepulsion={false}
              mouseInteraction={false}
              density={0.3}
              glowIntensity={0.2}
              numLayers={4}
              saturation={0.2}
              hueShift={240}
            />
          </Suspense>
        ) : (
          <StarField />
        )}
      </div>

      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-[1] bg-gradient-to-b from-[#030305]/10 via-[#030305]/30 to-[#030305]/80"
      />

      <BlogNav />
      {data.kind === 'article' && (
        <>
          <ReadingProgress />
          <SceneListTOC toc={data.post.toc} />
        </>
      )}
      {data.kind === 'index' && <BlogIndex posts={data.posts} />}
    </>
  )
}
