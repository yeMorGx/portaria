import { AnimatePresence, animate, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Toaster, toast } from 'sonner'
import { CapturaFoto, LeitorCodigo } from './components/Camera'
import { Entrega } from './components/Entrega'
import { Conferencia, Escolha, Inicio, Login, Turno, type Rascunho } from './components/Telas'
import { Cabecalho, Marca, Pagina } from './components/ui'
import { dados, ErroEntrega, type Encomenda } from './lib/data'
import { lerTexto, reduzirImagem } from './lib/ocr'
import { extrairDados, type Morador } from './lib/parser'

type Tela = 'carregando' | 'login' | 'turno' | 'inicio' | 'escolha' | 'foto' | 'codigo' | 'lendo' | 'conferir' | 'entrega'

const CHAVE_TURNO = 'portaria.turno'
function mensagemErroEntrega(e: unknown): string {
  if (!(e instanceof ErroEntrega)) return 'Não foi possível confirmar a entrega. Tente novamente.'
  switch (e.motivo) {
    case 'codigo_incorreto':
      return `Código incorreto. Restam ${e.restantes ?? 0} tentativa(s).`
    case 'bloqueado':
      return 'Muitas tentativas erradas. Aguarde 15 minutos ou use “Morador sem o código”.'
    case 'expirado':
      return 'Este código expirou. Reenvie o código ao morador.'
    case 'codigo_usado':
    case 'sem_codigo_gerado':
      return 'Este pedido não tem código válido. Reenvie o código ou use “Morador sem o código”.'
    case 'ja_retirada':
      return 'Esta encomenda já foi entregue.'
    default:
      return 'Não foi possível confirmar a entrega. Tente novamente.'
  }
}

function lerTurno(): string {
  try {
    return localStorage.getItem(CHAVE_TURNO) ?? ''
  } catch {
    return ''
  }
}
type Etapa = 'ocr' | 'busca'

/** Abertura do app: marca com contador. Some assim que a sessão é conhecida. */
function Abertura() {
  const [valor, setValor] = useState(0)
  useEffect(() => {
    const controle = animate(0, 100, { duration: 0.9, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setValor(Math.round(v)) })
    return () => controle.stop()
  }, [])
  return (
    <main className="grid min-h-screen place-items-center" role="status" aria-label="Carregando">
      <div className="flex flex-col items-center gap-4">
        <div className="opacity-40" style={{ clipPath: 'inset(0)' }}>
          <Marca />
        </div>
        <p className="rotulo num m-0">{valor}%</p>
      </div>
    </main>
  )
}

