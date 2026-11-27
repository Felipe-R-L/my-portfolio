# Loop do Awwwards: construtor e crítico com prints

Uso: `/ralph-loop "$(cat docs/awwwards/LOOP.md)" --max-iterations 20 --completion-promise "PARADA"`

Variante de `docs/superpowers/loop/PROMPT.md` para o polimento antes da
submissão. O mesmo texto volta a cada iteração; a memória entre iterações vive
só nos arquivos de `.loop/` e no git.

---

Você está polindo o portfólio do Felipe para o Awwwards. Trabalhe **só** em
`/home/felipe/Code/pessoal/my-portfolio-awwwards` (worktree, branch
`awwwards-polish`), sempre com caminhos absolutos ou `cd` para lá em cada
comando. Antes de tudo leia `docs/awwwards/DIRECTION.md`: é a direção
aprovada, e você não a muda.

## Arquivos do loop (`.loop/`, ignorado pelo git)

| Caminho | Quem escreve | Quem lê |
|---|---|---|
| `.loop/state.json` | construtor | todos. `{"iteration", "step", "clean_streak", "history", "stuck"}` |
| `.loop/shots/NNN/*.png` | `shoot.mjs` | crítico |
| `.loop/inbox/NNN/*.png` | crítico, via `mark.py` | **construtor: só estas imagens** |
| `.loop/notes/NNN.md` | crítico | **nunca o construtor** |
| `.loop/log/NNN.md` | construtor | Felipe: o que mudou, a causa, como foi conferido |
| `.loop/QUESTIONS.md` | construtor | Felipe |
| `.loop/hero-media-test.patch` | (já existe) | ninguém mexe: é o teste de mídia do hero, volta quando o vídeo chegar |

**Regra de ouro: o construtor nunca abre `.loop/notes/`.** O defeito chega
como retângulo vermelho, sem texto. Deduzir o problema faz parte do trabalho.

## O plano (só o que não depende do Felipe)

Um passo por iteração, na ordem. Um passo só termina quando o que ele pede
está feito **e** conferido no navegador.

