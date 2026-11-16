import { describe, expect, it } from 'vitest'
import type { Encomenda } from './data'
import { aguardandoNoDestino, empilhar } from './pilhas'
import { mensagemChegada } from './whatsapp'

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

describe('mensagemChegada', () => {
  it('uma encomenda: cita a origem e o local', () => {
    const m = mensagemChegada(enc({ loja: 'Shopee', local_guarda: 'Recepção' }), 1, 'Empresa X')
    expect(m).toBe('Olá, Maria! Chegou uma encomenda para Empresa X na portaria (Shopee). Ela está em: Recepção. Pode retirar quando quiser.')
  })

  it('várias encomendas: diz quantas estão aguardando', () => {
    const m = mensagemChegada(enc({}), 3, 'Empresa X')
    expect(m).toBe('Olá, Maria! Chegaram 3 encomendas para Empresa X na portaria e estão aguardando retirada. Pode retirar quando quiser.')
  })
})
