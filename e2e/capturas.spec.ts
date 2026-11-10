import { test, type Page } from '@playwright/test'

const pasta = process.env.PASTA_CAPTURAS ?? '.design/screens/f2'

async function novaPorCodigo(page: Page, texto: string, extra?: (p: Page) => Promise<void>) {
  await page.getByRole('button', { name: 'Nova Encomenda' }).click()
  await page.getByRole('button', { name: /Escanear código/ }).click()
  await page.getByLabel('Código digitado').fill(texto)
  await page.getByRole('button', { name: 'Usar código' }).click()
  await page.getByRole('heading', { name: 'Conferir encomenda' }).waitFor()
  if (extra) await extra(page)
  await page.getByRole('button', { name: 'Salvar Encomenda' }).click()
  await page.getByTestId('lista').waitFor()
  await page.waitForTimeout(400)
}

for (const [nome, w, h, esquema] of [
  ['mob', 390, 844, 'light'],
  ['desk', 1440, 900, 'light'],
  ['moddark', 390, 844, 'dark'],
] as const) {
  test('capturas fase 2 ' + nome, async ({ page }) => {
    await page.emulateMedia({ colorScheme: esquema })
    await page.setViewportSize({ width: w, height: h })
    await page.goto('/')
    await page.getByLabel('Seu nome').waitFor()
    await page.waitForTimeout(800)
    await page.screenshot({ path: `${pasta}/${nome}-1-turno.png` })
    await page.getByLabel('Seu nome').fill('Carlos')
    await page.getByRole('button', { name: 'Começar turno' }).click()
    await page.getByRole('button', { name: 'Nova Encomenda' }).waitFor()
    await page.waitForTimeout(900)
    await page.screenshot({ path: `${pasta}/${nome}-2-inicio-vazio.png` })

    // Conferência completa
    await page.getByRole('button', { name: 'Nova Encomenda' }).click()
    await page.getByRole('button', { name: /Escanear código/ }).click()
    await page.getByLabel('Código digitado').fill('Mercado Livre Correios SEDEX AB123456789BR Remetente: Casa Leve Ltda São Paulo - SP Maria Fernanda Oliveira apto 202 Pedido: 2000123456')
    await page.getByRole('button', { name: 'Usar código' }).click()
    await page.getByRole('heading', { name: 'Conferir encomenda' }).waitFor()
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `${pasta}/${nome}-3-conferir.png`, fullPage: true })
    await page.getByRole('radio', { name: 'Frágil' }).click()
    await page.getByRole('radio', { name: 'Prateleira A' }).click()
    await page.getByRole('button', { name: 'Salvar Encomenda' }).click()
    await page.getByTestId('lista').waitFor()

    await novaPorCodigo(page, 'TikTok Shop Total Express João Carlos da Silva apto 101')
    await novaPorCodigo(page, 'Shopee Shopee Xpress BR2512345678901 Beatriz Lima Costa apto 505', async (p) => {
      await p.getByRole('radio', { name: 'Envelope' }).click()
    })
    await page.waitForTimeout(1200)
    await page.screenshot({ path: `${pasta}/${nome}-4-lista-aguardando.png`, fullPage: true })

    // Entrega
    await page.getByRole('button', { name: /Entregar para Maria Fernanda/ }).click()
    await page.getByTestId('assinatura').waitFor()
    await page.waitForTimeout(1200)
    await page.screenshot({ path: `${pasta}/${nome}-5-entrega.png`, fullPage: true })
    const codigo = ((await page.getByTestId('codigo-simulado').textContent())!.match(/(\d{6})/))![1]
    await page.getByLabel('Código de retirada').fill(codigo)
    await page.getByTestId('assinatura').scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
    const c = (await page.getByTestId('assinatura').boundingBox())!
    await page.mouse.move(c.x + 40, c.y + 80)
    await page.mouse.down()
    await page.mouse.move(c.x + 110, c.y + 40, { steps: 8 })
    await page.mouse.move(c.x + 180, c.y + 110, { steps: 8 })
    await page.mouse.move(c.x + 260, c.y + 60, { steps: 8 })
    await page.mouse.up()
    await page.waitForTimeout(300)
    await page.screenshot({ path: `${pasta}/${nome}-6-entrega-assinada.png`, fullPage: true })
    await page.getByRole('button', { name: 'Confirmar entrega' }).click()
    await page.getByTestId('lista').waitFor()
    await page.getByRole('radio', { name: /Retiradas/ }).click()
    await page.waitForTimeout(800)
    await page.screenshot({ path: `${pasta}/${nome}-7-retiradas.png`, fullPage: true })
  })
}
