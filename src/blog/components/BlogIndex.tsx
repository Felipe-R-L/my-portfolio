import { useTranslation } from 'react-i18next'
import { PostCard } from './PostCard'
import type { PostSummary } from '../main'

/** The index: a reading list, newest first. */
export function BlogIndex({ posts }: { posts: PostSummary[] }) {
  const { t } = useTranslation()

  return (
    <main className="blog-page" id="article-body" tabIndex={-1}>
      <header className="blog-mast">
        <div>
          <span className="blog-eyebrow">{t('blog.eyebrow')}</span>
          <h1>{t('blog.title')}</h1>
        </div>
        <p>{t('blog.intro')}</p>
      </header>

      {posts.length === 0 ? (
        <p className="blog-empty">{t('blog.empty')}</p>
      ) : (
        <ol className="blog-posts">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </ol>
      )}
    </main>
  )
}
