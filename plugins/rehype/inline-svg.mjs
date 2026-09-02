import { visit } from 'unist-util-visit'
import { fromHtml } from 'hast-util-from-html'

const FORBIDDEN = new Set(['script', 'foreignobject', 'iframe', 'image', 'use', 'a'])

// Conservative, threshold-based. The article sits on #080810, so near-white
// grounds are dropped rather than repainted and Excalidraw accents become Zone A.
const REMAP = [
  { test: (r, g, b) => r < 60 && g < 60 && b < 60, to: '#ffffff' },
  { test: (r, g, b) => r > 200 && g > 200 && b > 200, to: 'transparent' },
  { test: (r, g, b) => r > 140 && g < 90 && b < 90, to: '#4c8dff' },
]

function parseColor(value) {
  if (typeof value !== 'string') return null
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(value.trim().toLowerCase())
  if (!m) return null
  const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1]
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function remapColor(value) {
  const rgb = parseColor(value)
  if (!rgb) return value
  for (const rule of REMAP) if (rule.test(...rgb)) return rule.to
  return value
}

function sanitize(node) {
  if (!node.children) return
  node.children = node.children.filter(
    (c) => !(c.type === 'element' && FORBIDDEN.has(c.tagName.toLowerCase())),
  )
  for (const child of node.children) {
    if (child.type !== 'element') continue
    for (const key of Object.keys(child.properties ?? {})) {
      const lower = key.toLowerCase()
      if (lower.startsWith('on')) { delete child.properties[key]; continue }
      // Fixed pixel dimensions are dropped tree-wide, not just on the svg root: the
      // diagram must scale purely off the root viewBox, never pin a size anywhere else.
      if (lower === 'width' || lower === 'height') { delete child.properties[key]; continue }
      if ((lower === 'href' || lower === 'xlinkhref') &&
          /^(https?:)?\/\//.test(String(child.properties[key]))) {
        delete child.properties[key]; continue
      }
      if (['fill', 'stroke', 'color', 'stopcolor'].includes(lower)) {
        child.properties[key] = remapColor(child.properties[key])
      }
      if (lower === 'style') {
        child.properties[key] = String(child.properties[key]).replace(
          /(fill|stroke)\s*:\s*(#[0-9a-fA-F]{3,6})/g,
          (_, prop, col) => `${prop}:${remapColor(col)}`,
        )
      }
    }
    sanitize(child)
  }
}

export default function inlineSvg({ readAsset }) {
  return (tree) => {
    const pending = []
    visit(tree, 'element', (node, index, parent) => {
      const path = node.properties?.['data-inline-svg'] ?? node.properties?.dataInlineSvg
      if (!path) return
      pending.push({ index, parent, path, alt: node.properties['data-alt'] ?? node.properties?.dataAlt ?? '' })
    })

    for (const { index, parent, path, alt } of pending) {
      const raw = readAsset(path)
      if (raw == null) {
        throw new Error(
          `Cannot inline SVG "${path}": the file is not committed to the repo. ` +
            `Run pnpm sync:posts from the machine that has it.`,
        )
      }

      const fragment = fromHtml(raw, { fragment: true, space: 'svg' })
      const svg = fragment.children.find((c) => c.type === 'element' && c.tagName === 'svg')
      if (!svg) throw new Error(`"${path}" does not contain an <svg> root.`)

      sanitize(svg)
      delete svg.properties.width
      delete svg.properties.height
      svg.properties.role = 'img'
      svg.properties.className = ['figure__svg']
      svg.children.unshift({
        type: 'element', tagName: 'title', properties: {},
        children: [{ type: 'text', value: alt }],
      })

      parent.children[index] = {
        type: 'element',
        tagName: 'figure',
        properties: { className: ['figure', 'figure--wide'] },
        children: [
          svg,
          { type: 'element', tagName: 'figcaption', properties: {},
            children: [{ type: 'text', value: alt }] },
        ],
      }
    }
  }
}
