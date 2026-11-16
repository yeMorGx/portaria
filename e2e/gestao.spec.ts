import { expect, test, type Page } from '@playwright/test'

// Capturas opcionais para a verificação visual: CAPTURAS_GESTAO=<pasta>.
const PASTA = process.env.CAPTURAS_GESTAO
async function capturar(page: Page, nome: string) {
  if (!PASTA) return
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${PASTA}/${nome}.png`, fullPage: true })
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('portaria.animacoes')) localStorage.setItem('portaria.animacoes', 'desligadas')
  })
})

async function comecar(page: Page) {
  await page.goto('/')
  await page.getByLabel('Seu nome').fill('Carlos')
  await page.getByRole('button', { name: 'Começar turno' }).click()
  await expect(page.getByRole('heading', { name: 'Encomendas' })).toBeVisible()
}

async function receber(page: Page, codigo: string, destinatario: string, loja: string) {
  await page.getByRole('button', { name: 'Nova Encomenda' }).click()
  await page.getByRole('button', { name: /Escanear código/ }).click()
  await page.getByLabel('Código digitado').fill(codigo)
  await page.getByRole('button', { name: 'Usar código' }).click()
  await page.getByRole('combobox', { name: 'Empresa' }).click()
  await page.getByRole('option', { name: /Empresa de teste/ }).click()
  await page.getByRole('radio', { name: destinatario }).click()
  await page.getByRole('button', { name: 'Próximo' }).click()
  await page.getByRole('radio', { name: loja, exact: true }).first().click()
  await page.getByRole('button', { name: 'Próximo' }).click()
  const png = Buffer.from(
    await page.evaluate(() => {
      const c = document.createElement('canvas')
      c.width = 60
      c.height = 40
      c.getContext('2d')!.fillRect(0, 0, 60, 40)
      return c.toDataURL('image/png').split(',')[1]
    }),
    'base64',
  )
  await page.getByTestId('foto-pacote').setInputFiles({ name: 'p.png', mimeType: 'image/png', buffer: png })
  await page.getByRole('button', { name: 'Próximo' }).click()
  await page.getByRole('radio', { name: 'Recepção' }).click()
  await page.getByRole('button', { name: 'Salvar Encomenda' }).click()
  await page.getByRole('button', { name: 'Avisar o morador' }).waitFor()
  await page.getByRole('button', { name: 'Concluir' }).click()
}

for (const tema of ['light', 'dark'] as const) {
  for (const largura of [1440, 390]) {
    test(`gestão: visão geral, empresas e usuários (${tema}, ${largura}px)`, async ({ page }) => {
      test.skip(!PASTA && (tema === 'dark' || largura === 390), 'variações de tema e largura só para capturas')
      await page.emulateMedia({ colorScheme: tema })
      await page.setViewportSize({ width: largura, height: 900 })
      await comecar(page)
      await receber(page, 'AA111111111BR', 'Maria Fernanda Oliveira', 'Mercado Livre')
      await receber(page, 'BB222222222BR', 'Financeiro', 'Amazon')

      // Visão geral
      await page.getByRole('button', { name: 'Gestão' }).click()
      await expect(page.getByRole('heading', { name: 'Gestão' })).toBeVisible()
      await expect(page.getByTestId('painel-aguardando')).toHaveText('2')
      await expect(page.getByRole('region', { name: 'Recebidas por dia' })).toBeVisible()
      await expect(page.getByRole('region', { name: 'Por empresa' })).toContainText('Empresa de teste')
      await page.getByRole('radio', { name: 'Hoje' }).click()
      await expect(page.getByRole('region', { name: 'Recebidas', exact: true })).toContainText('2')
      await capturar(page, `${tema}-${largura}-1-visao`)

      // Empresas: nova empresa e destinatário com WhatsApp
      await page.getByRole('tab', { name: 'Empresas' }).click()
      await expect(page.getByTestId('lista-empresas')).toContainText('Empresa de teste')
      await capturar(page, `${tema}-${largura}-2-empresas`)
      await page.getByRole('button', { name: 'Nova empresa' }).click()
      await page.getByLabel('Nome da empresa').fill('ZPT Digital')
      await page.getByLabel('Sala', { exact: true }).fill('804')
      await page.getByRole('button', { name: 'Salvar empresa' }).click()
      await page.getByLabel('Novo destinatário', { exact: true }).fill('Recepção ZPT')
      await page.getByLabel('WhatsApp do novo destinatário').fill('(13) 97777-6666')
      await page.getByRole('button', { name: 'Adicionar' }).click()
      await expect(page.getByTestId('destinatarios')).toContainText('WhatsApp 5513977776666')
      await capturar(page, `${tema}-${largura}-3-empresa-painel`)
      await page.getByRole('button', { name: 'Fechar' }).click()
      await expect(page.getByTestId('lista-empresas')).toContainText('ZPT Digital')

      // Usuários: convite com link mascarado, troca de papel e desativação
      await page.getByRole('tab', { name: 'Usuários' }).click()
      await expect(page.getByTestId('lista-usuarios')).toContainText('Carlos Souza')
      await capturar(page, `${tema}-${largura}-4-usuarios`)
      await page.getByRole('button', { name: 'Convidar usuário' }).click()
      await page.getByLabel('Nome', { exact: true }).fill('Beatriz Lima')
      await page.getByLabel('E-mail').fill('beatriz@exemplo.com')
      await page.getByRole('radio', { name: /Porteiro/ }).click()
      await page.getByRole('button', { name: 'Criar convite' }).click()
      await expect(page.getByTestId('link-convite')).toHaveText(/^•+$/)
      await page.getByRole('button', { name: 'Mostrar' }).click()
      await expect(page.getByTestId('link-convite')).toContainText('https://')
      await capturar(page, `${tema}-${largura}-5-convite`)
      await page.getByRole('button', { name: 'Fechar' }).click()
      await expect(page.getByTestId('lista-usuarios')).toContainText('Beatriz Lima')

      await page.getByRole('button', { name: 'Gerenciar Carlos Souza' }).click()
      await page.getByRole('radio', { name: /Síndico/ }).click()
      await page.getByRole('button', { name: 'Salvar papel' }).click()
      await page.getByRole('button', { name: 'Mudar para Síndico' }).click()
      await expect(page.getByText('Papel de Carlos Souza atualizado.')).toBeVisible()

      await page.getByRole('button', { name: 'Gerenciar Carlos Souza' }).click()
      await page.getByRole('button', { name: 'Desativar', exact: true }).click()
      await page.getByRole('button', { name: 'Desativar acesso' }).click()
      await expect(page.getByText('Carlos Souza desativado.')).toBeVisible()

      // A própria conta não se desativa.
      await page.getByRole('button', { name: /Gerenciar Você/ }).click()
      await expect(page.getByRole('button', { name: 'Desativar', exact: true })).toBeDisabled()
      await capturar(page, `${tema}-${largura}-6-gerenciar`)
    })
  }
}
