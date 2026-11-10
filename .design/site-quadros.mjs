// Uso: node .design/site-quadros.mjs <url> <pasta>
// Rola o site em passos (roda do mouse, como uma pessoa) e captura um quadro por passo, no computador e no celular.
import { chromium } from '@playwright/test'
import fs from 'node:fs'

const [url, pasta] = process.argv.slice(2)
fs.mkdirSync(pasta, { recursive: true })
const b = await chromium.launch({ channel: 'msedge' })
for (const [nome, w, h, reduzido, passo] of [
  ['desk', 1440, 900, false, 450],
  ['mob', 390, 844, false, 420],
  ['reduzido', 390, 844, true, 700],
]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: reduzido ? 'reduce' : 'no-preference', hasTouch: nome !== 'desk' })
  const p = await ctx.newPage()
  const erros = []
  p.on('pageerror', (e) => erros.push(e.message))
  p.on('console', (m) => m.type() === 'error' && erros.push(m.text()))
  await p.goto(url, { waitUntil: 'networkidle' })
  await p.waitForTimeout(400)
  await p.screenshot({ path: `${pasta}/${nome}-a00.png` })
  await p.waitForTimeout(2600)
  let anterior = -1
  for (let i = 1; i < 70; i++) {
    await p.screenshot({ path: `${pasta}/${nome}-${String(i).padStart(3, '0')}.png` })
    await p.mouse.move(w / 2, h / 2)
    await p.mouse.wheel(0, passo)
    await p.waitForTimeout(380)
    const y = await p.evaluate(() => Math.round(window.scrollY))
    if (y === anterior) break
    anterior = y
  }
  const largura = await p.evaluate(() => document.documentElement.scrollWidth)
  console.log(nome, 'altura final', anterior, 'largura', largura, 'erros', JSON.stringify(erros.slice(0, 5)))
  await ctx.close()
}
await b.close()
