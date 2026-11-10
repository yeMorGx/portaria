# Site de apresentação do Portaria

Página de venda, separada do app. React, Vite, TypeScript, Tailwind, GSAP e Lenis.

## Rodar localmente
```bash
cd site
npm install
npm run dev
```

## Antes de publicar
1. Troque o número em `src/config.ts` (`WHATSAPP_NUMERO`, só dígitos, com 55 e DDD).
2. Se quiser, ajuste a mensagem pronta em `WHATSAPP_MENSAGEM`.

## Publicar no Netlify (segundo site, mesma repo)
1. No Netlify: **Add new site → Import an existing project → GitHub → yeMorGx/portaria**.
2. **Base directory:** `site`. O resto vem do `site/netlify.toml` (build `npm run build`, publicação `dist`).
3. Não precisa de variáveis de ambiente.

## Atualizar as telas do app que aparecem no site
Na raiz do projeto: `CAPTURAS=1 npx playwright test telas-site`. As imagens vão para `site/src/assets/telas/`.
