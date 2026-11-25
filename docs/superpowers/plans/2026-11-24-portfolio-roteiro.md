# Portfolio Roteiro Implementation Plan

> **For agentic workers:** executado pelo loop em `docs/superpowers/loop/PROMPT.md`: um passo (Task) por iteração, com crítico de prints entre as iterações. Os passos usam checkbox (`- [ ]`). Marque `[x]` ao concluir.

**Goal:** refazer a home do portfolio como 7 cenas encadeadas (Abertura → Encontro → História → Trabalho → Prova → Como funciona → Conversa), com toda animação de rolagem em GSAP ScrollTrigger + Lenis.

**Architecture:**
- **Uma camada de rolagem** em `src/app/scroll/`: registro do GSAP, Lenis ligado ao ticker do GSAP, e o hook `useScene`, que embrulha ScrollTrigger + `gsap.matchMedia` + reduced motion.
- Cada cena é um componente em `src/app/scenes/`, alimentado por dados em `src/app/data/`. Os textos ficam no i18n (pt/en).
- **O que é testado:**
  - a matemática pura das cenas (frações de progresso, layout da linha do tempo, contagem), em funções testáveis;
  - a composição, com testes de renderização em jsdom.
- O visual é validado pelo crítico do loop.

**Tech Stack:** React 18.3.1, Vite, TypeScript, gsap 3.13 (ScrollTrigger, Draggable, InertiaPlugin, todos gratuitos), lenis 1.3, WebGL2 (`LiquidReveal`, mantido), react-i18next, vitest + jsdom, Tailwind.

**Spec:** `docs/superpowers/specs/2026-11-24-portfolio-roteiro-design.md`. Leia-a inteira antes do primeiro passo.

## Global Constraints

- **Público:** dono de negócio. Resultado antes da técnica. Sem jargão no texto principal.
- **Foto do Felipe:** aparece só na hero e no quadro da História.
- **Dallas Motel:** nunca dizer no site que é negócio da família nem que ele cresceu lá.
- **Genealogia:** só "Vincenzo Leone, Diamante, 1867". Sem data de chegada ao Brasil.
- **Números da OMD:** 31 empresas, 92 máquinas, 30 s → menos de 2 s, Agrishow. Removem 87 / 40M / 274 em todo o site.
- **Fontes:** Space Grotesk é a base. Instrument Serif só na História e na frase final da Conversa, servida localmente em `public/assets/fonts/`.
- **Cores:**
  - fundo `#050608`;
  - acento `#9fc3d6` só na História;
  - no Trabalho e depois dele, a única cor é a dos projetos revelados.
- **Movimento:**
  - todo movimento vem da rolagem ou da mão do visitante;
  - sem fade-and-slide genérico em seção;
  - com `prefers-reduced-motion`, layout estático legível: sem pin, sem Lenis, sem contagem.
- **Celular** (largura ≤ 767px):
  - rolagem nativa, sem Lenis;
  - a História fica vertical;
  - o carrossel funciona com o dedo e não sequestra a rolagem vertical.
- **Textos novos:** sempre em `pt.json` e `en.json` (o teste de paridade de chaves precisa passar). A voz do Felipe segue a skill `writing-as-felipe`. Fatos só da tabela da spec ou do conteúdo já publicado no site.
- **Bibliotecas:** nenhuma dependência nova além de `gsap`. `motion` só fica se o Task 8 não conseguir removê-lo sem custo.
- **Já rejeitado pelo Felipe:**
  - blueprint na foto;
  - linhas de diálogo;
  - seção "por que trabalhar comigo";
  - CTA de WhatsApp na hero;
  - Galaxy;
  - hover nas letras;
  - corte entre duas fotos na hero.
- **Portões a cada passo:** `pnpm test`, `pnpm build` e o detector do impeccable, todos verdes.

## Review Focus

