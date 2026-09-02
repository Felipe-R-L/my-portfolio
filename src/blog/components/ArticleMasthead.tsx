import { useTranslation } from 'react-i18next'
import type { PostSummary } from '../main'

// This component is never mounted in the browser. The masthead is static
// content, so scripts/fan-out.mjs emits an equivalent template string
// directly into the built HTML (see mastheadHtml there); shipping React to
// render six lines of markup would defeat the islands architecture the rest
// of the blog subsystem relies on. This file exists solely so the date
// logic (publish vs. revised) has something `renderToStaticMarkup` can
// exercise in tests/ui/masthead.test.tsx. Keep the two in sync by hand.

const timecode = (iso: string) => iso.replaceAll('-', '.')

export function ArticleMasthead({ post }: { post: PostSummary }) {
  const { t } = useTranslation()

  return (
    <header className="px-[var(--gutter)] pb-10 pt-2 max-w-[62ch] mx-auto">
      {post.tags[0] && (
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-white/40 mb-5">
          {post.tags[0]}
        </p>
      )}

      <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-bold leading-[1.1] tracking-tighter text-white">
        {post.title}
      </h1>

      <div
        aria-hidden="true"
        className="mt-6 h-1 w-24 rounded-full bg-gradient-to-r from-[var(--zone-a-1)] to-[var(--zone-a-2)]"
      />

      <p className="mt-6 text-[21px] font-light leading-[1.6] text-white/60">{post.summary}</p>

      <p className="mt-7 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">
        {t('blog.published')}{' '}
        <time dateTime={post.date}>{timecode(post.date)}</time>
        {post.updated && (
          <>
            {' · '}
            <span className="text-[var(--zone-a-1)]">
              {t('blog.revised')} <time dateTime={post.updated}>{timecode(post.updated)}</time>
            </span>
          </>
        )}
        {' · '}
        {t('blog.read_time', { count: post.readingTimeMinutes })}
      </p>
    </header>
  )
}