1. **Captura completa.** `scripts/loop/scenes.json` e `shoot.mjs` ainda acham
   seletores que não existem no celular e no movimento reduzido ("missing
   target"). Faça toda cena ser capturada nos três modos. Corrigir seletor
   vale; tirar cena para o crítico ver menos, não.
2. **Acessibilidade (meta: nenhuma falha).** axe-core em desktop, celular e
   reduzido; caminho inteiro só no teclado (ordem, foco visível, nada preso
   em pin, o case abre e fecha pelo teclado, Esc fecha); nomes acessíveis;
   contraste AA em todo texto, inclusive sobre foto; `prefers-reduced-motion`
   respeitado em tudo que se mexe.
3. **Performance.** Lighthouse no build de produção (`pnpm build && pnpm
   preview`), celular e desktop: performance ≥ 95, CLS 0, LCP no celular
   < 2,5 s, sem JS não usado evitável, imagens no tamanho certo, fontes com
   preload certo. Conferir também com rede lenta (Slow 4G) que a primeira
   tela não fica vazia.
4. **Semântica e SEO.** `lang` e hreflang PT/EN, títulos e descrições, JSON-LD
   `Person` e `WebSite`, sitemap e robots coerentes, um `h1`, hierarquia de
   títulos sem pulo, links com destino claro, páginas de case e blog também.
5. **Responsivo.** Toda cena em 360, 390, 430, 768, 1024, 1280, 1440 e 1920 de
   largura, e celular deitado. Nada estoura, nada corta texto, nenhum toque
   menor que 44 px.
6. **Coesão.** O que ainda destoa de `DIRECTION.md` no site: cor fora da
   regra, elemento que não fala a língua da película, ritmo e espaçamento
   desiguais entre capítulos. Só ajustes dentro da direção.
7. **Kit de submissão (rascunho).** `docs/awwwards/submission.md`: título,
   descrição curta em PT e EN na voz do Felipe (use a skill
   `writing-as-felipe` e rode o `checar-voz.py`), tags, cores, fontes,
   tecnologias, créditos de imagem, e a lista de thumbnails exigidas pelo
   Awwwards com os tamanhos. Gere as thumbnails provisórias em
   `.loop/submission/` (o hero ainda vai trocar de mídia). Nada é enviado.

Depois do passo 7, as iterações só corrigem o que o crítico marcar, até a
parada.

## Uma iteração

1. **Estado.** Leia `.loop/state.json` (crie com
   `{"iteration":0,"step":1,"clean_streak":0,"history":[],"stuck":[]}` se não
   existir). Incremente `iteration`; ele é o `NNN` da rodada, com três dígitos.
2. **Inbox.** Se existir `.loop/inbox/<NNN-1>/`, abra cada PNG com Read. Cada
   retângulo é um defeito: corrija na causa. Ambíguo: corrija a hipótese mais
   provável. Toda marca é corrigida, inclusive detalhe.
3. **Plano.** Se a inbox estava vazia e o passo atual terminou, avance para o
   próximo e faça-o inteiro. Pode delegar até 4 subagentes em tarefas
   independentes; o código deles passa por você antes de entrar.
4. **Portões.** `bash scripts/loop/gate.sh` (testes, build, detector) até
   ficar verde. Teste vermelho não vai para o crítico. Sem desativar teste.
5. **Captura.** O dev server do Felipe já roda em `http://127.0.0.1:5400/`
   (não suba outro nessa porta; se não responder, suba com
   `pnpm dev --host 127.0.0.1 --port 5400 --strictPort` em background).
   `node scripts/loop/shoot.mjs .loop/shots/<NNN> http://127.0.0.1:5400/`.
6. **Crítico.** Um subagente **novo** (`general-purpose`), sem este contexto,
   com o pedido:

   > Você é jurado do Awwwards e diretor de arte de agência premiada,
   > revisando um portfólio antes da submissão. Leia
   > `/home/felipe/Code/pessoal/my-portfolio-awwwards/docs/awwwards/DIRECTION.md`
   > e, se existir, `.loop/notes/<NNN-1>.md` (para ver se o que foi marcado
   > voltou). Olhe cada PNG em `.loop/shots/<NNN>/` (d = desktop 1440×900,
   > m = celular 390×844, r = movimento reduzido).
   >
   > Para cada defeito material, uma linha em `.loop/notes/<NNN>.md`, no
   > formato `d-02-encontro-50.png | x,y,w,h | gravidade | explicação`
   > (retângulo em pixels do PNG; gravidade = bloqueia, importante ou
   > detalhe). Sem defeito, o arquivo diz só "nenhum defeito".
   > Defeito material: legibilidade e contraste; corte, sobreposição ou
   > estouro; pixelização; quebra de continuidade entre cenas; desvio de
   > DIRECTION.md (cor inventada, fonte errada, elemento fora da película);
   > ritmo e alinhamento; desktop e celular incoerentes; texto inventado ou
   > com jargão; algo que um jurado de Usabilidade ou do Developer Award
   > puniria. Não marque gosto pessoal que contradiga DIRECTION.md. Não
   > marque a ausência da galeria nem a mídia provisória do hero.
   >
   > Rode `python3 scripts/loop/mark.py .loop/notes/<NNN>.md .loop/shots/<NNN> .loop/inbox/<NNN>`
   > e responda só `bloqueia=N importante=N detalhe=N`.

7. **Registro.** Acrescente a contagem a `history`. Zero marcas:
   `clean_streak += 1`; qualquer marca: `clean_streak = 0`. Mesmo retângulo
   no mesmo arquivo por 3 rodadas: anote em `stuck` e siga. Escreva
   `.loop/log/<NNN>.md` (pedido ou passo, causa, mudança, como conferiu).
8. **Commit.** Um por iteração, `git add` só dos arquivos que você mudou
   (nunca `-A` nem `.`: há assets de teste sem licença soltos em
   `public/assets/story/`), mensagem `awwwards <N>: <o que muda, em
   português, para quem usa o site>`, continuando a numeração do último
   commit `awwwards`. Termine a mensagem com a linha
   `Claude-Session: https://claude.ai/code/session_01VsPyKy1ofGWkLSni6T8NaK`.
   **Sem `Co-Authored-By`.** Nunca push, nunca deploy, nunca publicar nada.

## Quando parar e chamar o Felipe

Pare na hora, sem tentar adivinhar, quando a próxima coisa a fazer exigir
uma decisão de **direção criativa**:
- mudar o conceito, a regra de cor, a tipografia ou a ordem dos capítulos;
- criar seção, cena, animação de assinatura ou preloader novos;
- trocar ou reescrever texto além de corrigir erro (copy nova é decisão dele);
- escolher entre duas leituras que DIRECTION.md não resolve;
- usar mídia nova, de banco, gerada por IA ou que precise de licença.

Nesse caso: termine o que estiver no meio, deixe os portões verdes e faça o
commit; escreva em `.loop/QUESTIONS.md` a pergunta, as opções (com prints,
se ajudarem, em `.loop/questions/`) e a sua recomendação; e então escreva
`<promise>PARADA</promise>`.

## Parada normal

Os 7 passos feitos, `clean_streak >= 2` e portões verdes: escreva um resumo
em `.loop/log/FINAL.md` e `<promise>PARADA</promise>`.

A promessa só sai quando uma dessas duas condições for verdadeira.

## Proibido

- Ler `.loop/notes/` sendo o construtor.
- Ajustar crítico, `mark.py` ou o `shoot.mjs` para marcar menos.
- Pular portões, desativar testes, crescer `detector-baseline.txt`.
- Mexer em `.loop/hero-media-test.patch`, commitar `public/assets/story/_test-*`
  ou qualquer asset sem licença.
- Abrir o `.env` ou imprimir a chave do OpenRouter; gastar crédito do
  OpenRouter.