1. **Redimensionar a janela ou girar o celular no meio de uma cena presa:** a cena recalcula, nada fica meio visível nem deslocado (`ScrollTrigger.refresh` com `invalidateOnRefresh`). Teste: `useScene` registra `invalidateOnRefresh: true` e reverte o contexto ao desmontar.
2. **Chegar por link profundo** (`/#projects`, `/#about` vindo do blog): a página cai no começo da cena certa, depois que os pins criaram o espaçamento. Teste em `useHashScroll`: a rolagem acontece depois de `ScrollTrigger.refresh()`.
3. **Trocar o idioma para en** (textos mais longos): a largura da linha do tempo horizontal é medida, não fixa. Teste: `timelineDistance(trackWidth, viewportWidth)` usa as medidas reais.
4. **Arrastar o carrossel no celular:** o gesto horizontal move o carrossel, e o gesto vertical rola a página. Teste: o `Draggable` usa `type: "x"`, `allowNativeTouchScrolling: true` e `lockAxis: true`.
5. **`prefers-reduced-motion: reduce`:** nenhuma cena fica presa, todos os textos aparecem e a contagem mostra o valor final. Teste em cada cena: com reduced motion, `useScene` não cria ScrollTrigger e o conteúdo final é renderizado.

---

### Task 0: Ferramentas do loop e base de rolagem

**Files:**
- Create: `scripts/loop/shoot.mjs`, `scripts/loop/mark.py`, `scripts/loop/scenes.json`
- Create: `src/app/scroll/gsap.ts`, `src/app/scroll/useScene.ts`, `src/app/scroll/math.ts`
- Modify: `src/app/hooks/useSmoothScroll.ts`, `.gitignore` (+ `.loop/`, `design-src/`), `package.json` (+ `gsap@3.13.0`)
- Test: `tests/scroll/math.test.ts`, `tests/ui/use-scene.test.tsx`

**Interfaces:**
- Produces:
  - `gsap.ts`: `export { gsap, ScrollTrigger, Draggable, InertiaPlugin }`, com os plugins já registrados.
  - `math.ts`:
    - `clamp01(v: number): number`
    - `span(p: number, from: number, to: number): number`, o progresso local de 0 a 1 dentro de `[from, to]`.
    - `timelineDistance(trackWidth: number, viewportWidth: number): number`, igual a `max(0, trackWidth - viewportWidth)`.
    - `countAt(p: number, target: number): number`, o valor arredondado com ease-out.
  - `useScene(ref: RefObject<HTMLElement>, build: (ctx: SceneCtx) => void, deps?: unknown[]): void`:
    - `SceneCtx = { mm: gsap.MatchMedia; reduced: boolean; isPhone: boolean }`
    - O `build` só roda depois do mount, dentro de um `gsap.context` escopado em `ref`, e é revertido ao desmontar.
    - `ScrollTrigger.defaults({ invalidateOnRefresh: true })`.
  - `useSmoothScroll()` continua retornando `RefObject<Lenis | null>`. Lenis só no desktop sem reduced motion, ligado por `lenis.on("scroll", ScrollTrigger.update)` e `gsap.ticker.add(t => lenis.raf(t * 1000))`, com `gsap.ticker.lagSmoothing(0)`.
  - `shoot.mjs <outDir>`:
    - Lê `scenes.json`, uma lista de `{ name, at }`: a fração da página ou o seletor + progresso de cada cena.
    - Abre `http://localhost:5199/` no playwright-core (`~/.npm/_npx/e41f203b7505f1fb`) com `/usr/bin/google-chrome` e as flags do SwiftShader.
    - Tira prints em 1440×900 (prefixo `d-`) e 390×844 (prefixo `m-`), mais um conjunto com `reducedMotion: "reduce"` (prefixo `r-`).
    - Rola via `window.scrollTo` e espera 2 frames + 400 ms antes de cada print.
  - `mark.py <notes.md> <shotsDir> <inboxDir>`:
    - Lê as linhas `arquivo | x,y,w,h | gravidade | ...` do arquivo de notas.
    - Copia para a inbox só os prints com marcas, com retângulos vermelhos de 4 px (ImageMagick `-draw`), sem texto.
    - Sem marcas, a inbox fica vazia.

- [x] **Step 1:** Escreva `tests/scroll/math.test.ts`:
  - `span(0.5, 0.4, 0.6) === 0.5`
  - `span(0.3, 0.4, 0.6) === 0`
  - `timelineDistance(3000, 1440) === 1560`
  - `timelineDistance(800, 1440) === 0`
  - `countAt(1, 92) === 92`
  - `countAt(0, 92) === 0`
  - `countAt(0.5, 31) > 15`
