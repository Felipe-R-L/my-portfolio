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
const AUTHOR = 'Felipe Rodrigues Leone'

export function ArticleMasthead({ post }: { post: PostSummary }) {
  const { t } = useTranslation()

  return (
    <header className="article__masthead">
      {post.tags[0] && <p className="article__kicker">{post.tags[0]}</p>}
      <h1 className="article__title">{post.title}</h1>
      <p className="article__lead">{post.summary}</p>
      <p className="article__dateline">
        <span>
          {t('blog.published')} <time dateTime={post.date}>{timecode(post.date)}</time>
        </span>
        {post.updated && (
          <span className="article__revised">
            {t('blog.revised')} <time dateTime={post.updated}>{timecode(post.updated)}</time>
          </span>
        )}
        <span>{t('blog.read_time', { count: post.readingTimeMinutes })}</span>
        <span>{AUTHOR}</span>
      </p>
    </header>
  )
}
