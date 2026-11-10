import { describe, expect, it } from 'vitest'
import {
  detectarApartamento,
  detectarLoja,
  detectarOrigem,
  detectarPedido,
  detectarRastreio,
  detectarTransportadora,
  encontrarMorador,
  extrairDados,
  normalizar,
  type Morador,
} from './parser'

const moradores: Morador[] = [
  { id: '1', nome: 'João Carlos da Silva', apartamento: '101' },
  { id: '2', nome: 'Maria Fernanda Oliveira', apartamento: '202' },
  { id: '3', nome: 'Ana Souza', apartamento: '303', ativo: false },
  { id: '4', nome: 'José Almeida', apartamento: '404B' },
]

describe('normalizar', () => {
  it('remove acentos, pontuação e caixa', () => {
    expect(normalizar('  JOÃO,  Carlos!! ')).toBe('joao carlos')
  })
})

describe('detectarApartamento', () => {
  it('reconhece variações', () => {
    expect(detectarApartamento('DEST: Maria APTO 202')).toBe('202')
    expect(detectarApartamento('Ap. 101 Bloco A')).toBe('101')
    expect(detectarApartamento('Apartamento 404b')).toBe('404B')
  })
  it('retorna null sem apartamento', () => {
    expect(detectarApartamento('Rua das Flores, 150')).toBeNull()
  })
})

describe('detectarTransportadora', () => {
  it('reconhece marcas comuns', () => {
    expect(detectarTransportadora('SEDEX - CORREIOS')).toBe('Correios')
    expect(detectarTransportadora('Mercado Envios Flex')).toBe('Mercado Envios')
    expect(detectarTransportadora('Shopee Xpress')).toBe('Shopee Xpress')
    expect(detectarTransportadora('J&T Express')).toBe('J&T Express')
  })
  it('não confunde palavra parecida com sigla curta', () => {
    expect(detectarTransportadora('prospect ectoplasma')).toBeNull()
  })
  it('retorna null se desconhecida', () => {
    expect(detectarTransportadora('transportes xyz')).toBeNull()
  })
})

describe('detectarLoja', () => {
  it('reconhece onde foi comprado', () => {
    expect(detectarLoja('Vendido por Mercado Livre')).toBe('Mercado Livre')
    expect(detectarLoja('TikTok Shop pedido 123')).toBe('TikTok Shop')
    expect(detectarLoja('AliExpress Standard Shipping')).toBe('AliExpress')
  })
  it('retorna null sem loja conhecida', () => {
    expect(detectarLoja('Loja do João')).toBeNull()
  })
})

describe('detectarRastreio', () => {
  it('reconhece o padrão dos Correios', () => {
    expect(detectarRastreio('Objeto: AB123456789BR')).toBe('AB123456789BR')
  })
  it('reconhece Shopee', () => {
    expect(detectarRastreio('SPX BR2512345678901')).toBe('BR2512345678901')
  })
  it('reconhece número depois de rastreio', () => {
    expect(detectarRastreio('Rastreio: MLB99887766AA')).toBe('MLB99887766AA')
  })
  it('retorna null sem código', () => {
    expect(detectarRastreio('Maria Fernanda apto 202')).toBeNull()
  })
})

describe('detectarPedido', () => {
  it('lê o número do pedido', () => {
    expect(detectarPedido('Pedido: 2000123456789')).toBe('2000123456789')
    expect(detectarPedido('Order #A1B2C3D4')).toBe('A1B2C3D4')
  })
})

describe('detectarOrigem', () => {
  it('lê cidade e UF do remetente', () => {
    expect(detectarOrigem('Remetente: Loja X\nSão Paulo - SP')).toEqual({ cidade: 'São Paulo', uf: 'SP' })
    expect(detectarOrigem('REMETENTE\nCuritiba/PR')).toEqual({ cidade: 'Curitiba', uf: 'PR' })
  })
  it('ignora sigla que não é estado', () => {
    expect(detectarOrigem('Remetente: Loja - XX')).toBeNull()
  })
})

describe('encontrarMorador', () => {
  it('casa nome com acento diferente e ruído de OCR', () => {
    const m = encontrarMorador('Dest: JOAO CARLOS SILVA\nRua X', moradores)
    expect(m?.id).toBe('1')
  })
  it('ignora moradores inativos', () => {
    expect(encontrarMorador('Ana Souza', moradores)).toBeNull()
  })
  it('não casa com um único token genérico em nome composto', () => {
    expect(encontrarMorador('Maria', moradores)).toBeNull()
  })
  it('usa o apartamento para desempatar', () => {
    const lista: Morador[] = [
      { id: 'a', nome: 'Carlos Pereira', apartamento: '11' },
      { id: 'b', nome: 'Carlos Pereira', apartamento: '22' },
    ]
    expect(encontrarMorador('Carlos Pereira apto 22', lista, '22')?.id).toBe('b')
  })
})

describe('extrairDados', () => {
  it('extrai tudo de uma etiqueta típica', () => {
    const r = extrairDados(
      'CORREIOS SEDEX AB123456789BR\nRemetente: Casa Leve Ltda\nSão Paulo - SP\nDestinatario: Maria Fernanda Oliveira\nApto 202\nPedido: 2000123456',
      moradores,
    )
    expect(r.morador?.id).toBe('2')
    expect(r.apartamento).toBe('202')
    expect(r.transportadora).toBe('Correios')
    expect(r.rastreio).toBe('AB123456789BR')
    expect(r.pedido).toBe('2000123456')
    expect(r.remetente).toBe('Casa Leve Ltda')
    expect(r.origem_uf).toBe('SP')
  })
  it('devolve só o que achou quando o morador é desconhecido', () => {
    const r = extrairDados('Amazon\nFulano de Tal\nap 999', moradores)
    expect(r.morador).toBeNull()
    expect(r.apartamento).toBe('999')
    expect(r.loja).toBe('Amazon')
  })
})
