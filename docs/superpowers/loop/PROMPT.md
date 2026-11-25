# Loop de construção: construtor cego e crítico com prints

Uso: `/ralph-loop "$(cat docs/superpowers/loop/PROMPT.md)" --max-iterations 30 --completion-promise "ROTEIRO PRONTO"`

O mesmo texto volta a cada iteração. A memória entre iterações vive só em arquivos, listados abaixo.

---

Você está construindo o portfolio descrito em `docs/superpowers/specs/2026-11-24-portfolio-roteiro-design.md`, seguindo o plano em `docs/superpowers/plans/2026-11-24-portfolio-roteiro.md`. Trabalhe em `/home/felipe/Code/my-portfolio`, na branch `freela-networking`.

## Arquivos do loop (`.loop/`, ignorado pelo git)

| Caminho | Quem escreve | Quem lê |
|---|---|---|
| `.loop/state.json` | construtor | todos. Campos: iteração atual, passo do plano em andamento, `clean_streak`, `history` (a lista de rodadas do crítico, com a contagem de marcas de cada uma) |
| `.loop/shots/NNN/*.png` | script de captura | crítico |
| `.loop/inbox/NNN/*.png` | crítico, via `mark` | **construtor: só estas imagens** |
| `.loop/notes/NNN.md` | crítico | **nunca o construtor.** Só o crítico da rodada seguinte, o auditor humano e a condição de parada |

**Regra de ouro: o construtor nunca abre `.loop/notes/`.** Não lê, não lista, não faz grep. O feedback chega como imagem: um retângulo vermelho, sem texto, em volta de cada defeito. Ver o que está errado e deduzir o porquê faz parte do trabalho.

## Uma iteração

### 1. Ler o estado
- Leia `.loop/state.json`. Se não existir, crie-o com `{"iteration":0,"step":1,"clean_streak":0,"history":[]}`.
- Incremente `iteration`. Ele vira o `NNN` desta rodada, com três dígitos.

### 2. Corrigir o que o crítico marcou
- Se existir `.loop/inbox/<NNN-1>/`, abra cada PNG com a ferramenta Read e olhe.
- Cada retângulo vermelho é um defeito. Compare o que está dentro dele com a spec e com o craft floor do impeccable, descubra o problema e corrija na causa, não no sintoma.
- Se um retângulo for ambíguo, corrija a hipótese mais provável e siga em frente.
- Não peça a explicação.

### 3. Avançar o plano
- Se a inbox estava vazia **e** o passo atual está completo, passe para o próximo passo do plano.
- Construa um passo inteiro por iteração.
- Você pode delegar até 4 subagentes por iteração em tarefas independentes.
- O código deles passa por você: rode, olhe e recuse o que estiver errado antes de seguir.

### 4. Portões técnicos (obrigatórios, sem pular)
Rode:
```
bash scripts/loop/gate.sh
```
- O script roda testes, build e detector do impeccable. O detector só reprova achados **novos**; os anteriores ao loop estão em `scripts/loop/detector-baseline.txt`. Essa lista só pode diminuir, nunca crescer.
- Se algum falhar, corrija e rode de novo antes de capturar.
- Depois de `pnpm add`, reinicie o dev server com `--force`, senão a página fica em branco (504 Outdated Optimize Dep).
- Teste vermelho não vai para o crítico.

### 5. Capturar
- Suba o dev server, se não estiver no ar: `pnpm dev --port 5199`.
- Rode `node scripts/loop/shoot.mjs .loop/shots/<NNN>`.
- O script tira prints em dois tamanhos de tela:
  - desktop, 1440×900;
  - celular, 390×844.
- Os prints cobrem as posições de rolagem fixas de cada cena:
  - início, meio e fim de cada pin;
  - o carrossel arrastado;
  - `prefers-reduced-motion`.
- O nome de cada arquivo diz a cena e a posição, por exemplo `d-03-historia-50.png`.

### 6. Chamar o crítico
Use um subagente **novo**, sem o contexto desta conversa, do tipo `impeccable:impeccable-finish-reviewer` ou `general-purpose`, com este pedido:

> Você é um diretor de arte exigente, de agência premiada, revisando um site antes do lançamento. Leia a spec `docs/superpowers/specs/2026-11-24-portfolio-roteiro-design.md` (em especial Anti-objetivos e Linguagem visual) e `.loop/notes/<NNN-1>.md`, se existir, para checar se os defeitos anteriores foram corrigidos ou voltaram. Olhe cada PNG em `.loop/shots/<NNN>/`.
>
> Para cada defeito material, escreva uma linha em `.loop/notes/<NNN>.md`: arquivo, retângulo em pixels (x,y,w,h), gravidade (bloqueia / importante / detalhe) e a explicação.
>
> Conta como defeito material:
> - legibilidade e contraste;
> - corte, sobreposição ou estouro de layout;
> - pixelização;
> - quebra de continuidade entre as cenas;
> - desvio da spec ou de um anti-objetivo;
> - ritmo e alinhamento;
> - inconsistência entre o desktop e o celular;
> - texto inventado ou com jargão.
>
> Não marque gosto pessoal que contradiga a spec.
>
> Depois rode `python3 scripts/loop/mark.py .loop/notes/<NNN>.md .loop/shots/<NNN> .loop/inbox/<NNN>`. O script copia para a inbox só os prints com defeito e desenha retângulos vermelhos, sem texto.
>
> Responda só com a contagem: `bloqueia=N importante=N detalhe=N`.

### 7. Registrar e decidir
- Acrescente a contagem a `state.history`.
- **Toda marca é corrigida na próxima iteração**, inclusive os detalhes. A gravidade serve para auditar e para a parada, não para escolher o que corrigir.
- `clean_streak`:
  - zero marcas → `clean_streak += 1`;
  - qualquer marca → volta para 0.
- **Parada:**
  - todos os passos do plano feitos;
  - `clean_streak >= 2`, ou seja, duas rodadas seguidas sem marca;
  - portões verdes.

  Só então escreva `<promise>ROTEIRO PRONTO</promise>`.
- Se o mesmo retângulo, na mesma área e no mesmo arquivo, voltar 3 iterações seguidas, pare de insistir. Anote `stuck` em `state.json`, passe para o próximo passo e deixe o caso para revisão humana.

### 8. Commit
- Faça um commit por iteração com uma mensagem curta: `loop NNN: <passo>`.
- Termine a mensagem com as linhas de atribuição da sessão.
- Nunca dê push.

## Proibido
- Ler `.loop/notes/`, em qualquer forma, sendo o construtor.
- Ajustar o crítico, o `mark.py` ou o `shoot.mjs` para ele marcar menos.
- Pular portões, desativar testes, silenciar o detector sem justificativa registrada.
- Escrever a promessa de conclusão sem que ela seja verdadeira.
