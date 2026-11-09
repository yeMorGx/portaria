# DESIGN.md

Status: APROVADO em 2026-11-09
Modo: redesign completo
Referências: `REFERENCIAS.md` (6 aprovadas em 2026-11-09)

## Produto
- Público: porteiros (uso diário, rápido, em computador de portaria) e síndicos/administradoras (decidem a compra).
- Objetivo: registrar encomenda em segundos; demonstrar qualidade na venda.
- Tom e marca: confiável, ágil e moderno; passa seriedade a síndicos e administradoras.
- O que evitar: efeitos que atrasem o registro, visual infantil, contraste baixo, cara de template genérico, gradiente roxo-azul padrão, emoji como ícone.

## Estado atual (extraído do código)
- Telas: login, início (lista por dia), escolha, foto (câmera/arquivo), leitura de código, "lendo" (varredura), conferência.
- Componentes: `Botao`, `Marca`, `Cabecalho`, `Aviso`, `EstadoVazio`, ícones SVG próprios.
- Tokens: fundo `#f4f6f4`, acento verde `#0d5a4a`, Public Sans Variable, raios 12 a 16 px.

## Diagnóstico contra a lista "Proibido" da skill
| Item | Situação | Prioridade |
|---|---|---|
| Controle nativo sem estilo | `<select>` de morador é nativo | Alta |
| Escolha de morador | busca + select separados; deveria ser um combobox único | Alta |
| Camadas de superfície | só 2 níveis (fundo e cartão) | Média |
| Par tipográfico | só Public Sans | Média |
| Carregando/erro | "Carregando…" em texto; erro sem "tentar de novo" | Média |
| Layout em desktop | coluna única estreita em tela de 1440 px | Média |
| Ícones | autorais, sem biblioteca única | Baixa |
| Contraste, toque, movimento reduzido | ok | — |

## Estilo
- Estilo: Bento grid (aprovado)
- Paleta: off-white + índigo como único acento (aprovado)
- Tipografia: Geist (títulos e texto) + Geist Mono (números, horas, código lido) (aprovado)
- Densidade: confortável (alvos grandes)
- Animação: expressiva (aprovado), sempre com `prefers-reduced-motion`

## Tokens
**Cores (claro).** Quatro níveis de superfície, mais luminosos conforme sobem:
| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#F4F4F0` | fundo da página (off-white quente) |
| `--surface-1` | `#FFFFFF` | tile/cartão |
| `--surface-2` | `#EEEEF4` | bloco interno, campo, chip |
| `--surface-3` | `#E3E4EE` | hover de bloco interno, trilho |
| `--overlay` | `#FFFFFF` + sombra | lista aberta do combobox, toast |
| `--text` | `#15152B` | texto principal (contraste ≥ 15:1) |
| `--text-2` | `#575772` | texto secundário (contraste ≥ 5,5:1 no `--bg`) |
| `--border` | `#15152B` a 10% | borda de 1 px dos tiles |
| `--accent` | `#4338CA` | índigo; ação primária, foco, marcas "+" |
| `--accent-strong` | `#3730A3` | hover/pressed da ação primária |
| `--accent-soft` | `#E7E6FA` | fundo de seleção, tile destacado leve |
| `--on-accent` | `#FFFFFF` | texto sobre índigo (contraste 8,4:1) |
| `--success` | `#137A4B` | salvo |
| `--warning` | `#8F5A00` | morador não identificado |
| `--danger` | `#B42318` | erro |

**Cores (escuro, automático).** `--bg #0C0C14`, `--surface-1 #14141F`, `--surface-2 #1C1C2A`, `--surface-3 #262637` (cada nível 4 a 8% mais claro), `--text #EEEEF6`, `--text-2 #A2A2BC`, `--accent #8B84F5`, `--on-accent #0C0C1F`.