- [x] **Step 2:** Escreva `tests/ui/use-scene.test.tsx`, mockando `src/app/scroll/gsap`:
  - com `matchMedia("(prefers-reduced-motion: reduce)")` verdadeiro, `build` recebe `reduced: true`;
  - ao desmontar, `context.revert` é chamado.
- [x] **Step 3:** Rode `pnpm test tests/scroll tests/ui/use-scene.test.tsx`. Esperado: FAIL.
- [x] **Step 4:** Rode `pnpm add gsap@3.13.0`. Implemente `gsap.ts`, `math.ts`, `useScene.ts` e o novo `useSmoothScroll.ts`.
- [x] **Step 5:** Escreva `shoot.mjs`, `mark.py` e `scenes.json` (por enquanto com as posições da hero atual: 0, 0.1, 0.25, 0.5, 0.7, 0.85, 1.0 do track). Valide:
  - `node scripts/loop/shoot.mjs .loop/shots/000` gera os arquivos `d-*`, `m-*` e `r-*`;
  - `mark.py` com uma nota de teste desenha o retângulo.
- [x] **Step 6:** Copie `level.png` e `drive/look-left-sky.jpg` do scratchpad da sessão (`/tmp/claude-1000/-home-felipe-Code/a7aee68e-fb48-43db-9084-36dd1b2b1be8/scratchpad/`) para `design-src/`.
- [x] **Step 7:** Rode `pnpm test && pnpm build`. Esperado: PASS. Faça o commit `loop: base de rolagem gsap + ferramentas do loop`.

### Task 1: Hero em ScrollTrigger (visual idêntico) e skyline nítido

**Files:**
- Modify: `src/app/components/hero/HeroCity.tsx`, `HeroCity.css`, `LiquidReveal.tsx` (só a entrada de progresso e câmera)
- Delete: `src/app/components/hero/HeroPhoto.tsx/.css`, `readHeroVariant` e `HeroVariant` em `HeroParts.tsx`, `public/assets/profile/front-*`, `public/assets/profile/profile-*`
- Modify: `src/app/components/Hero.tsx` (renderiza só `HeroCity`), `index.html` (preload)
- Create: `scripts/assets/skyline.sh`, `public/assets/profile/scene-sky-wide.webp`, `public/assets/profile/scene-sky-tall.webp`
- Test: `tests/scroll/hero-camera.test.ts`

**Interfaces:**
- Consumes: `useScene`, `span` e `gsap` do Task 0.
- Produces:
  - `src/app/components/hero/camera.ts` exporta `cameraAt(p: number, shot: Shot, vw: number, vh: number): { x: number; y: number; scale: number }`.
  - É a função pura extraída do `HeroCity` atual, com a mesma interpolação geométrica entre `shot.start` e `shot.end(vw, vh)`.
  - A hero mantém todas as constantes atuais:
    - `TRACK_DESKTOP = 3.4`, `TRACK_PHONE = 3.15`;
    - `ZOOM_*`, `PULL_*`, `HOLD_FROM`, `EXIT_*`, `FRAME_*`.
  - A hero expõe ao fim o elemento `.city-frame` com `data-scene-frame`, para a História continuar dele.

- [x] **Step 1:** Teste `cameraAt`:
  - em `p = 0`, o rect visível é igual a `SHOT_WIDE.start`, com tolerância de 1 px;
  - em `p = 1`, igual a `end(1440, 900)`;
  - a escala é monotônica no intervalo.
