import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useSmoothScroll } from '../app/hooks/useSmoothScroll'
import { BlogIndex } from './components/BlogIndex'
import { BlogNav } from './components/BlogNav'
import { ReadingProgress } from './components/ReadingProgress'
import { SceneListTOC } from './components/SceneListTOC'
import type { BlogData } from './main'

/**
 * The article's static labels (dateline, "next", contact) are written in
 * English by scripts/fan-out.mjs and marked [data-i18n]; they follow the
 * reader's language from here, while the article itself stays as written.
 */
function useStaticLabels() {
  const { t, i18n } = useTranslation()
  useEffect(() => {
    document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
      const count = el.dataset.count
      el.textContent = count === undefined ? t(el.dataset.i18n!) : t(el.dataset.i18n!, { count: Number(count) })
    })
    document.documentElement.dataset.uiLang = i18n.language
  }, [t, i18n.language])
}

export function BlogChrome({ data }: { data: BlogData }) {
  useSmoothScroll()
  useStaticLabels()
  const tocSlot = typeof document === 'undefined' ? null : document.getElementById('blog-toc')

  return (
    <>
      <BlogNav kind={data.kind} />
      {data.kind === 'article' && (
        <>
          <ReadingProgress />
          {tocSlot && createPortal(<SceneListTOC toc={data.post.toc} />, tocSlot)}
        </>
      )}
      {data.kind === 'index' && <BlogIndex posts={data.posts} />}
    </>
  )
}
