import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// Um token de cor só pode ter um dono. Quando fonts.css e theme.css
// declararam --background os dois em :root, a ordem de import decidiu a cor
// do site, e o body passou a pintar branco sob um layout escuro. Na home o
// AppLayout cobria o erro, no blog não havia o que cobrir.
const ARQUIVOS = [
  ...readdirSync('src/styles').filter((f) => f.endsWith('.css')).map((f) => join('src/styles', f)),
  'src/blog/article.css',
]

const declaraEmRoot = (css, token) => {
  const blocos = [...css.matchAll(/:root\s*\{([^}]*)\}/g)].map((m) => m[1])
  return blocos.some((b) => new RegExp(`--${token}\\s*:`).test(b))
}

describe('tokens de tema', () => {
  for (const token of ['background', 'foreground']) {
    it(`--${token} é declarado em :root por exatamente um arquivo`, () => {
      const donos = ARQUIVOS.filter((f) => declaraEmRoot(readFileSync(f, 'utf8'), token))
      expect(donos).toHaveLength(1)
    })
  }

  it('o fundo padrão é o escuro que o layout usa, não branco', () => {
    const css = readFileSync('src/styles/theme.css', 'utf8')
    const root = css.match(/:root\s*\{([^}]*)\}/)[1]
    expect(root).toMatch(/--background:\s*#030305/)
  })
})
