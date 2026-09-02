import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, basename } from 'node:path'
import { parsePost, validateFrontmatter, slugify } from '../scripts/lib/frontmatter.mjs'
import { findEmbeds, loadManifest, hashFile } from '../scripts/lib/assets.mjs'
import { renderMarkdown } from './markdown-pipeline.mjs'

const REQUIRED = ['title', 'date', 'summary']
const WORDS_PER_MINUTE = 225

// The toc array only carries h2-h3 (see markdown-pipeline.mjs's collectToc), so a skip to h4+
// would be invisible there. Walk the rendered heading tags themselves instead.
function assertHeadingLevels(html, slug) {
  let previous = 1
  for (const match of html.matchAll(/<h([1-6])\b/g)) {
    const depth = Number(match[1])
    if (depth > previous + 1) {
      throw new Error(
        `[posts] ${slug}: heading level skips from h${previous} to h${depth}. ` +
          `Use consecutive levels.`,
      )
    }
    previous = depth
  }
}

export async function loadPosts({ repoRoot }) {
  const dir = join(repoRoot, 'src', 'content', 'posts')
  if (!existsSync(dir)) return []

  const files = readdirSync(dir).filter((f) => f.endsWith('.md')).sort()
  const posts = []
  const seenSlugs = new Map()

  for (const file of files) {
    const name = basename(file, '.md')
    const { data, body } = parsePost(readFileSync(join(dir, file), 'utf8'))

    const errors = validateFrontmatter(data, REQUIRED)
    if (errors.length > 0) throw new Error(`[posts] ${file}: ${errors.join('; ')}`)

    const slug = data.slug ? slugify(data.slug) : name
    if (seenSlugs.has(slug)) {
      throw new Error(`[posts] duplicate slug "${slug}" in ${file} and ${seenSlugs.get(slug)}`)
    }
    seenSlugs.set(slug, file)

    if (data.draft === true) continue

    const assetDir = join(repoRoot, 'public', 'blog', slug)
    const manifest = loadManifest(join(dir, `${slug}.assets.json`))

    for (const embed of findEmbeds(body)) {
      const assetPath = join(assetDir, embed.filename)
      if (!existsSync(assetPath)) {
        throw new Error(
          `[posts] ${file}: asset "${embed.filename}" is referenced but not committed at ` +
            `public/blog/${slug}/. Run pnpm sync:posts from the machine that has it.`,
        )
      }
      const recorded = manifest[embed.filename]
      if (recorded?.sha256 && recorded.sha256 !== hashFile(assetPath)) {
        throw new Error(
          `[posts] ${file}: asset "${embed.filename}" hash does not match the manifest. ` +
            `The committed file changed outside sync:posts. Re-run pnpm sync:posts.`,
        )
      }
    }

    const readAsset = (publicPath) => {
      const abs = join(repoRoot, 'public', publicPath.replace(/^\//, ''))
      return existsSync(abs) ? readFileSync(abs, 'utf8') : null
    }

    const { html, toc } = await renderMarkdown(body, { slug, readAsset })
    assertHeadingLevels(html, slug)

    const wordCount = body.split(/\s+/).filter(Boolean).length

    posts.push({
      slug,
      title: data.title,
      date: String(data.date),
      updated: data.updated ? String(data.updated) : null,
      summary: data.summary,
      tags: data.tags ?? [],
      revisions: data.revisions ?? [],
      html, toc, wordCount,
      readingTimeMinutes: Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE)),
    })
  }

  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  return posts
}

const VIRTUAL_ID = 'virtual:posts'
const RESOLVED_ID = '\0virtual:posts'

export default function postsPlugin({ repoRoot = process.cwd() } = {}) {
  return {
    name: 'blog-posts',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },
    async load(id) {
      if (id !== RESOLVED_ID) return
      const posts = await loadPosts({ repoRoot })
      const summaries = posts.map(
        ({ slug, title, date, updated, summary, tags, readingTimeMinutes }) => ({
          slug, title, date, updated, summary, tags, readingTimeMinutes,
        }),
      )
      return (
        `export const posts = ${JSON.stringify(posts)};\n` +
        `export default posts;\n` +
        `export const summaries = ${JSON.stringify(summaries)};\n`
      )
    },
    configureServer(server) {
      const dir = join(repoRoot, 'src', 'content', 'posts')
      server.watcher.add(dir)
      server.watcher.on('all', (_event, file) => {
        if (!String(file).startsWith(dir)) return
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      })
    },
  }
}
