import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { siWhatsapp } from 'simple-icons'
import { toast } from 'sonner'
import type { Encomenda } from '../lib/data'
import { aguardandoNoDestino } from '../lib/pilhas'
import { compartilharTexto, mensagemChegada } from '../lib/whatsapp'
import { CartaoPedido } from './Pedido'
import { Aparecer, Botao, Cabecalho, Pagina } from './ui'

/** Fim do recebimento: confirma o registro e deixa o porteiro avisar pelo WhatsApp com uma mensagem pronta. */
export function EncomendaRegistrada({
  encomenda,
  encomendas,
  empresa,
  aoConcluir,
}: {
  encomenda: Encomenda
  /** Lista atual, para contar quantas do mesmo destino aguardam retirada. */
  encomendas: Encomenda[]
  empresa?: string | null
  aoConcluir: () => void
}) {
  const pendentes = aguardandoNoDestino(encomendas, encomenda)
  const total = Math.max(pendentes.length, 1)
  const [texto, setTexto] = useState(() => mensagemChegada(encomenda, total, empresa))
  const [enviando, setEnviando] = useState(false)

  async function avisar() {
    setEnviando(true)
    try {
      const r = await compartilharTexto(texto)
      if (r === 'compartilhado') toast.success('Mensagem enviada para o compartilhamento.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Pagina className="md:max-w-2xl">
      <Cabecalho titulo="Encomenda registrada" />
      <div className="space-y-4">
        <Aparecer i={0}>
          <p className="m-0 flex items-center gap-2 font-medium text-ok" role="status">
            <CheckCircle2 className="size-5" strokeWidth={2} />
            {total > 1 ? `Salva. ${total} encomendas aguardam retirada${empresa ? ` para ${empresa}` : ''}.` : 'Salva e pronta para retirada.'}
          </p>
        </Aparecer>
        <Aparecer i={1}>
          <CartaoPedido e={encomenda} />
        </Aparecer>
        <Aparecer i={2}>
          <label className="tile block space-y-3 p-6">
            <span className="rotulo">Mensagem do aviso</span>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={4}
              aria-label="Mensagem do aviso"
              className="w-full rounded-botao border border-line bg-s2 p-4 text-base leading-6"
            />
            <span className="block text-sm text-muted">Você pode editar antes de enviar. O WhatsApp abre para escolher o contato.</span>
          </label>
        </Aparecer>
        <Aparecer i={3}>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={avisar}
              disabled={enviando || !texto.trim()}
              className="inline-flex min-h-16 flex-1 cursor-pointer items-center justify-center gap-3 rounded-botao bg-[#25D366] px-6 text-lg font-semibold text-[#06290f] transition duration-[120ms] hover:bg-[#1fbe5b] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden>
                <path d={siWhatsapp.path} />
              </svg>
              Avisar o morador
            </button>
            <Botao variante="secundario" grande onClick={aoConcluir}>
              Concluir
            </Botao>
          </div>
        </Aparecer>
      </div>
    </Pagina>
  )
}
