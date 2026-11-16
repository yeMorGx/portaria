import { describe, expect, it } from 'vitest'
import type { Empresa, Encomenda } from './data'
import { calcularPainel, desdeParaBuscar, variacao } from './painel'

const AGORA = new Date(2026, 10, 16, 15, 0) // 16/11/2026 15:00, horário local
const horasAtras = (h: number) => new Date(AGORA.getTime() - h * 3_600_000).toISOString()

function enc(parcial: Partial<Encomenda>): Encomenda {
  return {
    id: crypto.randomUUID(),
    morador_id: null,
    empresa_id: 'e1',
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
    recebido_em: horasAtras(1),
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

const empresas = [{ id: 'e1', nome: 'ZPT Digital' }, { id: 'e2', nome: 'Acme' }] as Empresa[]

describe('calcularPainel', () => {
  const lista = [
    enc({ recebido_em: horasAtras(2), loja: 'Shopee', transportadora: 'sedex' }),
    enc({ recebido_em: horasAtras(30), empresa_id: 'e2', loja: 'Amazon' }),
    enc({ recebido_em: horasAtras(100) }), // parada há 4 dias
    enc({ recebido_em: horasAtras(10), status: 'retirada', retirado_em: horasAtras(4) }),
    enc({ recebido_em: horasAtras(20), status: 'retirada', retirado_em: horasAtras(8), entrega_sem_codigo: true }),
    enc({ recebido_em: horasAtras(24 * 9), status: 'retirada', retirado_em: horasAtras(24 * 8) }), // período anterior
  ]

  it('conta o que aguarda e a idade de cada uma', () => {
    const p = calcularPainel(lista, 7, empresas, AGORA)
    expect(p.aguardando).toBe(3)
    expect(p.maisAntigaDias).toBe(4)
    expect(p.idade).toEqual({ ate1: 1, de1a3: 1, mais3: 1 })
    expect(p.paradas).toHaveLength(1)
  })

  it('compara recebidas e entregues com o período anterior', () => {
    const p = calcularPainel(lista, 7, empresas, AGORA)
    expect(p.recebidas).toEqual({ atual: 5, anterior: 1 })
    expect(p.entregues).toEqual({ atual: 2, anterior: 1 })
    expect(p.horasAteRetirada.atual).toBe(9) // (6 + 12) / 2
    expect(p.semCodigo.atual).toBe(50)
  })

  it('monta 7 dias no gráfico mesmo no período de hoje, com hoje por último', () => {
    const p = calcularPainel(lista, 1, empresas, AGORA)
    expect(p.dias).toHaveLength(7)
    expect(p.dias[6].chave).toBe('2026-11-16')
    expect(p.dias[6].recebidas).toBe(2)
    expect(p.recebidas.atual).toBe(2)
  })

  it('agrupa por empresa com o nome do cadastro e reconhece a marca pelo nome digitado', () => {
    const p = calcularPainel(lista, 7, empresas, AGORA)
    expect(p.porEmpresa[0]).toMatchObject({ nome: 'ZPT Digital', total: 4, aguardando: 2 })
    expect(p.porMarca.map((m) => m.nome)).toEqual(expect.arrayContaining(['Shopee', 'Amazon', 'Correios']))
  })

  it('busca o período, o anterior e ao menos 7 dias', () => {
    expect(desdeParaBuscar(1, AGORA).getDate()).toBe(10)
    expect(desdeParaBuscar(7, AGORA).getDate()).toBe(3)
  })
})

describe('variacao', () => {
  it('percentual inteiro, e null sem base', () => {
    expect(variacao(15, 10)).toBe(50)
    expect(variacao(5, 0)).toBeNull()
    expect(variacao(null, 3)).toBeNull()
  })
})
