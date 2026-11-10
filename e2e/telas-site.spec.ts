import { test, type Page } from '@playwright/test'

// Gera as capturas reais do app que aparecem no celular do site de apresentação (site/src/assets/telas).
const pasta = 'site/src/assets/telas'
test.use({ deviceScaleFactor: 2 })

async function etiqueta(page: Page, linhas: string[]) {
  const base64 = await page.evaluate((ls) => {
    const c = document.createElement('canvas')
    c.width = 900
    c.height = 600
    const g = c.getContext('2d')!
    g.fillStyle = '#fbfaf6'
    g.fillRect(0, 0, c.width, c.height)
    g.strokeStyle = '#111'
    g.lineWidth = 6
    g.strokeRect(30, 30, 840, 540)
    g.fillStyle = '#111'
    g.font = 'bold 44px Arial'
    ls.forEach((l, i) => g.fillText(l, 70, 120 + i * 90))
    return c.toDataURL('image/png').split(',')[1]
  }, linhas)
  return Buffer.from(base64, 'base64')
}

async function foto(page: Page, nome: string, cheia = false) {
  await page.screenshot({ path: `${pasta}/${nome}.jpg`, type: 'jpeg', quality: 85, fullPage: cheia })
}

async function porCodigo(page: Page, texto: string) {
  await page.getByRole('button', { name: 'Nova Encomenda' }).click()
  await page.getByRole('button', { name: /Escanear código/ }).click()
  await page.getByLabel('Código digitado').fill(texto)
  await page.getByRole('button', { name: 'Usar código' }).click()
  await page.getByRole('button', { name: 'Salvar Encomenda' }).click()
  await page.getByTestId('lista').waitFor()
}

test('capturas do app para o site', async ({ page }) => {
  test.setTimeout(240_000)
  await page.addInitScript(() => localStorage.setItem('portaria.animacoes', 'desligadas'))
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/')
  // Esconde (sem remover do DOM) os avisos e a dica de modo simulado, que não devem aparecer no site de venda.
  await page.addStyleTag({ content: '[data-sonner-toaster], [data-testid=codigo-simulado] { display: none !important }' })
  await page.getByLabel('Seu nome').fill('Carlos')
  await page.getByRole('button', { name: 'Começar turno' }).click()

  await porCodigo(page, 'TikTok Shop Total Express João Carlos da Silva apto 101')
  await porCodigo(page, 'Shopee Shopee Xpress BR2512345678901 Beatriz Lima Costa apto 505')
  await page.waitForTimeout(500)
  await foto(page, 'inicio')

  // Encomenda da Maria por código (sem depender do OCR), com loja e local de guarda.
  await page.getByRole('button', { name: 'Nova Encomenda' }).click()
  await page.getByRole('button', { name: /Escanear código/ }).click()
  await page.getByLabel('Código digitado').fill('Mercado Livre Correios AB123456789BR Maria Fernanda Oliveira apto 202')
  await page.getByRole('button', { name: 'Usar código' }).click()
  await page.getByRole('heading', { name: 'Conferir encomenda' }).waitFor()
  await page.getByRole('radio', { name: 'Prateleira A' }).first().click({ timeout: 5000 }).catch(() => {})
  await page.getByRole('button', { name: 'Salvar Encomenda' }).click()
  await page.getByTestId('lista').waitFor()

  // Entrega: código e assinatura
  await page.getByRole('button', { name: /Entregar para Maria Fernanda/ }).click()
  await page.getByTestId('assinatura').waitFor()
  const codigo = ((await page.getByTestId('codigo-simulado').textContent())!.match(/(\d{6})/))![1]
  await page.getByLabel('Código de retirada').fill(codigo)
  await page.getByTestId('assinatura').scrollIntoViewIfNeeded()
  const c = (await page.getByTestId('assinatura').boundingBox())!
  await page.mouse.move(c.x + 40, c.y + 90)
  await page.mouse.down()
  await page.mouse.move(c.x + 90, c.y + 40, { steps: 8 })
  await page.mouse.move(c.x + 140, c.y + 120, { steps: 8 })
  await page.mouse.move(c.x + 200, c.y + 50, { steps: 8 })
  await page.mouse.move(c.x + 280, c.y + 100, { steps: 8 })
  await page.mouse.up()
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(200)
  await foto(page, 'entrega', true)
  await page.getByRole('button', { name: 'Confirmar entrega' }).click()
  await page.getByTestId('lista').waitFor()
  await page.getByRole('radio', { name: /Retiradas/ }).click()
  await page.waitForTimeout(400)
  await foto(page, 'retiradas')

  // Recebe: tela de leitura da etiqueta (não espera o OCR terminar)
  await page.getByRole('radio', { name: /Aguardando/ }).click()
  await page.getByRole('button', { name: 'Nova Encomenda' }).click()
  await page.getByRole('button', { name: /Fotografar etiqueta/ }).click()
  const png = await etiqueta(page, ['CORREIOS  SEDEX', 'AB123456789BR', 'Maria Fernanda Oliveira', 'APTO 202  BLOCO A', 'Mercado Livre'])
  await page.getByTestId('arquivo-foto').setInputFiles({ name: 'etiqueta.png', mimeType: 'image/png', buffer: png })
  await page.getByText('Lendo a etiqueta').first().waitFor()
  await page.waitForTimeout(400)
  await foto(page, 'lendo')
})
