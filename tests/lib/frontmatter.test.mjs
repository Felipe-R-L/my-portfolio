import { describe, it, expect } from 'vitest'
import {
  parsePost, hashBody, validateFrontmatter, deriveStatus, serializePost, slugify,
} from '../../scripts/lib/frontmatter.mjs'

const RAW = `---
title: Arc Routing for Waste Collection
date: 2026-09-02
summary: Why the solvers optimize a different problem.
draft: true
---

Body text here.
`

describe('parsePost', () => {
  it('splits frontmatter from body', () => {
    const { data, body } = parsePost(RAW)
    expect(data.title).toBe('Arc Routing for Waste Collection')
    expect(body.trim()).toBe('Body text here.')
  })

  // Regression: YAML's core schema auto-parses an unquoted `date: 2026-09-02`
  // into a JS Date at UTC midnight. Formatted back in a negative-UTC-offset
  // timezone that reads as the day before the author typed. `date` (and
  // `updated`) must stay exactly the string the author wrote.
  it('keeps an unquoted date as a plain string, not a Date', () => {
    const { data } = parsePost('---\ndate: 2026-09-02\n---\nx')
    expect(typeof data.date).toBe('string')
    expect(data.date).toBe('2026-09-02')
  })

  it('still parses draft as a boolean and tags as an array under the new schema', () => {
    const { data } = parsePost('---\ndraft: true\ntags: [a, b]\n---\nx')
    expect(data.draft).toBe(true)
    expect(Array.isArray(data.tags)).toBe(true)
    expect(data.tags).toEqual(['a', 'b'])
  })
})

describe('hashBody', () => {
  it('is stable for identical bodies', () => {
    expect(hashBody('abc')).toBe(hashBody('abc'))
  })

  it('changes when the body changes', () => {
    expect(hashBody('abc')).not.toBe(hashBody('abd'))
  })

  it('ignores frontmatter changes entirely', () => {
    const a = parsePost(RAW)
    const withMeta = RAW.replace('draft: true', 'draft: true\nsynced_hash: deadbeef')
    const b = parsePost(withMeta)
    expect(hashBody(a.body)).toBe(hashBody(b.body))
  })
})

describe('validateFrontmatter', () => {
  const required = ['title', 'date', 'summary']

  it('accepts a complete record', () => {
    expect(validateFrontmatter(
      { title: 'T', date: '2026-09-02', summary: 'S' }, required,
    )).toEqual([])
  })

  it('reports every missing required field', () => {
    const errs = validateFrontmatter({ title: 'T' }, required)
    expect(errs).toHaveLength(2)
    expect(errs.join(' ')).toContain('date')
    expect(errs.join(' ')).toContain('summary')
  })

  it('rejects an unparseable date', () => {
    const errs = validateFrontmatter(
      { title: 'T', date: 'last tuesday', summary: 'S' }, required,
    )
    expect(errs.join(' ')).toContain('date')
  })

  it('rejects tags that are not an array', () => {
    const errs = validateFrontmatter(
      { title: 'T', date: '2026-09-02', summary: 'S', tags: 'optimization' }, required,
    )
    expect(errs.join(' ')).toContain('tags')
  })
})

describe('deriveStatus', () => {
  it('is never-synced when no hash was ever recorded', () => {
    expect(deriveStatus({ data: {}, bodyHash: 'aaa' })).toBe('never-synced')
  })

  it('is draft when draft is true, even with a recorded hash', () => {
    expect(deriveStatus({ data: { draft: true, synced_hash: 'aaa' }, bodyHash: 'aaa' }))
      .toBe('draft')
  })

  it('is pending when the body moved on', () => {
    expect(deriveStatus({ data: { synced_hash: 'aaa' }, bodyHash: 'bbb' })).toBe('pending')
  })

  it('is synced when the hashes agree', () => {
    expect(deriveStatus({ data: { synced_hash: 'aaa' }, bodyHash: 'aaa' })).toBe('synced')
  })
})

describe('serializePost', () => {
  it('round-trips through parsePost', () => {
    const { data, body } = parsePost(RAW)
    const out = parsePost(serializePost(data, body))
    expect(out.data.title).toBe(data.title)
    expect(out.body.trim()).toBe(body.trim())
  })

  it('does not change the body hash', () => {
    const { data, body } = parsePost(RAW)
    const out = parsePost(serializePost({ ...data, synced_hash: 'x' }, body))
    expect(hashBody(out.body)).toBe(hashBody(body))
  })

  // Regression: a round-trip through serializePost -> parsePost must never
  // drift the author's date, including across a second sync of an
  // already-synced file (the exact scenario that mutated the real vault note).
  it('round-trips date: 2026-09-02 unchanged, twice in a row', () => {
    const { data, body } = parsePost(RAW)
    expect(data.date).toBe('2026-09-02')

    const once = parsePost(serializePost(data, body))
    expect(once.data.date).toBe('2026-09-02')

    const twice = parsePost(serializePost(once.data, once.body))
    expect(twice.data.date).toBe('2026-09-02')

    // Also confirm the raw serialized frontmatter is the plain, unquoted
    // form the author typed -- not a quoted or timestamp-shaped string.
    expect(serializePost(data, body)).toContain('date: 2026-09-02\n')
  })
})

describe('slugify', () => {
  it('kebab-cases a title', () => {
    expect(slugify('Arc Routing for Waste Collection'))
      .toBe('arc-routing-for-waste-collection')
  })

  it('strips punctuation and accents', () => {
    expect(slugify('CARP: Bending PyVRP (v2)')).toBe('carp-bending-pyvrp-v2')
    expect(slugify('Conteúdo Técnico')).toBe('conteudo-tecnico')
  })
})
