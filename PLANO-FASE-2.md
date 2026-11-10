# PLANO-FASE-2.md

Status: EM ANDAMENTO (fases A e B construídas; migração SQL aguardando o ok do usuário)

Decisões do usuário (2026-11-09):
- Confirmação da retirada: **código de retirada por WhatsApp e assinatura na tela, os dois juntos**.
- **O morador é quem retira e recebe.** O funcionário leva o pacote até a porta e entrega ao morador; o código e a assinatura são feitos ali, no celular do funcionário. Não há retirada por terceiros.
- **Informação completa e visual:** loja de compra (Mercado Livre, TikTok Shop, Shopee, Amazon e outras) e transportadora aparecem **com logo**, e o pedido guarda rastreio, número do pedido, remetente, cidade e UF de origem, tipo, volumes, condição, local de guarda, observação e foto do pacote.
- Animação: **GSAP no site de apresentação e também no app**, com uma opção no app para **desligar as animações**.

Isso muda a spec original, que excluía controle de retirada, registro de quem retirou e notificações. Passa a valer esta fase.

## Ciclo do pedido
`recebida` → `avisada` (WhatsApp enviado com código) → `retirada` (código + assinatura).

## Dados do pedido
Já existem: destinatário, apartamento, transportadora, data e hora, foto da etiqueta, código lido.

**Novos em `encomendas`:**
| Campo | Tipo | Como entra |
|---|---|---|
| `status` | `recebida`, `avisada`, `retirada` | automático |
| `recebido_por` | texto | nome do porteiro do turno, perguntado uma vez ao abrir e lembrado no aparelho |
| `rastreio` | texto | do código lido |
| `remetente` | texto | OCR, editável |
| `tipo` | `caixa`, `envelope`, `sacola`, `volume_grande` | chips; padrão `caixa` |
| `volumes` | inteiro | padrão 1 |
| `condicao` | `ok`, `amassado`, `aberto`, `fragil`, `refrigerado` | chips; padrão `ok` |
| `foto_pacote_path` | texto | foto opcional do pacote |
| `local_guarda` | texto | chips dos locais usados, mais "outro" |
| `observacao` | texto curto | opcional |
| `codigo_retirada_hash` | texto | só o hash do código de 6 dígitos |
| `avisado_em` | data e hora | quando o aviso saiu |
| `retirado_em` | data e hora | na entrega |
| `retirado_por_nome` | texto | na entrega |
| `retirado_por_tipo` | `morador`, `terceiro` | na entrega |
| `entregue_por` | texto | porteiro do turno |
| `assinatura_path` | texto | imagem da assinatura no bucket privado |
| `entrega_sem_codigo` | booleano e `justificativa` | exceção: morador sem o código |

**Novos em `moradores`:** `telefone` (formato E.164), `bloco`, `consentimento_em` (data do aceite para receber avisos).

**Princípio:** o porteiro só digita o que o sistema não leu. Tipo, volumes e condição já vêm preenchidos (caixa, 1, ok) e só mudam com 1 toque.

## Telas
1. **Turno** (uma vez por aparelho): "Quem está na portaria?". Sem gestão de funcionários, só um nome.
2. **Conferência do recebimento** ganha tiles: tipo e volumes, condição (com foto opcional do pacote), local de guarda, observação recolhida. O botão Salvar continua sendo o único primário.
3. **Início:** lista com abas **Aguardando** e **Retiradas**; pacote parado há mais de X dias recebe marca "parado há N dias". O contador "Hoje" vira "Aguardando retirada".
4. **Entrega** (toque no pacote da aba Aguardando): resumo do pedido, campo do **código de 6 dígitos**, "Quem retira" (morador ou terceiro, com nome), **assinatura na tela**, botão "Confirmar entrega". Sem código: botão secundário "Morador sem o código", que exige justificativa e fica registrado.
5. **Opção "Reduzir animações"** no cabeçalho do app. Vale para Motion e GSAP, soma-se ao `prefers-reduced-motion` do sistema e fica lembrada no aparelho.

## Aviso por WhatsApp (decisão de provedor adiada)
- Função de borda no Supabase (`avisar-morador`) que gera o código, grava só o hash e chama um provedor de WhatsApp.
- **Primeira entrega em modo simulado:** a mensagem aparece numa área de teste e o código é exibido ao porteiro, para o fluxo inteiro funcionar e ser demonstrado sem custo.
- **Provedor real (custo, aprovação de modelo de mensagem e consentimento do morador) fica para uma decisão sua**, depois de validar o fluxo. Opções: API oficial do WhatsApp (Meta) ou um provedor brasileiro. Eu comparo preços e exigências com dados reais antes de você escolher.

## Segurança e LGPD
- Código de 6 dígitos de uso único, validade de 7 dias, guardado só como hash; limite de tentativas na validação.
- Fotos e assinaturas em bucket privado, acessíveis só com login; URLs assinadas curtas.
- Prazo para apagar fotos e assinaturas depois da retirada (sugestão: 90 dias), com rotina agendada.
- Consentimento do morador registrado (`consentimento_em`) antes de qualquer aviso.
- Documentação para o cliente: o condomínio é o controlador dos dados.

## Animação (GSAP)
- **Regra da skill:** Motion para componentes, GSAP para sequências. Não usar os dois para a mesma coisa.
- **No app:** GSAP para a abertura, a leitura da etiqueta (linha do tempo) e a celebração de entrega concluída. Motion segue nas entradas e trocas de tela.
- **Site de apresentação (separado do app):** GSAP, ScrollTrigger e Lenis, com storytelling. Segue os portões da skill ui-ux-design (modo "site novo", referências, plano). Já temos as referências cinematográficas do Awwwards aprovadas.
- Tudo desligável pela opção "Reduzir animações".

## Ordem de execução
| Fase | Conteúdo | Verificação |
|---|---|---|
| A | Banco (migração), turno, novos campos no recebimento, status | testes unitários e e2e; migração aplicada no Supabase de teste com o seu ok |
| B | Aba Aguardando e Retiradas, tela de Entrega com código e assinatura | e2e do ciclo completo recebida → retirada |
| C | Aviso: função de borda em modo simulado | e2e e teste da função |
| D | Opção "Reduzir animações" e GSAP no app | capturas e teste com a opção ligada e desligada |
| E | Site de apresentação animado (portões da skill) | portões 1 a 3 aprovados antes de construir |
Cada fase termina com commit; push só com o seu ok.

## Riscos e pontos em aberto
- Etiqueta e QR das transportadoras raramente trazem o nome do morador; sem integração oficial, o OCR segue como caminho.
- Assinatura na tela tem valor de registro, não de prova jurídica; para o cliente isso precisa estar claro.
- O WhatsApp real exige consentimento, modelo de mensagem aprovado e custo por mensagem.
- A migração altera o banco de teste. Antes, mostro o SQL e espero o seu ok.
