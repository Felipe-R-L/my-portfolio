# Galaxy background performance audit

**Date:** 2026-09-02
**Question:** why the WebGL galaxy background is laggy and stutters on laptops and low-power PCs.

**Method.** Static analysis of the whole app, plus benchmarks on real hardware. The Galaxy
fragment shader was extracted verbatim from `Galaxy.tsx` and driven with exactly the uniforms
`AppLayout.tsx:51-60` passes, rendered as a fullscreen triangle matching ogl's geometry and timed
with `readPixels` as a genuine GPU sync point. The ambient orbs were reproduced at their measured
sizes and blur radii and driven with fractional per-frame inline transforms, the way Motion writes
them. GPU throughout: Intel Raptor Lake-P integrated graphics, a representative and reasonably
modern laptop chip. The frame budget for 60 fps is 16.7 ms.

Where a benchmark was capped by vsync, that is stated. A vsync-capped result proves a ceiling, not
a cost.

---

## Summary

Two things are expensive, and both are fixable without changing how the site looks.

| Cost, measured on a laptop iGPU at 1920x1080 | ms/frame | effective fps |
|---|---|---|
| Galaxy shader as shipped, dpr 1.0 | 29.37 | 34 |
| Galaxy shader as shipped, dpr 1.5 (the cap in the code) | 65.77 | 15 |
| Six ambient orbs, animated and uncomposited | exceeds one vsync interval | 30 |

Those stack. On a plain 1080p laptop the page is trying to spend roughly 46 ms per frame on
decoration alone. On a Windows laptop at 150% display scaling, roughly 82 ms. The complaint is
exactly what the numbers predict.

The good news is that both fixes are cheap and neither is a visual compromise:

- A shader reordering that is **verified bit-identical** cuts the Galaxy by 36%.
- Lowering the DPR cap does the rest. A soft starfield does not need native resolution.
- One CSS line (`will-change: transform`) takes the orbs from 30 fps to 60 fps entirely.

---

## 1. The Galaxy shader

### What it costs

| Configuration | ms/frame | fps ceiling |
|---|---|---|
| As shipped, dpr 1.0 | 29.37 | 34 |
| As shipped, dpr 1.5 | 65.77 | 15 |
| dpr 2.0, for reference | 116.53 | 9 |
| 3 layers, dpr 1.0 | 22.25 | 45 |
| 2 layers, dpr 1.0 | 15.14 | 66 |

`Galaxy.tsx` caps device pixel ratio at 1.5. A plain 1080p laptop reports 1.0 and lands at 34 fps.
A Windows laptop at 125-150% scaling, or any HiDPI panel, hits the cap and lands at 15 fps. Both
are below 60, and the second is well into visible-stutter territory.

The reason is the loop structure. Four depth layers each call `StarLayer`, which walks a 3x3 cell
neighbourhood. That is 36 star-cell evaluations per pixel, each doing three `Hash21` calls, an
`atan`, an `hsv2rgb`, and several `smoothstep`s. At 2880x1620 that is roughly 168 million star
evaluations per frame.

### Fix 1: skip cells that contribute nothing (bit-identical, 36% faster)

`Star()` ends with `m *= smoothstep(1.0, 0.2, d)`, so it returns exactly `0.0` for any cell whose
centre is at least 1.0 away. In a 3x3 neighbourhood most cells qualify. The shader nonetheless runs
the full colour pipeline for all nine, then multiplies the result by zero.

Reordering so the cheap star term is computed first, with the colour work behind an early-out, is
exactly equivalent rather than an approximation:

```glsl
      vec2 pad = vec2(tris(seed * 34.0 + uTime * uSpeed / 10.0),
                      tris(seed * 38.0 + uTime * uSpeed / 30.0)) - 0.5;

      float star = Star(gv - offset - pad, flareSize);

      float twinkle = trisn(uTime * uSpeed + seed * 6.2831) * 0.5 + 1.0;
      twinkle = mix(1.0, twinkle, uTwinkleIntensity);
      star *= twinkle;

      if (star <= 0.0) continue;

      // ... the existing red/blu/grn, hue, sat, val, hsv2rgb block, unchanged ...

      col += star * size * base;
```

Verified across four timestamps: **0 of 2,073,600 colour channels differ, maximum delta 0/255.**

| | baseline | early-out | saving |
|---|---|---|---|
| dpr 1.0 | 29.37 ms | 18.93 ms | 36% |
| dpr 1.5 | 65.77 ms | 42.12 ms | 36% |

