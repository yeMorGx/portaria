import { describe, expect, it } from 'vitest'
import type { Encomenda } from './data'
import { aguardandoNoDestino, empilhar } from './pilhas'
import { linkWhatsapp, mensagemAviso, normalizarTelefone } from './whatsapp'

function enc(parcial: Partial<Encomenda>): Encomenda {
  return {
    id: crypto.randomUUID(),
    morador_id: null,
    empresa_id: null,
    destinatario_nome: 'Maria',
    apartamento: '101',
    bloco: null,
    loja: null,
    transportadora: null,
    vendedor: null,
    pedido: null,
    rastreio: null,
    origem_cidade: null,
    origem_uf: null,
    tipo: 'caixa',
    volumes: 1,
    condicao: 'ok',
    local_guarda: null,
    observacao: null,
    codigo_lido: null,
    foto_path: null,
    foto_pacote_path: null,
    recebido_em: '2026-11-16T10:00:00Z',
    recebido_por: null,
    status: 'recebida',
    avisado_em: null,
    retirado_em: null,
    retirado_por_nome: null,
    entregue_por: null,
    assinatura_path: null,
    entrega_sem_codigo: false,
    justificativa_sem_codigo: null,
    ...parcial,
  }
}

describe('empilhar', () => {
  it('junta as encomendas da mesma empresa, da mais recente para a mais antiga', () => {
    const a = enc({ empresa_id: 'e1', recebido_em: '2026-11-16T09:00:00Z' })
    const b = enc({ empresa_id: 'e2', recebido_em: '2026-11-16T10:00:00Z' })
    const c = enc({ empresa_id: 'e1', recebido_em: '2026-11-16T11:00:00Z' })
    const pilhas = empilhar([a, b, c])
    expect(pilhas).toHaveLength(2)
    expect(pilhas[0].itens.map((x) => x.id)).toEqual([c.id, a.id])
    expect(pilhas[1].itens.map((x) => x.id)).toEqual([b.id])
  })

  it('sem empresa, empilha pelo apartamento', () => {
    const pilhas = empilhar([enc({ apartamento: '101' }), enc({ apartamento: '101' }), enc({ apartamento: '202' })])
    expect(pilhas.map((p) => p.itens.length)).toEqual([2, 1])
  })

  it('conta só as que ainda aguardam no mesmo destino', () => {
    const nova = enc({ empresa_id: 'e1' })
    const lista = [nova, enc({ empresa_id: 'e1' }), enc({ empresa_id: 'e1', status: 'retirada' }), enc({ empresa_id: 'e2' })]
    expect(aguardandoNoDestino(lista, nova)).toHaveLength(2)
  })
})

describe('mensagemAviso', () => {
  it('uma encomenda para uma pessoa: cumprimenta pelo nome, cita a origem e o local', () => {
    const m = mensagemAviso({ itens: [enc({ loja: 'Shopee', local_guarda: 'Recepção' })], empresa: 'Empresa X' })
    expect(m).toBe('Olá, Maria! Chegou uma encomenda para você na portaria (Shopee). Ela está em: Recepção. Pode retirar quando quiser.')
  })

  it('destinatário é a própria empresa: não repete o nome', () => {
    const itens = [enc({ destinatario_nome: 'ZPT Digital' }), enc({ destinatario_nome: 'ZPT Digital' })]
    const m = mensagemAviso({ itens, empresa: 'ZPT Digital', codigo: '042731' })
    expect(m).toBe('Olá! Chegaram 2 encomendas para ZPT Digital na portaria. Código de retirada (vale para as 2): 042731. Informe o código na portaria para retirar.')
  })

  it('pessoas diferentes da mesma empresa: fala com a empresa', () => {
    const m = mensagemAviso({ itens: [enc({ destinatario_nome: 'Maria' }), enc({ destinatario_nome: 'Financeiro' })], empresa: 'Empresa X' })
    expect(m.startsWith('Olá! Chegaram 2 encomendas para Empresa X na portaria.')).toBe(true)
  })

  it('com código e uma encomenda: leva o código', () => {
    const m = mensagemAviso({ itens: [enc({ loja: 'Shopee' })], empresa: 'Empresa X', codigo: '042731' })
    expect(m).toBe('Olá, Maria! Chegou uma encomenda para você na portaria (Shopee). Código de retirada: 042731. Informe o código na portaria para retirar.')
  })
})

describe('telefone do WhatsApp', () => {
  it('aceita os formatos comuns e põe o 55', () => {
    expect(normalizarTelefone('(13) 99999-0000')).toBe('5513999990000')
    expect(normalizarTelefone('+55 13 99999-0000')).toBe('5513999990000')
    expect(normalizarTelefone('1333334444')).toBe('551333334444')
  })

  it('recusa o que não parece telefone', () => {
    expect(normalizarTelefone('123')).toBeNull()
    expect(normalizarTelefone('')).toBeNull()
    expect(normalizarTelefone(null)).toBeNull()
  })

  it('o link já abre a conversa do número com a mensagem', () => {
    expect(linkWhatsapp('5513999990000', 'Olá! Código: 1')).toBe('https://wa.me/5513999990000?text=Ol%C3%A1!%20C%C3%B3digo%3A%201')
  })
})
