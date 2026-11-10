import { Check, MapPin, Eraser, KeyRound, TriangleAlert } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { lerCodigoSimulado } from '../lib/codigo'
import type { Encomenda } from '../lib/data'
import { CartaoPedido } from './Pedido'
import { Aparecer, Aviso, Botao, Cabecalho, Pagina } from './ui'

/** Campo de assinatura: desenho com o dedo, o mouse ou a caneta. */
function Assinatura({ aoMudar }: { aoMudar: (blob: Blob | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const desenhando = useRef(false)
  const [vazia, setVazia] = useState(true)

  useEffect(() => {
    const c = ref.current!
    const ratio = window.devicePixelRatio || 1
    const caixa = c.getBoundingClientRect()
    c.width = caixa.width * ratio
    c.height = caixa.height * ratio
    const g = c.getContext('2d')!
    g.scale(ratio, ratio)
    g.lineWidth = 2.5
    g.lineCap = 'round'
    g.lineJoin = 'round'
    g.strokeStyle = '#15152b'
  }, [])

  function ponto(e: React.PointerEvent) {
    const caixa = ref.current!.getBoundingClientRect()
    return { x: e.clientX - caixa.left, y: e.clientY - caixa.top }
  }

  function exportar() {
    ref.current!.toBlob((b) => aoMudar(b), 'image/png')
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-botao border border-line bg-white">
        <canvas
          ref={ref}
          data-testid="assinatura"
          aria-label="Área de assinatura do morador"
          className="block h-48 w-full touch-none md:h-56"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            desenhando.current = true
            const g = ref.current!.getContext('2d')!
            const p = ponto(e)
            g.beginPath()
            g.moveTo(p.x, p.y)
            g.lineTo(p.x + 0.01, p.y + 0.01)
            g.stroke()
          }}
          onPointerMove={(e) => {
            if (!desenhando.current) return
            const g = ref.current!.getContext('2d')!
            const p = ponto(e)
            g.lineTo(p.x, p.y)
            g.stroke()
          }}
          onPointerUp={() => {
            if (!desenhando.current) return
            desenhando.current = false
            setVazia(false)
            exportar()
          }}
        />
        {vazia && (
          <p className="pointer-events-none absolute inset-0 grid place-items-center text-muted">
            O morador assina aqui
          </p>
        )}
        <div aria-hidden className="pointer-events-none absolute inset-x-6 bottom-12 h-px bg-black/20" />
      </div>
      <Botao
        variante="fantasma"
        type="button"
        className="!min-h-11 !gap-2"
        onClick={() => {
          const c = ref.current!
          c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
          setVazia(true)
          aoMudar(null)
        }}
      >
        <Eraser className="size-5" strokeWidth={1.75} />
        Limpar assinatura
      </Botao>
    </div>
  )
}

export function Entrega({
  encomenda,
  entreguePor,
  enviando,
  erro,
  aoConfirmar,
  aoVoltar,
}: {
  encomenda: Encomenda
  entreguePor: string
  enviando: boolean
  erro: string | null
  aoConfirmar: (d: { codigo: string; semCodigo: boolean; justificativa: string; assinatura: Blob }) => void
  aoVoltar: () => void
}) {
  const [codigo, setCodigo] = useState('')
  const [semCodigo, setSemCodigo] = useState(false)
  const [justificativa, setJustificativa] = useState('')
  const [assinatura, setAssinatura] = useState<Blob | null>(null)
  const dica = lerCodigoSimulado(encomenda.id)

  const codigoOk = semCodigo ? justificativa.trim().length >= 5 : codigo.length === 6
  const pronto = codigoOk && !!assinatura

  return (
    <Pagina className="md:max-w-3xl">
      <Cabecalho titulo="Entregar ao morador" voltar={aoVoltar} />
      <div className="grid gap-4 lg:gap-6">
        <Aparecer i={0}>
          <CartaoPedido e={encomenda} destaque />
        </Aparecer>

        {encomenda.local_guarda && (
          <Aparecer i={1}>
            <div className="tile flex items-center gap-3 p-4">
              <MapPin className="size-5 text-accent" strokeWidth={1.75} />
              <p className="m-0">
                Pegar em <strong>{encomenda.local_guarda}</strong>
              </p>
            </div>
          </Aparecer>
        )}

        <Aparecer i={2}>
          <div className="tile flex flex-col gap-4 p-6">
            <p className="rotulo m-0 flex items-center gap-2">
              <KeyRound className="size-4" strokeWidth={1.75} /> Código de retirada
            </p>
            {!semCodigo ? (
              <>
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  aria-label="Código de retirada"
                  className="num min-h-16 w-full rounded-botao border border-line bg-s2 px-4 text-center text-[32px] tracking-[0.35em]"
                />
                <p className="m-0 text-sm text-muted">O morador recebe o código por mensagem e informa na entrega.</p>
              </>
            ) : (
              <>
                <p role="status" className="m-0 flex items-center gap-2 text-sm font-medium text-warn">
                  <TriangleAlert className="size-4" strokeWidth={2} /> Entrega sem código: fica registrada com a justificativa.
                </p>
                <textarea
                  value={justificativa}
                  onChange={(e) => setJustificativa(e.target.value)}
                  placeholder="Por que o morador está sem o código? (mínimo 5 letras)"
                  aria-label="Justificativa"
                  rows={3}
                  className="w-full rounded-botao border border-line bg-s2 p-4 text-base"
                />
              </>
            )}
            <button
              type="button"
              onClick={() => setSemCodigo((x) => !x)}
              className="min-h-11 cursor-pointer self-start text-sm font-medium text-accent hover:underline"
            >
              {semCodigo ? 'Voltar a pedir o código' : 'Morador sem o código'}
            </button>
            {dica && !semCodigo && (
              <p data-testid="codigo-simulado" className="num m-0 rounded-campo bg-accent-soft px-3 py-2 text-sm">
                MODO SIMULADO · código enviado ao morador: {dica}
              </p>
            )}
          </div>
        </Aparecer>

        <Aparecer i={3}>
          <div className="tile flex flex-col gap-3 p-6">
            <p className="rotulo m-0">Assinatura do morador</p>
            <Assinatura aoMudar={setAssinatura} />
          </div>
        </Aparecer>

        <Aparecer i={4}>
          <div className="sticky bottom-4 z-10 space-y-3 md:static">
            {erro && <Aviso>{erro}</Aviso>}
            <Botao
              grande
              className="w-full"
              disabled={!pronto || enviando}
              onClick={() =>
                assinatura && aoConfirmar({ codigo, semCodigo, justificativa: justificativa.trim(), assinatura })
              }
            >
              <Check className="size-6" strokeWidth={2} />
              {enviando ? 'Confirmando…' : 'Confirmar entrega'}
            </Botao>
            <p className="m-0 text-center text-sm text-muted">
              Entregue por <strong>{entreguePor}</strong>
            </p>
          </div>
        </Aparecer>
      </div>
    </Pagina>
  )
}
