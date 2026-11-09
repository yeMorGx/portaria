# REFERENCIAS.md

Status: APROVADO em 2026-11-09 (as 6 referências: 4 do Awwwards e Intercom e Linear de interface de produto).

Pesquisa feita em 2026-11-09. Cada prêmio foi conferido na página do Awwwards e o site real foi aberto pelo **Visit Site**.

**Método da segunda rodada (análise completa):**
- **DeepBook e Justin Jefferson:** script `.design/analisar-completo.mjs` (Edge automatizado, versão ampliada de `scripts/analisar-site.mjs` da skill). Capturou o carregamento em 0,5 s, 2 s e 6 s, rolou em 19 e 24 passos, testou hover em 6 elementos, abriu em 390 px com toque, e leu fontes, cores, variáveis CSS e bibliotecas. Capturas em `.design/refs/<nome>/`.
- **FORMAT e Grids:** o Edge automatizado recebeu **403** desses dois sites. Refiz no Chrome real, com rolagem em passos curtos, hover, e leitura de estilos por JavaScript na página. Não consegui rodar a versão de celular desses dois.

| # | Nome | URL | Origem | Prêmio | O que aproveitar | O que evitar | Tecnologias |
|---|---|---|---|---|---|---|---|
| 1 | DeepBook | https://deepbook-v2-wip.webflow.io/ | Awwwards vencedor | Site of the Day, 3 nov 2026 | Ver detalhe abaixo | Fundo preto e tom cripto | Webflow, GSAP, ScrollTrigger, Lenis, Lottie |
| 2 | Justin Jefferson | https://jjettas.com | Awwwards vencedor | Site of the Day, 7 nov 2026 | Ver detalhe abaixo | Vídeo e imagem pesados | Lenis, canvas (6), vídeo, Lottie SVG |
| 3 | FORMAT (Obys e DES) | https://format.obys.agency/ | Awwwards vencedor | Site of the Day, 19 out 2026 | Ver detalhe abaixo | Contraste cinza sobre cinza | Lenis, fonte própria Obys Sans |
| 4 | Grids S03 (Obys e DES) | https://grids03.obys.agency/ | Awwwards vencedor | Site of the Day, 2 nov 2026 | Ver detalhe abaixo | Título sobre a lista | Lenis, WebGL (1 canvas), vídeo, Obys Sans |
| 5 | Intercom | https://www.intercom.com/ | Land-book (feed de landing pages) | Sem prêmio (galeria curada) | Ver detalhe abaixo | Rolagem longa de marketing | HTML/CSS próprio, sem GSAP/Lenis detectados |
| 6 | Linear | https://linear.app/ | Escolha direta (site de produto de referência) | Sem prêmio | Ver detalhe abaixo | Tema escuro total | HTML/CSS próprio, inércia de rolagem detectada |

Mínimo: 5 referências, sendo 3 vencedoras abertas pelo Visit Site. Cumprido: 4 vencedoras do Awwwards (aprovadas) e 2 de interface de produto (5 e 6, aguardando aprovação).

**Papel de cada fonte (orientação do usuário):** o Awwwards serve para ver sites cinematográficos e com storytelling (entrada, ritmo, transições, momentos de impacto). Para a interface do produto em si (bento, listas, formulários), usei outras fontes: a galeria Land-book e um site de produto aberto diretamente.

## 1. DeepBook (bento, o mais próximo do que queremos)

**Medido no código:** altura de página 11.203 px. Fontes TWK Everett (400 e 500) e Inter (300 a 700). Fundo `#000`, texto branco, acento azul `rgb(30,110,243)` (`#1E6EF3`), botão com raio de 4 px. h1 81 px, entrelinha 81 px (1,0), tracking −2%; h2 40 px, tracking −3%; texto 18 px. Variáveis CSS organizadas em níveis: `--_colors---text--primary/secondary/tertiary` (branco 100%, 50%, 40%) e escala tipográfica h1 5,125 em, h2 3,5 em, h3 3 em, h4 2,5 em. Rolagem com inércia confirmada (Lenis): 600 px de roda terminaram em 259 px aos 60 ms e 600 px aos 1,2 s.

