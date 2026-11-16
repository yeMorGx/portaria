import type { Encomenda } from './data'

/**
 * Mensagem de aviso de chegada, pronta para o porteiro revisar antes de enviar.
 * `total` é quantas encomendas do mesmo destino aguardam retirada, incluindo esta.
 * `codigo` é o código de retirada desta encomenda; sem ele, a mensagem só avisa a chegada.
 */
export function mensagemChegada(e: Encomenda, total: number, empresa?: string | null, codigo?: string | null): string {
  const partes = [`Olá, ${e.destinatario_nome}!`]
  if (total > 1) {
    partes.push(`Chegaram ${total} encomendas${empresa ? ` para ${empresa}` : ' para você'} na portaria e estão aguardando retirada.`)
  } else {
    const origem = e.loja ?? e.transportadora
    partes.push(`Chegou uma encomenda${empresa ? ` para ${empresa}` : ' para você'} na portaria${origem ? ` (${origem})` : ''}.`)
  }
  if (e.local_guarda) partes.push(`${total > 1 ? 'A mais recente está' : 'Ela está'} em: ${e.local_guarda}.`)
  if (codigo) {
    partes.push(`${total > 1 ? 'Código de retirada da mais recente' : 'Código de retirada'}: ${codigo}. Informe o código na portaria para retirar.`)
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
