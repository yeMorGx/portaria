import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import QRCode from 'qrcode'

// Gera um vídeo (y4m) de 640x480 com um QR Code real no centro e usa como câmera simulada.
const TEXTO = 'Mercado Livre Correios AB123456789BR Maria Fernanda Oliveira apto 202'
const arquivo = path.resolve('test-results', 'qr.y4m')
fs.mkdirSync(path.dirname(arquivo), { recursive: true })
{
  const W = 640
  const H = 480
  const qr = QRCode.create(TEXTO, { errorCorrectionLevel: 'M' })
  const n = qr.modules.size
  const margem = 4
  const escala = Math.floor(Math.min(W, H) / (n + margem * 2))
  const lado = (n + margem * 2) * escala
  const x0 = Math.floor((W - lado) / 2)
  const y0 = Math.floor((H - lado) / 2)
  const Y = Buffer.alloc(W * H, 235)
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!qr.modules.get(r, c)) continue
      for (let dy = 0; dy < escala; dy++) {
        for (let dx = 0; dx < escala; dx++) {
          Y[(y0 + (r + margem) * escala + dy) * W + x0 + (c + margem) * escala + dx] = 16
        }
      }
    }
  }
  const U = Buffer.alloc((W / 2) * (H / 2), 128)
  const frames = [Buffer.from('FRAME\n'), Y, U, U]
  const cab = Buffer.from(`YUV4MPEG2 W${W} H${H} F30:1 Ip A1:1 C420jpeg\n`)
  fs.writeFileSync(arquivo, Buffer.concat([cab, ...Array.from({ length: 30 }, () => Buffer.concat(frames))]))
}

test.use({
  launchOptions: {
    args: [
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
      `--use-file-for-fake-video-capture=${arquivo}`,
    ],
  },
})

test('lê um QR Code de verdade pela câmera e trava no alvo', async ({ page }) => {
  fs.mkdirSync('.design/screens/cinema2', { recursive: true })
  await page.addInitScript(() => localStorage.setItem('portaria.animacoes', 'ligadas'))
  await page.goto('/')
  await page.getByLabel('Seu nome').waitFor({ timeout: 20000 })
  await page.getByLabel('Seu nome').fill('Carlos')
  await page.getByRole('button', { name: 'Começar turno' }).click()
  await page.getByRole('button', { name: 'Nova Encomenda' }).waitFor()
  await page.waitForTimeout(1800)
  await page.getByRole('button', { name: 'Nova Encomenda' }).click()
  await page.getByRole('button', { name: /Escanear código/ }).click()

  // Quadros do visor e do "travar no alvo" (o QR aparece no vídeo e é decodificado).
  for (let i = 0; i < 16; i++) {
    await page.screenshot({ path: `.design/screens/cinema2/scan-${String(i).padStart(2, '0')}.png` })
    await page.waitForTimeout(100)
    if (await page.getByRole('heading', { name: 'Conferir encomenda' }).isVisible()) break
  }
  await expect(page.getByRole('heading', { name: 'Conferir encomenda' })).toBeVisible({ timeout: 20000 })
  await expect(page.getByRole('combobox', { name: 'Morador' })).toContainText('Maria Fernanda Oliveira')
  await expect(page.getByRole('radio', { name: 'Correios', exact: true })).toBeChecked()
})