**Estrutura vista rolando (19 quadros):**
1. Hero: título grande centralizado sobre um padrão de barras verticais que ondula (canvas), dois botões (azul sólido e branco).
2. **Bento fixo na tela (pinned):** dois painéis lado a lado com bordas finas. Esquerda: painel azul sólido com rótulo pequeno no topo ("The Sui finance Stack"), frase grande no centro e, embaixo, uma barra segmentada de capítulos. Direita: painel preto de pontos com um objeto isométrico azul e branco sobre quadrado branco. Ao rolar, a frase e o objeto trocam em 5 capítulos ("Spot. Margin. Predict." → "Three primitives…" → "Everything you need…" → "Combine them…" → "Whether you're building or trading…").
3. Dois blocos "Builders" e "Traders" em cartões escuros com ícone, título e lista de benefícios com botão.
4. Título gigante "Who's Building On DeepBook" com ilustração isométrica abaixo.
5. **Faixa de 4 números** em células lado a lado, cada uma de uma cor (azul, preto, cinza, branco) com número grande e rótulo pequeno e marcas "+" nos cantos.
6. "Battle-Tested Security" em fundo branco, com ilustração.
7. Rodapé azul com colunas de links pequenas e a marca DeepBook gigante cortada embaixo.

**Celular (390 px):** a faixa de aviso vira texto em rolagem contínua; a navegação vira logo + botão "Docs" + ícone de menu de 4 pontos; hero em coluna; **o bento empilha** (painel azul em cima, ilustração embaixo) e mantém a barra de capítulos e os "+". Sem rolagem horizontal.

**Hover:** nenhuma das 6 áreas testadas mudou cor, fundo, transformação ou opacidade em 500 ms. Não consegui ver feedback de hover nesse site. Não vou afirmar que ele existe.

**Aproveitar:** (a) painel de ação grande em cor sólida do acento ao lado de painel neutro; (b) capítulos numerados por barra segmentada; (c) marcas "+" nos cantos; (d) faixa de números em células de cores diferentes; (e) bordas de 1 px em vez de sombras; (f) texto secundário em branco 50%.
**Evitar:** fundo preto total, ilustrações isométricas, tom de cripto, entrada por rolagem fixa (o app não rola).

## 2. Justin Jefferson (ritmo e entrada)

**Medido:** altura 17.158 px; Lenis; 6 canvas, 1 vídeo, 221 imagens, 10 botões. Fontes: beachwood-variable (títulos, 200 a 900), fontBody (400 e 800), fontMono (500). Títulos de seção enormes (h2 de 313 px, entrelinha 260 px, tracking −9,4 px) em texto transparente com contorno de gradiente. Variáveis de tema: `--theme-bg` (ink), `--theme-fg` (bone), `--theme-accent` (gold), `--theme-surface` (smoke), largura máxima 1728 px. Texto de corpo 15,12 px e tracking 0,15 px.

**Estrutura vista rolando (24 quadros):**
1. **Carregamento** (0,5 s e 2 s): fundo roxo quase preto, logo em cinza que se preenche de branco, contador de 0 % a 100 %. Na 6 s: entra o hero claro.
2. Hero claro (retrato com fundo bege texturizado, cartão colecionável à esquerda, assinatura roxa desenhando à direita). **O reflexo dos óculos muda entre quadros** (laranja, verde): é mídia animada, não hover.
3. **Transição diagonal:** o fundo claro é cortado por uma diagonal e vira o escuro.
4. "Signature Moments": palavra gigante ao fundo e **cartões flutuando em linha** com paralaxe; réguas de números (10, 20, 30, 40, 50) marcam o progresso.
5. Frase "I want people to remember me for more than football" que **dissolve em pontos (meio-tom)** e se recompõe.
6. Pilha de fotos que entram uma sobre a outra, inclinadas como polaroides.
7. "Partnerships": palavra gigante atrás de um objeto dourado, logos de marcas na base.

**Celular (390 px):** contador de carregamento visível em 0 % e 29 %, retrato em coluna única com texto no topo e menu de hambúrguer. Sem rolagem horizontal. Dois quadros ficaram pretos (mídia ainda carregando).

**Aproveitar:** (a) carregamento com marca que se preenche e contador, só na abertura; (b) réguas e numeração como marca de progresso; (c) tokens de tema com superfície, acento e primeiro plano; (d) texto de rótulo mono pequeno.
**Evitar:** vídeo, canvas e 221 imagens (peso), títulos de 300 px, tema escuro esportivo.

## 3. FORMAT (hierarquia e formas)

**Medido (Chrome real):** altura 15.864 px; classe `lenis` na raiz; sem GSAP; 0 canvas, 7 SVG, 87 imagens. Fonte própria **Obys Sans**. Fundo `#222`, texto preto sobre cartões brancos. **Texto de corpo 12,5 px** (entrelinha 18,8 px). Wordmark gigante no topo ocupando a largura.

