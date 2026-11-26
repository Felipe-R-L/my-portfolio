# Portfolio: roteiro de cenas e transições

Data: 2026-11-24 (atualizado em 2026-11-26) · Branch: `freela-networking` · Status: jornada em capítulos implementada, em polimento (loops 017–047). O estado atual está no Adendo 4, que prevalece sobre o que vem antes dele.

## Intenção

O site existe para uma coisa: **fazer um dono de negócio querer um trabalho do Felipe no negócio dele.** Os visitantes são donos de motel, hotel, loja e boutique, gente que hoje usa planilha e caderno.

O Felipe conseguiu a vaga na OMD numa conversa casual, sem experiência, porque o dono viu nele vontade de aprender e facilidade de explicar. O site reproduz essa conversa: ao terminar de rolar, o visitante sente que já conversou com ele e confia.

O tom é profissional e dedicado, alguém que gosta de aprender e explica bem. Sem narcisismo: a foto dele aparece uma vez, e daí em diante o protagonista é o trabalho. É a mesma lógica do Lando Norris, cujo trabalho está na pista; o do Felipe são os sistemas no ar.

## Objetivos

- Uma sequência de cenas encadeadas, inspirada em sites de agência e no landonorris.com, em que cada transição liga uma cena à seguinte.
- Contar a história do Felipe de forma resumida e com contexto: de onde vem, como chegou até aqui.
- Mostrar a experiência e os projetos grandes, em linguagem de dono de negócio, com o resultado antes da técnica.
- Desktop e celular igualmente bons.

## Não-objetivos

- **Versão para recrutadores.** Fica para depois, possivelmente num subdomínio. Ela fala com recrutador técnico, como o LinkedIn faz hoje.
- **Blog.** Não muda: rota `/blog` e `BlogChrome` ficam como estão, salvo o necessário para herdar fontes e cor.

## Anti-objetivos (fracasso mesmo que funcione)

- Site cheio de foto do Felipe, ou um "sobre mim" que soe como autopromoção.
- Jargão técnico na frente do resultado ("outbox sync", "multi-tenant" etc. só como camada secundária, se houver).
- Efeito pelo efeito: transição que não liga uma cena à seguinte.
- Bugs de responsividade por causa de código de rolagem feito à mão. Esse é o motivo da escolha da abordagem.
- Prédios pixelados dentro das letras da hero.
- Coisas que o Felipe já rejeitou: o blueprint como revelação da foto, linhas de diálogo sobre a foto, a seção "por que trabalhar comigo", CTA de WhatsApp na hero, "quem sou" como seção solta ou como legenda desconexa, fundo Galaxy, hover nas letras.

## Fatos (fonte: LinkedIn exportado em 2026-11-24 e conversa)

| Quando | Marco |
|---|---|
| 1867 | Vincenzo Leone, tataravô, nasce em Diamante (Cosenza, Calábria) e depois vem para o Brasil. **Data de chegada desconhecida: não inventar.** |
| 2017 | Medalha de prata na XIX OBA (Olimpíada Brasileira de Astronomia). Elemento discreto |
| 2020–2021 | Curso técnico de ADS na ETEC Prof. Idio Zucchi, durante a pandemia; trancou |
| mar/2022–2023 | Engenharia mecânica no IFSP; as aulas de programação o trazem de volta para tecnologia |
| mai/2023–hoje | Dallas Motel (negócio da família — **não mencionar no site**; o site mostra só o trabalho dele lá): responsável técnico único. Landing page e cardápio digital (freela), depois o sistema de gestão offline-first que virou o **Dallas Sync**, SaaS por assinatura com o Dallas Motel como cliente |
| ago/2024–hoje | OMD do Brasil: três plataformas SaaS em produção (OMDfarm, Gestão Eco 360, OMD Collect), 31 empresas, 92 máquinas conectadas, consultas de BI de mais de 30 s para menos de 2 s, OMDfarm apresentado na Agrishow |
| hoje | Dallas Sync e Secret Boutique são produtos dele. Freela no sentido tradicional é só a LP do Dallas Motel. Eco360 é da OMD |

