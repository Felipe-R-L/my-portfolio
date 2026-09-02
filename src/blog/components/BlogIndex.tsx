import { PenLine } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Section } from '../../app/components/shared/Section'
import { SectionHeading } from '../../app/components/shared/SectionHeading'
import { PostCard } from './PostCard'
import type { PostSummary } from '../main'

export function BlogIndex({ posts }: { posts: PostSummary[] }) {
  const { t } = useTranslation()

  return (
    <main className="relative z-10 pt-28">
      <Section id="writing">
        <SectionHeading
          icon={PenLine}
          accent="cold"
          title={t('blog.title')}
          subtitle={t('blog.entries', { count: posts.length })}
        />

        {posts.length === 0 ? (
          <p className="text-lg font-light text-white/60">{t('blog.empty')}</p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {posts.map((post, i) => (
              <PostCard key={post.slug} post={post} index={i} />
            ))}
          </div>
        )}
      </Section>
    </main>
  )
}
