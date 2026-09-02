import { defineConfig } from 'vitest/config'
import postsPlugin from './plugins/vite-plugin-posts.mjs'

// Registers the same `virtual:posts` resolver Vite uses at build time, so
// components under test that import from it (e.g. LatestWritingContent) can
// resolve it — tests then override its content per-case with vi.doMock.
export default defineConfig({
  plugins: [postsPlugin({ repoRoot: __dirname })],
  test: {
    include: ['tests/**/*.test.{mjs,ts,tsx}'],
    environment: 'node',
    environmentMatchGlobs: [['tests/ui/**', 'jsdom']],
  },
})