Números da OMD: usar os do LinkedIn (31 empresas, 92 máquinas, 30 s → <2 s). Confirmado pelo Felipe; substituem 87 máquinas / 40M pontos / 274 dias em todo o site, inclusive o card do OMDfarm e a linha de fonte atual.

Correções no conteúdo atual: o Eco360 sai de "freela"; o Dallas Sync passa a ser apresentado como produto por assinatura e relação de três anos com o cliente, não como projeto de escopo fechado.

Da árvore genealógica, só o nome de Vincenzo Leone vai para o site.

## Roteiro (as 7 cenas)

O fio condutor é a sensação de já ter conversado com o Felipe. Cada cena termina com a transição para a próxima.

1. **Abertura.** "FELIPE" em branco e "RODRIGUES" com o skyline de Campinas dentro das letras.
   - **Correção:** o canto do skyline no original tem só cerca de 1.300 px de largura, e uma tela 2x precisa de cerca de 2.900 px. Escolha do Felipe: ampliar só a região dos prédios com IA (Real-ESRGAN, local), registrada pixel a pixel sobre a foto da cena, sem mudar o enquadramento.
   - → A câmera mergulha pelo "I" de RODRIGUES. **Mantido.**
2. **Encontro.** Foto P&B em tela cheia no Patriani, com a cor revelada por um rastro líquido de borda afiada e parallax em duas camadas. Sem texto.
   - → A foto encolhe e vira um quadro de cantos arredondados. **Mantido.**
3. **História (linguagem Editorial).** O quadro desliza para a esquerda e fica fixo enquanto a linha do tempo passa na horizontal, conduzida pela rolagem.
   - **Capítulos:** Diamante e Vincenzo (foto livre de direitos, fácil de trocar pela dele depois) → OBA 2017 (selo discreto) → ETEC → IFSP → Dallas 2023: site, cardápio digital e o sistema de gestão que virou o Dallas Sync → OMD 2024 → "hoje".
   - **No celular:** a linha do tempo fica vertical, porque rolagem lateral presa à página não funciona bem com o dedo.
   - → Em "hoje", o quadro sai, a serifa some e o carrossel entra em P&B.
4. **Trabalho (linguagem Revelação).** Carrossel lateral estilo Lando, **arrastável** e não preso à rolagem, para não repetir a cena 3.
   - **Cards:** telas grandes de Dallas Sync (o primeiro a ganhar cor, porque fecha o último capítulo da história), Dallas Motel, Secret Boutique, OMDfarm e Eco360.
   - **Cor:** P&B; o card em foco ganha cor (hover no desktop, card central no celular).
   - **Texto de cada card:** o que resolveu, em linguagem de dono de negócio.
   - **Serviços:** a seção "Como posso te ajudar" deixa de existir sozinha. Cada card diz o tipo de trabalho (site, loja, sistema). *Decisão minha, ver "Decisões do construtor".*
   - → O último card se abre e vira a cena da prova.
5. **Prova.** OMD em números que contam com a rolagem: 31 empresas, 92 máquinas, 30 s → 2 s, Agrishow.
   - → Os números se apagam e entram os passos.
6. **Como funciona.** Conversa → Rascunho → Desenvolvimento → No ar, com uma linha que se desenha conforme a rolagem. Reaproveita o conteúdo de `process`.
   - → A linha termina no botão da cena final.
7. **Conversa.** Uma frase pessoal em serifa, o botão do WhatsApp, o convite de networking ("Dev, designer ou empreendedor?") e um rodapé discreto com LinkedIn, blog e copyright. Sai o FluidGlass do rodapé.

## Linguagem visual

- **Fontes:**
  - Space Grotesk é a base do site inteiro.
  - Instrument Serif aparece só na História (cena 3) e na frase final (cena 7): o site abre e fecha com a voz dele.
