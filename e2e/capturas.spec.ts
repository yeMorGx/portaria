import { test, type Page } from '@playwright/test'

const pasta = process.env.PASTA_CAPTURAS ?? '.design/screens/r1'

async function etiqueta(page: Page, linhas: string[]) {
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

for (const [nome, w, h] of [
  ['mob', 390, 844],
  ['tab', 768, 1024],
  ['desk', 1440, 900],
  ['moddark', 390, 844],
] as const) {
  test('capturas ' + nome, async ({ page }) => {
    if (nome === 'moddark') await page.emulateMedia({ colorScheme: 'dark' })
    await page.setViewportSize({ width: w, height: h })
    await page.goto('/')
    await page.getByRole('button', { name: 'Nova Encomenda' }).waitFor()
    await page.waitForTimeout(900)
    await page.screenshot({ path: `${pasta}/${nome}-1-inicio-vazio.png` })

    await page.getByRole('button', { name: 'Nova Encomenda' }).click()
    await page.getByRole('button', { name: /Fotografar etiqueta/ }).waitFor()
    await page.waitForTimeout(900)
    await page.screenshot({ path: `${pasta}/${nome}-2-escolha.png` })

    await page.getByRole('button', { name: /Fotografar etiqueta/ }).click()
    await page.getByTestId('video-foto').waitFor()
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `${pasta}/${nome}-3-camera.png` })

    const png = await etiqueta(page, ['CORREIOS SEDEX', 'Maria Fernanda Oliveira', 'APTO 202'])
    await page.getByTestId('arquivo-foto').setInputFiles({ name: 'etiqueta.png', mimeType: 'image/png', buffer: png })
    await page.getByText('Lendo a etiqueta').first().waitFor()
    await page.waitForTimeout(600)
    await page.screenshot({ path: `${pasta}/${nome}-4-lendo.png` })

    await page.getByRole('heading', { name: 'Conferir encomenda' }).waitFor({ timeout: 90_000 })
    await page.waitForTimeout(1200)
    await page.screenshot({ path: `${pasta}/${nome}-5-conferir.png` })

    await page.getByRole('combobox', { name: 'Morador' }).click()
    await page.waitForTimeout(400)
    await page.screenshot({ path: `${pasta}/${nome}-6-combobox.png` })
    await page.keyboard.press('Escape')

    await page.getByRole('button', { name: 'Salvar Encomenda' }).click()
    await page.getByTestId('lista').waitFor()
    await page.waitForTimeout(300)
    await page.screenshot({ path: `${pasta}/${nome}-7-sucesso.png` })
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `${pasta}/${nome}-8-lista.png` })
  })
}
