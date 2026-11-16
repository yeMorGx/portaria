import { CheckCircle2, KeyRound, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { siWhatsapp } from 'simple-icons'
import { toast } from 'sonner'
import { dados, type Empresa, type Encomenda } from '../lib/data'
import { aguardandoNoDestino } from '../lib/pilhas'
import { enviarWhatsapp, mensagemAviso, normalizarTelefone } from '../lib/whatsapp'
import { CartaoPedido, Logos } from './Pedido'
import { Aparecer, Aviso, Botao, Cabecalho, Pagina } from './ui'

/**
 * Aviso pelo WhatsApp de tudo que aguarda retirada para o mesmo destino, com um código só.
 * Abre no fim do recebimento (`nova`) ou pelo botão do WhatsApp na lista.
 */
export function AvisoWhatsapp({
  referencia,
  nova,
  encomendas,
  empresas,
  aoOutra,
  aoConcluir,
}: {
  /** Uma encomenda do destino; o aviso cobre todas que aguardam retirada para ele. */
  referencia: Encomenda
  /** Veio do recebimento: mostra a encomenda salva e o botão de registrar outra. */
  nova?: boolean
  encomendas: Encomenda[]
  empresas: Empresa[]
  aoOutra?: () => void
  aoConcluir: () => void
}) {
  // A lista fica fixa ao abrir: o código gerado vale exatamente para estas encomendas.
  const [itens] = useState(() => {
    const doDestino = aguardandoNoDestino(encomendas, referencia)
    return doDestino.some((e) => e.id === referencia.id) ? doDestino : [referencia, ...doDestino]
  })
  const empresa = empresas.find((x) => x.id === referencia.empresa_id) ?? null
  const destinatarios = [...new Set(itens.map((e) => e.destinatario_id).filter(Boolean))] as string[]
  // Uma pessoa só: o número é dela. Várias pessoas (ou nenhuma): o contato da empresa.
  const alvo: { destinatarioId?: string; empresaId?: string | null } =
    destinatarios.length === 1 ? { destinatarioId: destinatarios[0] } : { empresaId: empresa?.id ?? null }
  const n = itens.length

  const [codigo, setCodigo] = useState<string | null>(null)
  const [erroCodigo, setErroCodigo] = useState(false)
  const [texto, setTexto] = useState(() => mensagemAviso({ itens, empresa: empresa?.nome }))
  const editado = useRef(false)
  const [numero, setNumero] = useState('')
  const [cadastrado, setCadastrado] = useState<string | null>(null)
  const digitou = useRef(false)
  const pedido = useRef(false)

  // Um código por tela: o número só existe agora, na mensagem; o banco guarda apenas o hash.
  useEffect(() => {
    if (pedido.current) return
    pedido.current = true
    dados
      .gerarCodigoLote(itens.map((e) => e.id))
      .then((c) => {
        setCodigo(c)
        if (!editado.current) setTexto(mensagemAviso({ itens, empresa: empresa?.nome, codigo: c }))
      })
      .catch(() => setErroCodigo(true))
  }, [itens, empresa?.nome])

  // Número já cadastrado: da pessoa, ou o contato da empresa.
  useEffect(() => {
    let cancelado = false
    const usar = (t: string | null | undefined) => {
      const tel = normalizarTelefone(t)
      if (cancelado || !tel) return
      setCadastrado(tel)
      if (!digitou.current) setNumero(tel)
    }
    if (alvo.destinatarioId && referencia.empresa_id) {
      dados
        .listarDestinatarios(referencia.empresa_id)
        .then((l) => usar(l.find((d) => d.id === alvo.destinatarioId)?.telefone))
        .catch(() => undefined)
    } else {
      usar(empresa?.responsavel_contato)
    }
    return () => {
      cancelado = true
    }
  }, [alvo.destinatarioId, referencia.empresa_id, empresa?.responsavel_contato])

  const numeroValido = normalizarTelefone(numero)
  const carregandoCodigo = !codigo && !erroCodigo
  const quem = destinatarios.length === 1 ? itens[0].destinatario_nome : (empresa?.nome ?? itens[0].destinatario_nome)
  const vaiSalvar = !!numeroValido && numeroValido !== cadastrado

  function avisar() {
    // Abre o WhatsApp primeiro, dentro do clique, para o navegador não bloquear a janela.
    void enviarWhatsapp(texto, numeroValido)
    if (vaiSalvar && numeroValido) {
      dados
        .lembrarTelefone(alvo, numeroValido)
        .then((ok) => {
          if (!ok) return
          setCadastrado(numeroValido)
          toast.success(`Número salvo no cadastro de ${quem}.`)
        })
        .catch(() => undefined)
    }
  }

  return (
    <Pagina className="md:max-w-2xl">
      <Cabecalho titulo={nova ? 'Encomenda registrada' : 'Avisar pelo WhatsApp'} voltar={nova ? undefined : aoConcluir} />
      <div className="space-y-4">
        {nova && (
          <Aparecer i={0}>
            <p className="m-0 flex items-center gap-2 font-medium text-ok" role="status">
              <CheckCircle2 className="size-5" strokeWidth={2} />
              {n > 1 ? `Salva. ${n} encomendas aguardam retirada${empresa ? ` para ${empresa.nome}` : ''}.` : 'Salva e pronta para retirada.'}
            </p>
          </Aparecer>
        )}

        <Aparecer i={1}>
          {nova && n === 1 ? (
            <CartaoPedido e={referencia} />
          ) : (
            <section className="tile p-6" aria-label="Encomendas do aviso">
              <p className="rotulo m-0 mb-3">
                {n} {n === 1 ? 'encomenda' : 'encomendas'} neste aviso{empresa ? ` · ${empresa.nome}` : ''}
              </p>
              <ul className="m-0 list-none space-y-3 p-0">
                {itens.map((e) => (
                  <li key={e.id} className="flex items-center gap-3">
                    <Logos e={e} tamanho={32} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{e.destinatario_nome}</span>
                      <span className="block truncate text-sm text-muted">
                        {[e.loja, e.transportadora, e.local_guarda].filter(Boolean).join(' · ') || 'Origem não informada'}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </Aparecer>

        <Aparecer i={2}>
          <div className="tile flex items-center justify-between gap-4 p-6">
            <div>
              <p className="rotulo m-0 flex items-center gap-2">
                <KeyRound className="size-4" strokeWidth={1.75} />
                Código de retirada
              </p>
              <p className="m-0 mt-1 text-sm text-muted">
                {n > 1 ? `Um código só, vale para as ${n}.` : 'Vai na mensagem.'} Na entrega, o destinatário informa este código.
              </p>
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
              <span className="rotulo">WhatsApp de {quem}</span>
              <input
                value={numero}
                onChange={(e) => {
                  digitou.current = true
                  setNumero(e.target.value)
                }}
                inputMode="tel"
                autoComplete="off"
                placeholder="(13) 99999-0000"
                aria-label="WhatsApp do destinatário"
                className="num min-h-12 w-full rounded-botao border border-line bg-s2 px-4 text-lg"
              />
              <span className="block text-sm text-muted">
                {numero.trim() && !numeroValido
                  ? 'Confira o número: use DDD e o celular, por exemplo (13) 99999-0000.'
                  : vaiSalvar
                    ? `Ao avisar, este número fica salvo no cadastro de ${quem}.`
                    : cadastrado
                      ? 'Número do cadastro.'
                      : 'Sem número no cadastro: digite uma vez e ele fica salvo.'}
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
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={avisar}
              disabled={carregandoCodigo || !texto.trim() || (!!numero.trim() && !numeroValido)}
              className="inline-flex min-h-16 w-full cursor-pointer items-center justify-center gap-3 rounded-botao bg-[#25D366] px-6 text-lg font-semibold text-[#06290f] transition duration-[120ms] hover:bg-[#1fbe5b] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden>
                <path d={siWhatsapp.path} />
              </svg>
              {carregandoCodigo ? 'Gerando código…' : 'Avisar o morador'}
            </button>
            <div className="flex flex-col gap-3 sm:flex-row">
              {nova && aoOutra && (
                <Botao variante="secundario" className="flex-1" onClick={aoOutra}>
                  <Plus className="size-5" strokeWidth={1.75} />
                  Outra encomenda para {empresa?.nome ?? quem}
                </Botao>
              )}
              <Botao variante="secundario" className="flex-1" onClick={aoConcluir}>
                Concluir
              </Botao>
            </div>
          </div>
        </Aparecer>
      </div>
    </Pagina>
  )
}
