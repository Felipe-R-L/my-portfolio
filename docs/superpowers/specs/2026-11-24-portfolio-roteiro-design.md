# Portfolio: roteiro de cenas e transições

Data: 2026-11-24 · Branch: `freela-networking` · Status: aguardando aprovação

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
