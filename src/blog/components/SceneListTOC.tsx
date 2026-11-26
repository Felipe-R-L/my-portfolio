import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TocEntry } from 'virtual:posts'

const NARROW = '(max-width: 860px)'

/**
 * The contents, in their own column beside the text (the fan-out leaves
 * #blog-toc there). The current section is marked as the text scrolls. On a
 * narrow screen the list sits above the text, folded behind its label.
 */
export function SceneListTOC({ toc }: { toc: TocEntry[] }) {
  const { t } = useTranslation()
  const [activeId, setActiveId] = useState(toc[0]?.id ?? '')
  const [narrow, setNarrow] = useState(() => window.matchMedia?.(NARROW).matches ?? false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia?.(NARROW)
    if (!mq) return
    const sync = () => setNarrow(mq.matches)
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const headings = toc
      .map((entry) => document.getElementById(entry.id))
      .filter((el): el is HTMLElement => el !== null)
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 },
    )
    headings.forEach((h) => observer.observe(h))
    return () => observer.disconnect()
  }, [toc])

  if (toc.length === 0) return null
  const shown = !narrow || open

  return (
    <nav aria-label={t('blog.contents')}>
      {narrow ? (
        <button
          type="button"
          className="article__toc-label"
          aria-expanded={open}
          aria-controls="blog-toc-list"
          onClick={() => setOpen((v) => !v)}
        >
          {t('blog.contents')} <span aria-hidden="true">{open ? '−' : '+'}</span>
        </button>
      ) : (
        <p className="article__toc-label">{t('blog.contents')}</p>
      )}
      {shown && (
        <ol id="blog-toc-list" lang="en">
          {toc.map((entry) => (
            <li key={entry.id} data-depth={entry.depth}>
              <a
                href={`#${entry.id}`}
                aria-current={activeId === entry.id ? 'true' : undefined}
                onClick={() => setOpen(false)}
              >
                <span>{entry.numeral}</span>
                {entry.text}
              </a>
            </li>
          ))}
        </ol>
      )}
    </nav>
  )
}
