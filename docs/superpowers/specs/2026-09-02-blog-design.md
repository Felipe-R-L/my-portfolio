# Blog Subsystem — Design

**Date:** 2026-09-02
**Status:** Approved design, pending implementation plan
**Repo:** `Felipe-R-L/my-portfolio`

---

## 1. Purpose

Add a blog to the portfolio that:

1. Extends this site's visual identity rather than importing another one.
2. Is genuinely pleasant to read for long-form technical writing.
3. Accepts Markdown authored in Obsidian with no reformatting step.
4. Cannot silently publish a broken or stale article.
5. Honours the performance decisions this codebase has already made and documented.

First article: **Arc Routing for Waste Collection** (2,066 words, 13 headings, ~9 min read).

### Non-goals

Comments, search, pagination, tag archive pages, a CMS, scheduled publishing, translated article
bodies. Wikilinks (`[[Note]]`) and Mermaid diagrams are out of scope for v1.

---

## 2. The codebase this must fit

| Aspect | Finding |
|---|---|
| Stack | Vite 6.3.5, React 18.3.1, Tailwind 4.1.12, pnpm 10.33.2, TypeScript |
| Router | **None.** `App.tsx` documents removing react-router: it "shipped its runtime, turbo-stream deserialiser and history stack for exactly one static route" |
| i18n | `i18next` + `react-i18next` + browser language detector. `en.json` / `pt.json`, nested keys |
| Ground | `#030305`. Lazy WebGL `Galaxy`, CSS `StarField` fallback on mobile and reduced-motion |
| Surface | Glassmorphism: `bg-white/[0.06]`, `backdrop-blur-2xl`, `border-white/[0.14]` |
| Accent | Zone A (cold, identity) `#4c8dff → #8b5cf6`; Zone B (warm, output) `#f0a63c → #ec4899` |
| Type | **Space Grotesk only** — variable 300–700, self-hosted woff2, latin + latin-ext. No serif, no mono |
| Layout | `layout.css`: `--measure: 72rem`, `--gutter`, `--rhythm-section`, `--rhythm-block`, `.section-shell`, `.measure` |
| Components | `Section`, `SectionHeading` (`accent: "cold" | "warm"`), `GlowCard`, `CardLink`, `StarField`, `SocialLinks` |
| Hooks | `useSmoothScroll` (Lenis, `lerp: 0.07`, disabled ≤768px), `useIsMobile` |
| Deploy | Vercel (`@vercel/analytics` present) |
| Culture | Every file comments *why*. Lazy WebGL, mobile fallbacks, self-hosted fonts, explicit WCAG fixes |

**The binding constraint this creates:** the codebase's most clearly stated value is not shipping
bytes it does not need. Every decision below is measured against that.

---

## 3. Decisions

| # | Decision | Choice |
|---|---|---|
| D1 | Content flow | `pnpm sync:posts` — Obsidian vault to repo, images committed to git |
| D2 | Routing | **Multi-page build, no client router.** A real HTML file per route |
| D3 | Markdown scope | GFM + `![[embeds]]` + callouts + KaTeX + inline SVG |
| D4 | Body typography | **Space Grotesk 400**, 18px / 1.8, 62ch. No new font file |
| D5 | Code typography | System monospace stack. No new font file |
| D6 | SVG | Inlined at build, sanitized, remapped to Zone A on `#030305` |
| D7 | Background | Galaxy stays; the article rides an opaque-enough glass slab |
| D8 | Accent zone | **Zone A (cold)** — writing is identity, not output |
| D9 | Hydration | **Islands.** The article body is static HTML and never hydrates |
| D10 | i18n | Chrome localizes via `blog.*` keys; article bodies stay English |
| D11 | Asset residency | Repo is the durable store; safeguards against machine asymmetry |
| D12 | Vault scope | One folder (`Blog/`) in one vault (`Sync`) |
| D13 | Folder layout | Flat `.md` files; `draft: true` holds a post back |
| D14 | Status surface | Frontmatter properties + generated `_Sync Status.md` |
| D15 | Extras | OG meta tags, generated OG image, RSS, heading anchors |
| D16 | Dates | Publish date author-set; `updated` auto-maintained from the body hash |

---

## 4. Architecture

Three stages with hard boundaries.