**Estrutura vista rolando (7 quadros):**
1. Wordmark FORMAT em letras recortadas em polígonos brancos, com legenda numa faixa de 1 linha ("Format — Obys and DES Special Project", "Notes Mode", "My 6 y.o. Daughter's Version").
2. **Cada formato é um cartão com a própria forma:** vertical (retrato, índice 1.1 a 1.4 em colunas), horizontal (largo, com lista rolando "Advert / Desktop / Business Cards…"), horizontal arredondado (pílula), círculo e anel ("SIDE A CIRCLE FORMAT"), relógio com rótulos "(Format)" girando em volta.
3. Numeração decimal em tudo (1, 1.1, 1.2, 2, 2.1) e rótulo pequeno em cinza "(Format)" acima de cada título.
4. Fundos mudam de preto para uma foto em preto e branco granulada entre os blocos.

**Aproveitar:** (a) hierarquia só por escala: rótulo minúsculo, título grande; (b) numeração decimal como estrutura (passo 1, 2, 3 do fluxo); (c) cartões com formas e raios deliberados (retângulo, pílula, círculo) em vez de um raio único; (d) rótulos pequenos entre parênteses acima dos títulos.
**Evitar:** texto cinza claro sobre cinza (contraste baixo), corpo de 12,5 px, foto granulada.

## 4. Grids S03 (lista numerada)

**Medido (Chrome real):** altura 25.374 px; classe `is-up has-gl lenis`; 1 canvas WebGL, 1 vídeo, 18 imagens, 1 SVG; Obys Sans; fundo branco, texto preto. h1 e h2 de 119 px, entrelinha 142,8 px (1,2), **tracking −7,14 px (−6%)**; texto 15,9 px, entrelinha 19 px, tracking −0,32 px.

**Estrutura vista rolando (4 quadros):**
1. Topo: título GRIDS formado por blocos pretos e bege em grade; coluna da esquerda com legenda, coluna da direita com a **lista de capítulos**.
2. **Lista de 18 itens:** número à esquerda (01 a 18), título com subtítulo em 3 linhas, **duração alinhada à direita** (03:35, 09:50…), uma linha fina de 1 px entre cada item; os itens alternam recuo para diferenciar níveis.
3. "GRIDS S03" gigante que **atravessa a lista** quando se rola, por cima do texto.
4. Depois da lista: faixa preta de 20 px e bloco "00 Trailer…" com duração e imagem em preto e branco.

**Hover:** passei o mouse sobre um item da lista e não vi mudança visual.

**Aproveitar:** (a) a lista de encomendas com número/hora alinhados à direita e linhas finas, a mesma estrutura de 18 itens; (b) tracking negativo forte só em títulos grandes; (c) preto e branco puros com um único acento.
**Evitar:** o título passando por cima da lista (atrapalha a leitura), WebGL.

## 5. Intercom (produto claro, fundo off-white)

**Medido (Edge automatizado):** altura 9.651 px; sem inércia de rolagem (rolagem nativa); 0 canvas, 0 vídeo, 57 SVG, 58 imagens, 50 botões. Fontes: **Saans** (títulos e texto) e DM Mono (rótulos), com várias fontes decorativas carregadas sob demanda. Texto `#111`, fundo claro. **h1 80 px, entrelinha 80 px (1,0), tracking −2,4 px (−3%)**; h2 24 px; corpo 15 px com entrelinha 22,5 px. Tokens de botão por variáveis: altura **2,5 rem (40 px)**, padding 0,875 rem, raio **0,375 rem (6 px)**, primário preto com texto branco e hover em 80% de opacidade, secundário transparente.

**Estrutura vista rolando (17 quadros):**
1. Hero claro, centralizado, com título de 3 linhas em cinza e preto, dois botões e **imagens recortadas nas laterais** (pessoa, céu).
2. **Tela do produto real dentro de um painel** com fundo texturizado (papel/areia), logos de clientes em grade abaixo.
3. Seções alternadas texto à esquerda e **ilustração de borboletas e pássaros em preto sólido** à direita, com **recortes da interface do produto** (lista de conversas, painel lateral, resposta de IA).
4. Trio de colunas "Work together seamlessly / Self-improving system / Centralized Knowledge Hub" com miniatura do produto sobre cada coluna.
5. Depoimento com texto marcado em azul (seleção) e retrato; grade de ícones de integrações; bloco de preço "$0.99" com título "Transparent pricing".
6. Rodapé em colunas de links pequenas.

**Hover:** o item "Product" do menu mudou o fundo de transparente para bege `rgb(241,238,233)` em 500 ms. É um hover de fundo, sem movimento.

