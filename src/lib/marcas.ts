import { siAliexpress, siDhl, siFedex, siShopee, siTiktok } from 'simple-icons'

export type TipoMarca = 'loja' | 'transportadora'

export interface Marca {
  id: string
  nome: string
  tipo: TipoMarca
  /** Palavras que identificam a marca no texto lido da etiqueta (já sem acento e em minúsculas). */
  chaves: string[]
  /** Cor aproximada da marca, usada no selo quando não há logo oficial. */
  cor: string
  corTexto: string
  sigla: string
  /** Caminho do ícone (simple-icons, domínio público) quando existe. */
  icone?: string
}

/**
 * Catálogo de lojas (onde foi comprado) e transportadoras.
 * Logos oficiais: coloque o arquivo em `src/assets/logos/<id>.svg` e ele passa a ser usado no lugar do selo.
 * As cores abaixo são aproximações; confira com o manual de marca de cada empresa antes de publicar.
 */
export const MARCAS: Marca[] = [
  // Lojas
  { id: 'mercado-livre', nome: 'Mercado Livre', tipo: 'loja', chaves: ['mercado livre', 'mercadolivre', 'mercado pago'], cor: '#FFE600', corTexto: '#2D3277', sigla: 'ML' },
  { id: 'amazon', nome: 'Amazon', tipo: 'loja', chaves: ['amazon', 'amzl'], cor: '#FF9900', corTexto: '#111111', sigla: 'a' },
  { id: 'shopee', nome: 'Shopee', tipo: 'loja', chaves: ['shopee'], cor: '#EE4D2D', corTexto: '#FFFFFF', sigla: 'S', icone: siShopee.path },
  { id: 'tiktok-shop', nome: 'TikTok Shop', tipo: 'loja', chaves: ['tiktok', 'tik tok'], cor: '#111111', corTexto: '#FFFFFF', sigla: 'T', icone: siTiktok.path },
  { id: 'shein', nome: 'Shein', tipo: 'loja', chaves: ['shein'], cor: '#111111', corTexto: '#FFFFFF', sigla: 'SH' },
  { id: 'aliexpress', nome: 'AliExpress', tipo: 'loja', chaves: ['aliexpress', 'ali express', 'cainiao'], cor: '#E62E04', corTexto: '#FFFFFF', sigla: 'A', icone: siAliexpress.path },
  { id: 'temu', nome: 'Temu', tipo: 'loja', chaves: ['temu'], cor: '#FB7701', corTexto: '#FFFFFF', sigla: 'T' },
  { id: 'magalu', nome: 'Magalu', tipo: 'loja', chaves: ['magalu', 'magazine luiza'], cor: '#0086FF', corTexto: '#FFFFFF', sigla: 'M' },
  { id: 'americanas', nome: 'Americanas', tipo: 'loja', chaves: ['americanas'], cor: '#E60014', corTexto: '#FFFFFF', sigla: 'Am' },
  { id: 'casas-bahia', nome: 'Casas Bahia', tipo: 'loja', chaves: ['casas bahia', 'casasbahia'], cor: '#0A3A8F', corTexto: '#FFFFFF', sigla: 'CB' },
  { id: 'kabum', nome: 'KaBuM!', tipo: 'loja', chaves: ['kabum'], cor: '#0060B1', corTexto: '#FFFFFF', sigla: 'K' },
  { id: 'netshoes', nome: 'Netshoes', tipo: 'loja', chaves: ['netshoes'], cor: '#111111', corTexto: '#FFFFFF', sigla: 'N' },
  { id: 'dafiti', nome: 'Dafiti', tipo: 'loja', chaves: ['dafiti'], cor: '#111111', corTexto: '#FFFFFF', sigla: 'D' },
  // Transportadoras
  { id: 'correios', nome: 'Correios', tipo: 'transportadora', chaves: ['correios', 'sedex', 'pac mini', 'ect '], cor: '#FFCC00', corTexto: '#003A8C', sigla: 'C' },
  { id: 'mercado-envios', nome: 'Mercado Envios', tipo: 'transportadora', chaves: ['mercado envios', 'mercadoenvios', 'meli flex', 'envio flex'], cor: '#FFE600', corTexto: '#2D3277', sigla: 'ME' },
  { id: 'amazon-logistics', nome: 'Amazon Logistics', tipo: 'transportadora', chaves: ['amazon logistics', 'amzl', 'amazon'], cor: '#FF9900', corTexto: '#111111', sigla: 'a' },
  { id: 'shopee-xpress', nome: 'Shopee Xpress', tipo: 'transportadora', chaves: ['shopee xpress', 'spx', 'shopee'], cor: '#EE4D2D', corTexto: '#FFFFFF', sigla: 'S', icone: siShopee.path },
  { id: 'jadlog', nome: 'Jadlog', tipo: 'transportadora', chaves: ['jadlog'], cor: '#D71920', corTexto: '#FFFFFF', sigla: 'J' },
  { id: 'loggi', nome: 'Loggi', tipo: 'transportadora', chaves: ['loggi'], cor: '#0A8DD8', corTexto: '#FFFFFF', sigla: 'L' },
  { id: 'total-express', nome: 'Total Express', tipo: 'transportadora', chaves: ['total express'], cor: '#1F4E9C', corTexto: '#FFFFFF', sigla: 'TE' },
  { id: 'jt-express', nome: 'J&T Express', tipo: 'transportadora', chaves: ['j&t', 'j t express', 'jt express'], cor: '#D6001C', corTexto: '#FFFFFF', sigla: 'J&T' },
  { id: 'azul-cargo', nome: 'Azul Cargo', tipo: 'transportadora', chaves: ['azul cargo'], cor: '#0033A0', corTexto: '#FFFFFF', sigla: 'AC' },
  { id: 'sequoia', nome: 'Sequoia', tipo: 'transportadora', chaves: ['sequoia'], cor: '#00854A', corTexto: '#FFFFFF', sigla: 'Sq' },
  { id: 'kangu', nome: 'Kangu', tipo: 'transportadora', chaves: ['kangu'], cor: '#FF5A00', corTexto: '#FFFFFF', sigla: 'K' },
  { id: 'braspress', nome: 'Braspress', tipo: 'transportadora', chaves: ['braspress'], cor: '#0054A6', corTexto: '#FFFFFF', sigla: 'Br' },
  { id: 'dhl', nome: 'DHL', tipo: 'transportadora', chaves: ['dhl'], cor: '#FFCC00', corTexto: '#D40511', sigla: 'DHL', icone: siDhl.path },
  { id: 'fedex', nome: 'FedEx', tipo: 'transportadora', chaves: ['fedex'], cor: '#4D148C', corTexto: '#FFFFFF', sigla: 'Fx', icone: siFedex.path },
]