```
STAGE 1  INGEST            STAGE 2  TRANSFORM         STAGE 3  EMIT
─────────────────          ──────────────────         ────────────────
Obsidian vault             Vite plugin                MPA fan-out
  Blog/*.md                  remark/rehype              blog.html template
       │                          │                          │
   sync:posts                 .md -> HTML             inject body + meta
       │                     + TOC, meta                     │
       v                          v                          v
  src/content/posts/         virtual:posts            dist/blog/<slug>/
  public/blog/<slug>/                                   index.html
  *.assets.json                                       rss.xml, og/*.png

  The repo is the source     Knows nothing of         No React on the
  of truth. Stage 2 never    Obsidian or the vault.   article body at all.
  reads the vault.
```

**The build never touches the vault.** A clone builds correctly on any machine, and on Vercel,
with Obsidian absent. Ingestion is an explicit, human-triggered act.

---

## 5. Stage 1 — Ingest (`pnpm sync:posts`)

> Stage 1 is complete and ported from prior work: `scripts/lib/{vault,frontmatter,assets,revisions,status-note}.mjs`
> with 60 passing tests. It is repo-agnostic by construction. This section records its contract.

### 5.1 Configuration

`blog.config.json` — committed, identical on every machine:

```json
{
  "postsFolder": "Blog",
  "statusNote": "_Sync Status.md",
  "requiredFrontmatter": ["title", "date", "summary"],
  "assetExtensions": [".svg", ".png", ".jpg", ".jpeg", ".webp"]
}
```

`.blog.local.json` — gitignored, per-machine: `{ "vaultPath": "/home/felipe/Documents/Sync", "hostLabel": "felipe-desktop" }`

Vault root resolution, in order, **never guessing**: `--vault` flag → `$OBSIDIAN_VAULT` →
`.blog.local.json` → fail with instructions. Only `<vaultRoot>/Blog` is walked.

### 5.2 Frontmatter contract

Author-owned: `title`, `date`, `summary` (required); `updated`, `revisions`, `tags`, `slug`, `draft`.
Tool-owned: `status`, `synced_at`, `synced_hash`.

**Body-only hashing is load-bearing.** The tool writes bookkeeping into frontmatter; a whole-file
hash would invalidate itself on every write. State is derived, never merely stored:

```
no synced_hash               -> ◌  never synced
draft: true                  -> ✎  draft
sha256(body) != synced_hash  -> ●  pending changes
sha256(body) == synced_hash  -> ✓  synced
```

`updated` is proposed only when a *published* article's body changes; draft churn records nothing.

### 5.3 Asset resolution

**The repo is the durable image store. The vault is an opportunistic source and never an authority
on deletion.** For every `![[embed]]`: present in vault → ingest; else present in repo → reuse and
report provenance; else → hard fail.

**Never-delete rule.** No code path removes a repo asset because the vault lacks it. Orphans are
reported and removed only under an explicit `--prune`.

**Filename containment.** A filename whose resolved path escapes its directory is rejected and
returns `missing`. Without this, `![[../x.png]]` would let the copy step overwrite a committed file
outside the asset directory. Empty and non-regular-file names are rejected the same way.

Manifest `src/content/posts/<slug>.assets.json` records `sha256`, `bytes`, `ingestedFrom`,
`ingestedAt` — giving staleness detection, provenance, and build-time integrity.

### 5.4 Machine asymmetry

Text syncs to every device; images live only where they were made.

| Scenario | Defence |
|---|---|
| Image on desktop, publishing from laptop | Resolution step 2, then hard fail |
| Image already committed, re-sync elsewhere | **Never-delete rule** |
| Diagram redrawn on another machine | Manifest hash comparison flags stale |
| Sync not settled | Warn when the vault body is older than `synced_at` |
| Text references an image that never existed | Hard fail |

The second is the dangerous one: it is data loss caused by misreading *absence* as *intent to
delete*. Absence is ambiguous and therefore carries no information.

### 5.5 Safety and visibility

Dry-run with a diff and confirmation by default. `pnpm check:posts` is read-only. Never auto-commits.
`Blog/_Sync Status.md` is generated each run: a table of every article's state and every asset's
residency, syncing back to the author's phone. Free-text cells escape `|` so a title containing a
pipe cannot corrupt the table.

### 5.6 `.gitignore`

`public/blog/**` image extensions must be negated if any blanket image rule exists, and
`sync:posts` verifies each written asset is not ignored (`git check-ignore`), failing loudly if it is.

---

## 6. Stage 2 — Transform (Vite plugin)

Runs at build time. **The browser receives finished HTML and ships zero markdown parser.**

### 6.1 Pipeline