**Aproveitar:** (a) a **tela real do produto no hero** como prova, sem ilustração genérica; (b) tokens de botão em variáveis (altura 40 px, raio 6 px) e hierarquia primário preto/secundário transparente; (c) fundo off-white com um tom bege quente nos estados; (d) título com tracking negativo e entrelinha 1,0; (e) mono só para rótulos.
**Evitar:** rolagem longa de marketing, ilustrações de pássaros e borboletas, 7 famílias de fonte decorativas, banner de cookies sobre a tela (cobriu o conteúdo em todas as capturas).

## 6. Linear (precisão de produto, hover e densidade)

**Medido (Edge automatizado):** altura 9.960 px; inércia de rolagem detectada (600 px de roda: 0 aos 60 ms, 600 aos 1,2 s); 0 canvas, 229 SVG, 39 imagens, 71 botões. Fontes **Inter Variable** (100 a 900, usa o peso 510) e **Berkeley Mono** para código e rótulos. Fundo `rgb(8,9,10)` (`#08090A`), texto `rgb(247,248,248)`, **texto secundário `rgb(138,143,152)`**. h1 64 px, entrelinha 64 px, peso 510, tracking −1,408 px (−2,2%); h2 48 px; corpo 15 px com entrelinha 24 px e tracking −0,165 px; navegação em 13 px. Variáveis de layout: grade de **12 colunas**, largura máxima 1024 px de página e 1344 px da home, padding lateral 24 px, **altura do cabeçalho 72 px com desfoque de 20 px**. Botões da barra com **raio de 9999 px (pílula)**.

**Estrutura vista rolando (17 quadros):**
1. Carregamento: título entra **desfocado e fica nítido** em ~2 s, depois entra o produto abaixo.
2. **Tela real do produto no hero**, cortada na base e escurecida por degradê, mostrando barra lateral, lista de itens e painel de detalhe.
3. Faixa de logos de clientes e parágrafo grande em cinza claro com a frase-chave em branco.
4. Três cartões com **ilustração isométrica em traço fino** sobre fundo quase preto.
5. Seções "Intake", "Planning", "AI and automations", "Build, review, and ship": **título curto à esquerda, parágrafo e link "Learn more →" à direita**, e abaixo uma **janela do produto** (conversa, cronograma, atribuição a agentes, diff de código) que aparece **escurecida e se ilumina** ao entrar na tela.
6. Changelog em colunas de 4 itens com datas pequenas em mono.
7. Depoimentos em dois cartões, um **lilás claro** e um **amarelo-limão** (contraste forte contra o fundo escuro).
8. "Built for the future. Available today." com dois botões e rodapé em 6 colunas.

**Hover:** o item "Product" do menu mudou cor do texto (cinza para quase branco) e fundo (transparente para branco 8%) em 500 ms. Hover de pílula suave.

**Celular (390 px):** cabeçalho reduzido a logo, "Log in", botão "Sign up" em pílula e menu hambúrguer; hero em coluna; as janelas do produto aparecem inteiras sem cortar; **sem rolagem horizontal**.

**Aproveitar:** (a) **hierarquia em 3 níveis de cinza** (texto principal, secundário, hover em branco 8%) em vez de cores; (b) cabeçalho de 72 px com desfoque; (c) hover em pílula com fundo translúcido; (d) entrada "desfocado para nítido" no carregamento; (e) janelas do produto aparecendo escurecidas e iluminando ao entrar; (f) grade de 12 colunas; (g) rótulos e datas em mono; (h) **cartões coloridos pontuais** (lilás e amarelo) como único momento de cor.
**Evitar:** tema escuro total, jargão de IA, rolagem longa.

## O que as 4 referências do Awwwards têm em comum (e vale para o app)
- **Lenis em 4 de 4** (inércia de rolagem confirmada em 2 por script e em 2 pela presença da classe). No app, a lista é a única parte que rola: Lenis só lá, e nada de rolagem presa.
- **Tipografia com identidade:** fontes próprias ou pares definidos. Nosso par aprovado é Geist + Geist Mono.
- **Estrutura por linhas finas de 1 px** em vez de sombras (DeepBook, Grids).
- **Numeração e rótulos pequenos** acima de títulos grandes (FORMAT, Grids, DeepBook).
- **Um único acento** (azul no DeepBook, roxo no Justin Jefferson, preto no Grids).

## Limites honestos
- Não vi hover com mudança em nenhum dos 4 sites; não afirmo que existam.
- Celular: só DeepBook e Justin Jefferson. FORMAT e Grids não foram abertos em 390 px.
- Não analisei desempenho (quadros por segundo) nem acessibilidade (teclado, leitor de tela, contraste medido) dos sites.
- Os quadros de movimento são capturas estáticas: a curva de easing e as durações exatas não foram medidas.
- Não copiei código, textos nem imagens. Só extraí princípios.
