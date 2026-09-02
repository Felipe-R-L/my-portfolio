import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TocEntry } from 'virtual:posts'
import { cn } from '../../app/utils/cn'

/*
 * The desktop rail floats over the galaxy at the page margin, where there is
 * already light behind it to blur — the same situation as the desktop nav
 * pill, and the same recipe. It deliberately does NOT use `.glass-dark`: that
 * surface brightens its own backdrop to survive sitting on the near-black
 * article slab, and applied over the galaxy it blows the rail out to white.
 */
const RAIL_GLASS =
  'border border-white/[0.14] bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150 ' +
  'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16)]'

export function SceneListTOC({ toc }: { toc: TocEntry[] }) {
  const { t } = useTranslation()
  const [activeId, setActiveId] = useState(toc[0]?.id ?? '')
  const [open, setOpen] = useState(false)

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

  const list = (
    <ol className="space-y-3">
      {toc.map((entry) => (
        <li key={entry.id} style={{ paddingLeft: entry.depth === 3 ? '0.9rem' : 0 }}>
          <a
            href={`#${entry.id}`}
            aria-current={activeId === entry.id ? 'true' : undefined}
            onClick={() => setOpen(false)}
            className={cn(
              'flex gap-2.5 border-l-2 pl-3 text-[11px] font-medium uppercase tracking-[0.12em] transition-colors duration-300',
              activeId === entry.id
                ? 'border-[var(--zone-a-1)] text-white'
                : 'border-transparent text-white/45 hover:text-white/80',
            )}
          >
            {entry.numeral && <span className="shrink-0 text-white/25">{entry.numeral}</span>}
            <span>{entry.text}</span>
          </a>
        </li>
      ))}
    </ol>
  )

  return (
    <>
      <nav
        aria-label={t('blog.contents')}
        className={cn(
          'hidden xl:block fixed left-6 top-1/2 -translate-y-1/2 z-40 w-56 max-h-[70vh] overflow-y-auto rounded-[24px] px-5 py-6',
          RAIL_GLASS,
        )}
      >
        <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.25em] text-white/30">
          {t('blog.contents')}
        </p>
        {list}
      </nav>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'glass-dark xl:hidden fixed right-3 z-[45] rounded-[40px] px-5 py-3',
          'bottom-[var(--dock-stacked)] md:bottom-[var(--dock-bottom)]',
          'text-[10px] font-medium uppercase tracking-[0.2em] text-white',
        )}
      >
        {open ? t('blog.close') : t('blog.contents')}
      </button>

      {open && (
        <nav
          aria-label={t('blog.contents')}
          className={cn(
            'glass-sheet xl:hidden fixed inset-0 z-40 overflow-y-auto px-8 pt-24',
            'pb-[calc(var(--dock-stacked)+var(--dock-height))]',
          )}
        >
          {list}
        </nav>
      )}
    </>
  )
}