### Fix 2: lower the DPR cap

This is the largest single lever, and on a soft starfield it is invisible. All rows below include
the early-out:

| Configuration | ms/frame | fps ceiling |
|---|---|---|
| dpr 1.00, 4 layers | 18.93 | 53 |
| dpr 0.85, 4 layers | **13.74** | **73** |
| dpr 0.75, 4 layers | 10.78 | 93 |
| dpr 0.60, 4 layers | 6.97 | 144 |
| dpr 1.00, 3 layers | 14.44 | 69 |
| dpr 0.75, 3 layers | 8.23 | 122 |

**Recommended landing spot: early-out plus a DPR cap of 0.85, keeping all four layers.** That is
13.74 ms, comfortably inside budget, with the star pattern itself untouched.

Prefer lowering DPR over lowering `numLayers`. `depth = fract(i / 4.0 + ...)` hardcodes the 4.0, so
reducing `numLayers` drops the last depth slice rather than redistributing, which visibly thins the
field. Reducing resolution only softens it.

### Fix 3: consider capping the shader's own frame rate

The field drifts slowly (`rotationSpeed` 0.1, `starSpeed` 0.5). Rendering it at 30 fps halves its
cost by construction and leaves alternate frames entirely free for scrolling and compositing.

### Two smaller issues in `Galaxy.tsx`

**The IntersectionObserver pause can never fire.** The observer watches the component's own
container, which is `w-full h-full` inside `AppLayout.tsx:48`'s `fixed inset-0 z-0`. A fixed
full-viewport element is always intersecting, so the off-screen branch is unreachable. This is not
worth "fixing" by making it work, because the background genuinely is visible at every scroll
position. It is dead code that reads as an optimisation. The `visibilitychange` path does work,
though rAF is already throttled in background tabs.

**A layout read on every global mousemove.** The handler is attached to `window` and calls
`ctn.getBoundingClientRect()` per event. The container is fixed and full-viewport, so that rect only
changes on resize. Cache it and refresh it in the existing resize handler. Separately, `mouseleave`
on `window` fires unreliably; `document.documentElement` or `pointerleave` is the usual target.

---

## 2. The ambient orbs, and a one-line fix worth 30 fps

Six `AmbientOrbs` (two each in About, Projects and Experience) plus the Hero orb are 480-720 px
circles with `filter: blur(130px)` to `blur(150px)` and `mix-blend-mode: screen`. Motion animates
them with `x`/`y` and `repeat: Infinity`.

Motion only hands a value to the compositor when the value name is in its accelerated set. It
animates `x`, `y` and `scale` as separate named values, so these fall back to main-thread JS
animation writing fractional inline transforms every frame. The layer tree confirms none of the six
carries an active-transform compositing reason. Each frame therefore invalidates the enclosing
section layer across the union of the old and new blurred bounds, and a 150 px Gaussian is re-run.
Paint bounds expand by a measured 2.8 sigma, so a 720 px orb rasterises as 1560x1560.

Measured on the real GPU, at the page's actual orb count:

| Configuration | median frame time | effective fps |
|---|---|---|
| 6 orbs, animated, uncomposited (as shipped) | 33.3 ms | 30 |
| 6 orbs, animated, `will-change: transform` | 16.7 ms | 60 |
| 12 orbs uncomposited | 50.1 ms | 20 |
| 12 orbs promoted | 16.7 ms | 60 |
| 48 orbs uncomposited | 166.6 ms | 6 |
| 48 orbs promoted | 16.7 ms | 60 |

Note these are `requestAnimationFrame` deltas, which quantise to whole vsync intervals. The precise
reading is that six uncomposited orbs push frame time past one interval, so the page presents at
30 fps. Promoting them keeps it at 60. Even 48 promoted orbs stay at 60, which is the clearest
possible statement that promotion, not orb count, is the variable that matters.

**Add `will-change: transform` to the animated orbs.** Also gate them on viewport: four of the seven
are animating off-screen at any given scroll position, and nothing pauses them. `Services.tsx:30`
already has the right instinct, with a comment noting its glows are static specifically to avoid
per-frame repaints of a 120 px blur. About, Projects, Experience and Hero never got the same
treatment.

Separately, the Hero orb animates `scale`, which changes a blur's effective radius and forces a true
re-rasterisation rather than a layer reposition. Drop the `scale` keyframe.

---

## 3. Everything else, ranked

