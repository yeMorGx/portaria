import { test, type Page } from '@playwright/test'

const pasta = '.design/screens/cinema2'

async function quadros(page: Page, prefixo: string, n: number, intervalo = 90) {
  for (let i = 0; i < n; i++) {
    await page.screenshot({ path: `${pasta}/${prefixo}-${String(i).padStart(2, '0')}.png` })
    await page.waitForTimeout(intervalo)
  }
}

for (const [nome, w, h] of [
  ['desk', 1280, 760],
  ['mob', 390, 760],
] as const) {
  test('camera e transicoes ' + nome, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('portaria.animacoes', 'ligadas'))
    await page.setViewportSize({ width: w, height: h })
    await page.goto('/')
    await page.getByLabel('Seu nome').waitFor({ timeout: 15000 })
    await page.getByLabel('Seu nome').fill('Carlos')
    await page.getByRole('button', { name: 'Começar turno' }).click()
    await page.getByRole('button', { name: 'Nova Encomenda' }).waitFor()
    await page.waitForTimeout(2200)

    // Troca de tela do dia a dia: deslize, sem cortina
    await page.getByRole('button', { name: 'Nova Encomenda' }).click()
    await quadros(page, `${nome}-a`, 8, 45)
    await page.waitForTimeout(900)

    // Câmera de foto: cantos, laser e dica
    await page.getByRole('button', { name: /Fotografar etiqueta/ }).click()
    await page.getByTestId('video-foto').waitFor()
    await quadros(page, `${nome}-b`, 10, 120)

    // Flash do obturador
    await page.waitForTimeout(800)
    await page.getByRole('button', { name: 'Fotografar etiqueta' }).click()
    await quadros(page, `${nome}-c`, 10, 40)
    await page.waitForTimeout(2500)
  })
}
