export interface Morador {
  id: string
  nome: string
  apartamento: string
  ativo?: boolean
}

export interface Extracao {
  morador: Morador | null
  apartamento: string | null
  transportadora: string | null
}

export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const TRANSPORTADORAS: Array<[string, string[]]> = [
  ['Correios', ['correios', 'sedex', 'pac ', 'ect ']],
  ['Mercado Livre', ['mercado livre', 'mercadolivre', 'mercado envios', 'meli']],
  ['Amazon', ['amazon', 'amzl']],
  ['Shopee', ['shopee', 'spx', 'shopee xpress']],
  ['Jadlog', ['jadlog']],
  ['Loggi', ['loggi']],
  ['Total Express', ['total express']],
  ['Azul Cargo', ['azul cargo']],
  ['Magalu', ['magalu', 'magazine luiza']],
  ['Americanas', ['americanas']],
  ['Shein', ['shein']],
  ['AliExpress', ['aliexpress', 'cainiao']],
  ['DHL', ['dhl']],
  ['FedEx', ['fedex']],
  ['Sequoia', ['sequoia']],
  ['Kangu', ['kangu']],
]

export function detectarTransportadora(texto: string): string | null {
  const n = ` ${normalizar(texto)} `
  for (const [nome, chaves] of TRANSPORTADORAS) {
    if (chaves.some((c) => n.includes(` ${normalizar(c)} `) || n.includes(normalizar(c)))) {
      return nome
    }
  }
  return null
}

export function detectarApartamento(texto: string): string | null {
  const m = normalizar(texto).match(/\b(?:apto|apt|ap|apartamento|unidade|casa)\s*(?:n\s*)?(\d{1,4}[a-z]?)\b/)
  return m ? m[1].toUpperCase() : null
}

function tokens(texto: string): string[] {
  return normalizar(texto)
    .split(' ')
    .filter((t) => t.length > 2 && !['dos', 'das', 'del'].includes(t))
}

/** Fração dos tokens do nome do morador presentes no texto da etiqueta. */
function pontuar(texto: string, morador: Morador): number {
  const alvo = tokens(morador.nome)
  if (alvo.length === 0) return 0
  const nt = ` ${normalizar(texto)} `
  const achados = alvo.filter((t) => nt.includes(` ${t} `)).length
  return achados / alvo.length
}

export function encontrarMorador(
  texto: string,
  moradores: Morador[],
  apartamento?: string | null,
): Morador | null {
  const ativos = moradores.filter((m) => m.ativo !== false)
  let melhor: Morador | null = null
  let melhorPontos = 0
  for (const m of ativos) {
    let p = pontuar(texto, m)
    if (apartamento && m.apartamento.toUpperCase() === apartamento.toUpperCase()) p += 0.25
    if (p > melhorPontos) {
      melhorPontos = p
      melhor = m
    }
  }
  // Exige ao menos 2 tokens batendo ou o nome inteiro (para nomes curtos).
  if (!melhor) return null
  const alvo = tokens(melhor.nome)
  const batidos = Math.round(pontuar(texto, melhor) * alvo.length)
  if (batidos >= 2 || (alvo.length === 1 && batidos === 1) || pontuar(texto, melhor) >= 0.99) {
    return melhor
  }
  return null
}

export function extrairDados(texto: string, moradores: Morador[]): Extracao {
  const apartamento = detectarApartamento(texto)
  const morador = encontrarMorador(texto, moradores, apartamento)
  return {
    morador,
    apartamento: morador?.apartamento ?? apartamento,
    transportadora: detectarTransportadora(texto),
  }
}
