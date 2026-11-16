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

// Os testes rodam com animações desligadas para serem rápidos e determinísticos.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('portaria.animacoes')) localStorage.setItem('portaria.animacoes', 'desligadas')
  })
})

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

// Passo 1 da conferência: escolhe a empresa e, se houver, o destinatário.
async function escolherEmpresa(page: Page, destinatario?: string) {
  await page.getByRole('combobox', { name: 'Empresa' }).click()
  await page.getByRole('option', { name: /Empresa de teste/ }).click()
  if (destinatario) await page.getByRole('radio', { name: destinatario }).click()
}

// Passo 3 da conferência: a foto do pacote é obrigatória para salvar.
async function fotoDoPacote(page: Page) {
  const png = await etiqueta(page, ['PACOTE'])
  await page.getByTestId('foto-pacote').setInputFiles({ name: 'pacote.png', mimeType: 'image/png', buffer: png })
}

async function proximo(page: Page) {
  await page.getByRole('button', { name: 'Próximo' }).click()
}

// Tela final do recebimento: oferece o aviso pelo WhatsApp e volta ao início em "Concluir".
async function concluir(page: Page, mensagem?: string | RegExp) {
  await expect(page.getByRole('heading', { name: 'Encomenda registrada' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Avisar o morador' })).toBeVisible()
  if (mensagem) await expect(page.getByLabel('Mensagem do aviso')).toHaveValue(mensagem)
  await page.getByRole('button', { name: 'Concluir' }).click()
}

async function receberPorCodigo(page: Page, codigo: string, destinatario: string) {
  await page.getByRole('button', { name: 'Nova Encomenda' }).click()
  await page.getByRole('button', { name: /Escanear código/ }).click()
  await page.getByLabel('Código digitado').fill(codigo)
  await page.getByRole('button', { name: 'Usar código' }).click()
  await escolherEmpresa(page, destinatario)
  await proximo(page)
  await proximo(page)
  await fotoDoPacote(page)
  await proximo(page)
  await page.getByRole('button', { name: 'Salvar Encomenda' }).click()
}

test('encomendas da mesma empresa ficam empilhadas e a mensagem conta quantas aguardam', async ({ page }) => {
  await comecarTurno(page)
  await receberPorCodigo(page, 'AA111111111BR', 'Maria Fernanda Oliveira')
  await concluir(page, /^Olá, Maria Fernanda Oliveira! Chegou uma encomenda para Empresa de teste na portaria/)
  await receberPorCodigo(page, 'BB222222222BR', 'Financeiro')
  await concluir(page, /^Olá, Financeiro! Chegaram 2 encomendas para Empresa de teste na portaria/)

  const pilha = page.getByRole('button', { name: '2 encomendas para Empresa de teste' })
  await expect(pilha).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByRole('button', { name: /Entregar para/ })).toHaveCount(0)
  await pilha.click()
  await expect(pilha).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('button', { name: 'Entregar para Maria Fernanda Oliveira' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Entregar para Financeiro' })).toBeVisible()
  await expect(page.getByTestId('contador-aguardando')).toHaveText('2')
})

test('recebe por foto, completa o pedido por passos e entrega com código e assinatura', async ({ page }) => {
  await comecarTurno(page)
  await expect(page.getByText('Nenhuma encomenda aguardando')).toBeVisible()
  await expect(page.getByTestId('contador-aguardando')).toHaveText('0')

  await page.getByRole('button', { name: 'Nova Encomenda' }).click()
  await page.getByRole('button', { name: /Fotografar etiqueta/ }).click()
  const png = await etiqueta(page, ['CORREIOS SEDEX', 'Empresa de teste', 'Sala 101'])
  await page.getByTestId('arquivo-foto').setInputFiles({ name: 'etiqueta.png', mimeType: 'image/png', buffer: png })

  // Passo 1: empresa e destinatário
  await expect(page.getByRole('heading', { name: 'Conferir encomenda' })).toBeVisible({ timeout: 90_000 })
  await expect(page.getByRole('combobox', { name: 'Empresa' })).toContainText('Empresa de teste')
  await page.getByRole('radio', { name: 'Maria Fernanda Oliveira' }).click()
  await proximo(page)

  // Passo 2: loja e transportadora
  await expect(page.getByRole('radio', { name: 'Correios', exact: true })).toBeChecked()
  await page.getByRole('radio', { name: 'Shopee', exact: true }).first().click()
  await proximo(page)

  // Passo 3: pacote, com foto obrigatória
  await page.getByRole('radio', { name: 'Envelope' }).click()
  await page.getByRole('button', { name: 'Aumentar' }).click()
  await page.getByRole('radio', { name: 'Frágil' }).click()
  await expect(page.getByRole('button', { name: 'Próximo' })).toBeDisabled()
  await fotoDoPacote(page)
  await proximo(page)

  // Passo 4: guarda e revisão
  await page.getByRole('radio', { name: 'Prateleira A' }).click()
  await page.getByRole('button', { name: 'Salvar Encomenda' }).click()
  await concluir(page)

  const lista = page.getByTestId('lista')
  await expect(lista).toContainText('Maria Fernanda Oliveira')
  await expect(lista).toContainText('Envelope · 2 volumes')
  await expect(lista).toContainText('Frágil')
  await expect(lista).toContainText('Prateleira A')
  await expect(lista).toContainText('Comprado em Shopee')
  await expect(page.getByTestId('contador-aguardando')).toHaveText('1')

  // Sem telefone de contato na empresa, não há código: a entrega sai só com justificativa.
  await page.getByRole('button', { name: /Entregar para Maria Fernanda/ }).click()
  await expect(page.getByRole('heading', { name: 'Entregar ao morador' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirmar entrega' })).toBeDisabled()
  await page.getByRole('button', { name: 'Morador sem o código' }).click()
  await page.getByLabel('Justificativa').fill('Entregue na recepção da empresa')
  await assinar(page)
  await page.getByRole('button', { name: 'Confirmar entrega' }).click()

  await expect(page.getByTestId('contador-aguardando')).toHaveText('0')
  await page.getByRole('radio', { name: /Retiradas/ }).click()
  await expect(page.getByTestId('lista')).toContainText('Maria Fernanda Oliveira')

  // A encomenda retirada abre o histórico: quem retirou, como foi entregue e a assinatura.
  await page.getByRole('button', { name: 'Ver detalhes de Maria Fernanda Oliveira' }).click()
  await expect(page.getByRole('heading', { name: 'Encomenda retirada' })).toBeVisible()
  const linhaDoTempo = page.getByRole('region', { name: 'Linha do tempo' })
  await expect(linhaDoTempo).toContainText('Recebida na portaria')
  await expect(linhaDoTempo).toContainText('Entregue por Carlos')
  await expect(linhaDoTempo).toContainText('Sem código de retirada')
  await expect(linhaDoTempo).toContainText('Entregue na recepção da empresa')
  await expect(page.getByRole('img', { name: 'Assinatura' })).toBeVisible()
  await page.getByRole('button', { name: 'Voltar' }).click()
  await expect(page.getByRole('heading', { name: 'Encomendas' })).toBeVisible()
})

test('seleção manual da empresa quando a etiqueta não identifica', async ({ page }) => {
  await comecarTurno(page)
  await page.getByRole('button', { name: 'Nova Encomenda' }).click()
  await page.getByRole('button', { name: /Escanear código/ }).click()
  await page.getByLabel('Código digitado').fill('XYZ123456BR')
  await page.getByRole('button', { name: 'Usar código' }).click()

  await expect(page.getByText('Não foi possível identificar a empresa')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Próximo' })).toBeDisabled()
  await escolherEmpresa(page, 'Financeiro')
  await proximo(page)
  await proximo(page)
  await fotoDoPacote(page)
  await proximo(page)
  await page.getByRole('button', { name: 'Salvar Encomenda' }).click()
  await concluir(page)
  await expect(page.getByTestId('lista')).toContainText('Financeiro')
})

test('código de retirada: errado é recusado com tentativas restantes', async ({ page }) => {
  await comecarTurno(page)
  await page.getByRole('button', { name: 'Nova Encomenda' }).click()
  await page.getByRole('button', { name: /Escanear código/ }).click()
  await page.getByLabel('Código digitado').fill('AB123456789BR')
  await page.getByRole('button', { name: 'Usar código' }).click()
  await escolherEmpresa(page, 'Maria Fernanda Oliveira')
  await proximo(page)
  await proximo(page)
  await fotoDoPacote(page)
  await proximo(page)
  await page.getByRole('button', { name: 'Salvar Encomenda' }).click()
  await concluir(page)
  await expect(page.getByTestId('lista')).toContainText('Maria Fernanda Oliveira')

  // A empresa de teste não tem contato cadastrado, então não há código gerado: o servidor recusa a conferência.
  await page.getByRole('button', { name: /Entregar para Maria Fernanda/ }).click()
  await page.getByLabel('Código de retirada').fill('123456')
  await assinar(page)
  await page.getByRole('button', { name: 'Confirmar entrega' }).click()
  await expect(page.getByRole('alert')).toContainText('não tem código válido')
})

test('controle de animações: liga, desliga e lembra a escolha', async ({ page }) => {
  await comecarTurno(page)
  await expect(page.locator('html')).toHaveAttribute('data-animacoes', 'reduzidas')
  await page.getByRole('button', { name: 'Animações' }).click()
  await page.getByRole('radio', { name: /Sempre animar/ }).click()
  await expect(page.locator('html')).toHaveAttribute('data-animacoes', 'completas')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-animacoes', 'completas')
})