```
remark-parse -> remark-frontmatter -> remark-gfm -> remark-math
  -> section-numeral   (custom)   "## 5. Title" -> numeral + clean title
  -> obsidian-callout  (custom)   "> [!warning]" -> panel node
  -> obsidian-embed    (custom)   "![[file]]" -> figure / svg marker
  -> remark-rehype (allowDangerousHtml)
  -> rehype-raw                   REQUIRED: turns raw nodes into elements
  -> rehype-slug -> inline-svg (custom) -> rehype-katex
  -> rehype-shiki -> rehype-autolink-headings -> rehype-stringify
```

`rehype-raw` is not optional. `obsidian-embed` emits mdast `html` nodes, which `remark-rehype`
passes through as `raw` nodes; without `rehype-raw` they never become elements and the inline-SVG
plugin can never match its own marker.

### 6.2 Inline SVG (D6)

Sanitized (`script`, event handlers, external refs, `foreignObject` stripped), then palette-remapped
for this site: near-black ink → `#ffffff`, near-white ground → transparent, Excalidraw accents →
`--zone-a-1`. Fixed `width`/`height` replaced by `viewBox` + `max-width: 100%`; `role="img"` and a
`<title>` from the alt text. Remaps are logged; a per-embed escape hatch disables them.

### 6.3 Build-time validation

Independent of `sync:posts`, so a hand-edit cannot reach production: required frontmatter present and
typed, every referenced asset present **and matching its manifest hash**, no duplicate slugs, heading
levels do not skip, internal `/blog/*` links resolve. **Any failure fails the build.**

### 6.4 Emitted interface

```ts
type Post = {
  slug, title, date, summary: string
  updated: string | null
  tags: string[]
  revisions: { date: string; note: string }[]
  html: string                                    // fully rendered
  toc: { id, text, depth, numeral }[]
  wordCount, readingTimeMinutes: number
}
```

Exposed as `virtual:posts`, typed in `src/types/posts.d.ts`.

---

## 7. Stage 3 — Emit (MPA islands)

### 7.1 No client router (D2)

`App.tsx` removed react-router because there was "exactly one static route". A blog makes that
premise false, but the conclusion still holds: with every route pre-rendered to a real file, a
client router would ship history and matching machinery to navigate between documents the browser
can already fetch. **Zero router bytes.**

Vite gains one extra HTML input, `blog.html`. After `vite build`, a fan-out step writes:

```
dist/index.html                            the existing site
dist/blog/index.html                       the archive
dist/blog/<slug>/index.html                one per article
dist/rss.xml  dist/og/<slug>.png
```

Each is produced from the built `blog.html`, injecting the article HTML, the TOC/meta JSON island,
and per-page `<meta>` tags. Real 200s, crawlable without JS, correct link unfurls, no SPA fallback
and no refresh-404. `vercel.json` needs only `buildCommand`, `outputDirectory`, `cleanUrls`.

`sync:posts` never runs on Vercel: the vault does not exist there and the build reads only
committed content.

### 7.2 Islands, not hydration (D9)

The article body is already HTML in the document, so **it is never hydrated**. `src/blog/main.tsx`
mounts only the chrome into fixed containers:

- the lazy `Galaxy` background with `StarField` fallback, exactly as `AppLayout` does
- the frosted nav pill
- the scene-list TOC rail, reading its data from `<script type="application/json" id="toc">`
- the reading-progress line

2,000 words of prose cost zero hydration time. This is available only because Stage 2 renders at
build time — a choice originally made to keep the parser out of the bundle.

### 7.3 Extras (D15)

Per-article OG and Twitter tags, JSON-LD `Article` with `datePublished` and `dateModified`,
`/rss.xml` carrying `pubDate` and `atom:updated`, a 1200×630 OG card generated at build in this
site's identity (`#030305`, Zone A gradient rule, Space Grotesk — the self-hosted woff2 is reused,
so no new font is downloaded), and `¶` anchors on every heading.

---

## 8. Visual design — "The Slab"

### 8.1 Concept

This site is a dark cosmic space containing **frosted glass objects**: the nav pill, the footer
lens, the glow cards. The blog needs no new visual language. An article is the largest glass object
on the site — a lit document suspended over the same galaxy — and every control around it stays in
the small-floating-pill vocabulary already established.

This resolves the one real conflict. A mouse-repulsing WebGL starfield is superb under a page you
scan for fifteen seconds and hostile under nine minutes of dense prose. Keeping the galaxy at the
margins and putting the text on a dense slab preserves the signature without making the reader
fight it.

### 8.2 The slab