function Lendo({ previa, etapa, texto }: { previa: string | null; etapa: Etapa; texto: string }) {
  const linhas = texto
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 5)
  return (
    <Pagina className="md:max-w-xl">
      <Cabecalho titulo="Lendo a etiqueta" passo={2} />
      <div role="status" className="space-y-4">
        <div className="tile cantos relative overflow-hidden !border-0 bg-black">
          {previa && <img src={previa} alt="" className="max-h-72 w-full object-contain md:max-h-96" />}
          <div className="varredura absolute inset-x-0 top-0 h-1 bg-accent shadow-[0_0_24px_4px_var(--accent)]" />
        </div>
        <p className="m-0 text-lg font-semibold">
          {etapa === 'ocr' ? 'Reconhecendo o texto…' : 'Procurando o morador…'}
        </p>
        {etapa === 'busca' && !!linhas.length && (
          <ul className="num m-0 list-none space-y-1 p-0 text-sm text-muted">
            {linhas.map((l, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
                className="truncate"
              >
                {l}
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </Pagina>
  )
}

/** Troca de tela: deslize curto de 16 px com fade (200 ms). */
function Transicao({ id, children }: { id: string; children: ReactNode }) {
  const reduzir = useReducedMotion()
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, x: reduzir ? 0 : 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: reduzir ? 0 : -16 }}
      transition={{ duration: reduzir ? 0.12 : 0.2, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  const [tela, setTela] = useState<Tela>('carregando')
  const [encomendas, setEncomendas] = useState<Encomenda[] | null>(null)
  const [moradores, setMoradores] = useState<Morador[]>([])
  const [rascunho, setRascunho] = useState<Rascunho | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [novoId, setNovoId] = useState<string | null>(null)
  const [previa, setPrevia] = useState<string | null>(null)
  const [etapa, setEtapa] = useState<Etapa>('ocr')
  const [textoLido, setTextoLido] = useState('')
  const [turno, setTurno] = useState(lerTurno)
  const [entrega, setEntrega] = useState<Encomenda | null>(null)
  const [enviando, setEnviando] = useState(false)
  const reduzir = useReducedMotion()

  const proxima = useCallback(() => (lerTurno() ? 'inicio' : 'turno') as Tela, [])

  const carregar = useCallback(async () => {
    try {
      setErro(null)
      const [e, m] = await Promise.all([dados.listarEncomendas(), dados.listarMoradores()])
      setEncomendas(e)
      setMoradores(m)
    } catch {
      setErro('Não foi possível carregar as encomendas. Verifique a conexão e tente de novo.')
    }
  }, [])

  useEffect(() => {
    dados.sessaoAtiva().then((ok) => {
      if (ok) {
        setTela(proxima())
        carregar()
      } else setTela('login')
    })
  }, [carregar, proxima])

  function novoRascunho(parcial: Partial<Rascunho>, texto = ''): Rascunho {
    const r = extrairDados(texto, moradores)
    return {
      foto: null,
      fotoUrl: null,
      codigo: null,
      morador: r.morador,
      loja: r.loja ?? '',
      transportadora: r.transportadora ?? '',
      vendedor: r.remetente ?? '',
      pedido: r.pedido ?? '',
      rastreio: r.rastreio ?? '',
      origem_cidade: r.origem_cidade ?? '',
      origem_uf: r.origem_uf ?? '',
      tipo: 'caixa',
      volumes: 1,
      condicao: 'ok',
      local_guarda: '',
      observacao: '',
      foto_pacote: null,
      ...parcial,
    }
  }

  async function processarFoto(original: Blob) {
    setPrevia(URL.createObjectURL(original))
    setEtapa('ocr')
    setTextoLido('')
    setTela('lendo')
    setErro(null)
    const foto = await reduzirImagem(original).catch(() => original)
    let texto = ''
    try {
      texto = await lerTexto(foto)
    } catch {
      toast.error('Não foi possível ler a etiqueta automaticamente. Selecione o morador manualmente.')
    }
    setTextoLido(texto)
    setEtapa('busca')
    if (!reduzir && texto) await new Promise((ok) => setTimeout(ok, 450))
    setRascunho(novoRascunho({ foto, fotoUrl: URL.createObjectURL(foto) }, texto))
    setTela('conferir')
  }

  function processarCodigo(codigo: string) {
    const pareceRastreio = !/s/.test(codigo) && codigo.length >= 8 && codigo.length <= 30
    setRascunho(novoRascunho({ codigo, ...(pareceRastreio ? { rastreio: codigo.toUpperCase() } : {}) }, codigo))
    setTela('conferir')
  }

  async function salvar(r: Rascunho & { morador: Morador }) {
    setSalvando(true)
    setErro(null)
    try {
      const vazio = (v: string) => v.trim() || null
      const salva = await dados.salvarEncomenda({
        morador: r.morador,
        destinatario_nome: r.morador.nome,
        apartamento: r.morador.apartamento,
        loja: vazio(r.loja),
        transportadora: vazio(r.transportadora),
        vendedor: vazio(r.vendedor),
        pedido: vazio(r.pedido),
        rastreio: vazio(r.rastreio),
        origem_cidade: vazio(r.origem_cidade),
        origem_uf: vazio(r.origem_uf),
        tipo: r.tipo,
        volumes: r.volumes,
        condicao: r.condicao,
        local_guarda: vazio(r.local_guarda),
        observacao: vazio(r.observacao),
        codigo_lido: r.codigo,
        foto: r.foto,
        foto_pacote: r.foto_pacote,
        recebido_por: turno,
      })
      await carregar()
      setNovoId(salva.id)
      setRascunho(null)
      setTela('inicio')
      toast.success(
        salva.status === 'avisada'
          ? 'Encomenda salva. Aviso ao morador enviado (simulado).'
          : 'Encomenda salva. Morador sem telefone ou consentimento: sem aviso.',
      )
    } catch {
      setErro('Não foi possível salvar. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  async function confirmarEntrega(d: { codigo: string; semCodigo: boolean; justificativa: string; assinatura: Blob }) {
    if (!entrega) return
    setEnviando(true)
    setErro(null)
    try {
      await dados.confirmarEntrega({ encomenda: entrega, entreguePor: turno, ...d })
      await carregar()
      setEntrega(null)
      setTela('inicio')
      toast.success('Entrega confirmada')
    } catch (e) {
      setErro(mensagemErroEntrega(e))
    } finally {
      setEnviando(false)
    }
  }

  async function reenviarCodigo() {
    if (!entrega) return
    try {
      const r = await dados.reenviarCodigo(entrega)
      toast[r.avisado ? 'success' : 'message'](
        r.avisado ? 'Código novo enviado ao morador (simulado).' : 'Morador sem telefone ou consentimento: não há como enviar.',
      )
      setErro(null)
    } catch {
      toast.error('Não foi possível reenviar o código.')
    }
  }

  function conteudo(): ReactNode {
    switch (tela) {
      case 'carregando':
        return <Abertura />
      case 'login':
        return (
          <Login
            aoEntrar={() => {
              setTela(proxima())
              carregar()
            }}
          />
        )
      case 'turno':
        return (
          <Turno
            aoConfirmar={(nome) => {
              try {
                localStorage.setItem(CHAVE_TURNO, nome)
              } catch {
                /* sem armazenamento: o nome vale só nesta sessão */
              }
              setTurno(nome)
              setTela('inicio')
            }}
          />
        )
      case 'inicio':
        return (
          <Inicio
            encomendas={encomendas}
            erro={erro}
            novoId={novoId}
            turno={turno}
            aoNova={() => setTela('escolha')}
            aoEntregar={(e) => {
              setErro(null)
              setEntrega(e)
              setTela('entrega')
            }}
            aoTrocarTurno={() => setTela('turno')}
            aoRecarregar={carregar}
            aoSair={
              dados.precisaLogin
                ? async () => {
                    await dados.sair()
                    setTela('login')
                  }
                : undefined
            }
          />
        )
      case 'entrega':
        return entrega ? (
          <Entrega
            encomenda={entrega}
            entreguePor={turno}
            enviando={enviando}
            erro={erro}
            aoConfirmar={confirmarEntrega}
            aoReenviar={reenviarCodigo}
            aoVoltar={() => {
              setErro(null)
              setEntrega(null)
              setTela('inicio')
            }}
          />
        ) : null
      case 'escolha':
        return (
          <Escolha aoFoto={() => setTela('foto')} aoCodigo={() => setTela('codigo')} aoVoltar={() => setTela('inicio')} />
        )
      case 'foto':
        return (
          <Pagina>
            <Cabecalho titulo="Fotografar etiqueta" passo={2} voltar={() => setTela('escolha')} />
            <CapturaFoto aoCapturar={processarFoto} />
          </Pagina>
        )
      case 'codigo':
        return (
          <Pagina>
            <Cabecalho titulo="Escanear código" passo={2} voltar={() => setTela('escolha')} />
            <LeitorCodigo aoLer={processarCodigo} />
          </Pagina>
        )
      case 'lendo':
        return <Lendo previa={previa} etapa={etapa} texto={textoLido} />
      case 'conferir':
        return rascunho ? (
          <Conferencia
            rascunho={rascunho}
            moradores={moradores}
            salvando={salvando}
            erro={erro}
            aoSalvar={salvar}
            aoCancelar={() => {
              setErro(null)
              setRascunho(null)
              setTela('inicio')
            }}
          />
        ) : null
    }
  }

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <Transicao id={tela}>{conteudo()}</Transicao>
      </AnimatePresence>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--surface-1)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-overlay)',
            fontFamily: 'var(--font-sans)',
          },
        }}
      />
    </>
  )
}

