import { test, type Page } from '@playwright/test'

const pasta = '.design/screens/cinema'

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
  test('cinema ' + nome, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('portaria.animacoes', 'ligadas'))
    await page.setViewportSize({ width: w, height: h })
    await page.goto('/')
    // Abertura, cortina e entrada da tela inicial
    await quadros(page, `${nome}-a`, 20, 110)
    await page.getByLabel('Seu nome').waitFor({ timeout: 15000 })
    await page.getByLabel('Seu nome').fill('Carlos')
    await page.getByRole('button', { name: 'Começar turno' }).click()
    await quadros(page, `${nome}-b`, 14, 100)
    await page.getByRole('button', { name: 'Nova Encomenda' }).waitFor()
    await page.waitForTimeout(1800)
    await quadros(page, `${nome}-c`, 2, 50)

    // Transição por cortina ao abrir Nova Encomenda
    await page.getByRole('button', { name: 'Nova Encomenda' }).click()
    await quadros(page, `${nome}-d`, 12, 60)

    // Recebe e entrega para ver a celebração
    await page.getByRole('button', { name: /Escanear código/ }).waitFor()
    await page.getByRole('button', { name: /Escanear código/ }).click()
    await page.getByLabel('Código digitado').fill('Mercado Livre Correios AB123456789BR Maria Fernanda Oliveira apto 202')
    await page.getByRole('button', { name: 'Usar código' }).click()
    await page.getByRole('button', { name: 'Salvar Encomenda' }).click()
    await page.getByTestId('lista').waitFor()
    await page.waitForTimeout(1500)
    await page.getByRole('button', { name: /Entregar para Maria/ }).click()
    await page.getByTestId('assinatura').waitFor()
    await page.waitForTimeout(1200)
    const codigo = ((await page.getByTestId('codigo-simulado').textContent())!.match(/(\d{6})/))![1]
    await page.getByLabel('Código de retirada').fill(codigo)
    await page.getByTestId('assinatura').scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
    const c = (await page.getByTestId('assinatura').boundingBox())!
    await page.mouse.move(c.x + 40, c.y + 80)
    await page.mouse.down()
    await page.mouse.move(c.x + 140, c.y + 40, { steps: 6 })
    await page.mouse.move(c.x + 240, c.y + 100, { steps: 6 })
    await page.mouse.up()
    await page.getByRole('button', { name: 'Confirmar entrega' }).click()
    await quadros(page, `${nome}-e`, 18, 100)
  })
}