1. **95 permanently promoted text layers.** `SplitText.css:10` sets
   `will-change: transform, opacity` on `.split-text-letter`. Ninety-five spans carry it for the life
   of the page, accounting for about 74% of the page's 107-129 compositor layers, for a one-shot
   0.6 s entrance transition that the component itself finishes and then sets `transition: none` on.
   `ScrollReveal.css:10-14` documents this exact bug and fixes it there. Deleting one line frees 95
   layers, which matters most on the integrated GPUs in question, where VRAM is shared.

2. **`TextType` types forever, off-screen, through a drop-shadow.** `Hero.tsx` never passes
   `startOnVisible`, which defaults to `false`, so the IntersectionObserver returns immediately and
   the typing loop runs from mount to unload: one state update per character at 60 ms, into a span
   with `bg-clip-text` and `drop-shadow-2xl`. That is roughly 16 repaints per second of
   gradient-clipped, shadowed text, continuing while the hero is several screens above the viewport.
   The prop already exists and already wires up the observer. Pass it, and make the observer also
   clear the flag on exit.

3. **`LazyMotion` is worth 45 kB, measured.** The motion chunk is 133,544 bytes, of which 46,439
   (34.8%) is layout projection, drag, pan and inertia code, plus 4,418 bytes of
   `@emotion/is-prop-valid` pulled in transitively. The app uses none of it: zero `drag`, `layout`,
   `layoutId`, `AnimatePresence` or `Reorder`. Swapping the twelve `motion` imports for `m` inside
   `<LazyMotion features={domAnimation}>` was built and measured at **133,544 to 88,423 raw, 43,888
   to 31,175 gzip**. Mechanical, no behaviour change, best payload-per-effort on the page.

4. **Nested pointer handlers do three to five forced layouts per event.** `BorderGlow` calls
   `getBoundingClientRect()` three times per `pointermove`, because `getEdgeProximity` and
   `getCursorAngle` each re-measure the element that was just measured. It then does two `setState`
   calls, rebuilding eight gradient strings and a thirteen-layer box-shadow. `SpotlightCard` nests
   inside it and adds a fourth read plus a 600 px radial gradient write. Cache the rect and move the
   writes to CSS custom properties set via a ref in a rAF-throttled handler.

5. **Lenis leaks its rAF loop and stretches scroll work 1.3 s past each gesture.**
   `useSmoothScroll.ts` never captures the frame id and never calls `cancelAnimationFrame`;
   `lenis.destroy()` does not cancel it because `autoRaf` is false. Harmless in production since the
   layout never unmounts, but it leaks across every hot reload. More importantly, `lerp: 0.07`
   converges at about 6.8% per frame, so a single wheel notch keeps firing scroll events for roughly
   76 frames. Every scroll-linked cost on the page runs 1.3 s after the user stops. Raising the lerp
   to about 0.1 roughly halves that tail.

6. **`prefers-reduced-motion` is almost entirely unhonoured.** It correctly swaps the Galaxy for the
   static `StarField`, and it gates the `TextType` caret. Under emulated reduced motion, seven orbs
   still animate including a running `scale`, all five section-heading icons still pulse, the
   gradient text keyframes still run, `TextType` still types, and Lenis still hijacks scrolling.
   A single `<MotionConfig reducedMotion="user">` in `App.tsx` fixes the whole Motion surface at
   once. `AmbientOrbs.tsx:14` already documents reduced-motion behaviour that was never implemented.

7. **`SectionHeading` animates `width` from 0 to 96** on four instances, which forces layout on every
   frame of a one-second animation, fired while the user is scrolling. `scaleX` is free.

8. **The full-viewport gradient overlay could fold into the shader.** `AppLayout.tsx:68-71` is a
   fixed `inset-0` gradient that never changes. It costs a composited layer, a 20 MB texture at
   dpr 2, a non-occluding full-viewport blend every frame, and it promotes `main` to a 9.96 Mpx
   layer. Removing it measured a 3.8% frame gain on its own. Expressing it as one `mix()` on the
   shader's output colour deletes all of that at zero visual cost.

9. **Duplicate `ResizeObserver`.** `GlassSurface.tsx:171-183` and `185-197` are byte-identical. Each
   callback rebuilds a ~700-character SVG, URI-encodes it, and sets it as a data href, forcing a
   fresh SVG decode and full filter-chain invalidation. Delete one.

