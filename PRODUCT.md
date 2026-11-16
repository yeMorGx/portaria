# PRODUCT.md

Atualizado em 2026-11-16 para a área de gestão. Aguardando confirmação do usuário (Portão 1).

## O que é
Sistema web para a portaria de um prédio comercial registrar, avisar e entregar encomendas, substituindo a caderneta de papel. Um prédio tem várias empresas; cada empresa tem destinatários (pessoas ou setores). O produto é vendido a prédios, síndicos e administradoras.

## Quem usa
- **Porteiro:** usa todos os dias, com pressa e com pacotes nas mãos. Registra, avisa pelo WhatsApp e entrega com código. Não vê a gestão.
- **Síndico e administradora:** cuidam do prédio. Cadastram empresas e destinatários, criam e desativam contas de porteiros e de outros gestores, e acompanham como as encomendas estão fluindo.
- **Comprador:** vê o produto numa demonstração. O visual precisa transmitir confiança e qualidade.

## Fluxos que já existem
1. Início: Nova Encomenda, contador e lista (pilhas por empresa, aguardando e retiradas, botão do WhatsApp).
2. Recebimento em 4 passos: empresa, loja e transportadora, pacote (foto obrigatória), guarda e revisão.
3. Aviso pelo WhatsApp com código de retirada (um código por lote).
4. Entrega com código ou com justificativa; histórico da retirada.
5. Cadastro de empresas e destinatários (tela simples, só síndico e administradora).

## O que entra agora: área de gestão
- **Visão geral (dashboard):** como as encomendas estão fluindo no prédio.
- **Empresas:** criar, editar, desativar; destinatários com WhatsApp.
- **Usuários:** convidar novas contas (porteiro, síndico, administradora), trocar papel, desativar sem apagar o histórico.

## Fora de escopo (por enquanto)
App para destinatários, cobrança, vários prédios na mesma tela, integrações com transportadoras, relatórios exportáveis.

## Não pode mudar
Fluxo do porteiro, textos dos botões principais, `data-testid` usados nos testes, contrato com o Supabase em `src/lib/data.ts` (só cresce), regras de acesso por prédio e por papel.
