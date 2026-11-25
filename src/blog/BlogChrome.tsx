import { StarField } from '../app/components/shared/StarField'
import { useSmoothScroll } from '../app/hooks/useSmoothScroll'
import { BlogIndex } from './components/BlogIndex'
import { BlogNav } from './components/BlogNav'
import { ReadingProgress } from './components/ReadingProgress'
import { SceneListTOC } from './components/SceneListTOC'
import type { BlogData } from './main'

export function BlogChrome({ data }: { data: BlogData }) {
  useSmoothScroll()
  return (
    <>
      <div className="fixed inset-0 z-0" aria-hidden="true">
        <StarField />
      </div>

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
