import { ArrowRight, PenLine } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { Post } from "virtual:posts";
import posts from "virtual:posts";
import { Section } from "./shared/Section";
import { SectionHeading } from "./shared/SectionHeading";
import { GlowCard } from "./shared/GlowCard";

/**
 * Only the fields the teaser renders. `virtual:posts` also carries the full
 * rendered article `html`, which is fine for the blog entry (it's injected
 * server-side, never bundled) but must never ride along into the homepage
 * chunk — see LatestWriting.tsx for how this module is kept out of it.
 */
type WritingSummary = Pick<
  Post,
  "slug" | "title" | "date" | "summary" | "tags" | "readingTimeMinutes"
>;

function toSummary(post: Post): WritingSummary {
  const { slug, title, date, summary, tags, readingTimeMinutes } = post;
  return { slug, title, date, summary, tags, readingTimeMinutes };
}

/**
 * The homepage teaser for the most recent post. A recent technical article is
 * evidence of how someone thinks; a bare "read my blog" button is not — so
 * this shows the article itself (title, summary, reading time), reusing the
 * same GlowCard treatment as PostCard on the blog index for visual
 * continuity, just more compact.
 *
 * Renders nothing when there is no published post: a `draft: true` post or an
 * empty content directory must never leave behind an empty heading.
 */
export default function LatestWritingContent() {
  const { t } = useTranslation();
  const latest = posts.length > 0 ? toSummary(posts[0]) : null;

  if (!latest) return null;

  const month = latest.date.slice(0, 7).replace("-", ".");

  return (
    <Section id="writing">
      <SectionHeading
        icon={PenLine}
        accent="cold"
        title={t("home.writing.title_part1")}
        subtitle={t("home.writing.title_part2")}
      >
        <p className="text-gray-400 text-lg max-w-2xl leading-relaxed mt-4">
          {t("home.writing.lead")}
        </p>
      </SectionHeading>

      <div className="max-w-3xl">
        <GlowCard
          glowColor="#4c8dff"
          spotlightColor="rgba(76, 141, 255, 0.12)"
          tilt
          contentClassName="p-7 md:p-9"
        >
          <a
            href={`/blog/${latest.slug}`}
            aria-label={t("home.writing.card_aria", { title: latest.title })}
            className="group block no-underline"
          >
            <p className="mb-4 flex flex-wrap items-center gap-x-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">
              <time dateTime={latest.date}>{month}</time>
              <span>· {t("blog.read_time", { count: latest.readingTimeMinutes })}</span>
            </p>

            <h3 className="text-[clamp(1.5rem,3vw,2rem)] font-bold leading-[1.15] tracking-tight text-white transition-colors group-hover:text-[var(--zone-a-1)]">
              {latest.title}
            </h3>

            <p className="mt-4 max-w-[60ch] text-base font-light leading-relaxed text-white/60">
              {latest.summary}
            </p>

            {latest.tags.length > 0 && (
              <p className="mt-6 flex flex-wrap gap-4 text-[10px] font-medium uppercase tracking-[0.25em] text-white/30">
                {latest.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </p>
            )}

            <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--zone-a-1)]">
              {t("home.writing.read_more")}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </span>
          </a>
        </GlowCard>

        <a
          href="/blog"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white/50 hover:text-white transition-colors"
        >
          {t("home.writing.see_all")}
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </a>
      </div>
    </Section>
  );
}
