# RELATORIO.md

## Área de gestão e dashboard (2026-11-16)

Redesign parcial seguindo a skill `ui-ux-design`: Portão 0 (parte nova no app), Portão 1 (contexto; variante "mais ousado"), Portão 2 (6 referências: 4 vencedores SOTD do Awwwards e 2 shots do Dribbble) e Portão 3 (plano) aprovados em 2026-11-16.
Capturas das 2 rodadas em `.design/screens/gestao/r1` e `r2` (1440 e 390 px, claro e escuro; 24 por rodada). Essa pasta não vai para o Git.

### O que foi feito
- **Entrada:** o botão "Cadastro" do início virou **"Gestão"** (síndico e administradora; também no modo demonstração).
- **Abas** Visão geral · Empresas · Usuários, com indicador que desliza; no celular ocupam a largura toda e escondem os ícones.
- **Visão geral:** número herói que conta até o valor (aguardando agora), barra de idade (até 1 dia, 1 a 3, mais de 3 no destaque), "Paradas há 3 dias ou mais" com o botão do WhatsApp, 4 indicadores com mini gráficos de tipos diferentes (área, barras, linha, pontos) e variação contra o período anterior, recebidas por dia (hoje no destaque, tooltip com recebidas e entregues), ranking por empresa e índice de lojas e transportadoras no estilo "(n) Nome". Período Hoje · 7 dias · 30 dias.
- **Empresas:** lista em índice com busca, situação e quantas aguardam; painel lateral (de baixo no celular) com o formulário e os destinatários, agora com edição do WhatsApp de quem já está cadastrado.
- **Usuários:** lista com papel, último acesso e situação, busca e filtro por papel; **convite** que cria a conta e devolve um link de acesso mascarado (mostrar, copiar, mandar pelo WhatsApp); troca de papel e desativação com confirmação; ninguém se desativa nem o prédio fica sem gestor.
- **Crie sua senha:** quem abre o link de convite cria a própria senha antes de usar o sistema.
- **Servidor:** migração 009 (`listar_usuarios_predio`, `atualizar_usuario`) e Edge Function `convidar-usuario` (a chave de administrador fica só no servidor).

### Componentes e origem
| Componente | Origem |
|---|---|
| Abas | Radix Tabs (instalado) + Motion `layoutId` |
| Painel lateral e confirmação | Radix Dialog (instalado), animação por CSS com `data-state` |
| Período, papel e filtro | Radix ToggleGroup (já usado) |
| Gráficos | SVG e HTML próprios (`Graficos.tsx`), seguindo a skill de visualização de dados |
| Número que conta | `NumeroAnimado` (já existia, GSAP) |
| Lista em índice | própria, a partir de Grids e Creative Reference Library |
Bibliotecas de componentes: Radix (+ cmdk que já existia). Nenhuma biblioteca de gráfico.

### Cores dos gráficos
Forma de **ênfase** (skill de visualização): o dado que importa no destaque `#6366F1`, o contexto em cinza (`--chart-muted`: `#94A3B8` claro, `#71717A` escuro). O validador reprovou um par categórico cinza + destaque (cinza tem croma baixo), então o gráfico por dia mostra uma série só (recebidas) e as entregues ficam no tooltip e no indicador próprio. Contraste do cinza claro é 2,5:1: compensado por valores escritos, tooltip e tabela para leitor de tela.

### Rodadas de verificação
**Rodada 1** (`r1`): defeitos encontrados e corrigidos:
1. Indicadores: "sem base para comparar" quebrava em 3 linhas ao lado do mini gráfico → mini gráfico subiu para o lado do rótulo.
2. Gráfico por dia: o rótulo "3" do eixo encostava no título → respiro no topo.
3. Abas no celular cortavam "Usuários" → largura total, sem ícones no celular.
4. Painel da empresa: formulário de novo destinatário espremido e "Adicionar" saindo do painel → grade de 2 colunas.
5. Lista de empresas: coluna "Local" quebrava → coluna mais larga.
6. Iniciais "V(" em "Você (demonstração)" → só palavras que começam com letra.
**Rodada 2** (`r2`): os 6 conferidos como corrigidos nas 4 combinações (claro/escuro, 1440/390).

