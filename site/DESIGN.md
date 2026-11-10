# DESIGN.md (site de apresentação)

Status: APROVADO em 2026-11-10 (Portões 1, 2 e 3)
Modo: site novo (Fase E)

## Produto
- Nome: Portaria (provisório; trocar só textos e logo depois).
- Público: síndicos, administradoras e conselhos de condomínio que decidem a compra.
- Objetivo: fazer o visitante pedir uma demonstração.
- Ação principal: **Pedir demonstração**, abrindo o WhatsApp com mensagem pronta (número de exemplo até o usuário informar o real).
- Tom: confiável, moderno, direto; mostra o produto real funcionando.
- O que evitar: números inventados, depoimentos falsos, fotos de banco genéricas, jargão de tecnologia, cara de template.

## Estilo
- Estilo: identidade do app em versão cinematográfica (aprovado).
- Paleta: off-white `#F4F4F0` e índigo `#4338CA` do app, com cenas escuras (`#0C0C14`) alternadas.
- Tipografia: Geist e Geist Mono, como no app, com títulos gigantes.
- Animação: nível alto, cinematográfico (GSAP, ScrollTrigger, SplitText, Lenis), com respeito a movimento reduzido.
- Onde fica: pasta `site/` desta repo, publicada como um segundo site no Netlify.

## Referências
Ver `site/REFERENCIAS.md` (5 vencedores do Awwwards, aprovados em 2026-11-10).

## Plano (Portão 3, aprovado em 2026-11-10)

### Ideia central
O site conta **a viagem de uma encomenda**: ela chega na portaria, a etiqueta é lida e vira dado, o morador é avisado e a entrega acontece na porta com código e assinatura. O **celular com o app real** é o palco (Anime.js); a **caixa com etiqueta** é o objeto protagonista (Oryzo); o **real vira dado** (Terminal); o **condomínio em corte** mostra o caminho (Kriss); o **bento se monta** (Dropbox).

### Cenas (mobile-first; no computador, cenas presas na tela durante a rolagem)
| # | Cena | O que acontece | Referência |
|---|---|---|---|
| 0 | Abertura | "Portaria" gigante sobe letra por letra, contador de 000 a 100, cortina de faixas revela o site. No máximo 1,5 s e só na primeira visita da sessão. | App, Kriss |
| 1 | Hero | Título "A caderneta da portaria acabou." sobe palavra por palavra; subtítulo; botão **Pedir demonstração** (magnético no mouse) e "Ver como funciona". O celular com a tela inicial do app flutua com leve paralaxe. | Linear, Terminal |
| 2 | O problema | Uma página de caderneta em SVG: as linhas de registro são riscadas uma a uma conforme a rolagem, e surgem as perguntas "Quem recebeu?", "Onde está?", "Já foi entregue?". A página se dobra e dá lugar ao celular. | Oryzo |
| 3 | Do real ao dado | Uma caixa isométrica com etiqueta; o laser do visor passa sobre ela e os campos (destinatário, apto, loja, transportadora, rastreio) **saem da etiqueta e voam** para montar o cartão do pedido com logos. | Terminal |
| 4 | O caminho da encomenda | Condomínio isométrico em corte (portaria, elevador, corredor, porta do apto). Um ponto índigo percorre o caminho; em cada parada o celular ao lado troca de tela: **1 Recebe** (foto), **2 Avisa** (mensagem com código), **3 Entrega** (código e assinatura), **4 Registra** (histórico). No computador a cena corre na horizontal; no celular, na vertical. | Kriss, Anime.js |
| 5 | Bate o olho | Bento que se monta: lojas e transportadoras reconhecidas (selos), contador "Aguardando retirada", lista por dia, câmera com visor, modo escuro, animações desligáveis. Os blocos entram e travam no lugar. | Dropbox |
| 6 | Segurança (cena escura) | Código de 6 dígitos em painel de palhetas que viram; fatos do produto: código validado no servidor, 5 tentativas e bloqueio de 15 min, fotos e assinaturas privadas, consentimento do morador. | Terminal |
| 7 | Chamada final | "Peça uma demonstração" gigante, botão magnético que abre o WhatsApp com mensagem pronta; rodapé. | — |

### Componentes (todos próprios; nenhum copiado das referências)
Palco do celular (moldura em CSS com capturas reais do app), caderneta em SVG, caixa e condomínio isométricos em SVG desenhados à mão no estilo de blocos (como o DeepBook), cartão do pedido (mesmo componente visual do app), painel de palhetas, bento, botão magnético, cortina. Capturas do app geradas pelo Playwright no modo demonstração, em WebP.

### Bibliotecas
**GSAP** (ScrollTrigger para cenas presas, SplitText para títulos, DrawSVG para riscos e caminhos, MotionPath para o ponto no condomínio, Flip para a etiqueta virando cartão) e **Lenis** para rolagem suave sincronizada com o ScrollTrigger. React, Vite, TypeScript e Tailwind, iguais ao app. Sem Three.js nesta versão: o condomínio em SVG é mais leve e funciona bem no celular.

### Onde entra animação e por quê
Toda animação acompanha a rolagem e conta um passo da história. Nada de efeito sem função. Com movimento reduzido: sem Lenis, sem cenas presas, sem animação contínua; as cenas viram seções estáticas legíveis, com o estado final de cada uma.

### Regras de honestidade
- Sem números inventados, sem depoimentos, sem "clientes" fictícios.
- Lojas e transportadoras aparecem como "reconhece etiquetas de…", com selos neutros (sigla e cor) e o aviso de que as marcas pertencem aos donos e não há parceria.
- O WhatsApp usa um número de exemplo num arquivo de configuração até o usuário informar o real.

### Responsivo e desempenho
Mobile-first (390 px) e computador (1440 px). Sem vídeo; imagens WebP com carregamento sob demanda. Meta: conteúdo principal visível em até 2,5 s no celular.

### Publicação
Pasta `site/` com projeto próprio. No Netlify, um **segundo site** apontando para a mesma repo com diretório base `site` (o usuário cria no painel; eu deixo o `netlify.toml` pronto).

### Execução e verificação
1. Projeto, tokens e fontes; abertura e hero.
2. Cenas 2 a 7, uma por vez.
3. Celular e movimento reduzido.
4. Verificação: build e lint, capturas em 1440 e 390 px, sequência de quadros de cada cena com a rolagem, crítica contra a lista "Proibido" e as leis de UX, no mínimo 2 rodadas.
5. `site/RELATORIO.md` com capturas.
