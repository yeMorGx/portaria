/** Selos neutros (sigla e cor aproximada). Não são os logos oficiais e não indicam parceria. */
export interface Selo {
  nome: string
  sigla: string
  cor: string
  texto: string
}

export const LOJAS: Selo[] = [
  { nome: 'Mercado Livre', sigla: 'ML', cor: '#FFE600', texto: '#2D3277' },
  { nome: 'Amazon', sigla: 'a', cor: '#FF9900', texto: '#111111' },
  { nome: 'Shopee', sigla: 'S', cor: '#EE4D2D', texto: '#FFFFFF' },
  { nome: 'TikTok Shop', sigla: 'T', cor: '#111111', texto: '#FFFFFF' },
  { nome: 'Shein', sigla: 'SH', cor: '#111111', texto: '#FFFFFF' },
  { nome: 'AliExpress', sigla: 'A', cor: '#E62E04', texto: '#FFFFFF' },
  { nome: 'Temu', sigla: 'T', cor: '#FB7701', texto: '#FFFFFF' },
  { nome: 'Magalu', sigla: 'M', cor: '#0086FF', texto: '#FFFFFF' },
]

export const TRANSPORTADORAS: Selo[] = [
  { nome: 'Correios', sigla: 'C', cor: '#FFCC00', texto: '#003A8C' },
  { nome: 'Mercado Envios', sigla: 'ME', cor: '#FFE600', texto: '#2D3277' },
  { nome: 'Jadlog', sigla: 'J', cor: '#D71920', texto: '#FFFFFF' },
  { nome: 'Loggi', sigla: 'L', cor: '#0A8DD8', texto: '#FFFFFF' },
  { nome: 'Total Express', sigla: 'TE', cor: '#1F4E9C', texto: '#FFFFFF' },
  { nome: 'J&T Express', sigla: 'J&T', cor: '#D6001C', texto: '#FFFFFF' },
  { nome: 'Shopee Xpress', sigla: 'S', cor: '#EE4D2D', texto: '#FFFFFF' },
  { nome: 'DHL', sigla: 'DHL', cor: '#FFCC00', texto: '#D40511' },
]

export function porNome(nome: string): Selo | undefined {
  return [...LOJAS, ...TRANSPORTADORAS].find((s) => s.nome === nome)
}
