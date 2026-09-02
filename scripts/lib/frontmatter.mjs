import { createHash } from 'node:crypto'
import matter from 'gray-matter'
import yaml from 'js-yaml'

// gray-matter's default YAML engine resolves an unquoted `date: 2026-09-02`
// under js-yaml's DEFAULT_SCHEMA, which includes a !!timestamp type -- so the
// author's plain calendar date silently becomes a JS Date at UTC midnight.
// Formatted back in a negative-UTC-offset timezone (this machine is UTC-3),
// that reads as the day before the author typed. JSON_SCHEMA has no
// timestamp type, so a plain date stays exactly the string it was written
// as, and `draft: true` / `tags: [a, b]` keep parsing as boolean/array.
const engines = { yaml: { parse: (s) => yaml.load(s, { schema: yaml.JSON_SCHEMA }) ?? {} } }

// Defensive: normalizes a `Date` that reaches us some other way -- a file
// that was mangled before this fix existed, or a caller constructing a Date
// directly -- back to `YYYY-MM-DD`. Uses `toISOString`, which is UTC; never
// `getFullYear`/`getMonth`/`getDate`, which are local-timezone and would
// reintroduce the exact off-by-one this exists to prevent.
export function toDateString(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return value
}

export function parsePost(raw) {
  const parsed = matter(raw, { engines })
  const data = parsed.data ?? {}
  if (data.date !== undefined) data.date = toDateString(data.date)
  if (data.updated !== undefined) data.updated = toDateString(data.updated)
  return { data, body: parsed.content ?? '' }
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
  if (ordered.date !== undefined) ordered.date = toDateString(ordered.date)
  if (ordered.updated !== undefined) ordered.updated = toDateString(ordered.updated)
  // Dumping under JSON_SCHEMA (matching the parse side) keeps a plain date
  // like `2026-09-02` unquoted, exactly as the author typed it. Dumping
  // under the default schema would quote it (`'2026-09-02'`) to disambiguate
  // from its own timestamp type -- a needless, author-visible diff.
  const front = yaml.dump(ordered, { schema: yaml.JSON_SCHEMA, lineWidth: 100, noRefs: true }).trimEnd()
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