```
        ╭─ nav pill ─╮
   ✴          ✴              ✴
 ┌──────┐  ╭─────────────────────────╮
 │ SCENE│  │  Arc Routing for Waste  │    bg: #080810 at 80%
 │ LIST │  │  Collection             │    backdrop-blur-2xl
 │      │  │  ▔▔▔▔▔ zone-a gradient  │    border white/10
 │ ▸ 1  │  │                         │    rounded-[2rem]
 │   2  │  │  Choosing the best      │
 ╰──────╯  ╰─────────────────────────╯
   ✴              ✴          ✴
```

`#080810/80` over the galaxy, not `white/[0.06]`. The nav pill's translucency works because it holds
six words; a reading surface must not let stars move behind body text. The blur and the visible
margins keep it reading as the same material.

### 8.3 Type scale

| Role | Font | Size | Weight | Notes |
|---|---|---|---|---|
| Article body | Space Grotesk | 18px / 1.8 | **400** | 62ch measure |
| Lead / summary | Space Grotesk | 21px / 1.6 | 300 | white/60 |
| h2 | Space Grotesk | clamp(1.75rem, 4vw, 2.25rem) | 700 | uppercase, tracking-tighter |
| h3 | Space Grotesk | 1.375rem | 600 | |
| Meta / labels | Space Grotesk | 10–12px | 500 | uppercase, tracking `0.2em`, white/40 |
| Inline code | system mono | 0.9em | 400 | `bg-white/[0.07]` |
| Code block | system mono | 14px / 1.7 | 400 | |

**Weight 400, not 300, for body.** Space Grotesk 300 at 18px over `#030305` reads thin and greys
out; the site uses 300 only for large display text where the strokes are thick enough to survive.

**System monospace, not a new file.** `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`.
The site ships no mono face, and the article has inline code and fenced blocks. A downloaded mono
would contradict Section 2's binding constraint for a surface that appears in one article.

### 8.4 Two-track grid

Prose locks to 62ch; code, tables, figures and callouts break out to `--measure` (72rem). Implemented
as a CSS grid with named `text` / `wide` / `full` columns so breakout is declarative. Spacing uses
the existing `--gutter` and `--rhythm-*` tokens; no new spacing scale.

### 8.5 Chrome

- **Nav** — the existing pill, plus a `BLOG` item. On article pages section anchors become `/#about`
  so they still work off the home page. The EN/PT switch is unchanged.
- **Progress** — 2px, `linear-gradient(--zone-a-1 → --zone-a-2)`: the identical gradient as the nav's
  hover underline.
- **TOC rail** — floating glass panel using the nav pill's exact recipe
  (`border-white/[0.14] bg-white/[0.06] backdrop-blur-2xl rounded-[24px]`), active section in
  `--zone-a-1`, driven by `IntersectionObserver`. Below `lg` it collapses to a floating pill button.
- **Masthead** — title in title case (not uppercase: article titles are too long to shout), a Zone A
  gradient bar beneath it echoing `SectionHeading`'s `showBar`, then the dateline.
- **Dateline** — `PUBLISHED 2026.09.02 · 9 MIN`. When revised, ` · REVISED 2026.10.14` is appended
  with only the `REVISED` token in `--zone-a-1`, so an unrevised article carries no visual noise.
  Both dates emit as `<time datetime>`, feeding JSON-LD, RSS and OG from one source.

### 8.6 Callouts, code, figures

Callouts render as `<aside>` panels on `bg-white/[0.04]` with a 2px Zone A left rule and an
uppercase tracked label. The three benchmark caveats in the article become one `[!warning]` panel —
the highest-value structural edit available to it. Code blocks sit in a darker inset
(`bg-black/40`, `border-white/[0.08]`) and scroll inside themselves; the page body never scrolls
sideways. Figures sit on the wide track with a tracked uppercase caption.

### 8.7 Index page

Reuses this site's components rather than inventing: `Section` + `SectionHeading`
(`accent="cold"`, a Lucide icon, `showBar`), and post entries as `GlowCard` with a Zone A
`glowColor` — the same `TiltedCard → BorderGlow → SpotlightCard` stack About, Projects, Experience
and Services already use, so posts move the way the rest of the site moves. Composed so one post
reads as deliberate rather than empty. A revised post carries a small Zone A `REV` tag; sorting is
by publish date, so fixing a sentence never reshuffles the archive.

### 8.8 Motion

`useSmoothScroll` is reused unchanged, including its `lerp: 0.07` and its existing mobile cutoff.
Article entry is one orchestrated reveal — masthead, gradient bar, then body — and **nothing
animates on scroll inside the body**: `SplitText` and `whileInView` staggering belong on section
headings, not on paragraphs a reader is trying to follow. Under `prefers-reduced-motion` the galaxy
falls back to `StarField` exactly as `AppLayout` already does.

