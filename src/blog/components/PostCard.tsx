import { useTranslation } from 'react-i18next'
import type { PostSummary } from '../main'

const month = (iso: string) => iso.slice(0, 7).replace('-', '.')

/** One entry of the reading list: when, what, the gist, and how long it takes. */
export function PostCard({ post }: { post: PostSummary }) {
  const { t } = useTranslation()

  return (
    <li className="blog-post">
      <a href={`/blog/${post.slug}`}>
        <span className="blog-post__date">
          <time dateTime={post.date}>{month(post.date)}</time>
          {post.updated && (
            <span className="blog-post__rev">
              {t('blog.revised')} <time dateTime={post.updated}>{month(post.updated)}</time>
            </span>
          )}
        </span>
        <div>
          <h2 lang="en">{post.title}</h2>
          <p lang="en">{post.summary}</p>
          {post.tags.length > 0 && (
            <ul className="blog-tags">
              {post.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          )}
        </div>
        <span className="blog-post__mins">
          {t('blog.read_time', { count: post.readingTimeMinutes })}
          <span className="blog-post__arrow" aria-hidden="true">
            →
          </span>
        </span>
      </a>
    </li>
  )
}