- **Fundo:** o escuro atual (`#050608`).
- **Cor com regra:**
  - Na História, um único acento: o azul do mar de Diamante (perto de `#9fc3d6`).
  - No Trabalho e depois dele, a única cor é a dos projetos revelados. Sem acento de UI.
- **Movimento:**
  - Peso e intenção, mais "engenharia bem-feita" do que "show de efeitos".
  - Sem entradas fade-and-slide genéricas em toda seção.
  - Todo o movimento vem da rolagem ou da mão do visitante.
- **Movimento reduzido:** com `prefers-reduced-motion`, as cenas viram layout estático legível. Sem fixar cena, sem rolagem suave, sem contagem.

## Abordagens consideradas

- **A. Manter o motor atual (`motion/react`, progresso derivado de `scrollY`) e usar Lenis.** Sem dependência nova e sem reescrita. Descartada: cada cena seria código de rolagem escrito à mão, e foi daí que vieram os bugs da hero (sticky quebrado por overflow, camadas presas pela ScrollTimeline, medidas erradas no resize).
- **B. GSAP com ScrollTrigger e Lenis. ESCOLHIDA pelo Felipe.**
  - **Motivo:** trocar código próprio por bibliotecas testadas, para evitar bugs de responsividade.
  - O ScrollTrigger cuida do pin com o espaçamento certo, do recálculo no resize e na rotação, e de `matchMedia` para cenas diferentes no celular e no desktop.
  - GSAP e os plugins são gratuitos.
- **C. Motor atual sem rolagem suave.** Mais leve, mas a cena lateral sente falta da inércia. Descartada.

**Decisão do Felipe:** padronizar tudo em B, **inclusive a hero**. Ela pode ser reescrita se for o necessário para padronizar.

## Decisões de como (já tomadas)

- **GSAP + ScrollTrigger:** toda animação ligada à rolagem (pins, scrubs, linha do tempo horizontal, contagem, linha do processo, transições entre cenas), hero incluída.
- **Lenis:** já está no projeto (`useSmoothScroll`, só desktop) e passa a ser integrada ao ticker do GSAP (`lenis.on('scroll', ScrollTrigger.update)` e `gsap.ticker`). No celular, rolagem nativa.
- **`motion/react`:** não é mais usado em animação ligada à rolagem. Pode ficar para interações pequenas e para o arrastar do carrossel, ou ser trocado pelo `Draggable`/`Observer` do GSAP. Ver "Decisões do construtor".
- **`LiquidReveal` (WebGL):** fica como está. Só muda quem informa o progresso e a câmera.
- **Testes:** a suíte vitest atual (155 testes) e o teste de paridade de chaves pt/en continuam passando. Textos novos entram nos dois idiomas.
- **Navegação:** as âncoras (`about`, `projects`, `process` etc.) se ajustam às cenas novas: "Sobre" leva à História, "Projetos" ao Trabalho.

## Decisões do construtor

- **Serviços:** dissolver "Como posso te ajudar" nos cards do carrossel, como proposto, ou manter uma faixa curta entre Prova e Como funciona.
- **Carrossel:** arrastar com `motion` ou com o GSAP `Draggable`/`InertiaPlugin`.
- **Itens a remover:**
  - Variante 2 da hero (`?hero=foto`, `HeroPhoto` e os assets `front-*`).
  - `AmbientOrbs` e o FluidGlass do rodapé.
  - `profile-320/448/640`, sem uso.
  - Componentes que o roteiro deixa órfãos: `Services`, `Credibility`, `Experience`, `TechMarquee` etc.
  - `Experience` e `TechMarquee` estão guardados para a versão de recrutador. Mover para uma pasta, não apagar.
- **`LatestWriting`:** entra na cena 7 como um link discreto para o blog, ou sai da home.
- **Foto de Diamante:** Wikimedia Commons ou Unsplash, licença livre, crédito no rodapé ou no `alt`, tratamento coerente com a História.
- **Telas dos projetos:** reaproveitar `dallas`, `secret` e `omdfarm` e as telas ilustrativas do `DallasSyncShowcase`. Faltam telas do Eco360.
- **Textos:**
  - Redigir pt e en.
  - Os do Felipe seguem a skill `writing-as-felipe`.
  - Fatos vêm da tabela acima ou do conteúdo já publicado no site (descrições e métricas atuais de `pt.json`/`en.json`, que o Felipe já aprovou). Nada inventado. *Decisão minha.*