const arquivos = import.meta.glob<string>('../assets/logos/*.svg', { eager: true, query: '?url', import: 'default' })

/** Endereço do logo oficial da marca, se o arquivo existir em src/assets/logos. */
export function logoOficial(id: string): string | undefined {
  return arquivos[`../assets/logos/${id}.svg`]
}

export const LOJAS = MARCAS.filter((m) => m.tipo === 'loja')
export const TRANSPORTADORAS = MARCAS.filter((m) => m.tipo === 'transportadora')

function normalizar(t: string): string {
  return t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9&\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function marcaPorNome(nome: string | null | undefined, tipo?: TipoMarca): Marca | undefined {
  if (!nome) return undefined
  const n = normalizar(nome)
  return MARCAS.find((m) => (!tipo || m.tipo === tipo) && normalizar(m.nome) === n)
}

/** Procura a primeira marca do tipo cujas palavras aparecem no texto. Marcas mais específicas vêm primeiro no catálogo. */
export function detectarMarca(texto: string, tipo: TipoMarca): Marca | null {
  const n = ` ${normalizar(texto)} `
  // Palavras mais longas primeiro, para "shopee xpress" vencer "shopee".
  const candidatos = MARCAS.filter((m) => m.tipo === tipo)
    .flatMap((m) => m.chaves.map((c) => ({ m, c: normalizar(c) })))
    .sort((a, b) => b.c.length - a.c.length)
  for (const { m, c } of candidatos) {
    if (n.includes(` ${c} `)) return m
  }
  return null
}
