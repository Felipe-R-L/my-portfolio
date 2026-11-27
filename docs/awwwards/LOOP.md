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
| `.loop/tools/*.mjs` | construtor | ferramentas de verificação (axe, teclado, responsivo, `herowave2.mjs` para a onda com a roda do mouse) |

**Regra de ouro: o construtor nunca abre `.loop/notes/`.** O defeito chega
como retângulo vermelho, sem texto. Deduzir o problema faz parte do trabalho.

## O plano (só o que não depende do Felipe)

Feito até awwwards 21: captura nos três modos, acessibilidade (axe 0,
teclado), performance (~95 celular, 98 desktop), SEO e sitemap, responsivo
(360 a 1920, toques de 44 px), coesão, rascunho do kit, botão de som, a
linha do tataravô, o voo de Diamante no hero e no Contato, e o mar levando
ao retrato colorido.

Um passo por iteração, na ordem. Um passo só termina quando o que ele pede
está feito **e** conferido no navegador (a onda, com
`node .loop/tools/herowave2.mjs 1440 900 d`, que gira a roda uma vez e tira
prints ao longo do tempo; `scrollTo` direto não serve, a rolagem guiada
leva a página para outro lugar).

1. **Ritmo da onda.** Hoje um giro da roda toca a passagem inteira em ~1,5 s
   (a passagem de `registerPassages` tem `duration: 3.4`, mas a distância
   encurta o tempo). Meta: a subida e a volta lidas com calma, ~3 s no total
   num giro, sem travar quem rola rápido. No celular, conferir com o toque.
2. **Acabamento da onda.** A faixa branca da borda é regular demais: torná-la
   irregular (espessura e brilho variando, respingos soltos à frente). Água
   funda longe da crista sem cara de borrão no celular. Conferir no
   ultrawide (3440×1440) e no celular deitado.
3. **Peso da mídia.** O mar tem 48 MB (desktop) e 25 MB (celular); o voo,
   5 MB. Meta: o mar abaixo de ~8 MB por aparelho (trecho menor, AV1 ou VP9
   com fallback H.264, bitrate pensado para a tela) e carregado só depois do
   primeiro quadro, sem atrasar o LCP. Os pôsteres em WebP abaixo de 200 KB.
   Lighthouse de novo depois.
4. **Captura e testes do hero novo.** `scripts/loop/scenes.json`: as cenas
   02-encontro e 02-quadro eram da janela; trocar por cenas da onda (subindo,
   cobrindo, recuando) e do retrato parado. Teste unitário mínimo do
   `SeaWash` (não monta com movimento reduzido; canvas some fora da faixa).
5. **Som.** Com o plano de áudio do Storyblocks: escolher e baixar a
   sonoplastia (onda subindo e recuando, card, quadro, mar baixinho) e
   ligar os cues em `src/app/audio/cues.ts`, com volume baixo e sem tocar
   sozinho. A música espera os nomes que o Felipe escolher.
6. **Coesão com o retrato colorido.** Só o que não depende da decisão de cor
   (ver "Em aberto" em DIRECTION.md): o quadro que vai para o lado com a
   História e o T1 continuam certos com a foto colorida?

7. **Detalhes de Diamante** (aprovados, ver DIRECTION.md): as coordenadas
   de Diamante (39°40′ N · 15°49′ E, as mesmas do carimbo do hero) na marca de borda de cada capítulo; o mar
   voltando como transição para o Contato, reaproveitando o `SeaWash` (mesma
   água, sem clipe novo); o som do mar baixinho sob a música, junto com os
   cues do passo 5. Movimento reduzido: sem o mar.

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
   > marque a ausência da galeria nem a falta de som.
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
   `Claude-Session: https://claude.ai/code/session_01VsPyKxGUgvV3cMdzvYPPme`.
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

Os 7 passos do plano feitos, `clean_streak >= 2` e portões verdes: escreva um resumo
em `.loop/log/FINAL.md` e `<promise>PARADA</promise>`.

A promessa só sai quando uma dessas duas condições for verdadeira.

## Proibido

- Ler `.loop/notes/` sendo o construtor.
- Ajustar crítico, `mark.py` ou o `shoot.mjs` para marcar menos.
- Pular portões, desativar testes, crescer `detector-baseline.txt`.
- Commitar qualquer coisa de `public/assets/sb/` (mídia licenciada, repo
  público), `public/assets/story/_test-*` ou asset sem licença.
- Abrir o `.env` ou imprimir a chave do OpenRouter; gastar crédito do
  OpenRouter.
