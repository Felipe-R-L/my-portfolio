#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { join, dirname, resolve, sep } from 'node:path'
import { OG_WIDTH, OG_HEIGHT } from './lib/og-size.mjs'

export const SITE = 'https://feliperl.space'
export const AUTHOR = 'Felipe Rodrigues Leone'
export const AUTHOR_URL = 'https://linkedin.com/in/felipe-rodrigues-leone'

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
    author: { '@type': 'Person', name: AUTHOR, url: AUTHOR_URL },
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
    `<meta property="og:image:width" content="${OG_WIDTH}" />`,
    `<meta property="og:image:height" content="${OG_HEIGHT}" />`,
    `<meta property="og:image:type" content="image/png" />`,
    `<meta name="author" content="${escapeAttr(AUTHOR)}" />`,
    `<meta property="article:author" content="${AUTHOR_URL}" />`,
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

/*
 * The article's static words. The page ships in English (the posts are
 * written in English); the chrome island swaps each [data-i18n] label for the
 * reader's language on mount, so the labels follow the language switch while
 * the article itself stays as written.
 */
const label = (key, text, count) =>
  `<span data-i18n="${key}"${count === undefined ? '' : ` data-count="${count}"`}>${escapeAttr(text)}</span>`

function mastheadHtml(post) {
  const revised = post.updated
    ? `<span class="article__revised">${label('blog.revised', 'Revised')} <time datetime="${post.updated}">${timecode(post.updated)}</time></span>`
    : ''
  return `<header class="article__masthead">
  ${post.tags[0] ? `<p class="article__kicker">${escapeAttr(post.tags[0])}</p>` : ''}
  <h1 class="article__title">${escapeAttr(post.title)}</h1>
  <p class="article__lead">${escapeAttr(post.summary)}</p>
  <p class="article__dateline"><span>${label('blog.published', 'Published')} <time datetime="${post.date}">${timecode(post.date)}</time></span>${revised}<span>${label('blog.read_time', `${post.readingTimeMinutes} min read`, post.readingTimeMinutes)}</span><span>${escapeAttr(AUTHOR)}</span></p>
</header>`
}

/* The way on: the next (older) text, or the newest once the list runs out, and the contact. */
function footHtml(post, posts) {
  const others = posts.filter((p) => p.slug !== post.slug)
  const at = posts.findIndex((p) => p.slug === post.slug)
  const next = others.length ? posts[at + 1] ?? others[0] : null
  return `<footer class="article__foot">
  ${next ? `<div><p class="article__foot-label">${label('blog.next', 'Next')}</p><a class="article__next" href="/blog/${next.slug}">${escapeAttr(next.title)}</a></div>` : '<div></div>'}
  <a class="article__contact" href="/#contact">${label('blog.contact', 'Talk to me')}</a>
</footer>`
}

export function renderRoute({ template, kind, post, posts }) {
  const head = kind === 'article' ? articleHead(post) : indexHead()
  // the contents sit beside the text in their own column; the chrome island mounts there
  const content = kind === 'article'
    ? `<article class="article" lang="en">${mastheadHtml(post)}<div class="article__grid"><aside class="article__toc" id="blog-toc"></aside><div class="article__main"><div class="article__body" id="article-body" tabindex="-1">${post.html}</div>${footHtml(post, posts)}</div></div></article>`
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

/**
 * A case's address, /work/<slug>, as a page of its own for whoever receives
 * the link: the home page's HTML with the case's title, description, address
 * and picture in the head, so a link sent on WhatsApp previews the project.
 * The app reads the path and opens the case over the journey.
 */
export function renderCase({ template, item, title, description }) {
  const url = `${SITE}/work/${item.slug}`
  const image = `${SITE}${item.image.src}`
  const full = `${title} | Felipe Rodrigues Leone`
  const set = (html, re, value) => {
    if (!re.test(html)) throw new Error(`[fan-out] index.html has no ${re} to fill for ${item.slug}`)
    return html.replace(re, (_m, open, close) => `${open}${escapeAttr(value)}${close}`)
  }
  let html = template
  html = set(html, /(<title>)[^<]*(<\/title>)/, full)
  html = set(html, /(<meta name="description" content=")[^"]*(")/, description)
  for (const net of ['og', 'twitter']) {
    html = set(html, new RegExp(`(<meta property="${net}:title" content=")[^"]*(")`), full)
    html = set(html, new RegExp(`(<meta property="${net}:description" content=")[^"]*(")`), description)
    html = set(html, new RegExp(`(<meta property="${net}:url" content=")[^"]*(")`), url)
    html = set(html, new RegExp(`(<meta property="${net}:image" content=")[^"]*(")`), image)
  }
  return html.replace('</head>', () => `  <link rel="canonical" href="${url}" />\n  </head>`)
}

export async function renderCases({ repoRoot, dist }) {
  const { WORK } = await import(join(repoRoot, 'src', 'app', 'data', 'work.ts'))
  const pt = JSON.parse(readFileSync(join(repoRoot, 'src', 'app', 'i18n', 'locales', 'pt.json'), 'utf8'))
  const template = readFileSync(join(dist, 'index.html'), 'utf8')
  const root = resolve(dist, 'work') + sep
  for (const item of WORK) {
    const text = pt.work.items[item.id]
    const target = resolve(dist, 'work', item.slug, 'index.html')
    if (!target.startsWith(root)) throw new Error(`[fan-out] case slug "${item.slug}" escapes dist/work/`)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, renderCase({ template, item, title: text.title, description: text.result }))
    console.log(`  emitted work/${item.slug}/index.html`)
  }
  return WORK.length
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const repoRoot = process.cwd()
  const dist = join(repoRoot, 'dist')
  const posts = await renderRoutes({ repoRoot, dist })

  const { writeFeed } = await import('./lib/feed.mjs')
  writeFeed({ posts, dist })

  const { writeOgImages } = await import('./lib/og-image.mjs')
  await writeOgImages({ posts, dist, repoRoot })

  const cases = await renderCases({ repoRoot, dist })

  console.log(`\n✓ emitted ${posts.length + 1} blog routes and ${cases} case routes\n`)
}