- [x] **Step 2:** Rode o teste. Esperado: FAIL. Extraia `camera.ts`. Rode de novo. Esperado: PASS.
- [x] **Step 3:** Troque `useSceneProgress`, os `useTransform` e os `motion.*` do `HeroCity` por **uma** timeline com `scrollTrigger: { trigger: ".city", start: "top top", end: "bottom bottom", scrub: true }`. Fixe o `.city-stage` via `pin` ou mantenha o `sticky` (escolha o que der menos jitter no print). Cada faixa (sheet, front, shade, about, frame) é um tween posicionado na fração da timeline igual à constante atual. O progresso alimenta `cameraAt` e `LiquidReveal` via `onUpdate`.
- [ ] **Step 4:** **Skyline.**
  - Se `design-src/realesrgan/` existir (a ferramenta de ampliação, baixada só com aprovação do Felipe), `skyline.sh`:
    1. recorta a região do skyline do `level.png` (crops WIDE e TALL documentados no resumo: `-rotate 2.2`, WIDE `3856x2410+214+2820`, TALL `3856x4681+214+772`, região = `shot.start` com margem de 15%);
    2. amplia 4x;
    3. reduz para 2x do rect;
    4. exporta `scene-sky-*.webp`.
  - A hero mostra essa camada alinhada exatamente sobre a foto até `ZOOM_TO` e faz crossfade para a foto em `[ZOOM_TO, ZOOM_TO + 0.03]`, que é imperceptível porque os pixels coincidem.
  - Se a ferramenta não existir, pule este passo, anote `skyline: blocked` em `.loop/state.json` e siga.
- [x] **Step 5:** Remova a variante 2 e os assets sem uso. O `?hero=foto` não muda mais nada.
- [x] **Step 6:** Atualize `scenes.json` com as posições da hero e rode os portões. Commit: `loop: hero em scrolltrigger + skyline`.

### Task 2: Cena História (editorial)

**Files:**
- Create: `src/app/data/story.ts`, `src/app/scenes/Story.tsx`, `src/app/scenes/Story.css`
- Create: `public/assets/story/diamante-*.webp` (foto livre de Wikimedia Commons; licença e autor em `story.ts`), `public/assets/fonts/instrument-serif-*.woff2` (+ `@font-face` em `src/styles/fonts.css`)
- Modify: `pt.json` e `en.json` (`story.*`), `src/app/AppLayout.tsx`
- Delete: `src/app/components/About.tsx/.css` e o caption `.city-about` da hero
- Test: `tests/ui/story.test.tsx`, `tests/scroll/math.test.ts` (+ `chapterAt`)

**Interfaces:**
- Consumes: `useScene`, `timelineDistance` e `gsap`; o `[data-scene-frame]` da hero.
- Produces:
  - `STORY: StoryChapter[]`, com `StoryChapter = { id: "diamante" | "oba" | "etec" | "ifsp" | "dallas" | "omd" | "hoje"; year: string; image?: { src: string; credit?: string } }`.
  - Os anos são: `"1867"`, `"2017"`, `"2020"`, `"2022"`, `"2023"`, `"2024"`, e `"hoje"` traduzido.
  - `chapterAt(p: number, n: number): number` devolve o índice do capítulo em foco.
  - A seção tem `id="about"`.

- [ ] **Step 1:** Escreva os testes:
  - `chapterAt(0, 7) === 0` e `chapterAt(1, 7) === 6`;
  - o render de `<Story/>` com i18n stub mostra os 7 títulos, na ordem do `STORY`;
  - com reduced motion, o render não cria pin e os 7 capítulos ficam visíveis;
  - existe o texto "Vincenzo Leone";
  - nenhuma string contém "família" ou "cresci".
- [ ] **Step 2:** Rode. Esperado: FAIL.
- [ ] **Step 3:** Implemente o layout:
  - **Desktop:** seção presa. O quadro, à esquerda com 24% da largura, continua do `.city-frame`: no fim da hero, o quadro faz FLIP para essa posição. O trilho horizontal translada `-timelineDistance(...)` com `scrub`.
  - **Celular:** lista vertical, com o quadro no topo, menor.
  - **Tipografia:** títulos em Instrument Serif, ano em `#9fc3d6`.
  - **OBA:** um selo pequeno, sem destaque.
  - **Saída:** em "hoje", o quadro e a serifa saem com opacidade e escala, e o fundo segue escuro para o Trabalho.
- [ ] **Step 4:** Textos pt/en de cada capítulo, com no máximo 2 frases, na voz do Felipe (skill `writing-as-felipe`). Dallas 2023: site, cardápio digital e o sistema de gestão que virou o Dallas Sync.
- [ ] **Step 5:** Portões e `scenes.json` (História em 0, 0.33, 0.66 e 1). Commit.

