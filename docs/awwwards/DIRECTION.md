# Direção para o Awwwards

O que o Felipe decidiu até 2026-11-27. O crítico do loop julga contra este
documento; o construtor não muda nada daqui sem perguntar.

## Meta

Honorable Mention no mínimo (nota do júri ≥ 6,5), Site of the Day como alvo.
Pesos do júri: Design 40%, Usabilidade 30%, Criatividade 20%, Conteúdo 10%.
O Developer Award olha semântica e SEO, animação, acessibilidade, performance,
responsivo e qualidade do markup. Referência: Lando Norris (SOTD 8,18; o ponto
fraco dele foi usabilidade 7,9 e acessibilidade 7,0, e é aí que este site
precisa ser impecável).

## Conceito: o site inteiro rodado em Diamante 400

O portfólio é um filme. Diamante, na Calábria, terra do tataravô do Felipe, é
o plano de abertura e o nome da película ("DIAMANTE 400"). O vínculo é visual
(o carimbo, o voo sobre a cidade, o mar que leva ao retrato, o retorno no
fim); o único texto sobre ele é uma linha discreta no rodapé do Contato.

- **A cor.** Diamante abre em cor. **O retrato agora é colorido** (Felipe,
  2026-11-27: o preto e branco não combinou com a onda). O resto do meio da
  página continua com a regra antiga até ele decidir: preto e branco, com
  cor só no foco (capítulo ativo, hover, plano alcançado); no Contato a cor
  volta inteira. Ver "Em aberto".
- **Nunca cor inventada.** Só a cor real da foto ou do vídeo e o azul
  #9fc3d6, acento único. Sem dourado, sem paleta de ilustração. Ajuste de
  tom do mar na edição é permitido (ele pediu).
- **Uma película:** a mesma granulação na página toda; a marca de borda
  "FRL 2026 · DIAMANTE 400 · 0N" sob o título de cada capítulo; o quadro que
  atravessa a página é a câmera.
- **Fecho:** o Contato termina em Diamante: o fundo é o último quadro do voo
  do hero (feito em awwwards 20).

## O hero (awwwards 20 e 21)

1. **Diamante.** Voo de drone que recua da cidade velha até a costa inteira
   ao pôr do sol (Storyblocks 348598577, Francesco Rinaldi), tocado uma vez a
   1,5× (15 s) e parado na vista larga. Primeiro quadro = pôster e LCP (um
   arquivo por aparelho); no celular, corte vertical e sombra mais alta sob o
   texto. Nome em duas linhas (Cormorant, "Rodrigues" em itálico) e o
   carimbo de viagem.
2. **O mar** (`src/app/components/hero/SeaWash.tsx`, WebGL). No trecho da
   rolagem que era a janela no rosto (OPEN_FROM..OPEN_TO da cena), a onda
   sobe de baixo sobre Diamante e o nome, cobre a tela e recua deixando o
   retrato colorido. A água é o clipe Storyblocks 355192518 (espuma subindo
   sobre mar fundo, filmado na vertical, master ProRes 4K), com tom puxado
   para verde-azulado. A borda é desenhada (linha orgânica animada + faixa de
   espuma viva) e logo abaixo dela fica sempre a parte mais densa da espuma
   do vídeo. Na água rasa perto da borda, o que está por baixo (o quadro do
   vídeo de Diamante, depois o retrato) aparece refratado e escurecido; à
   frente da onda a terra fica na sombra; atrás dela, na volta, o retrato
   fica molhado e seca. Câmera: Diamante mergulha (escala), o nome sobe num
   plano mais próximo (−14vh) até a água levar, o retrato sai da água 12%
   mais perto e assenta. Tudo reversível pela rolagem.
3. O retrato para; depois vira o quadro que vai para o lado com a História,
   como antes.
- **Movimento reduzido:** sem mar; o retrato simplesmente aparece.
- Removidos: a janela no rosto, o pincel de cor no retrato (`LiquidReveal`) e
  o traço automático de cor (awwwards 16), porque o retrato já é colorido.
- Arquivos do mar: um loop de 7 s sem emenda (o último segundo funde no
  primeiro), AV1 (`sea-1440.av1.mp4` 4 MB, `sea-1080.av1.mp4` 2,6 MB) e
  H.264 de reserva (`sea-1080.h264.mp4` 6,7 MB). Baixado só depois que o
  voo de Diamante tem o que tocar (ou 3 s). Pôsteres: `-first-1920.webp`
  (197 KB) e `-first-tall-720.webp` (100 KB).
