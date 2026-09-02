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
