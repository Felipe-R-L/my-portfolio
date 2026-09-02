import { describe, it, expect } from 'vitest'
import { renderMarkdown } from '../../plugins/markdown-pipeline.mjs'

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
  <rect width="400" height="200" fill="#ffffff"/>
  <path d="M0 0 L10 10" stroke="#000000"/>
  <text x="5" y="5" fill="#1e1e1e">node</text>
  <script>alert(1)</script>
  <a href="http://evil.example" onclick="steal()">x</a>
  <image href="http://evil.example/p.png"/>
</svg>`

const render = (md) => renderMarkdown(md, { slug: 'arc', readAsset: () => SVG })

describe('inline svg', () => {
  it('inlines the svg instead of linking it', async () => {
    const { html } = await render('![[d.svg]]')
    expect(html).toContain('<svg')
    expect(html).not.toContain('src="/blog/arc/d.svg"')
  })

  it('strips script elements', async () => {
    const { html } = await render('![[d.svg]]')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('alert(1)')
  })

  it('strips event handler attributes', async () => {
    expect((await render('![[d.svg]]')).html).not.toContain('onclick')
  })

  it('strips external references', async () => {
    expect((await render('![[d.svg]]')).html).not.toContain('evil.example')
  })

  it('remaps near-black ink to white', async () => {
    const { html } = await render('![[d.svg]]')
    expect(html).toContain('#ffffff')
    expect(html).not.toContain('#000000')
  })

  it('drops the near-white ground so the slab shows through', async () => {
    const { html } = await render('![[d.svg]]')
    expect(html).toContain('transparent')
  })

  it('keeps the viewBox and drops fixed width and height', async () => {
    const { html } = await render('![[d.svg]]')
    expect(html).toContain('viewBox="0 0 400 200"')
    expect(html).not.toContain('width="400"')
  })

  it('adds role and a title from the alt text', async () => {
    const { html } = await render('![[d.svg|Routing graph]]')
    expect(html).toContain('role="img"')
    expect(html).toContain('Routing graph')
  })

  it('fails loudly when the asset cannot be read', async () => {
    await expect(renderMarkdown('![[missing.svg]]', { slug: 'arc', readAsset: () => null }))
      .rejects.toThrow(/missing\.svg/)
  })
})