- Prévias de laboratório e encodes antigos (fora do site e do git):
  `~/Videos/storyblocks-diamante/web-lab/` (`wave-immersive.html` foi a
  aprovada; abre só servida de `public/assets/sb/`).

## Decisões fechadas

- Carimbo de viagem no hero: "Benvenuti a Diamante · Città dei murales e del
  peperoncino", pimenta, coordenadas.
- Tipografia: Cormorant Garamond nos títulos, EB Garamond no corpo (peso 450,
  font-size-adjust 0.46), sans do sistema só em rótulos e nav. Nunca Space
  Grotesk.
- "Em uso" removido. Como funciona = tira de filme com 4 planos; o plano 3
  (Construção) é ilustração; projeto real só no plano 4, e não o Dallas Sync.
- Sem métricas inventadas; texto em PT e EN com a voz do Felipe
  (skill `writing-as-felipe`).
- Linha sobre o tataravô: só no rodapé do Contato (awwwards 19): "Diamante,
  na Calábria, foi a terra do meu tataravô."
- Som (awwwards 17): desligado por padrão, botão discreto na nav, escolha
  lembrada no aparelho. Música bem baixa ao fundo; sonoplastia da onda, dos
  cards e do quadro; nada toca sozinho. Motor em `src/app/audio/`.
  Fontes (Felipe, 2026-11-27; o áudio do Storyblocks é um plano à parte,
  R$ 260, e não compensa): papel, cartão, shutter e tick são **gerados na
  página** (`synth.ts`, sem arquivo e sem licença); onda e vento vêm do
  **Pixabay** ("Waves Crashing" e "Wave on the Shore", DRAGON-STUDIO; "a
  gentle breeze, wind 4"); a música é uma playlist do Pixabay escolhida por
  ele: Amore al Mare (Grand_Project), Bossa Nova Soulful (andriih) e
  Nostalgic Folk No. 3 (Sonican). Mini player no canto superior esquerdo,
  só com o som ligado: silenciar a música e trocar de faixa (lembrados no
  aparelho). Reserva: Vivaldi, Verão, Allegro non molto (John Harrison,
  CC BY-SA).
- Mídia de banco: Storyblocks (assinatura do Felipe, plano com acesso total
  desde 2026-11-27, inclui áudio). Pode ser de outro lugar que não a Itália
  quando for só textura (o mar). Nunca para o Felipe ou os projetos.
  Publicar com a assinatura ativa e guardar o comprovante.
- **Detalhes de Diamante no resto da página** (aprovado em 2026-11-27,
  inclusive o som): as coordenadas de Diamante na marca de borda; o mar
  voltando como transição para o Contato; o som do mar baixinho sob a
  música. Sem pimenta, mural ou ilustração fora do hero.
- Hospedagem da mídia (2026-11-27): **Cloudflare R2**, num subdomínio
  próprio (`media.feliperl.space`). O Felipe cria o bucket e põe as chaves
  no `.env.local` (nunca no chat nem no git). Até lá, o site lê de
  `public/assets/sb/` no dev.
- Mídia licenciada nunca entra no git: o repositório `Felipe-R-L/my-portfolio`
  é público. Tudo fica em `public/assets/sb/` (excluído por
  `.git/info/exclude`); os masters ficam em `~/Videos/storyblocks-diamante/`.
  Prévias sem licença (`public/assets/story/_test-*`) também nunca entram.

## Em aberto (decisão do Felipe)

- **A regra de cor depois do retrato colorido:** o meio da página continua
  em preto e branco com cor no foco, ou a cor fica em tudo? Afeta História,
  Como funciona e o "plano alcançado".
- **Músicas:** o MCP do Storyblocks não lê as pastas nem os favoritos dele;
  ele passa os nomes ou baixa.
- **Galeria "Fora do código":** fotos dele, sem tratamento, num álbum
  compartilhado do Google Fotos chamado "Portfolio" (o link fica em
  `.loop/QUESTIONS.md`, fora do git). Ele ainda vai acrescentar fotos e quer
  que o site puxe do álbum sozinho. Proposta: um script de sincronização
  rodado à mão (`pnpm gallery:sync`) que lê o álbum, gera AVIF/WebP, sobe
  para a hospedagem da mídia e escreve um manifesto; nada ao vivo no
  navegador (a API do Google Fotos não lê mais álbuns de terceiros e os
  links das imagens expiram). Quais fotos entram é decisão dele.
- **Kit de submissão:** a descrição ainda fala do "quadro que abre no meu
  rosto" e do preto e branco; precisa ser reescrita na voz dele.
- Conta PRO, contatos para votar, data do envio.