### Task 3: Cena Trabalho (carrossel revelação)

**Files:**
- Create: `src/app/data/work.ts`, `src/app/scenes/Work.tsx`, `src/app/scenes/Work.css`
- Modify: `src/app/data/projects.ts` (fonte dos links e imagens), `pt.json` e `en.json` (`work.*`), `AppLayout.tsx`
- Delete da home: `Services`, `Projects`, `Credibility`, `DallasSyncShowcase` (reaproveite as telas dele como imagem/JSX do card Dallas Sync)
- Test: `tests/ui/work.test.tsx`

**Interfaces:**
- Consumes: `gsap`, `Draggable` e `InertiaPlugin`; `projects.ts`.
- Produces:
  - `WORK: WorkItem[]` na ordem Dallas Sync, Dallas Motel, Secret Boutique, OMDfarm, Eco360.
  - `WorkItem = { id: string; kind: "sistema" | "site" | "loja" | "omd"; image: string; href?: string }`.
  - A seção tem `id="projects"`.

- [ ] **Step 1:** Testes:
  - os 5 cards aparecem, na ordem;
  - o Dallas Sync tem `data-focus="true"` no estado inicial;
  - OMDfarm e Eco360 mostram o rótulo i18n `work.kind.omd` ("construí na OMD");
  - nenhum card contém "87", "40M" ou "274";
  - o `Draggable` é criado com `type: "x"`, `lockAxis: true`, `allowNativeTouchScrolling: true` e `inertia: true`.
- [ ] **Step 2:** Rode. Esperado: FAIL.
- [ ] **Step 3:** Implemente a seção, que **não fica presa**:
  - **Cards:** telas grandes (cerca de 62vw no desktop, 82vw no celular) em P&B (`filter: grayscale(1)`). O card em foco transiciona para a cor: hover no desktop, o card mais central no celular, recalculado no `onDrag` e no `onThrowUpdate`.
  - **Snap:** para o card mais próximo.
  - **Texto de cada card:** o que resolveu, em uma frase de dono de negócio, mais o tipo (site, loja ou sistema).
  - **Saída:** ao rolar para fora, todos voltam a P&B (ScrollTrigger com `start: "bottom 60%"`).
- [ ] **Step 4:** Telas: use `dallas`, `secret` e `omdfarm` do `public/assets/projects/`. Para o Eco360 sem tela, mostre o logo `eco360-logo.webp` sobre um fundo neutro. Nada de tela falsa.
- [ ] **Step 5:** Portões e `scenes.json` (Trabalho no início, com o card 3 em foco no celular). Commit.

### Task 4: Cena Prova (números OMD)

**Files:**
- Create: `src/app/scenes/Proof.tsx`, `src/app/scenes/Proof.css`
- Modify: `pt.json` e `en.json` (`proof.*`, removendo as chaves `credibility.*` sem uso)
- Test: `tests/ui/proof.test.tsx`

**Interfaces:**
- Consumes: `useScene` e `countAt`.
- Produces: `PROOF = [{ id: "empresas", value: 31 }, { id: "maquinas", value: 92 }, { id: "consulta", value: 2, prefix: "<", before: "30 s" }]` e mais a linha da Agrishow.

- [ ] **Step 1:** Testes:
  - com reduced motion, aparecem 31, 92 e "< 2 s" no texto final;
  - aparece "OMD do Brasil";
  - não aparece "87", "40M" nem "274".
- [ ] **Step 2:** Rode. Esperado: FAIL.
- [ ] **Step 3:** Implemente:
  - Os números grandes em Space Grotesk contam com `scrub` (`countAt`) enquanto a seção cruza a tela.
  - Uma linha curta diz o que são.
  - Sem pin longo: no máximo 100vh.
- [ ] **Step 4:** Portões e `scenes.json`. Commit.

### Task 5: Cena Como funciona

**Files:**
- Modify: `src/app/components/Process.tsx` → mover para `src/app/scenes/Process.tsx` e reescrever, mais o CSS. Reaproveite `process.steps.*` e `process.gate`; as `process.scenes.*` saem.
- Test: `tests/ui/process.test.tsx`

