import { describe, expect, it } from 'vitest'
import {
  detectarApartamento,
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
    expect(detectarTransportadora('Mercado Livre Envios')).toBe('Mercado Livre')
    expect(detectarTransportadora('Shopee Xpress')).toBe('Shopee')
  })
  it('retorna null se desconhecida', () => {
    expect(detectarTransportadora('transportes xyz')).toBeNull()
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
    const r = extrairDados('CORREIOS SEDEX\nDestinatario: Maria Fernanda Oliveira\nApto 202', moradores)
    expect(r.morador?.id).toBe('2')
    expect(r.apartamento).toBe('202')
    expect(r.transportadora).toBe('Correios')
  })
  it('devolve só o que achou quando o morador é desconhecido', () => {
    const r = extrairDados('Amazon\nFulano de Tal\nap 999', moradores)
    expect(r.morador).toBeNull()
    expect(r.apartamento).toBe('999')
    expect(r.transportadora).toBe('Amazon')
  })
})
