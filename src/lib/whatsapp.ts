import type { Encomenda } from './data'

/**
 * Mensagem de aviso de chegada, pronta para o porteiro revisar antes de enviar.
 * `total` é quantas encomendas do mesmo destino aguardam retirada, incluindo esta.
 */
export function mensagemChegada(e: Encomenda, total: number, empresa?: string | null): string {
  const partes = [`Olá, ${e.destinatario_nome}!`]
  if (total > 1) {
    partes.push(`Chegaram ${total} encomendas${empresa ? ` para ${empresa}` : ' para você'} na portaria e estão aguardando retirada.`)
  } else {
    const origem = e.loja ?? e.transportadora
    partes.push(`Chegou uma encomenda${empresa ? ` para ${empresa}` : ' para você'} na portaria${origem ? ` (${origem})` : ''}.`)
  }
  if (e.local_guarda) partes.push(`${total > 1 ? 'A mais recente está' : 'Ela está'} em: ${e.local_guarda}.`)
  partes.push('Pode retirar quando quiser.')
  return partes.join(' ')
}

export type ResultadoEnvio = 'compartilhado' | 'cancelado' | 'whatsapp'

/**
 * Abre o compartilhamento do próprio aparelho (no celular aparece o WhatsApp na lista).
 * Sem esse recurso, como em parte dos computadores, abre o WhatsApp com a mensagem pronta para escolher o contato.
 */
export async function compartilharTexto(texto: string): Promise<ResultadoEnvio> {
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
