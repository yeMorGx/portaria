import type { Encomenda } from './data'

const comparavel = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

/**
 * Mensagem de aviso, pronta para o porteiro revisar antes de enviar.
 * `itens` são as encomendas do mesmo destino que aguardam retirada; `codigo` vale para todas elas.
 * Só cumprimenta pelo nome quando há uma pessoa (ou setor) e ela não é a própria empresa,
 * para não sair "Olá, ZPT Digital! Chegaram 2 encomendas para ZPT Digital".
 */
export function mensagemAviso({ itens, empresa, codigo }: { itens: Encomenda[]; empresa?: string | null; codigo?: string | null }): string {
  const n = itens.length
  const nomes = [...new Set(itens.map((e) => e.destinatario_nome.trim()))]
  const nome = nomes.length === 1 && (!empresa || comparavel(nomes[0]) !== comparavel(empresa)) ? nomes[0] : null
  const para = nome ? 'para você' : empresa ? `para ${empresa}` : 'para você'

  const partes = [nome ? `Olá, ${nome}!` : 'Olá!']
  if (n <= 1) {
    const origem = itens[0]?.loja ?? itens[0]?.transportadora
    partes.push(`Chegou uma encomenda ${para} na portaria${origem ? ` (${origem})` : ''}.`)
  } else {
    partes.push(`Chegaram ${n} encomendas ${para} na portaria.`)
  }
  const locais = [...new Set(itens.map((e) => e.local_guarda).filter(Boolean))]
  if (locais.length === 1) partes.push(`${n <= 1 ? 'Ela está' : 'Estão'} em: ${locais[0]}.`)
  if (codigo) {
    partes.push(`${n <= 1 ? 'Código de retirada' : `Código de retirada (vale para as ${n})`}: ${codigo}. Informe o código na portaria para retirar.`)
  } else {
    partes.push('Pode retirar quando quiser.')
  }
  return partes.join(' ')
}

/**
 * Número para o link do WhatsApp: só dígitos, com 55 na frente.
 * Aceita "(13) 99999-0000", "13999990000" ou "+55 13 99999-0000". Devolve null se não parecer um celular do Brasil.
 */
export function normalizarTelefone(bruto: string | null | undefined): string | null {
  const d = (bruto ?? '').replace(/\D/g, '')
  if (d.length === 10 || d.length === 11) return `55${d}`
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) return d
  return null
}

/** Link que abre a conversa com o número já escolhido e a mensagem escrita. */
export function linkWhatsapp(numero: string, texto: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
}

export type ResultadoEnvio = 'whatsapp' | 'compartilhado' | 'cancelado'

/**
 * Com número: abre o WhatsApp direto na conversa daquele número.
 * Sem número: abre o compartilhamento do aparelho (ou o WhatsApp para escolher o contato).
 */
export async function enviarWhatsapp(texto: string, numero: string | null): Promise<ResultadoEnvio> {
  if (numero) {
    window.open(linkWhatsapp(numero, texto), '_blank', 'noopener')
    return 'whatsapp'
  }
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ text: texto })
      return 'compartilhado'
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return 'cancelado'
    }
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener')
  return 'whatsapp'
}
