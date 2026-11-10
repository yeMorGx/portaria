import { detectarMarca } from './marcas'

export interface Morador {
  id: string
  nome: string
  apartamento: string
  bloco?: string | null
  telefone?: string | null
  consentimento_em?: string | null
  ativo?: boolean
}

export interface Extracao {
  morador: Morador | null
  apartamento: string | null
  transportadora: string | null
  loja: string | null
  rastreio: string | null
  pedido: string | null
  remetente: string | null
  origem_cidade: string | null
  origem_uf: string | null
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

export function detectarTransportadora(texto: string): string | null {
  return detectarMarca(texto, 'transportadora')?.nome ?? null
}

export function detectarLoja(texto: string): string | null {
  return detectarMarca(texto, 'loja')?.nome ?? null
}

export function detectarApartamento(texto: string): string | null {
  const m = normalizar(texto).match(/\b(?:apto|apt|ap|apartamento|unidade|casa)\s*(?:n\s*)?(\d{1,4}[a-z]?)\b/)
  return m ? m[1].toUpperCase() : null
}

/** Código de rastreio: padrão dos Correios, Shopee (BR + dígitos) ou número depois de "rastreio/tracking". */
export function detectarRastreio(texto: string): string | null {
  const t = texto.toUpperCase()
  const correios = t.match(/\b([A-Z]{2}\d{9}[A-Z]{2})\b/)
  if (correios) return correios[1]
  const shopee = t.match(/\b(BR\d{10,14}[A-Z]?)\b/)
  if (shopee) return shopee[1]
  const rotulado = t.match(/(?:RASTREIO|RASTREAMENTO|TRACKING|CODIGO DE RASTREIO|CÓDIGO DE RASTREIO)[\s:#.-]*([A-Z0-9]{8,25})/)
  return rotulado ? rotulado[1] : null
}

export function detectarPedido(texto: string): string | null {
  const m = texto.match(/(?:pedido|order)\s*(?:n[ºo°.]?)?[\s:#-]*([A-Za-z0-9-]{6,25})/i)
  return m ? m[1].toUpperCase() : null
}

const UFS = new Set(
  'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' '),
)

/** Cidade e UF de origem a partir do bloco do remetente ("São Paulo - SP", "Curitiba/PR"). */
export function detectarOrigem(texto: string): { cidade: string; uf: string } | null {
  const idx = texto.search(/remetente|sender|origem/i)
  const trecho = idx >= 0 ? texto.slice(idx, idx + 220) : texto
  for (const m of trecho.matchAll(/([A-Za-zÀ-ú][A-Za-zÀ-ú .']{2,38}?)\s*[-/,]\s*([A-Z]{2})\b/g)) {
    if (UFS.has(m[2])) return { cidade: m[1].trim(), uf: m[2] }
  }
  return null
}

export function detectarRemetente(texto: string): string | null {
  const m = texto.match(/(?:remetente|sender)\s*[:\-]?\s*\n?\s*([^\n]{3,60})/i)
  return m ? m[1].trim() : null
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
  const origem = detectarOrigem(texto)
  return {
    morador,
    apartamento: morador?.apartamento ?? apartamento,
    transportadora: detectarTransportadora(texto),
    loja: detectarLoja(texto),
    rastreio: detectarRastreio(texto),
    pedido: detectarPedido(texto),
    remetente: detectarRemetente(texto),
    origem_cidade: origem?.cidade ?? null,
    origem_uf: origem?.uf ?? null,
  }
}