### 8.9 i18n (D10)

Chrome localizes through new `blog.*` keys in `en.json` and `pt.json`: nav label, archive heading,
`min read`, `published`, `revised`, empty state, TOC label. Article bodies stay English and the
article element carries `lang="en"`, so a Portuguese reader gets a Portuguese interface around an
English technical article and assistive technology announces it correctly.

### 8.10 Accessibility

Body `#FFFFFF` at 90% on `#080810` clears AAA. Meta text at white/40 is used only for non-essential
labels; anything load-bearing sits at white/60 or above, following the WCAG correction already made
in `AppLayout`'s footer. `--zone-a-1` on `#080810` is ~4.8:1 and is used for rules, markers and
links, never for small body text. The TOC is a real `<nav>` with `aria-current`; a skip link
precedes it; the galaxy stays `aria-hidden` as it already is.

---

## 9. File layout

```
blog.config.json                   committed config
.blog.local.json                   gitignored, per-machine
blog.html                          MPA template for every blog route
scripts/
  sync-posts.mjs  check-posts.mjs  Stage 1 CLIs
  fan-out.mjs                      Stage 3
  lib/  vault, frontmatter, assets, revisions, status-note, plan-sync,
        og-image, feed
plugins/
  vite-plugin-posts.mjs            virtual:posts + validation
  markdown-pipeline.mjs
  remark/  obsidian-embed, obsidian-callout, section-numeral
  rehype/  inline-svg
src/
  content/posts/*.md               ingested articles
  content/posts/*.assets.json      manifests
  blog/
    main.tsx                       island entry
    BlogChrome.tsx  ArticleChrome.tsx
    components/  SceneListTOC, ReadingProgress, ArticleMasthead, PostCard
    article.css                    slab, type scale, two-track grid
  app/AppLayout.tsx                gains the BLOG nav item
  app/i18n/locales/{en,pt}.json    gain blog.* keys
public/blog/<slug>/                committed assets
```

---

## 10. Testing

Vitest. Ported suites cover vault resolution, frontmatter and body hashing, asset resolution
(including containment and all five asymmetry scenarios, with the never-delete rule asserted
directly), revisions, and the status note. New suites cover the markdown pipeline by fixture, the
SVG sanitizer, build-time validation failures, the MPA fan-out, and the dateline's revised state.
Manual pass at 375 / 768 / 1440, plus reduced-motion and keyboard-only.

The asset-resolution suite matters most: it is the only place where a bug destroys data rather than
producing a visible defect.

---

## 11. Risks

| Risk | Mitigation |
|---|---|
| Galaxy costs too much on article pages | It is already lazy with a `StarField` fallback; articles reuse both |
| Space Grotesk proves tiring over 2,000 words | 18px/1.8/62ch is tuned for it; a self-hosted serif on article routes only remains a reversible follow-up |
| Slab opacity kills the identity | Galaxy stays visible at the margins and through the blur; opacity is one token to tune |
| Palette remap mangles a diagram | Conservative thresholds, every remap logged, per-embed escape hatch |
| Blanket gitignore swallows assets | Negation rules plus `git check-ignore` verification in `sync:posts` |
| MPA fan-out drifts from the template | Fan-out reads the built `blog.html`; an integration test asserts the emitted files |

---

## 12. Article-specific work

Title **Arc Routing for Waste Collection**, slug `arc-routing-for-waste-collection`, summary
*"Why the solvers you can install optimize a different problem than the one a truck actually has."*
Published `2026-09-02`; `updated` starts absent.

Already applied in the vault: the stale hand-written TOC removed, the filing-artifact h1 replaced by
frontmatter, the three benchmark caveats converted to a `[!warning]` callout with the prose verbatim,
and five copy fixes (subject/verb agreement, a broken verb phrase, a missing period, a missing
object, and comma decimals normalised to periods).

Numbers policy, confirmed: public academic benchmarks stay; fleet and city calibration values do not.

One open item, the author's call: §3.1 uses a rhetorical colon ("Going back to the thought
experiment: choosing...") where §5 uses a comma for the same construction. Left unchanged because it
is voice, not grammar.

---

## 13. Open items

1. Article body font is Space Grotesk by decision (D4). If it reads tiring in practice, adding a
   self-hosted serif on article routes only is a contained, reversible change.
2. Vault symlink (`<vault>/blog-assets` → `public/blog/`) deferred; verified feasible under
   Obsidian's Flatpak sandbox (`filesystems=home`). Enabling it eliminates machine asymmetry at the
   root and requires no pipeline change.
3. The §3.1 rhetorical colon, above.
