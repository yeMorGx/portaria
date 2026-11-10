# REFERENCIAS.md (site de apresentação)

Status: APROVADO em 2026-11-10

Pesquisa nova em 2026-11-10, a pedido do usuário. Foco: rolagem narrativa e landing de produto.
- **Prêmio:** conferido na página de cada site no Awwwards (título "SOTD" e data). Todos estão também na lista de Sites of the Month.
- **Site real:** aberto pelo **Visit Site**.
- **Análise:** `.design/analisar-completo.mjs` (Edge automatizado): carregamento em 0,5 s, 2 s e 6 s, rolagem em até 24 passos, hover em 6 elementos, celular em 390 px, e fontes, cores e bibliotecas lidas do código. Capturas em `.design/refs/<nome>/`.
- **Descartado:** Navigate (nvg8.io), que respondeu com erro 525 do Cloudflare (site fora do ar).

| # | Nome | URL | Prêmio | Por que entra |
|---|---|---|---|---|
| 1 | Terminal Industries | https://terminal-industries.com/ | Site of the Day, 3 set 2025 | Logística, o tema mais próximo do nosso; vende operação com cinema |
| 2 | Kriss.ai | https://kriss.ai/ | Site of the Day, 24 out 2024 | Um prédio em 3D cujos ambientes são as funções do produto; lembra um condomínio |
| 3 | Oryzo AI | https://oryzo.ai/ | Site of the Day, 13 abr 2026 | Um objeto só, contado em cenas de rolagem; ritmo e tipografia gigante |
| 4 | Anime.js | https://animejs.com/ | Site of the Day, 6 mai 2025 | Cada recurso é uma cena animada dentro de um mesmo palco |
| 5 | Dropbox Brand | https://brand.dropbox.com/ | Site of the Day, 12 fev 2025 | Grade bento colorida que se monta na rolagem |

## 1. Terminal Industries (logística, cinema e produto)
**Medido:** página de 15.766 px; Lenis (inércia confirmada); 1 canvas, 4 vídeos. Fontes **Suisse Intl** e **Geist Mono** (a mesma mono do nosso app). Títulos de 70 a 82 px, tracking −3,6 px (−5%); rótulos em Geist Mono 11 px, peso 600, tracking 18%, em caixa alta. Hover do menu: branco para verde-limão `rgb(171,255,2)`.

**Estrutura vista rolando (24 quadros):**
1. Carregamento claro com o logo, depois **vídeo em tela cheia** de um caminhão ao pôr do sol.
2. Rolando, o vídeo vira **vista aérea do pátio** e o caminhão **se transforma em wireframe** (linhas azuis) sobre fundo preto. É o produto "enxergando" a operação.
3. Logos de clientes em grade com linhas finas.
4. Três cartões de entrada ("Fix one yard problem today", "I have a few yards", "I run a network").
5. **Calculadora interativa** ("What's your yard costing you?") com resultado em painel verde-escuro.
6. "Introducing the Terminal Yard Operating System": seções em duas colunas, texto à esquerda e **cena escura com o pátio em wireframe** à direita; o texto ainda não lido aparece esmaecido e acende ao chegar.
7. Carrossel de módulos em cartões grandes, depoimento sobre foto noturna, formulário de contato verde-escuro e perguntas frequentes.

**Celular:** sem rolagem horizontal.
**Aproveitar:** (a) a **transformação de real para "visto pelo sistema"** (foto que vira wireframe), que para nós é a etiqueta virando dados; (b) texto que acende conforme a leitura; (c) rótulos mono em caixa alta; (d) um único acento vivo no hover.
**Evitar:** calculadora com números inventados; vídeo pesado.

## 2. Kriss.ai (prédio que conta o produto)
**Medido:** a página tem só 900 px: a rolagem é capturada por uma **cena 3D em canvas**. Fonte própria Krissai (400 e 600). Menu com opacidade 0,6 que vai a 1 no hover.

**Estrutura vista:**
1. Carregamento com **porcentagem gigante** no canto (1 %, 100 %).
2. Hero "Hi, I'm Kriss." centralizado, botão com **cantos em colchete**.
3. A rolagem **entra num prédio em corte** (3D, cores pastel): cada andar ou sala é uma função ("Front Desk", "Patient Consultation"), com um cartão lateral de título, texto, lista de benefícios e botão.

