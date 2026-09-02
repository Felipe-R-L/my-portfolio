#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { join, dirname, resolve, sep } from 'node:path'

export const SITE = 'https://feliperl.space'

const escapeAttr = (v) =>
  String(v).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;')

// A closing tag inside JSON would end the script element early. The
// `</script>` guard must run first: escaping every `<` to `<` up front
// consumes the `<` that `</script>` needs to match, so the second pass would
// never fire. Escaping `</script>` first, then escaping any other `<` while
// skipping the one we just guarded, keeps both defenses intact.
const embedJson = (value) =>
  JSON.stringify(value)
    .replaceAll('</script>', '<\\/script>')
    .replace(/<(?!\\\/script>)/g, '\\u003c')

function articleHead(post) {
  const url = `${SITE}/blog/${post.slug}`
  const image = `${SITE}/og/${post.slug}.png`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.summary,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: { '@type': 'Person', name: 'Felipe Rodrigues Leone' },
    keywords: post.tags.join(', '),
    inLanguage: 'en',
    image,
    mainEntityOfPage: url,
  }

  return [
    `<title>${escapeAttr(post.title)} — Felipe R. Leone</title>`,
    `<meta name="description" content="${escapeAttr(post.summary)}" />`,
    `<meta property="og:title" content="${escapeAttr(post.title)}" />`,
    `<meta property="og:description" content="${escapeAttr(post.summary)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="article:published_time" content="${post.date}" />`,
    post.updated ? `<meta property="article:modified_time" content="${post.updated}" />` : '',
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeAttr(post.title)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(post.summary)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<link rel="alternate" type="application/rss+xml" href="${SITE}/rss.xml" />`,
    `<script type="application/ld+json">${embedJson(jsonLd)}</script>`,
  ].filter(Boolean).join('\n    ')
}

function indexHead() {
  const url = `${SITE}/blog`
  const title = 'Writing — Felipe R. Leone'
  const description = 'Technical writing on optimization, routing and applied software.'
  return [
    `<title>${escapeAttr(title)}</title>`,
    `<meta name="description" content="${escapeAttr(description)}" />`,
    `<meta property="og:title" content="${escapeAttr(title)}" />`,
    `<meta property="og:description" content="${escapeAttr(description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<link rel="canonical" href="${url}" />`,
    `<link rel="alternate" type="application/rss+xml" href="${SITE}/rss.xml" />`,
  ].join('\n    ')
}

const summarise = (p) => ({
  slug: p.slug, title: p.title, date: p.date, updated: p.updated,
  summary: p.summary, tags: p.tags, readingTimeMinutes: p.readingTimeMinutes,
})

const timecode = (iso) => iso.replaceAll('-', '.')

function mastheadHtml(post) {
  const revised = post.updated
    ? ` · <span style="color:var(--zone-a-1)">REVISED <time datetime="${post.updated}">${timecode(post.updated)}</time></span>`
    : ''
  return `<header class="article__masthead">
  ${post.tags[0] ? `<p class="article__kicker">${escapeAttr(post.tags[0])}</p>` : ''}
  <h1 class="article__title">${escapeAttr(post.title)}</h1>
  <div class="article__rule" aria-hidden="true"></div>
  <p class="article__lead">${escapeAttr(post.summary)}</p>
  <p class="article__dateline">PUBLISHED <time datetime="${post.date}">${timecode(post.date)}</time>${revised} · ${post.readingTimeMinutes} MIN</p>
</header>`
}

export function renderRoute({ template, kind, post, posts }) {
  const head = kind === 'article' ? articleHead(post) : indexHead()
  const content = kind === 'article'
    ? `<article class="article" lang="en"><div class="article__slab">${mastheadHtml(post)}<div class="article__body" id="article-body" tabindex="-1">${post.html}</div></div></article>`
    : ''
  const data = kind === 'article'
    ? { kind, post: { ...summarise(post), toc: post.toc } }
    : { kind, posts: posts.map(summarise) }

  // Function replacements, not strings: a string replacement interprets
  // `$&`, `$\``, `$'` and `$$` in the replacement text, and `head`,
  // `content` and the JSON island are arbitrary author content (code
  // fences, shell snippets) that can contain those sequences.
  return template
    .replace('<!--blog-head-->', () => head)
    .replace('<!--blog-content-->', () => content)
    .replace('<!--blog-data-->', () => embedJson(data))
}

export async function renderRoutes({ repoRoot, dist }) {
  const { loadPosts } = await import(join(repoRoot, 'plugins', 'vite-plugin-posts.mjs'))
  const posts = await loadPosts({ repoRoot })

  const templatePath = join(dist, 'blog.html')
  if (!existsSync(templatePath)) {
    throw new Error(`[fan-out] ${templatePath} is missing. Did vite build run with the blog input?`)
  }
  const template = readFileSync(templatePath, 'utf8')

  const write = (relative, html) => {
    const target = join(dist, relative)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, html)
    console.log(`  emitted ${relative}`)
  }

  write('blog/index.html', renderRoute({ template, kind: 'index', posts }))
  for (const post of posts) {
    // The slug is slugified upstream so this should never fire, but the same
    // bug class was fixed once already in scripts/lib/assets.mjs by
    // containment-checking at the point of use, not by trusting the source.
    const blogRoot = resolve(dist, 'blog') + sep
    const target = resolve(dist, 'blog', post.slug, 'index.html')
    if (!target.startsWith(blogRoot)) {
      throw new Error(`[fan-out] post slug "${post.slug}" escapes dist/blog/ — refusing to write ${target}`)
    }
    write(`blog/${post.slug}/index.html`, renderRoute({ template, kind: 'article', post, posts }))
  }

  // The template itself must not ship as a reachable page.
  rmSync(templatePath)

  return posts
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const repoRoot = process.cwd()
  const dist = join(repoRoot, 'dist')
  const posts = await renderRoutes({ repoRoot, dist })

  const { writeFeed } = await import('./lib/feed.mjs')
  writeFeed({ posts, dist })

  const { writeOgImages } = await import('./lib/og-image.mjs')
  await writeOgImages({ posts, dist, repoRoot })

  console.log(`\n✓ emitted ${posts.length + 1} blog routes\n`)
}
