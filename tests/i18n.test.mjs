import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const load = (lang) =>
  JSON.parse(readFileSync(join(process.cwd(), 'src/app/i18n/locales', `${lang}.json`), 'utf8'))

const flatten = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null && !Array.isArray(v)
      ? flatten(v, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  )

// i18next v21+ resolves plurals against Intl.PluralRules category names
// (`_one` / `_other` for both English and Portuguese), not the legacy
// `key` + `key_other` pair the original plan draft used. See task-12 report
// for the source-level verification.
const REQUIRED = [
  'nav.blog', 'blog.title', 'blog.entries_one', 'blog.entries_other', 'blog.empty',
  'blog.published', 'blog.revised', 'blog.read_time', 'blog.contents', 'blog.close', 'blog.back',
]

describe('locales', () => {
  it('define every blog key in English', () => {
    const keys = flatten(load('en'))
    for (const key of REQUIRED) expect(keys).toContain(key)
  })

  it('define every blog key in Portuguese', () => {
    const keys = flatten(load('pt'))
    for (const key of REQUIRED) expect(keys).toContain(key)
  })

  it('have identical key sets, so neither locale drifts', () => {
    expect(flatten(load('en')).sort()).toEqual(flatten(load('pt')).sort())
  })
})
