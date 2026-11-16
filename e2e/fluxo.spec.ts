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

// Tela final do recebimento: gera o código, põe na mensagem do WhatsApp e volta ao início em "Concluir".
async function concluir(page: Page, mensagem?: string | RegExp): Promise<string> {
  await expect(page.getByRole('heading', { name: 'Encomenda registrada' })).toBeVisible()
  const campoCodigo = page.getByTestId('codigo-retirada')
  await expect(campoCodigo).toHaveText(/^\d{6}$/)
  const codigo = (await campoCodigo.textContent())!.trim()
  await expect(page.getByRole('button', { name: 'Avisar o morador' })).toBeEnabled()
  await expect(page.getByLabel('Mensagem do aviso')).toHaveValue(new RegExp(`Código de retirada.*${codigo}`))
  if (mensagem) await expect(page.getByLabel('Mensagem do aviso')).toHaveValue(mensagem)
  await page.getByRole('button', { name: 'Concluir' }).click()
  return codigo
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

test('encomendas da mesma empresa ficam empilhadas e um código só libera todas', async ({ page }) => {
  await comecarTurno(page)
  await receberPorCodigo(page, 'AA111111111BR', 'Maria Fernanda Oliveira')
  await concluir(page, /^Olá, Maria Fernanda Oliveira! Chegou uma encomenda para você na portaria/)
  await receberPorCodigo(page, 'BB222222222BR', 'Financeiro')
  // Pessoas diferentes da mesma empresa: a mensagem fala com a empresa, sem repetir nome.
  const codigo = await concluir(page, /^Olá! Chegaram 2 encomendas para Empresa de teste na portaria\. .*\(vale para as 2\)/)

  const pilha = page.getByRole('button', { name: '2 encomendas para Empresa de teste' })
  await expect(pilha).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByRole('button', { name: /Entregar para/ })).toHaveCount(0)
  await pilha.click()
  await expect(pilha).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('button', { name: 'Entregar para Maria Fernanda Oliveira' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Entregar para Financeiro' })).toBeVisible()
  await expect(page.getByTestId('contador-aguardando')).toHaveText('2')

  // O código da última mensagem vale também para a primeira encomenda.
  await page.getByRole('button', { name: 'Entregar para Maria Fernanda Oliveira' }).click()
  await page.getByLabel('Código de retirada').fill(codigo)
  await page.getByRole('button', { name: 'Confirmar entrega' }).click()
  await expect(page.getByTestId('contador-aguardando')).toHaveText('1')
})

test('"outra encomenda" já vem com a empresa, e o aviso da lista salva o número digitado', async ({ page }) => {
  // O WhatsApp abriria numa aba nova: o teste só guarda o endereço que seria aberto.
  await page.addInitScript(() => {
    window.open = ((url?: string | URL) => {
      ;(window as unknown as { abriu: string }).abriu = String(url)
      return null
    }) as typeof window.open
  })
  await comecarTurno(page)
  await receberPorCodigo(page, 'CC333333333BR', 'Financeiro')
  await expect(page.getByRole('heading', { name: 'Encomenda registrada' })).toBeVisible()
  await page.getByRole('button', { name: 'Outra encomenda para Empresa de teste' }).click()

  await page.getByRole('button', { name: /Escanear código/ }).click()
  await page.getByLabel('Código digitado').fill('DD444444444BR')
  await page.getByRole('button', { name: 'Usar código' }).click()
  await expect(page.getByText('Empresa identificada')).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Empresa' })).toContainText('Empresa de teste')
  await expect(page.getByRole('radio', { name: 'Financeiro' })).toBeChecked()
  await proximo(page)
  await proximo(page)
  await fotoDoPacote(page)
  await proximo(page)
  await page.getByRole('button', { name: 'Salvar Encomenda' }).click()
  await concluir(page, /^Olá, Financeiro! Chegaram 2 encomendas para você na portaria\./)

  // Botão do WhatsApp na lista: avisa a pilha toda. Sem número no cadastro, digita uma vez e fica salvo.
  await page.getByRole('button', { name: 'Avisar Empresa de teste no WhatsApp' }).click()
  await expect(page.getByRole('heading', { name: 'Avisar pelo WhatsApp' })).toBeVisible()
  await expect(page.getByTestId('codigo-retirada')).toHaveText(/^\d{6}$/)
  await expect(page.getByLabel('WhatsApp do destinatário')).toHaveValue('')
  await page.getByLabel('WhatsApp do destinatário').fill('(13) 98888-7777')
  await expect(page.getByText('Ao avisar, este número fica salvo no cadastro de Financeiro.')).toBeVisible()
  await page.getByRole('button', { name: 'Avisar o morador' }).click()
  await expect.poll(() => page.evaluate(() => (window as unknown as { abriu?: string }).abriu)).toMatch(/^https:\/\/wa\.me\/5513988887777\?text=/)
  await expect(page.getByText('Número salvo no cadastro de Financeiro.')).toBeVisible()
  await page.getByRole('button', { name: 'Concluir' }).click()

  await page.getByRole('button', { name: 'Avisar Empresa de teste no WhatsApp' }).click()
  await expect(page.getByLabel('WhatsApp do destinatário')).toHaveValue('5513988887777')
  await expect(page.getByText('Número do cadastro.')).toBeVisible()
})

test('recebe por foto, completa o pedido por passos e entrega sem código, com justificativa', async ({ page }) => {
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
  // O WhatsApp cadastrado do destinatário já vem preenchido: o envio abre direto na conversa dele.
  await expect(page.getByLabel('WhatsApp do destinatário')).toHaveValue('5511999990202')
  await concluir(page)

  const lista = page.getByTestId('lista')
  await expect(lista).toContainText('Maria Fernanda Oliveira')
  await expect(lista).toContainText('Envelope · 2 volumes')
  await expect(lista).toContainText('Frágil')
  await expect(lista).toContainText('Prateleira A')
  await expect(lista).toContainText('Comprado em Shopee')
  await expect(page.getByTestId('contador-aguardando')).toHaveText('1')

  // Sem o código em mãos, a entrega também pode sair com justificativa.
  await page.getByRole('button', { name: /Entregar para Maria Fernanda/ }).click()
  await expect(page.getByRole('heading', { name: 'Entregar ao morador' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirmar entrega' })).toBeDisabled()
  await page.getByRole('button', { name: 'Morador sem o código' }).click()
  await page.getByLabel('Justificativa').fill('Entregue na recepção da empresa')
  // Sem assinatura: a entrega vale pelo código ou pela justificativa.
  await expect(page.getByTestId('assinatura')).toHaveCount(0)
  await page.getByRole('button', { name: 'Confirmar entrega' }).click()

  await expect(page.getByTestId('contador-aguardando')).toHaveText('0')
  await page.getByRole('radio', { name: /Retiradas/ }).click()
  await expect(page.getByTestId('lista')).toContainText('Maria Fernanda Oliveira')

  // A encomenda retirada abre o histórico: quem retirou e como foi entregue.
  await page.getByRole('button', { name: 'Ver detalhes de Maria Fernanda Oliveira' }).click()
  await expect(page.getByRole('heading', { name: 'Encomenda retirada' })).toBeVisible()
  const linhaDoTempo = page.getByRole('region', { name: 'Linha do tempo' })
  await expect(linhaDoTempo).toContainText('Recebida na portaria')
  await expect(linhaDoTempo).toContainText('Entregue por Carlos')
  await expect(linhaDoTempo).toContainText('Sem código de retirada')
  await expect(linhaDoTempo).toContainText('Entregue na recepção da empresa')
  await expect(page.getByRole('img', { name: 'Foto do pacote' })).toBeVisible()
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

test('código de retirada: o da mensagem libera a entrega, um errado é recusado', async ({ page }) => {
  await comecarTurno(page)
  await receberPorCodigo(page, 'AB123456789BR', 'Maria Fernanda Oliveira')
  const codigo = await concluir(page)
  await expect(page.getByTestId('lista')).toContainText('Maria Fernanda Oliveira')

  await page.getByRole('button', { name: /Entregar para Maria Fernanda/ }).click()
  await page.getByLabel('Código de retirada').fill(codigo === '123456' ? '654321' : '123456')
  await page.getByRole('button', { name: 'Confirmar entrega' }).click()
  await expect(page.getByRole('alert')).toContainText('Restam 4 tentativa(s)')

  await page.getByLabel('Código de retirada').fill(codigo)
  await page.getByRole('button', { name: 'Confirmar entrega' }).click()
  await expect(page.getByTestId('contador-aguardando')).toHaveText('0')
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