### Testes
- Unitários: 37 (6 novos dos cálculos do dashboard).
- End-to-end: 8, incluindo `gestao.spec.ts` (visão geral, nova empresa com destinatário e WhatsApp, convite com link mascarado, troca de papel, desativação, própria conta protegida).
- Migração 009 ensaiada no banco com reversão: lista com e-mails, recusa de desativar a si mesmo e de papel inválido; nada gravado.

### Checklist de leis de UX
| Lei | Resultado |
|---|---|
| Hick | Passou: uma ação principal por aba (Nova empresa, Convidar usuário; na visão geral, o WhatsApp das paradas) |
| Fitts | Passou: alvos de 44 px ou mais; ação principal no canto superior da lista que ela afeta |
| Jakob | Passou: abas, lista com cabeçalho, painel lateral e confirmação no padrão conhecido |
| Proximidade | Passou: período ao lado do título que ele muda; busca e filtro colados na lista |
| Von Restorff | Passou: só o dado que importa no destaque em cada gráfico |
| Carga cognitiva | Passou: herói responde "o que precisa de atenção agora" antes do resto |
| Contraste | Passou em texto; cinza de contexto dos gráficos compensado com valores escritos e tabela |

### Não verificado (honestidade)
- **Convite de verdade:** a Edge Function não foi publicada nem testada contra o Supabase real; os testes rodaram no modo demonstração. O link volta para o app só depois que o endereço do app estiver liberado como URL de retorno na autenticação do Supabase.
- Leitor de tela e navegação só por teclado nas abas e nos painéis: não testados de ponta a ponta.
- Celular real, Safari e Firefox: não testados.
- Dashboard calcula no navegador a partir de até 5.000 encomendas do período; para prédios muito grandes, o cálculo deveria ir para o banco.

---

## Fluxo do porteiro (2026-11-09)

Redesign completo do app da portaria, seguindo a skill `ui-ux-design` (Portões 0 a 3 aprovados em 2026-11-09).
Capturas das 3 rodadas em `.design/screens/r1`, `r2` e `r3` (390, 768 e 1440 px, claro e escuro). Essa pasta não vai para o Git.

## O que mudou
- **Estilo:** Bento grid, off-white com índigo, Geist e Geist Mono, animação expressiva.
- **Mobile-first:** estilos base para 390 px; `md:` (768 px) e `lg:` (1024 px) ampliam para tablet e computador da portaria. Sem rolagem horizontal em nenhuma tela.
- **Telas refeitas:** login, início (bento com Nova Encomenda, Hoje e lista por dia), escolha, câmera, leitura de código, leitura da etiqueta, conferência, abertura.
- **Funcionalidade:** mantida. Mesmo fluxo de 3 passos, mesmos textos dos botões principais, mesmo contrato com o Supabase, mesmo parser e OCR.

## O que foi mantido de propósito
Rotas (não há), `data-testid` (`lista`, `apto`, `arquivo-foto`, `video-foto`), `src/lib/data.ts`, `src/lib/parser.ts`, `src/lib/ocr.ts`, esquema do banco, textos dos botões "Nova Encomenda", "Fotografar etiqueta", "Escanear código", "Salvar Encomenda".

## Componentes e origem
| Componente | Origem |
|---|---|
| Combobox de morador | Radix Popover + `cmdk`, no padrão do shadcn/ui, estilizado com os tokens |
| Chips de transportadora | Radix ToggleGroup (padrão shadcn/ui), estilizado |
| Aviso de sucesso | `sonner` (padrão shadcn/ui), com tema pelos tokens |
| Ícones | `lucide-react` (substituiu os SVGs autorais) |
| Animação | `motion` |
| Fontes | `@fontsource-variable/geist` e `geist-mono`, instaladas no projeto |
| Tile bento, marcas "+", varredura, esqueleto, botão, campo | próprios, inspirados em DeepBook e Linear (princípios, sem copiar código) |
Não usei a CLI do shadcn: instalei os pacotes Radix diretamente e escrevi os componentes no mesmo padrão. Biblioteca de componentes: uma só base (Radix/shadcn). Licenças: Radix, cmdk, sonner, motion e lucide são MIT/ISC.

## Rodadas de verificação
**Rodada 1** (capturas `r1`): achei 3 defeitos, corrigidos.
1. Tile "Hoje" com rótulo embaixo e número no meio no celular. Reorganizado em coluna.
2. Aviso de status encostado no rótulo "MORADOR" (`m-0` anulava o espaçamento). Tile em coluna com `gap`.
3. Campo de busca do combobox com contorno pesado.

