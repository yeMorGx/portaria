# RELATORIO.md (site de apresentação)

Fase E, construída seguindo a skill `ui-ux-design` (Portões 1, 2 e 3 aprovados em 2026-11-10).
Capturas em `.design/screens/site/r1` e `r2` (computador 1440 px, celular 390 px e movimento reduzido). Essa pasta não vai para o Git.

## O que foi feito
Um site de uma página que conta a viagem de uma encomenda, em 8 cenas:
0. **Abertura:** "Portaria" gigante sobe letra por letra, contador e cortina de faixas. Só na primeira visita da sessão.
1. **Hero:** título palavra por palavra, botão magnético "Pedir demonstração", celular com a tela inicial real do app e etiquetas flutuantes com paralaxe.
2. **O problema:** caderneta em que as linhas são riscadas com a rolagem e as perguntas acendem.
3. **A etiqueta vira registro:** laser lê a etiqueta e cada campo voa até o cartão do pedido.
4. **O caminho da encomenda:** condomínio em corte; a caixa percorre portaria, elevador e porta do 202, a mensagem sobe até o apartamento e o celular troca de tela em cada passo (recebe, avisa, entrega, registra).
5. **Bate o olho:** bento que se monta, com fita de selos, contador, câmera com visor, lista por dia, claro e escuro.
6. **Segurança (escura):** código de 6 dígitos em palhetas que giram e fatos que acendem.
7. **Chamada final e rodapé.**

## Técnica
- Projeto próprio em `site/` (React, Vite, TypeScript, Tailwind), separado do app.
- GSAP: ScrollTrigger (cenas presas), SplitText, DrawSVG, MotionPath. Lenis para rolagem suave sincronizada com o ScrollTrigger.
- **Mobile-first:** no computador as cenas 2, 3 e 4 ficam presas na tela; no celular elas rolam normalmente, com as animações ligadas à rolagem.
- **Movimento reduzido:** sem Lenis, sem cenas presas e sem loops; cada cena aparece no estado final (riscos feitos, cartão montado, código completo).
- Capturas reais do app geradas pelo Playwright no modo demonstração (`e2e/telas-site.spec.ts`), em 2x, sem avisos nem a dica "modo simulado".
- Tamanho: JavaScript 141 KB e CSS 8 KB depois de compactados; pasta final de 1 MB com fontes e imagens.

## Componentes e origem
Todos escritos para este site; nenhum código copiado das referências. Caderneta, caixa e condomínio são SVG/HTML desenhados aqui. Selos de lojas e transportadoras são neutros (sigla e cor aproximada), com aviso de que não há parceria.

## Rodadas de verificação
**Rodada 1** (`r1`): o site carrega e rola inteiro nas três versões, sem rolagem horizontal e sem erros de JavaScript. Defeitos encontrados e corrigidos:
1. Botão do cabeçalho quebrando em duas linhas no celular: rótulo curto "Demonstração" no celular.
2. Etiquetas flutuantes do hero saindo da tela no celular: novas posições.
3. Celulares de cada passo grandes demais no celular: de 200 para 160 px.
4. Bloco "Celular e computador" sozinho numa linha do bento: virou faixa de largura total.
5. Passos do caminho ficariam apagados com movimento reduzido no computador: o apagado agora só existe com animação.

**Rodada 2** (`r2`): os 5 defeitos conferidos como corrigidos.

**Defeito na captura, não no app:** a primeira versão do script que gera as telas apagava do DOM os avisos do app; o React quebrava ("insertBefore") e a tela ficava branca. Confirmei com um teste de três encomendas seguidas, em três configurações, que o app não trava; o script passou a esconder os avisos por CSS.

## Checklist de leis de UX
| Lei | Resultado |
|---|---|
| Hick | Passou: uma ação (Pedir demonstração) e um link secundário |
| Fitts | Passou: botão principal de 64 a 80 px, alvos de 44 px ou mais |
| Jakob | Passou: cabeçalho, âncoras e rodapé no padrão conhecido |
| Miller | Passou: uma ideia por cena; 3 perguntas, 4 passos, 4 fatos |
| Von Restorff | Passou: só o botão de demonstração em índigo sólido por tela |
| Zeigarnik e progresso | Passou: passos numerados 01 a 04 |
| Peak-End | Passou: o caminho termina no visto verde; o site fecha numa chamada única |
| Carga cognitiva | Passou: sem números de marketing, só o produto |
| Contraste | Passou: texto principal escuro sobre off-white; claro sobre a cena escura |

## Não verificado (honestidade)
- Fluidez em celular real e em computador fraco; medi só no Edge do computador.
- Efeito magnético do botão e holofote: dependem de mouse; não aparecem em captura.
- Leitor de tela e navegação só por teclado: não testados.
- Safari e Firefox: não testados.
- Nota de desempenho (Lighthouse): não medida.
- O número do WhatsApp em `src/config.ts` ainda é de exemplo.

## Para publicar
Ver `site/README.md`.