**Tipografia.** Display e texto: Geist (variável, pesos 400, 500, 600). Mono: Geist Mono (números de apartamento, horas, código lido, rótulos de 12 px). Escala: 12, 14, 16, 20, 24, 32, 48, 72. Títulos de tela 32/36, tile principal 48/48, número do apartamento 72/72 em mono. Tracking dos títulos: −2% (48 em diante), −1% (24 a 32). Corpo 16/24; rótulos 12/16 em mono com tracking +2%. Medida de texto até 65 caracteres.

**Espaçamento.** Base 4: 4, 8, 12, 16, 24, 32, 48, 64. Intervalo (gap) do bento 16 px (24 em telas ≥ 1280 px). Padding interno dos tiles 24 px.

**Raio.** 8 px (campos e botões pequenos), 12 px (botões grandes e chips), 20 px (tiles do bento), 9999 px (chips de transportadora e pílulas de hover).

**Sombra.** Tonal, sem halo: tiles sem sombra (só borda de 1 px); overlay `0 8px 24px -8px rgb(21 21 43 / .18), 0 1px 2px rgb(21 21 43 / .08)`; botão primário `0 1px 2px rgb(21 21 43 / .2), 0 8px 16px -8px rgb(67 56 202 / .6)`.

**Movimento.** Durações 120 ms (hover), 200 ms (troca de estado), 360 ms (entrada de tile), 600 ms (momentos principais). Easing `cubic-bezier(0.16, 1, 0.3, 1)` (saída exponencial); `cubic-bezier(0.4, 0, 0.2, 1)` para saída de tela. Só `transform`, `opacity` e `filter: blur`.

## Plano

### Telas e seções
Todas com grade de 12 colunas, largura máxima 1200 px, centralizada. No celular os tiles empilham numa coluna (como no DeepBook), com alvos de 44 px ou mais.

1. **Login.** Um tile central com a marca, e-mail, senha e botão primário. Erro e carregando no próprio botão.
2. **Início (bento).** Três tiles:
   - **Nova Encomenda** (grande, índigo sólido, rótulo mono "NOVO" em vez de eyebrow, marcas "+" nos cantos): é a única ação primária da tela.
   - **Hoje** (pequeno): número grande em mono com quantas encomendas chegaram hoje (calculado da própria lista, sem dado novo) e "ontem" em cinza.
   - **Lista de encomendas** (largo): agrupada por dia, hora em mono alinhada à direita, linha fina de 1 px entre itens (padrão Grids), miniatura da etiqueta ou ícone, nome, apartamento e transportadora.
   - Estados: esqueleto com a forma da lista ao carregar; vazio com ilustração, título, uma linha e a ação; erro com mensagem, causa e "Tentar de novo".
3. **Nova Encomenda: escolha.** Dois tiles de pesos diferentes: **Fotografar etiqueta** (grande, índigo, primário) e **Escanear código** (menor, superfície 1, secundário). Rótulo numerado "1 de 3" para mostrar progresso.
4. **Câmera / leitura de código.** Moldura da câmera com cantos em "+" e uma linha guia; botão **Fotografar** primário; **Enviar arquivo** secundário; "Voltar" em ghost. Para código, campo de código digitado ao lado.
5. **Lendo etiqueta** (momento principal, 600 ms+): a foto aparece com linha de varredura, e o texto reconhecido entra palavra por palavra em mono; ao final o morador "se encaixa" no tile seguinte. Rótulo "2 de 3".
6. **Conferência (bento).** Quatro tiles em grade: **Foto** (tile alto à esquerda), **Morador** (combobox pesquisável, ver componentes), **Apartamento** (número em mono 72 px, preenchido pelo morador), **Transportadora** (chips selecionáveis das mais comuns mais "Outra"), e **Salvar Encomenda** (primário, largo, no fim). Faixa de status: "Morador identificado" (índigo suave) ou "Selecione o morador" (aviso). Rótulo "3 de 3".
7. **Sucesso.** Ao salvar, o tile da lista recebe a nova linha com destaque que se desfaz em 900 ms e um aviso discreto "Encomenda salva". Sem tela intermediária.
8. **Carregamento inicial.** Uma só vez ao abrir o app: marca com preenchimento e contador curto (referência Justin Jefferson), até 1 s, e some assim que os dados chegam.