- **Eco360 e OMDfarm no carrossel:** aparecem como "construí na OMD", não como serviço que ele vende. *Decisão minha.*
- **Hero, cena 1 → 2:** a transição sem corte é obrigatória, porque o Felipe rejeitou o corte entre duas fotos. O skyline em alta resolução precisa ser registrado pixel a pixel sobre a mesma foto. O master é `level.png` (4284×5712, já nivelado) e o original é `drive/look-left-sky.jpg`, ambos no scratchpad da sessão; copiar para `design-src/` (ignorado pelo git) antes de construir.

## Adendo (2026-11-24, pedido do Felipe)

O sobrenome **Leone** entra no nome da hero e em todo lugar onde o nome dele aparece (h1, aria-label, títulos). Preferência: o nome completo **FELIPE RODRIGUES LEONE**. Se não couber bem (desktop 1440×900 e celular 390×844), usar **FELIPE R. LEONE**. O mergulho da câmera continua por uma letra da linha que mostra a cidade.

## Adendo 2 (2026-11-24, retorno do Felipe)
- **Um estilo só, editorial em tudo.** Todos os títulos de seção (Trabalho, Prova, Processo, Conversa) em Instrument Serif, com o azul de Diamante (#9fc3d6) como único acento da página. O texto corrido segue no sans. O nome do hero continua em caixa alta pesada, porque é a peça de arquitetura da página. Isto substitui a divisão "Editorial para a história, Revelação para o trabalho".
- **Trabalho rola com o scroll do mouse.** No desktop a seção fica presa e os cards passam na horizontal conforme a rolagem; arrastar e as setas continuam. No celular, arrasto.
- **Rolagem menos sensível e história mais lenta.** O texto de cada capítulo precisa de tempo de leitura.
- **Imagens na história.** Cada capítulo ganha uma imagem: fotos com licença livre da Wikimedia Commons (Diamante, ETEC, IFSP, OBA), mostradas ao Felipe antes de entrar, e as telas dos projetos nos capítulos de trabalho (Dallas, OMD).
- **Skyline:** upscale com Real-ESRGAN autorizado.
- **OMD:** o site não conta que a vaga veio de uma conversa com o dono; o capítulo diz só que ele entrou em 2024 como desenvolvedor.
- **Skyline:** o Real-ESRGAN não recupera detalhe da névoa da foto original; o mergulho passou a partir dos prédios próximos, que são nítidos.
- **Imagens da história:** Diamante (Eugenio Magurno) e IFSP Sertãozinho (Panoramio), CC BY-SA 3.0, com crédito no rodapé. ETEC Idio Zucchi e OBA sem foto livre: um trecho de "Hello, world" e um desenho de órbitas.

## Adendo 3 (2026-11-25, retorno do Felipe)
- **Animações disparadas, não arrastadas.** Os números da OMD e o trilho do Processo tocam sozinhos, uma vez, quando a seção está bem visível; não acompanham a rolagem.
- **Uma tela por cena embaixo.** Prova, Processo e Conversa ocupam cada uma uma tela inteira no desktop; nunca aparecem duas ao mesmo tempo.
- **Cards 3D.** Os passos do Processo se levantam da página quando a linha chega, e cards de números, passos e projetos se inclinam na direção do ponteiro.
- **Projetos em movimento e com detalhes.** A imagem em foco se move devagar (e o Dallas Sync alterna entre duas telas reais, em modo treino); clicar abre os detalhes: o problema, o que foi feito, hoje, a stack e todas as telas. Base do Dallas Sync: `dallas-turborepo/docs/VISAO-PRODUTO.md` e README.

## Adendo 4 (2026-11-25 e 2026-11-26): jornada em capítulos

Pedido do Felipe em 2026-11-25: a home vira uma jornada em capítulos, com um único quadro persistente como fio condutor. Plano da fase 0 aprovado no artifact https://claude.ai/artifact/S5814wmGNEyW7UvrmbsU7q. Construída nos loops 017–047. **Este adendo descreve o estado atual e prevalece sobre o roteiro das 7 cenas acima.**

### Estrutura

- **Capítulos:** hero e história (`partida`) → Projetos (`destinos`) → Em uso (`telemetria`) → Como funciona (`plano`) → Fale comigo (`retorno`).
- **O quadro (`src/app/journey/`):** um único `JourneyFrame` fixo por baixo da página.
  - Cada cena registra *beats* com `registerBeats`, e o diretor (`director.ts`) calcula onde o quadro está (`frameAt`).
  - O conteúdo de cada beat vem de `contents.ts`.
  - As travessias: T1 do hero para a história, T2 para o caso aberto, T3 para Em uso, T4 para Como funciona e T5 para Fale comigo.
- **Modos (`useJourneyMode`):**
  - `scroll` no desktop;
  - `swipe` no celular;
  - `list` com movimento reduzido.
- **Luz ambiente (`AmbientLight`):** uma cor por capítulo, fixa atrás de tudo.
  - Cenários carregados por proximidade: o mapa topográfico gerado no Como funciona e as fotos de Diamante (CC BY-SA 3.0, Eugenio Magurno) atrás do Fale comigo.
- **Rolagem leve:**
  - Lenis com `lerp 0.1` e `wheelMultiplier 1`;
  - a página tem cerca de 17 telas;
  - os tamanhos das pistas estão em `SCROLL`, em `src/app/motion/tokens.ts`.

### Hero

- **Foto:** a do terraço em que o Felipe olha para a câmera (42EEEC6B, trocada em 2026-11-26).
- **Assets gerados dela:**
  - versões em cinza e em cor;
  - o recorte da pessoa (rembg `isnet-general-use`, rodado fora do projeto);
  - formatos largo (3400×2125) e alto (1800×2185).
- **Enquadramento:** o rosto e os cantos de partida da câmera estão em `components/hero/camera.ts`.
- **Dados das fotos:** sem EXIF e sem localização.

### História (trilho horizontal ao lado do retrato)

- **Capítulos:** OBA 2017 → ETEC 2020 → IFSP 2022 → Dallas Motel 2023 → OMD do Brasil 2024 → Hoje. O capítulo de origem (Diamante e Vincenzo) foi removido, e o texto de família não volta.
- **Foco e passado:** são geométricos. Um card passa a "passado" quando a borda esquerda dele chega ao retrato. O foco, a cor revelada e o fundo seguem o card logo ao lado do retrato, então a trilha abre na OBA.
- **Fundos:** cada capítulo tem um fundo com parallax (0,3 da velocidade dos cards) que se transforma no do próximo, num platô de peso `1,5 − 2·|i − at|`.
  - O véu escurece a faixa do texto, e o texto ganha um halo escuro.
- **Card e fundo de cada capítulo:**

| Capítulo | Card | Fundo |
|---|---|---|
| OBA | medalha de prata desenhada | sistema solar colorido |
| ETEC | o código `int main` | o terminal rodando o programa (`$ ./hello`, "Hello, world") |
| IFSP | foto da turma de engenharia mecânica com o carrinho de CDs, mais o logo do IFSP (domínio público) | o croqui do carrinho no caderno dele, com a tinta separada do papel |
| Dallas Motel | a tela do site | o hero do jrdallasmotel.com.br |
| OMD | a foto dele na OMD | o estande da OMD na Agrishow (foto dele) |
| Hoje | carrossel 3D com as telas reais do Dallas Sync, da Secret Boutique e do Dallas Motel: troca no hover, gira sozinho a cada 3,2 s e fica parado com movimento reduzido | a cidade vista do alto (foto dele, sem o letreiro do hotel) |

- **Créditos no rodapé:** só Diamante e o logo do IFSP.

### Projetos

- **Projetos:** Dallas Sync, Secret Boutique e Dallas Motel. OMDfarm e Eco360 saíram; a OMD fica só como capítulo da história.
- **A troca de projeto:**
  - a tela que sai recua girando para o fundo, à esquerda;
  - a folha de rosto do próximo (número, tipo e nome) vem do fundo, à direita, até a frente;
  - ela segura um instante e segue em direção a quem olha, abrindo na tela nova.
  - Só `transform` e `opacity`, ligados à rolagem.
- **Índice sobre o quadro:** "01 Dallas Sync · 02 Secret Boutique · 03 Dallas Motel", com o projeto atual aceso e uma barra de progresso.
- **Caso aberto:** clicar no quadro ou em "Ver detalhes" abre o caso em `/work/<slug>`. O build gera uma página estática por caso, com título e og próprios (`scripts/fan-out.mjs`).

### Motion dos projetos (`MotionShot`, `data/motion.ts`)

- **Como o vídeo é apresentado:**
  - a tela gravada fica num "mundo" de 1440×900;
  - a câmera inclina e aproxima nos gestos;
  - o cursor é desenhado a partir do caminho gravado, sem cursor real no vídeo;
  - há legendas, anel e pulso de clique;
  - o último quadro segura 1,2 s antes do loop.
- **Câmera:** uma cúbica monótona (Fritsch–Carlson) que passa por poucos pontos bem espaçados. Ela não para em cada ponto, nunca ultrapassa e segura parada só entre pontos iguais. O tempo é um relógio próprio, ancorado no vídeo.
- **Gravações (`scripts/capture/`):** Playwright com screencast via CDP, codificado em H.264 (e VP9 quando sai menor), com pôster.
  - **Dallas Sync:** organização de demonstração local, em modo treino, com seed fictícia. O card avisa que a tela é ilustrativa.
  - **Secret Boutique:** a tela inicial, o carrossel de destaques, o catálogo e um produto no carrinho. Sem checkout.
  - **Dallas Motel:** do hero para baixo, passando pelas suítes (com o clique em Fim de semana), pelo legado e pelo cardápio.
  - Os dois sites são gravados em produção só para leitura, com toda requisição que não é GET abortada.

### Regras que continuam

- **Conteúdo:** nada de número, depoimento, logo ou cliente inventado, nem foto de banco passando por foto dele.
- **Dados de cliente:** nenhum dado real de cliente nos vídeos.
- **Produção:** nunca concluir pagamento nem usar credencial de produção.
- **Animação:** só `transform`, `opacity`, `filter` e `clip-path`.
- **Movimento reduzido:** o site continua legível.
- **Clichês espaciais:** nenhum (foguete, astronauta e afins).
- **Deploy:** nunca.

## Adendo 5 (2026-11-26): Cormorant Garamond e o blog editorial

- **Tipografia.** Felipe comparou seis pares serifados numa prévia (https://claude.ai/artifact/GihAbtWNMxYSqpVPdRGsmf) e escolheu Cormorant Garamond, com a densidade da Fraunces. Ela substitui a Instrument Serif em todos os títulos da jornada e do blog. Tokens em `src/styles/journey.css`: peso 500 nos títulos e 600 nos subtítulos, espaçamento -0,035em e -0,02em (medido contra a Fraunces, entre 2,3% e 5%), escala 1,1 porque o x dela é mais baixo. Contadores e anos usam algarismos alinhados. Todo texto em serifa foi medido antes e depois em 1440, 1280 e 390 px: nenhuma linha a mais e nada passando da caixa. O texto corrido do portfólio segue no sans.
- **Blog.** O papel claro da tela de detalhes, com tema escuro (a noite da jornada) que segue o sistema e guarda a escolha do leitor. Índice como lista de leitura; artigo em uma coluna, com o sumário fixo ao lado e o texto em EB Garamond. O dev renderiza `/blog` como o build (`plugins/vite-plugin-posts.mjs`). A galáxia e o menu antigo saíram do blog.
