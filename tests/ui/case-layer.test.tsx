import { describe, it, expect } from 'vitest'
import pt from '../../src/app/i18n/locales/pt.json'
import en from '../../src/app/i18n/locales/en.json'
import { WORK } from '../../src/app/data/work'
import { slugFromPath } from '../../src/app/journey/caseRoute'

describe('the case (surface)', () => {
  it('has every part of every case in both languages, with no family framing', () => {
    for (const bundle of [pt, en]) {
      for (const w of WORK) {
        const c = (bundle.work.items as Record<string, { case?: Record<string, string> }>)[w.id].case
        for (const part of w.parts) expect(c?.[part], `${w.id}.${part}`).toBeTruthy()
      }
      expect(JSON.stringify(bundle.work)).not.toMatch(/família|family|cresci|grew up|\b87\b|40M|\b274\b/i)
      expect(bundle.work.case.back).toBeTruthy()
    }
  })

  it('opens only known addresses', () => {
    for (const w of WORK) expect(slugFromPath(`/work/${w.slug}`)).toBe(w.slug)
    expect(slugFromPath('/work/nope')).toBeNull()
    expect(slugFromPath('/blog/x')).toBeNull()
  })
})
