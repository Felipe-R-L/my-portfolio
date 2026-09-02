import { createHash } from 'node:crypto'
import matter from 'gray-matter'
import yaml from 'js-yaml'

export function parsePost(raw) {
  const parsed = matter(raw)
  return { data: parsed.data ?? {}, body: parsed.content ?? '' }
}

// Hashes the BODY ONLY. Frontmatter carries tool bookkeeping that this hash
// must not react to, or writing the hash would invalidate the hash.
export function hashBody(body) {
  return createHash('sha256').update(body.trim(), 'utf8').digest('hex')
}

export function validateFrontmatter(data, required) {
  const errors = []
  for (const field of required) {
    const value = data[field]
    if (value === undefined || value === null || String(value).trim() === '') {
      errors.push(`missing required frontmatter field: ${field}`)
    }
  }
  if (data.date !== undefined && !errors.some((e) => e.includes('date'))) {
    const asDate = new Date(data.date)
    if (Number.isNaN(asDate.getTime())) {
      errors.push(`date is not a parseable ISO date: ${data.date}`)
    }
  }
  if (data.tags !== undefined && !Array.isArray(data.tags)) {
    errors.push('tags must be an array, for example: [optimization, pyvrp]')
  }
  if (data.draft !== undefined && typeof data.draft !== 'boolean') {
    errors.push('draft must be true or false')
  }
  return errors
}

export function deriveStatus({ data, bodyHash }) {
  if (data.draft === true) return 'draft'
  if (!data.synced_hash) return 'never-synced'
  return data.synced_hash === bodyHash ? 'synced' : 'pending'
}

const FIELD_ORDER = [
  'title', 'date', 'updated', 'summary', 'tags', 'slug', 'draft',
  'revisions', 'status', 'synced_at', 'synced_hash',
]

export function serializePost(data, body) {
  const ordered = {}
  for (const key of FIELD_ORDER) {
    if (data[key] !== undefined) ordered[key] = data[key]
  }
  for (const key of Object.keys(data)) {
    if (!(key in ordered)) ordered[key] = data[key]
  }
  const front = yaml.dump(ordered, { lineWidth: 100, noRefs: true }).trimEnd()
  return `---\n${front}\n---\n\n${body.trim()}\n`
}

export function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
