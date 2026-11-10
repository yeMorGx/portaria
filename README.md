# Portaria — Registro de Encomendas

Sistema web simples para a portaria registrar encomendas: fotografar a etiqueta (OCR) ou ler código de barras/QR, conferir o morador e salvar. Substitui a caderneta de papel.

**Stack:** React + Vite + TypeScript + Tailwind · Supabase (Postgres, Storage, Auth) · Tesseract.js (OCR no navegador) · ZXing (códigos).

## Rodar localmente

```bash
npm install
npm run dev
```

Sem configuração, abre em **modo demonstração** (dados em memória, sem login), útil para apresentar o sistema.

## Configurar o Supabase (produção)

1. Crie um projeto em supabase.com.
2. No **SQL Editor**, execute `supabase/schema.sql` (tabelas, RLS e bucket privado `etiquetas`) e, em seguida, `supabase/migrations/002_fase2_pedido_completo.sql` (pedido completo, ciclo de retirada e consentimento do morador).
3. Em **Authentication → Users**, crie a conta da portaria (e-mail e senha). Desative o cadastro público em **Authentication → Providers → Email → Allow new users to sign up**.
4. Cadastre os moradores na tabela `moradores` (Table Editor → Import CSV, colunas `nome`, `apartamento`, `bloco`, `telefone` em formato +55DDDNÚMERO e `consentimento_em` com a data do aceite para receber avisos).
5. Copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (Project Settings → API).

## Deploy

`npm run build` gera `dist/`. Publique em um host HTTPS (Netlify, Vercel), definindo as duas variáveis de ambiente acima. HTTPS é obrigatório para o navegador liberar a câmera.

## Testes

```bash
npm test          # unitários (parser de etiquetas)
npm run test:e2e  # Playwright, usa o Microsoft Edge instalado
```

## Observações

- O OCR baixa o modelo de idioma português na primeira leitura (precisa de internet nessa vez) e depende da qualidade da foto; sempre é possível corrigir o morador manualmente.
- Skills de design/teste usadas no desenvolvimento ficam em `.claude/skills/` (Taste Skill, Impeccable, Playwright).