**Celular:** sem rolagem horizontal.
**Aproveitar:** (a) a **metáfora do prédio em corte**, que no nosso caso é o condomínio, com a encomenda indo da portaria ao apartamento; (b) cada ambiente sendo uma função; (c) colchetes nos cantos, que já usamos no visor da câmera.
**Evitar:** sequestrar a rolagem inteira (prejudica acessibilidade e celular); 3D pesado sem alternativa.

## 3. Oryzo AI (um objeto, várias cenas)
**Medido:** página de 56.691 px (rolagem muito longa); inércia confirmada; 6 canvas, 2 vídeos. Fontes **Halyard Display** e **Halyard Text** (variáveis), **Literata** (serifada) e **DM Mono**. h1 de 123 px, entrelinha 0,9, tracking −2,2 px. Texto creme `rgb(255,237,215)` sobre marrom quase preto.

**Estrutura vista rolando (24 quadros):**
1. Carregamento: o objeto aparece como **desenho técnico vetorial** (pontos de controle) que se preenche e vira foto real sobre uma mesa de corte.
2. "ISN'T JUST A COASTER.": o objeto **gira no centro** a cada passo de rolagem, com texto fixo dos dois lados.
3. "Powered by AI" escrito com **desfoque que fica nítido** letra por letra; uma mão entra por baixo e segura o objeto.

**Celular:** sem rolagem horizontal.
**Aproveitar:** (a) **um objeto protagonista** girando com a rolagem, que no nosso caso é a caixa ou a etiqueta; (b) desenho técnico que vira objeto real; (c) título que surge desfocado.
**Evitar:** 56 mil px de rolagem; ironia que não cabe para síndico.

## 4. Anime.js (palco único, recursos em cenas)
**Medido:** página de 21.142 px; inércia; 6 canvas, 110 SVGs. Fonte **DIN** (títulos de 64 px, peso 700) e mono. Fundo `rgb(37,36,35)`, texto `rgb(246,244,242)`. Hover do menu: cinza para quase branco.

**Estrutura vista rolando (24 quadros):**
1. Hero: um **anel multicolorido** com uma forma vermelha que muda (onda, losango) no centro.
2. Uma peça mecânica em 3D que vira **desenho técnico** em fundo claro, com rótulos ligados por linhas.
3. Cada recurso ("Intuitive API", "SVG toolset", "Springs", "Responsive") é uma **cena no mesmo anel central**, com título colorido, lista e trecho de código ao lado.

**Celular:** sem rolagem horizontal.
**Aproveitar:** (a) **um palco fixo** onde cada cena troca o conteúdo, que no nosso caso é a tela do celular do porteiro mostrando cada passo; (b) cor por recurso; (c) rótulos ligados por linhas.
**Evitar:** paleta muito colorida, que foge do índigo.

## 5. Dropbox Brand (bento que se monta)
**Medido:** página curta (2.700 px); Webflow; fonte **Atlas Grotesk** 14 px e **Sharp Grotesk** variável. Banner de cookies cobriu parte das capturas.

**Estrutura vista rolando:**
1. Carregamento com o logo **desenhado em linhas** que se completam.
2. Texto curto em azul sobre grade de linhas finas.
3. Blocos coloridos **entram e se encaixam** até formar um **bento** ("Framework", "Voice & Tone", "Logo", "Typography", "Color", "Iconography", "Imagery", "Motion"), cada um com um ícone grande.

**Aproveitar:** (a) o **bento que se monta na rolagem**, que casa com o bento do nosso app; (b) logo desenhado em linhas.
**Evitar:** muitas cores; página sem narrativa.

## O que as referências têm em comum, e como vira o nosso site
- **Objeto ou palco protagonista** (Oryzo, Anime.js, Kriss): o **celular com o app** é o palco, e a **caixa com etiqueta** é o objeto.
- **Real que vira dado** (Terminal): a foto da etiqueta se transforma no cartão do pedido com logos.
- **Narrativa por ambientes** (Kriss): a encomenda percorre o condomínio, da portaria à porta do apartamento.
- **Texto que acende e título que surge desfocado** (Terminal, Oryzo).
- **Bento que se monta** (Dropbox), igual ao app.
- **Rótulos mono em caixa alta** (Terminal usa Geist Mono, a nossa).

## Limites honestos
- Kriss.ai prende a rolagem numa cena 3D; o script só registrou 4 quadros, então não vi todos os ambientes.
- Hover medido só no menu; não testei hover nos cartões.
- Não medi desempenho nem acessibilidade.
- Não copio código, textos, imagens nem identidade; só princípios.
