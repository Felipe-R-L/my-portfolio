# Ajustes de 2026-11-27 (awwwards 23 a 54)

Tudo o que mudou a pedido do Felipe ou pelo loop neste dia, com o motivo,
para quem retomar o trabalho. As decisões em si estão em `DIRECTION.md`;
aqui fica o que foi feito e o que quebrou no caminho.

## Hospedagem e mídia
- **R2** (`media.feliperl.space`, bucket `my-portfolio`): a mídia licenciada sai do
  deploy e é lida por `media()` / `VITE_MEDIA_BASE` (Vercel: produção e
  prévia). Upload com `pnpm media:push` (rclone, credenciais em
  `.env.local`). (awwwards 33, 34)
- **Regras aprendidas:** subir a mídia **antes** do código que a usa (a
  Cloudflare guarda o 404 por minutos); arquivo substituído ganha **nome
  novo** (cache de um ano, `immutable`).
- **Barco borrando:** o resto do voo de Diamante foi refeito com mais
  bitrate (`diamante-rest2-*`: webm 11 MB, mp4 15 MB, o celular metade).
  (39)

## Hero
- **Onda com relógio próprio** (3,6 s), disparada pela rolagem, como os
  cards. (35)
- **"g" de Rodrigues cortado:** espaço abaixo da linha do nome. (35)
- **Nome encostado no trilho de capítulos** no desktop: o quadro do nome
  começa depois do trilho. (39)
- **Diamante em loop:** o primeiro voo passa para o resto (aproximação,
  telhados, barco) e volta, com fusões (`placeLoop.ts`). (37)
- **Sem pausa no retrato:** mar → retrato → card numa passagem só de 5,2 s.
  (44)
- **Cards da História por cima da onda** ao rolar forte: a passagem do
  hero agora é `whole` (toca no tempo dela). (46)
- **Onda sumindo depois de descer e subir:** o `SeaWash` refazia o efeito
  a cada render do hero e descartava o contexto WebGL do mesmo canvas;
  agora depende de valores e só descarta quando o canvas sai da página.
  (45)
- **Volta lenta:** subindo, o retrato ficava ~3 s parado antes de o mar
  vir; agora o mar vem assim que o card abre no retrato (espelho da ida).
  (49)

## Contato
- **Opção A:** o T5 virou o mar (`TalkSea.tsx`), no lugar do recuo sobre
  São Paulo; a página atravessa sob a água (passagem `under`, curva
  `underCurve`), a foto corta para o lado do convite no meio. (44)
- **Último plano do Como funciona apagado e mudo:** o mar engatava no
  embalo e cobria o plano 4 no mesmo instante. O mar nunca é engatado pelo
  embalo e espera 0,65 s depois do trecho anterior; o plano conta como
  alcançado com uma folga de alguns px. (48)

## Usabilidade: acelerar sem cortar (54)
- Um gesto durante a abertura do hero ou o mar antes do Contato não é mais
  ignorado. No mesmo sentido, o resto da passagem toca na **mesma curva**,
  mais rápido, e o mar junto (`timeScale` pelo evento `glide:pace`): um
  gesto corta pela metade o que falta, insistir ou um giro forte leva a
  ~0,6 s. Os primeiros 0,35 s não contam (é o próprio gesto que começou).
- No sentido contrário volta na hora: o hero refaz a volta de onde está; o
  mar do Contato toca a própria curva de trás para frente, a página
  atravessando de volta sob a água.
- O mar do Contato acelera também enquanto sobe (antes esperava a tela
  coberta e parecia travado, Felipe): a página e a água aceleram juntas,
  então ela continua atravessando só sob a água. (55)
- **Som da onda atrasado na aceleração** (Felipe): o estrondo de 5 s seguia
  depois da água sumir. Agora a onda que está tocando acompanha: um pouco
  mais rápida (até 1,25×, acima disso soa de brinquedo) e some meio
  segundo depois da água; ao voltar, ela dá lugar à onda da volta. (55)
- **Quadrados pixelados à frente da espuma** no mar do Contato, às vezes
  (Felipe): os respingos sorteavam as gotas com um hash de `sin` sobre o
  relógio do mar, que no Contato já está alto (o mar monta perto do Como
  funciona); sem precisão, as gotas viravam blocos. Hash sem `sin` e
  relógio curto para os respingos. (55)
- Defeito achado no caminho: quando a página já estava no fim do trecho
  (sob a água, antes ou depois de atravessar), o Lenis ignorava o novo
  scroll e o anterior seguia; voltar cedo mostrava a página indo ao
  Contato com o mar descendo. Agora esse trecho é só tempo (`still`).
- Conferido: `.loop/tools/herohurry.mjs` e `talkhurry.mjs` (sem gesto,
  um gesto, dois, volta), `heroclock`, `plano3` (plano 4 aceso e com som).

## Navegação
- **Links da nav quebrados** (o Contato caía no meio da passagem do mar e
  a página voltava; "Sobre" pousava no meio da História): cada link pousa
  no repouso do capítulo, de qualquer ponto; o "acabamento" do glide não
  sequestra mais o voo. Voo de 0,9 s com vento e woosh, sem onda. (50)

## Som
- Efeitos gerados na página (`synth.ts`): papel, cartão, obturador, tick e
  woosh; o card e o swipe suavizados duas vezes ("áspero"). (29, 30, 36)
- Onda, vento, música e barco do Pixabay; mini player no canto. (31, 32)
- O canto é o único botão do som: convite → bolinha → player; no celular a
  bolinha sai do caminho ao rolar para baixo. (39, 42)
- Som da onda voltando tocava ~2 s atrasado: agora no instante em que ela
  vira. (39)
- Mar ambiente tirado (soava como balde); só vento (abafado e mais baixo)
  e música. Barco a 0,2. (44, 47, 50)

## Detalhes dos projetos
- **Laterais não rolavam com o touchpad:** o fundo claro da camada é
  `position: fixed`, e a roda sobre um elemento fixo rola a página (travada),
  não a camada. Fundo sem ponteiro. (52)

## Película e capítulos
- Marca de borda sob o título em todos os capítulos, com as coordenadas de
  Diamante numa linha própria. (41, 42, 43)
- Botão "See details" cortado no celular (faixa de arrastar). (43)

## Loop e captura
- `scenes.json`: a onda é fotografada em tempos fixos (`times`), sem as
  cenas `hold`; saíram as cenas do meio do Contato, que só existiam num
  salto para trás. (41)
- Push para `awwwards-polish` liberado; deploy de produção nunca. (40)