10. **Dead code and dead bytes.** `TiltedCard.tsx` and its CSS are never mounted (`GlowCard` defaults
    `tilt` to false and no caller overrides it). `ImageWithFallback.tsx` is imported by nothing.
    `GlassSurface.css` is imported by nothing, so that component ships unstyled, which is probably a
    latent bug rather than intentional. `FluidGlass.css`'s `.fluid-glass-effect` rule matches no
    element. `figmaAssetResolver` in the Vite config points at a `src/assets` directory that does not
    exist. `tw-animate-css` emits zero bytes and has zero usages. `dallas.webp` and `secret.webp`
    are 94,156 bytes of unreferenced images being deployed. The eighteen tech SVGs are unoptimised
    and load as eighteen separate requests.

---

## What was investigated and found not to be a problem

Recorded so these do not get re-litigated. Several were prime suspects.

- **The nav pill's `backdrop-filter` is not a cost.** It sits over the continuously repainting canvas,
  and the structural reasoning that it must re-snapshot and re-filter every frame is correct. But the
  element is 575x42, the backdrop source region is 0.21 Mpx, and Skia downsamples heavily before
  convolving a sigma of 40. A/B measured at dpr 1 and dpr 2: no detectable difference either way.
- **`mix-blend-mode` is not a cost.** Removing every blend mode on the page changed nothing
  measurably. The orbs are expensive because of unpromoted animated blur, not because they blend.
- **There is no second WebGL context.** `FluidGlass` and `GlassSurface` are SVG and CSS only. Measured:
  one canvas, one GL context, and only two persistent rAF loops page-wide, Lenis and Galaxy.
  Their SVG displacement filters measured at zero cost, hovered and unhovered, because the surface is
  only 349x349.
- **`AppLayout` re-renders do not tear down the WebGL context.** Every Galaxy prop is a primitive
  literal and the effect dependencies are all scalars, deliberately destructured with a comment
  explaining the hazard. Even a language change survives it intact.
- **`useIsMobile` is correct.** `useSyncExternalStore` over `matchMedia`, firing only when the 768 px
  boundary is crossed, not on every resize.
- **i18next does not cause async re-render churn.** Both locales are bundled inline and initialised at
  module scope before the first render.
- **Code splitting genuinely works.** Galaxy, FluidGlass and ogl are separate chunks and are absent
  from the modulepreload list in the built HTML, which is more than most projects that call
  `React.lazy` achieve.
- **`ogl` tree-shakes well**: 45 kB from 19 of 64 modules, with all loaders, textures, cameras and
  post-processing dropped.
- **`lucide-react` tree-shakes perfectly**: 11 icons, 3,833 bytes.
- **Tailwind scanning is correctly scoped** with `source(none)` plus a targeted `@source`.
- **`StarField` is genuinely cheap**: tiled radial gradients, no JS, no animation, no box-shadow star
  field.
- **`ScrollReveal` is careful work.** It quantises every scroll-derived value, including blur radius
  to 0.5 px steps, and deliberately avoids permanent `will-change` with a comment saying why.
- **Fonts and the LCP image are exemplary**: self-hosted woff2 replacing a Google Fonts request chain,
  correct `unicode-range` splits, only the needed face preloaded, hero image preloaded with
  `imagesrcset`, `imagesizes` and `fetchpriority`. Every image is WebP with explicit dimensions.

Two caveats on evidence. Some of the compositor A/B work above was run under software rasterisation,
where Gaussian blur is disproportionately expensive; those runs are reliable for raster-invalidation
counts and layer geometry, which are device-independent, but their absolute milliseconds do not
transfer. Every number in sections 1 and 2 was measured on real GPU hardware.

---

## Recommended order

1. Add the shader early-out. Verified bit-identical, 36%.
2. Lower the DPR cap from 1.5 to 0.85. Together with step 1 this takes the background from 65.8 ms
   to 13.7 ms on a scaled display.
3. Add `will-change: transform` to the animated orbs and gate them on viewport. 30 fps to 60 fps.
4. Delete `will-change` from `SplitText.css:10`. Frees 95 compositor layers.
5. Pass `startOnVisible` to `TextType`.
6. Swap to `LazyMotion` with `m`. Measured 45 kB raw, 12.7 kB gzip.
7. Cache the rect in `BorderGlow` and `Galaxy`'s mousemove handlers.
8. Cancel the Lenis rAF and raise `lerp` to about 0.1.
9. Add `<MotionConfig reducedMotion="user">`.
10. Fold the gradient overlay into the shader; delete the dead code and unreferenced images.

Steps 1 through 3 are small and low-risk, and between them they account for nearly all of the
measured problem. None of the three changes how the site looks.
