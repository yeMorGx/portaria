import { expect, test } from '@playwright/test'

// Gera uma "etiqueta" em PNG desenhando texto num canvas dentro do navegador.
async function etiqueta(page: import('@playwright/test').Page, linhas: string[]) {
  const base64 = await page.evaluate((ls) => {
    const c = document.createElement('canvas')
    c.width = 1200
    c.height = 600
    const g = c.getContext('2d')!
    g.fillStyle = '#fff'
    g.fillRect(0, 0, c.width, c.height)
    g.fillStyle = '#000'
    g.font = 'bold 60px Arial'
    ls.forEach((l, i) => g.fillText(l, 60, 100 + i * 100))
    return c.toDataURL('image/png').split(',')[1]
  }, linhas)
  return Buffer.from(base64, 'base64')
}

test('registra encomenda por foto da etiqueta (modo demonstração)', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Encomendas' })).toBeVisible()
  await expect(page.getByText('Nenhuma encomenda registrada ainda')).toBeVisible()

  await page.getByRole('button', { name: 'Nova Encomenda' }).click()
  await page.getByRole('button', { name: /Fotografar etiqueta/ }).click()

  const png = await etiqueta(page, ['CORREIOS SEDEX', 'Maria Fernanda Oliveira', 'APTO 202'])
  await page.getByTestId('arquivo-foto').setInputFiles({ name: 'etiqueta.png', mimeType: 'image/png', buffer: png })

  await expect(page.getByRole('heading', { name: 'Conferir encomenda' })).toBeVisible({ timeout: 90_000 })
  await expect(page.getByLabel('Morador', { exact: true })).toHaveValue('2')
  await expect(page.getByTestId('apto')).toHaveText('202')
  await expect(page.getByPlaceholder('Opcional')).toHaveValue('Correios')

  await page.getByRole('button', { name: 'Salvar Encomenda' }).click()
  const lista = page.getByTestId('lista')
  await expect(lista).toContainText('Maria Fernanda Oliveira')
  await expect(lista).toContainText('Apto 202')
  await expect(lista).toContainText('Correios')
})

test('permite seleção manual quando o morador não é identificado', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Nova Encomenda' }).click()
  await page.getByRole('button', { name: /Escanear código/ }).click()
  await page.getByLabel('Código digitado').fill('XYZ123456BR')
  await page.getByRole('button', { name: 'Usar código' }).click()

  await expect(page.getByText('Não foi possível identificar o morador')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Salvar Encomenda' })).toBeDisabled()
  await page.getByLabel('Morador', { exact: true }).selectOption({ label: 'José Almeida — Apto 404' })
  await page.getByRole('button', { name: 'Salvar Encomenda' }).click()
  await expect(page.getByTestId('lista')).toContainText('José Almeida')
})