**Interfaces:**
- Consumes: `useScene`.
- Produces: a seção com `id="process"` e o elemento `[data-process-end]` onde a linha termina, que é o alvo da cena 7.

- [ ] **Step 1:** Testes:
  - os 4 passos aparecem na ordem Conversa, Rascunho, Desenvolvimento, No ar;
  - a frase "Nada começa sem o seu ok." aparece;
  - com reduced motion, a linha aparece completa.
- [ ] **Step 2:** Rode. Esperado: FAIL.
- [ ] **Step 3:** Implemente: uma linha SVG com `stroke-dashoffset` em `scrub`. Cada passo acende quando a linha chega nele. A linha é vertical no celular e horizontal no desktop (`gsap.matchMedia`).
- [ ] **Step 4:** Portões e `scenes.json`. Commit.

### Task 6: Cena Conversa e rodapé

**Files:**
- Create: `src/app/scenes/Talk.tsx`, `src/app/scenes/Talk.css`
- Modify: `AppLayout.tsx` (sai o FluidGlass do rodapé e o `GradientText` do copyright), `pt.json` e `en.json` (`talk.*`, reaproveitando `contact.*`)
- Delete da home: `Contact.tsx`, `LatestWriting.tsx` (o link para o post mais recente entra no `Talk` via `LatestWritingContent` ou `virtual:posts`), `AmbientOrbs.tsx`, `react-bits/FluidGlass` (se não houver outro uso)
- Move: `Experience.tsx` e `TechMarquee.tsx` → `src/app/recruiter/` (sem import na home)
- Test: `tests/ui/talk.test.tsx`, atualizar `tests/ui/app-layout-nav.test.tsx` e `tests/ui/latest-writing.test.tsx`

**Interfaces:**
- Consumes: o `[data-process-end]` do Task 5.
- Produces: a seção com `id="contact"`.

- [ ] **Step 1:** Testes:
  - o link do WhatsApp tem `href` com `wa.me` e a mensagem `contact.whatsapp_message` encodada;
  - existem o convite de networking e o link do LinkedIn;
  - o link do blog aponta para o post mais recente;
  - o rodapé tem "© {ano} Felipe Rodrigues Leone".
- [ ] **Step 2:** Rode. Esperado: FAIL.
- [ ] **Step 3:** Implemente:
  - uma frase curta em Instrument Serif, na voz do Felipe;
  - o botão do WhatsApp;
  - o convite de networking;
  - o rodapé discreto: LinkedIn, GitHub, blog e copyright.
  - A linha do processo termina no botão, que acende quando a linha chega.
- [ ] **Step 4:** Portões e `scenes.json` (o fim da página). Commit.

### Task 7: Navegação, link profundo e limpeza final

**Files:**
- Modify: `AppLayout.tsx` (`SECTION_IDS = ["about", "projects", "process", "contact"]`), `src/app/hooks/useHashScroll.ts`, `GlassNav` (rótulos), `pt.json` e `en.json` (`nav.*`)
- Delete: chaves i18n órfãs, componentes e assets sem import (`pnpm build` + `grep` para confirmar), `motion` do `package.json` se não restar nenhum uso
- Test: `tests/ui/app-layout-nav.test.tsx`, `tests/ui/hash-scroll.test.tsx`

- [ ] **Step 1:** Testes:
  - o nav lista `about`, `projects`, `process` e `contact`, nessa ordem;
  - o clique chama `lenis.scrollTo("#projects", …)`;
  - `useHashScroll` chama `ScrollTrigger.refresh()` antes de rolar até o hash.
- [ ] **Step 2:** Rode. Esperado: FAIL. Implemente. Rode de novo. Esperado: PASS.
- [ ] **Step 3:** Limpeza:
  - remova as chaves i18n sem uso (o teste de paridade continua verde);
  - remova os arquivos órfãos;
  - se `motion` não tiver mais uso, rode `pnpm remove motion`;
  - os mocks dos testes que citam `motion/react` acompanham a remoção.
- [ ] **Step 4:** Portões completos e `scenes.json` final, com a página inteira em cerca de 30 posições. Commit: `loop: navegação e limpeza`.