### Componentes e de onde vêm
Máximo de duas bibliotecas de componentes.
| Componente | Origem |
|---|---|
| Combobox de morador (busca, teclado, leitor de tela) | **shadcn/ui** (Radix Popover + cmdk `Command`), estilizado |
| Chips de transportadora | shadcn/ui `ToggleGroup` (Radix) |
| Aviso de sucesso e erro | shadcn/ui `Sonner` (toast) |
| Skeleton, botão, campo, tile | shadcn/ui base, restilizado com os tokens acima |
| Ícones | **Lucide** (`lucide-react`), um só traço de 1,75 px; substitui os SVGs autorais atuais |
| Marcas "+" nos cantos, tile bento, linha de varredura | componentes próprios, inspirados em DeepBook e Linear (princípios, sem copiar código) |
Registrar a origem de cada um no `RELATORIO.md`.

### Bibliotecas
- **Motion** (ex-Framer Motion): entrada escalonada dos tiles, troca de tela (`AnimatePresence`), layout animado da lista e do tile de conferência.
- **Sem GSAP e sem Lenis:** o app não tem rolagem narrativa; Lenis é só para sites e landing.
- **Fontes:** `@fontsource-variable/geist` e `@fontsource-variable/geist-mono`, instaladas no projeto (sem CDN).
- Versões fixadas no `package.json`.

### Onde entra animação (propósito de cada uma)
| Momento | Efeito | Pergunta que responde |
|---|---|---|
| Abertura do app | marca preenche + contador, até 1 s | orienta: o app está carregando |
| Tiles do início e da conferência | entrada escalonada 40 ms entre tiles, 360 ms, de baixo para cima com opacidade | cria hierarquia: a ação primária chega primeiro |
| Título de tela | entra desfocado e fica nítido (Linear), 600 ms | dá identidade ao ponto de partida |
| Troca de tela | deslize curto 16 px + opacidade, 200 ms, mantendo o botão primário no mesmo lugar | orienta: avançou ou voltou |
| Leitura da etiqueta | linha de varredura e texto reconhecido entrando | feedback: o sistema está lendo |
| Morador identificado | tile do morador pulsa o contorno em índigo uma vez | feedback: achou |
| Salvar | linha nova entra e destaca, aviso de sucesso | feedback: gravou |
| Hover de botões e itens | fundo em pílula translúcida, 120 ms | feedback: é clicável |
Tudo desligado ou reduzido a fade de 120 ms com `prefers-reduced-motion`.

### O que não muda
Fluxo de 3 passos, textos dos botões principais ("Nova Encomenda", "Fotografar etiqueta", "Escanear código", "Salvar Encomenda"), `data-testid` (`lista`, `apto`, `arquivo-foto`, `video-foto`), contrato com o Supabase (`src/lib/data.ts`), parser e OCR. Só a camada visual muda.

### Execução (Construção, depois da aprovação)
1. Tokens, fontes e componentes base (botão, tile, campo, chip, combobox, toast, skeleton).
2. Telas na ordem do fluxo: Início, Escolha, Câmera/Código, Lendo, Conferência, Login, Carregamento.
3. Verificação: build, lint, testes (unitários e Playwright, atualizando só textos que mudarem), capturas em 1440 e 390 px, crítica contra "Proibido" e leis de UX, no mínimo 2 rodadas.
4. Entrega: `RELATORIO.md` e capturas em `.design/screens/`.
Commits pequenos, por tela, em uma branch própria.

## Suposições
Nenhuma pendente. Ponto para o usuário decidir: o tile **"Hoje"** (contador) é novo em relação à spec original, que pedia só o botão e a lista. Ele só lê dados que já existem.
