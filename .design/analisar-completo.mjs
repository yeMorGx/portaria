// Uso: node .design/analisar-completo.mjs <url> <nome>
// Versão ampliada de scripts/analisar-site.mjs da skill ui-ux-design: usa o Edge instalado,
// captura o carregamento, rola em passos curtos, testa hover, abre no celular e lê estilos reais.
import { chromium } from '@playwright/test'
import fs from 'node:fs'

const url = process.argv[2]
const name = process.argv[3] ?? 'site'
const out = `.design/refs/${name}`
fs.mkdirSync(out, { recursive: true })

const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const requests = []
page.on('request', (r) => requests.push(r.url()))
const shot = (p, f) => p.screenshot({ path: `${out}/${f}`, type: 'jpeg', quality: 60 }).catch(() => {})

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch((e) => console.error('goto', e.message))
await page.waitForTimeout(500)
await shot(page, 'load-0.5s.jpg')
await page.waitForTimeout(1500)
await shot(page, 'load-2s.jpg')
await page.waitForTimeout(4500)
await shot(page, 'load-6s.jpg')

const info = await page.evaluate(() => {
  const g = (sel) => document.querySelector(sel)
  const cs = (el) => {
    if (!el) return null
    const s = getComputedStyle(el)
    return {
      font: s.fontFamily, size: s.fontSize, weight: s.fontWeight, lh: s.lineHeight,
      ls: s.letterSpacing, color: s.color, bg: s.backgroundColor, radius: s.borderRadius,
      text: (el.textContent || '').trim().slice(0, 50),
    }
  }
  const fontsLoaded = [...document.fonts].map((f) => `${f.family} ${f.weight} ${f.status}`)
  const rootVars = []
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.selectorText === ':root') {
          for (const p of rule.style) if (p.startsWith('--')) rootVars.push(`${p}: ${rule.style.getPropertyValue(p).trim()}`)
        }
      }
    } catch {}
  }
  return {
    title: document.title,
    pageHeight: document.documentElement.scrollHeight,
    htmlClass: document.documentElement.className,
    libs: {
      gsap: !!window.gsap, scrollTrigger: !!window.ScrollTrigger, lenis: !!(window.lenis || window.Lenis) || /lenis/.test(document.documentElement.className),
      locomotive: !!window.locomotiveScroll || /has-scroll-smooth/.test(document.documentElement.className),
      three: !!window.THREE, barba: !!window.barba, webflow: !!window.Webflow,
      framer: !!document.querySelector('[data-framer-name], [data-framer-component-type]'),
      nextjs: !!window.__NEXT_DATA__, react: !!document.querySelector('[data-reactroot]'),
    },
    counts: {
      canvas: document.querySelectorAll('canvas').length, video: document.querySelectorAll('video').length,
      svg: document.querySelectorAll('svg').length, img: document.querySelectorAll('img').length,
      buttons: document.querySelectorAll('button, a[role=button]').length,
    },
    body: cs(document.body), h1: cs(g('h1')), h2: cs(g('h2')), p: cs(g('p')), a: cs(g('a')), button: cs(g('button, a[class*=btn], a[class*=button]')),
    fontsLoaded: [...new Set(fontsLoaded)].slice(0, 20),
    rootVars: rootVars.slice(0, 40),
    scripts: [...document.scripts].map((s) => s.src).filter(Boolean).slice(0, 30),
  }
})

// Inércia do scroll
const y0 = await page.evaluate(() => window.scrollY)
await page.mouse.move(720, 450)
await page.mouse.wheel(0, 600)
await page.waitForTimeout(60)
const y1 = await page.evaluate(() => window.scrollY)
await page.waitForTimeout(1200)
const y2 = await page.evaluate(() => window.scrollY)
await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(800)

// Rolagem em passos curtos
const steps = Math.min(24, Math.max(4, Math.ceil(info.pageHeight / 600)))
const positions = []
for (let i = 0; i < steps; i++) {
  await shot(page, `scroll-${String(i).padStart(2, '0')}.jpg`)
  positions.push(await page.evaluate(() => Math.round(window.scrollY)))
  await page.mouse.wheel(0, 600)
  await page.waitForTimeout(1100)
}

// Hover nos elementos interativos visíveis no topo
await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(1200)
const alvos = await page.$$('a:visible, button:visible')
const hover = []
for (let i = 0, feitos = 0; i < alvos.length && feitos < 6; i++) {
  const box = await alvos[i].boundingBox()
  if (!box || box.y > 880 || box.width < 20 || box.height < 12) continue
  const antes = await alvos[i].evaluate((el) => { const s = getComputedStyle(el); return [s.color, s.backgroundColor, s.transform, s.opacity, s.textDecorationLine].join(' | ') })
  await alvos[i].hover({ timeout: 2000 }).catch(() => {})
  await page.waitForTimeout(500)
  const depois = await alvos[i].evaluate((el) => { const s = getComputedStyle(el); return [s.color, s.backgroundColor, s.transform, s.opacity, s.textDecorationLine].join(' | ') })
  await shot(page, `hover-${feitos}.jpg`)
  hover.push({ texto: (await alvos[i].textContent())?.trim().slice(0, 30), mudou: antes !== depois, antes, depois })
  feitos++
}

// Celular
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
await mobile.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {})
await mobile.waitForTimeout(6000)
const mobileOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
for (let i = 0; i < 6; i++) {
  await shot(mobile, `mobile-${i}.jpg`)
  await mobile.mouse.wheel(0, 700)
  await mobile.waitForTimeout(1100)
}

const libsRede = [...new Set(requests.map((u) => (u.match(/(gsap|ScrollTrigger|lenis|locomotive|three|barba|framer|motion|swiper|splitting|splittype|lottie|rive|webflow|next)[^/]*\.js/i) || [])[0]).filter(Boolean))]
const report = { url, ...info, scrollInertia: { inertia: y2 > y1 + 20, y0, y1, y2 }, scrollPositions: positions, hover, mobileOverflowHorizontal: mobileOverflow, libsDetectadasNaRede: libsRede }
fs.writeFileSync(`${out}/relatorio.json`, JSON.stringify(report, null, 2))

// Folhas de contato para ver tudo de uma vez
const files = fs.readdirSync(out).filter((f) => f.endsWith('.jpg')).sort()
const grupos = [files.filter((f) => f.startsWith('load') || f.startsWith('scroll')), files.filter((f) => f.startsWith('hover') || f.startsWith('mobile'))]
for (let n = 0; n < grupos.length; n++) {
  if (!grupos[n].length) continue
  const html = `<body style="margin:0;background:#222;display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:6px;width:1500px">${grupos[n]
    .map((f) => `<figure style="margin:0;color:#fff;font:12px sans-serif"><img src="data:image/jpeg;base64,${fs.readFileSync(`${out}/${f}`).toString('base64')}" style="width:100%;display:block">${f}</figure>`)
    .join('')}</body>`
  const sheet = await browser.newPage({ viewport: { width: 1500, height: 800 } })
  await sheet.setContent(html)
  await sheet.screenshot({ path: `${out}/folha-${n}.png`, fullPage: true })
}
console.log(JSON.stringify({ nome: name, libs: info.libs, inertia: report.scrollInertia.inertia, altura: info.pageHeight, fontes: info.fontsLoaded, hover: hover.map((h) => `${h.texto}:${h.mudou}`) }))
await browser.close()
