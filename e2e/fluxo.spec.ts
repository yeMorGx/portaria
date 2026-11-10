import { expect, test, type Page } from '@playwright/test'

// Gera uma "etiqueta" em PNG desenhando texto num canvas dentro do navegador.
async function etiqueta(page: Page, linhas: string[]) {
  const base64 = await page.evaluate((ls) => {
    const c = document.createElement('canvas')
    c.width = 1200
    c.height = 700
    const g = c.getContext('2d')!
    g.fillStyle = '#fff'
    g.fillRect(0, 0, c.width, c.height)
    g.fillStyle = '#000'
    g.font = 'bold 56px Arial'
    ls.forEach((l, i) => g.fillText(l, 50, 90 + i * 100))
    return c.toDataURL('image/png').split(',')[1]
  }, linhas)
  return Buffer.from(base64, 'base64')
}

async function comecarTurno(page: Page, nome = 'Carlos') {
  await page.goto('/')
  await page.getByRole('heading', { name: 'Quem está na portaria?' }).waitFor()
  await page.getByLabel('Seu nome').fill(nome)
  await page.getByRole('button', { name: 'Começar turno' }).click()
  await expect(page.getByRole('heading', { name: 'Encomendas' })).toBeVisible()
}

async function assinar(page: Page) {
  await page.getByTestId('assinatura').scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)
  const caixa = (await page.getByTestId('assinatura').boundingBox())!
  await page.mouse.move(caixa.x + 40, caixa.y + 60)
  await page.mouse.down()
  await page.mouse.move(caixa.x + 120, caixa.y + 100, { steps: 6 })
  await page.mouse.move(caixa.x + 200, caixa.y + 50, { steps: 6 })
  await page.mouse.up()
}

test('recebe por foto, completa o pedido e entrega com código e assinatura', async ({ page }) => {
  await comecarTurno(page)
  await expect(page.getByText('Nenhuma encomenda aguardando')).toBeVisible()
  await expect(page.getByTestId('contador-aguardando')).toHaveText('0')

  await page.getByRole('button', { name: 'Nova Encomenda' }).click()
  await page.getByRole('button', { name: /Fotografar etiqueta/ }).click()
  const png = await etiqueta(page, ['CORREIOS SEDEX AB123456789BR', 'Maria Fernanda Oliveira', 'APTO 202'])
  await page.getByTestId('arquivo-foto').setInputFiles({ name: 'etiqueta.png', mimeType: 'image/png', buffer: png })

  await expect(page.getByRole('heading', { name: 'Conferir encomenda' })).toBeVisible({ timeout: 90_000 })
  await expect(page.getByRole('combobox', { name: 'Morador' })).toContainText('Maria Fernanda Oliveira')
  await expect(page.getByTestId('apto')).toHaveText('202')
  await expect(page.getByRole('radio', { name: 'Correios' })).toBeChecked()

  // Completa o pedido: loja, tipo, volumes, condição e local de guarda.
  await page.getByRole('radio', { name: 'Shopee', exact: true }).first().click()
  await page.getByRole('radio', { name: 'Envelope' }).click()
  await page.getByRole('button', { name: 'Aumentar' }).click()
  await page.getByRole('radio', { name: 'Frágil' }).click()
  await page.getByRole('radio', { name: 'Prateleira A' }).click()

  await page.getByRole('button', { name: 'Salvar Encomenda' }).click()
  const lista = page.getByTestId('lista')
  await expect(lista).toContainText('Maria Fernanda Oliveira')
  await expect(lista).toContainText('Envelope · 2 volumes')
  await expect(lista).toContainText('Frágil')
  await expect(lista).toContainText('Prateleira A')
  await expect(lista).toContainText('Comprado em Shopee')
  await expect(page.getByTestId('contador-aguardando')).toHaveText('1')

  // Entrega: código do morador + assinatura.
  await page.getByRole('button', { name: /Entregar para Maria Fernanda/ }).click()
  await expect(page.getByRole('heading', { name: 'Entregar ao morador' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirmar entrega' })).toBeDisabled()
  const dica = (await page.getByTestId('codigo-simulado').textContent())!
  const codigo = dica.match(/(\d{6})/)![1]
  await page.getByLabel('Código de retirada').fill(codigo)
  await assinar(page)
  await page.getByRole('button', { name: 'Confirmar entrega' }).click()

  await expect(page.getByTestId('contador-aguardando')).toHaveText('0')
  await page.getByRole('radio', { name: /Retiradas/ }).click()
  await expect(page.getByTestId('lista')).toContainText('Maria Fernanda Oliveira')
})

test('seleção manual do morador quando o código lido não identifica', async ({ page }) => {
  await comecarTurno(page)
  await page.getByRole('button', { name: 'Nova Encomenda' }).click()
  await page.getByRole('button', { name: /Escanear código/ }).click()
  await page.getByLabel('Código digitado').fill('XYZ123456BR')
  await page.getByRole('button', { name: 'Usar código' }).click()

  await expect(page.getByText('Não foi possível identificar o morador')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Salvar Encomenda' })).toBeDisabled()
  await page.getByRole('combobox', { name: 'Morador' }).click()
  await page.getByRole('option', { name: /José Almeida/ }).click()
  await expect(page.getByLabel('Código de rastreio')).toHaveValue('XYZ123456BR')
  await page.getByRole('button', { name: 'Salvar Encomenda' }).click()
  await expect(page.getByTestId('lista')).toContainText('José Almeida')
})

test('entrega: código errado é recusado; sem código exige justificativa', async ({ page }) => {
  await comecarTurno(page)
  await page.getByRole('button', { name: 'Nova Encomenda' }).click()
  await page.getByRole('button', { name: /Escanear código/ }).click()
  await page.getByLabel('Código digitado').fill('AB123456789BR')
  await page.getByRole('button', { name: 'Usar código' }).click()
  await page.getByRole('combobox', { name: 'Morador' }).click()
  await page.getByRole('option', { name: /Ana Paula Souza/ }).click()
  await page.getByRole('button', { name: 'Salvar Encomenda' }).click()
  await expect(page.getByText(/sem telefone ou consentimento/)).toBeVisible()

  await page.getByRole('button', { name: /Entregar para Ana Paula/ }).click()
  await expect(page.getByTestId('codigo-simulado')).toBeVisible()
  await page.getByLabel('Código de retirada').fill('000000')
  await assinar(page)
  await page.getByRole('button', { name: 'Confirmar entrega' }).click()
  await expect(page.getByRole('alert')).toContainText('Código incorreto')

  await page.getByRole('button', { name: 'Morador sem o código' }).click()
  await expect(page.getByRole('button', { name: 'Confirmar entrega' })).toBeDisabled()
  await page.getByLabel('Justificativa').fill('Morador esqueceu o celular')
  await page.getByRole('button', { name: 'Confirmar entrega' }).click()
  await expect(page.getByTestId('contador-aguardando')).toHaveText('0')
})