**Rodada 2** (`r2`, incluindo tablet e modo escuro): o contorno do combobox ainda aparecia e o login tinha o título colado à marca. A causa era a mesma: regras globais fora de `@layer base` venciam os utilitários do Tailwind. Movi os resets (`:focus-visible`, `h1 h2 h3`, `button input select`) para `@layer base`.

**Rodada 3** (`r3`): combobox limpo, login corrigido, hierarquia ok. Achei que a moldura da câmera ficava branca quando a câmera falhava (a classe `.tile` vencia `bg-black`). Corrigi pondo o fundo preto na área interna.

## Checklist de leis de UX
| Lei | Resultado |
|---|---|
| Hick | Passou: no máximo 2 opções na escolha; 6 chips de transportadora mais "Outra" |
| Fitts | Passou: alvos de 44 px ou mais (chips, voltar, itens do combobox 48 px); primário de 64 px |
| Jakob | Passou: combobox, chips, lista por dia e "Voltar" no padrão conhecido |
| Miller | Passou: informação em tiles de um assunto cada |
| Proximidade | Passou: o combobox fica no tile do morador; o apartamento logo abaixo |
| Similaridade e regiões | Passou: todos os tiles com o mesmo raio, borda e superfície |
| Von Restorff | Passou: uma só ação em índigo sólido por tela |
| Zeigarnik e progresso | Passou: "1 de 3", "2 de 3", "3 de 3" |
| Peak-End | Parcial: sucesso tem aviso e destaque da linha; não há tela final dedicada, por escolha |
| Tesler | Passou: o sistema identifica morador, apartamento e transportadora; o porteiro só confere |
| Doherty | Passou: esqueleto da lista, tela de leitura com varredura, botão "Salvando…" |
| Postel | Parcial: a busca do morador tolera acento e caixa (cmdk); campo de código aceita qualquer texto |
| Carga cognitiva | Passou: o tile "Hoje" é o único elemento além da spec |
| Hierarquia | Passou: ação primária única por tela |
| Estados | Parcial: ver "Não verificado" |

## Lista "Proibido" da skill
- Controle nativo sem estilo: removido (o `<select>` virou combobox). O `<input type=file>` fica oculto atrás de um botão estilizado.
- Superfícies chapadas: 4 níveis de superfície (fundo, tile, bloco interno, hover).
- Fonte padrão: Geist e Geist Mono, definidas.
- Duas ações de mesmo peso: não há.
- Estados vazio, erro e carregando desenhados: vazio e carregando sim; erro com botão "Tentar de novo".
- Contraste e toque: texto principal acima de 15:1, secundário acima de 5,5:1; alvos de 44 px ou mais.
- Mobile que só encolhe: pensado do celular para o computador.
- Animação sem propósito: cada uma está no DESIGN.md e respeita `prefers-reduced-motion`.
- Segredos na tela: não há.
- Cópia das referências: não houve.

## Não verificado (honestidade)
- **Câmera ao vivo em celular de verdade:** só testei com câmera simulada do navegador.
- **Login com Supabase real:** a tela de login foi capturada com chaves falsas; o ciclo completo de entrar e sair com o projeto real não foi retestado após o redesign.
- **Tela de abertura (marca com contador):** existe no código e passa nos testes, mas não tenho captura dela. Dura menos de 1 s.
- **Esqueleto da lista e estado de erro da lista:** implementados, sem captura.
- **Leitor de tela e navegação só por teclado:** o combobox e os chips vêm do Radix (acessíveis por padrão), mas não testei com leitor de tela.
- **Outros navegadores:** só Edge (Chromium). Não testei Safari nem Firefox.
- **Desempenho (quadros por segundo) das animações em computador fraco.**
- **A tela de leitura da etiqueta** foi capturada no início da leitura; o texto reconhecido aparecendo linha por linha dura 450 ms e não foi capturado.

## Pendências
- Subir ao GitHub e atualizar o Netlify (nada foi enviado).
- Página de apresentação com storytelling para a venda (site novo, separado do app): não feita.
- Refazer a captura com um celular real conectado, quando possível.

## Ferramentas
`.design/analisar-completo.mjs` (análise das referências) e `.design/folha.mjs` (folha de contato das capturas). Capturas do app: `CAPTURAS=1 npx playwright test capturas`.
