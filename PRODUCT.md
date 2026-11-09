# PRODUCT.md

Rascunho gerado a partir do código atual. Aguardando confirmação do usuário (Portão 1).

## O que é
Sistema web para a portaria de um condomínio registrar o recebimento de encomendas, substituindo a caderneta de papel. O produto será vendido a condomínios.

## Quem usa
- **Operador (porteiro):** usa todos os dias, no computador da portaria, muitas vezes com pressa e com pacotes nas mãos. Precisa registrar uma encomenda em poucos segundos, com poucos botões.
- **Comprador (síndico/administradora):** vê o produto numa demonstração. O visual precisa transmitir confiança e qualidade.

## Fluxo principal
1. Início com botão "Nova Encomenda" e lista das encomendas (mais recente primeiro).
2. Escolha: fotografar a etiqueta (OCR) ou escanear código de barras/QR.
3. Conferência: morador, apartamento, transportadora, foto. Botão "Salvar Encomenda".

## Fora de escopo
Retirada de encomendas, painel administrativo, notificações, app para moradores, relatórios, integrações com transportadoras.

## Não pode mudar
Fluxo de 3 passos, nomes de campos e `data-testid` usados nos testes (`lista`, `apto`, `arquivo-foto`, `video-foto`), contrato com o Supabase (`src/lib/data.ts`), textos dos botões principais.
