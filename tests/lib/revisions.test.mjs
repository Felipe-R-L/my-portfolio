import { describe, it, expect } from 'vitest'
import { proposeUpdated } from '../../scripts/lib/revisions.mjs'

const TODAY = '2026-10-14'

describe('proposeUpdated', () => {
  it('proposes nothing on a first sync', () => {
    expect(proposeUpdated({ data: { date: '2026-09-02' }, bodyHash: 'aaa', today: TODAY }))
      .toBeNull()
  })

  it('proposes nothing while the post is a draft, however much it churns', () => {
    expect(proposeUpdated({
      data: { date: '2026-09-02', draft: true, synced_hash: 'aaa' },
      bodyHash: 'bbb', today: TODAY,
    })).toBeNull()
  })

  it('proposes today when a published body changes', () => {
    expect(proposeUpdated({
      data: { date: '2026-09-02', synced_hash: 'aaa' }, bodyHash: 'bbb', today: TODAY,
    })).toBe(TODAY)
  })

  it('proposes nothing when the body is unchanged', () => {
    expect(proposeUpdated({
      data: { date: '2026-09-02', synced_hash: 'aaa' }, bodyHash: 'aaa', today: TODAY,
    })).toBeNull()
  })

  it('respects --no-updated for a typo fix', () => {
    expect(proposeUpdated({
      data: { date: '2026-09-02', synced_hash: 'aaa' },
      bodyHash: 'bbb', today: TODAY, noUpdated: true,
    })).toBeNull()
  })

  it('proposes nothing when updated already records today', () => {
    expect(proposeUpdated({
      data: { date: '2026-09-02', synced_hash: 'aaa', updated: TODAY },
      bodyHash: 'bbb', today: TODAY,
    })).toBeNull()
  })
})
