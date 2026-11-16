import { CheckCircle2, KeyRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { siWhatsapp } from 'simple-icons'
import { dados, type Encomenda } from '../lib/data'
import { aguardandoNoDestino } from '../lib/pilhas'
import { enviarWhatsapp, mensagemChegada, normalizarTelefone } from '../lib/whatsapp'
import { CartaoPedido } from './Pedido'
import { Aparecer, Aviso, Botao, Cabecalho, Pagina } from './ui'

/**
 * Fim do recebimento: gera o código de retirada, monta a mensagem com ele
 * e abre o WhatsApp direto na conversa do destinatário.
 */
export function EncomendaRegistrada({
  encomenda,
  encomendas,
  empresa,
  telefone,
  aoConcluir,
}: {
  encomenda: Encomenda
  /** Lista atual, para contar quantas do mesmo destino aguardam retirada. */
  encomendas: Encomenda[]
  empresa?: string | null
  /** WhatsApp cadastrado do destinatário (ou do responsável da empresa), se houver. */
  telefone?: string | null
  aoConcluir: () => void
}) {
  const total = Math.max(aguardandoNoDestino(encomendas, encomenda).length, 1)
  const [codigo, setCodigo] = useState<string | null>(null)
  const [erroCodigo, setErroCodigo] = useState(false)
  const [texto, setTexto] = useState(() => mensagemChegada(encomenda, total, empresa))
  const editado = useRef(false)
  const [numero, setNumero] = useState(telefone ?? '')
  const pedido = useRef(false)

  // Um código por tela: o número só existe agora, na mensagem; o banco guarda apenas o hash.
  useEffect(() => {
    if (pedido.current) return
    pedido.current = true
    dados
      .gerarCodigoRetirada(encomenda)
      .then((c) => {
        setCodigo(c)
        if (!editado.current) setTexto(mensagemChegada(encomenda, total, empresa, c))
      })
      .catch(() => setErroCodigo(true))
  }, [encomenda, total, empresa])

  const numeroValido = normalizarTelefone(numero)
  const carregandoCodigo = !codigo && !erroCodigo

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
          <div className="tile flex items-center justify-between gap-4 p-6">
            <div>
              <p className="rotulo m-0 flex items-center gap-2">
                <KeyRound className="size-4" strokeWidth={1.75} />
                Código de retirada
              </p>
              <p className="m-0 mt-1 text-sm text-muted">Vai na mensagem. Na entrega, o destinatário informa este código.</p>
            </div>
            <p className="num m-0 shrink-0 text-4xl font-medium tracking-[0.12em]" data-testid="codigo-retirada">
              {codigo ?? (erroCodigo ? '——' : '······')}
            </p>
          </div>
          {erroCodigo && (
            <div className="mt-3">
              <Aviso>Não foi possível gerar o código. A mensagem vai sem ele; na entrega, use “sem o código” com justificativa.</Aviso>
            </div>
          )}
        </Aparecer>

        <Aparecer i={3}>
          <div className="tile space-y-4 p-6">
            <label className="block space-y-2">
              <span className="rotulo">WhatsApp do destinatário</span>
              <input
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                inputMode="tel"
                autoComplete="off"
                placeholder="(13) 99999-0000"
                aria-label="WhatsApp do destinatário"
                className="num min-h-12 w-full rounded-botao border border-line bg-s2 px-4 text-lg"
              />
              <span className="block text-sm text-muted">
                {numero.trim() && !numeroValido
                  ? 'Confira o número: use DDD e o celular, por exemplo (13) 99999-0000.'
                  : telefone
                    ? 'Número do cadastro. Pode trocar se precisar.'
                    : 'Sem número no cadastro: digite o celular. Sem número, o WhatsApp abre para escolher o contato.'}
              </span>
            </label>
            <label className="block space-y-2">
              <span className="rotulo">Mensagem do aviso</span>
              <textarea
                value={texto}
                onChange={(e) => {
                  editado.current = true
                  setTexto(e.target.value)
                }}
                rows={5}
                aria-label="Mensagem do aviso"
                className="w-full rounded-botao border border-line bg-s2 p-4 text-base leading-6"
              />
            </label>
          </div>
        </Aparecer>

        <Aparecer i={4}>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => enviarWhatsapp(texto, numeroValido)}
              disabled={carregandoCodigo || !texto.trim() || (!!numero.trim() && !numeroValido)}
              className="inline-flex min-h-16 flex-1 cursor-pointer items-center justify-center gap-3 rounded-botao bg-[#25D366] px-6 text-lg font-semibold text-[#06290f] transition duration-[120ms] hover:bg-[#1fbe5b] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden>
                <path d={siWhatsapp.path} />
              </svg>
              {carregandoCodigo ? 'Gerando código…' : 'Avisar o morador'}
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
