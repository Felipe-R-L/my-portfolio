import { readFileSync } from 'node:fs'
import { join, basename, dirname } from 'node:path'
import { listPostFiles, postsDir } from './vault.mjs'
import { parsePost, hashBody, validateFrontmatter, deriveStatus, slugify } from './frontmatter.mjs'
import { proposeUpdated } from './revisions.mjs'
import { findEmbeds, resolveAsset, loadManifest, findOrphans } from './assets.mjs'

const WORDS_PER_MINUTE = 225

export const countWords = (body) => body.split(/\s+/).filter(Boolean).length
export const readingTime = (body) => Math.max(1, Math.round(countWords(body) / WORDS_PER_MINUTE))

export function buildSyncPlan({ repoRoot, vaultRoot, config, today, hostLabel, noUpdated = false }) {
  const errors = []
  const warnings = []
  const orphans = []
  const posts = []
  const seenSlugs = new Map()

  for (const sourcePath of listPostFiles({ vaultRoot, config })) {
    const name = basename(sourcePath)
    const { data, body } = parsePost(readFileSync(sourcePath, 'utf8'))

    const fieldErrors = validateFrontmatter(data, config.requiredFrontmatter)
    for (const e of fieldErrors) errors.push(`${name}: ${e}`)
    if (fieldErrors.length > 0) continue

    const slug = data.slug ? slugify(data.slug) : slugify(data.title)
    if (seenSlugs.has(slug)) {
      errors.push(`${name}: duplicate slug "${slug}", already used by ${seenSlugs.get(slug)}`)
      continue
    }
    seenSlugs.set(slug, name)

    const bodyHash = hashBody(body)
    const status = deriveStatus({ data, bodyHash })
    const proposedUpdated = proposeUpdated({ data, bodyHash, today, noUpdated })

    const repoAssetDir = join(repoRoot, 'public', 'blog', slug)
    const manifestPath = join(repoRoot, 'src', 'content', 'posts', `${slug}.assets.json`)
    const manifest = loadManifest(manifestPath)

    const embeds = findEmbeds(body)
    const assets = []
    for (const embed of embeds) {
      const resolution = resolveAsset({
        filename: embed.filename,
        vaultDir: dirname(sourcePath),
        repoAssetDir,
        manifest,
      })
      resolution.alt = embed.alt
      resolution.raw = embed.raw

      if (resolution.action === 'missing') {
        errors.push(
          `${name}: image "${embed.filename}" is not in the vault on this machine and not ` +
            `committed to the repo. Publish from the machine that has it, or remove the embed.`,
        )
      } else if (resolution.action === 'reuse') {
        warnings.push(
          `${name}: "${embed.filename}" not present on this host; reusing the copy ingested ` +
            `from '${resolution.entry.ingestedFrom}'.`,
        )
      } else if (resolution.stale) {
        warnings.push(`${name}: "${embed.filename}" changed since the last sync; re-ingesting.`)
      }
      assets.push(resolution)
    }

    for (const orphan of findOrphans({ manifest, referenced: embeds.map((e) => e.filename) })) {
      orphans.push(`${slug}/${orphan}`)
    }

    const frontmatterWrites = {
      ...data,
      status,
      synced_at: new Date().toISOString(),
      synced_hash: bodyHash,
    }
    if (proposedUpdated) frontmatterWrites.updated = proposedUpdated

    posts.push({
      slug, title: data.title, sourcePath, manifestPath, repoAssetDir, status, body,
      targetPath: join(repoRoot, 'src', 'content', 'posts', `${slug}.md`),
      proposedUpdated: proposedUpdated ?? null,
      words: countWords(body),
      readingTimeMinutes: readingTime(body),
      date: data.date ?? null,
      updated: proposedUpdated ?? data.updated ?? null,
      syncedAt: data.synced_at ?? null,
      assets, frontmatterWrites,
    })
  }

  if (orphans.length > 0) {
    warnings.push(
      `Orphaned assets (committed but no longer referenced): ${orphans.join(', ')}. ` +
        `They are kept. Remove them with --prune only if you are sure.`,
    )
  }

  return { posts, errors, warnings, orphans, vaultPostsDir: postsDir({ vaultRoot, config }) }
}
