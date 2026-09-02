import { useTranslation } from 'react-i18next'
import { GlowCard } from '../../app/components/shared/GlowCard'
import type { PostSummary } from '../main'

export function PostCard({ post, index }: { post: PostSummary; index: number }) {
  const { t } = useTranslation()
  const month = post.date.slice(0, 7).replace('-', '.')

  return (
    <GlowCard
      glowColor="#4c8dff"
      spotlightColor="rgba(76, 141, 255, 0.12)"
      tilt
      contentClassName="h-full p-7 md:p-9"
    >
      <a href={`/blog/${post.slug}`} className="group block no-underline">
        <p className="mb-4 flex flex-wrap items-center gap-x-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">
          <span className="text-white/25">{String(index + 1).padStart(2, '0')}</span>
          <time dateTime={post.date}>{month}</time>
          <span>· {t('blog.read_time', { count: post.readingTimeMinutes })}</span>
          {post.updated && <span className="text-[var(--zone-a-1)]">· REV</span>}
        </p>

        <h3 className="text-[clamp(1.5rem,3vw,2rem)] font-bold leading-[1.15] tracking-tight text-white transition-colors group-hover:text-[var(--zone-a-1)]">
          {post.title}
        </h3>

        <p className="mt-4 max-w-[60ch] text-base font-light leading-relaxed text-white/60">
          {post.summary}
        </p>

        {post.tags.length > 0 && (
          <p className="mt-6 flex flex-wrap gap-4 text-[10px] font-medium uppercase tracking-[0.25em] text-white/30">
            {post.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </p>
        )}
      </a>
    </GlowCard>
  )
}
