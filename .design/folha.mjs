import { chromium } from '@playwright/test'
import fs from 'node:fs'
const [pasta, prefixo, largura, colunas] = process.argv.slice(2)
const arqs = fs.readdirSync(pasta).filter((f) => f.startsWith(prefixo) && f.endsWith('.png')).sort()
const html = `<body style="margin:0;background:#888;display:grid;grid-template-columns:repeat(${colunas},${largura}px);gap:8px;padding:8px;width:${(+largura + 8) * +colunas}px">${arqs
  .map((f) => `<figure style="margin:0;font:12px sans-serif;color:#fff"><img src="data:image/png;base64,${fs.readFileSync(`${pasta}/${f}`).toString('base64')}" style="width:100%;display:block">${f}</figure>`)
  .join('')}</body>`
const b = await chromium.launch({ channel: 'msedge' })
const p = await b.newPage({ viewport: { width: (+largura + 8) * +colunas + 16, height: 800 } })
await p.setContent(html)
await p.screenshot({ path: `${pasta}/folha-${prefixo}.png`, fullPage: true })
await b.close()
