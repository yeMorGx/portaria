import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Toaster, toast } from 'sonner'
import { CapturaFoto, LeitorCodigo } from './components/Camera'
import { Abertura, Celebracao, Cortina, type CortinaApi } from './components/Cinema'
import { Entrega } from './components/Entrega'
import { Conferencia, Escolha, Inicio, Login, Turno, type Rascunho } from './components/Telas'
import { Cabecalho, Pagina } from './components/ui'
import { useAnimacao } from './lib/animacao'
import { gsap, useGSAP } from './lib/gsap'
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

function Lendo({ previa, etapa, texto }: { previa: string | null; etapa: Etapa; texto: string }) {
  const raiz = useRef<HTMLDivElement>(null)
  const linhas = texto
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 5)
  useGSAP(
    () => {
      if (etapa === 'busca') {
        gsap.from('[data-lida]', { opacity: 0, x: -18, duration: 0.5, ease: 'expo.out', stagger: 0.07 })
      }
    },
    { scope: raiz, dependencies: [etapa, linhas.length] },
  )
  return (
    <Pagina className="md:max-w-xl">
      <Cabecalho titulo="Lendo a etiqueta" passo={2} />
      <div ref={raiz} role="status" className="space-y-4">
        <div className="tile cantos relative overflow-hidden !border-0 bg-black">
          {previa && <img src={previa} alt="" className="max-h-72 w-full object-contain md:max-h-96" />}
          <div className="varredura absolute inset-x-0 top-0 h-1 bg-accent shadow-[0_0_24px_4px_var(--accent)]" />
        </div>
        <p className="m-0 text-lg font-semibold">{etapa === 'ocr' ? 'Reconhecendo o texto…' : 'Procurando o morador…'}</p>
        {etapa === 'busca' && !!linhas.length && (
          <ul className="num m-0 list-none space-y-1 p-0 text-sm text-muted">
            {linhas.map((l, i) => (
              <li key={i} data-lida className="truncate">
                {l}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Pagina>
  )
}

/** Troca de tela: a cortina esconde a troca; aqui só um fade curto. */
function Transicao({ id, children }: { id: string; children: ReactNode }) {
  const { reduzir } = useAnimacao()
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, scale: reduzir ? 1 : 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduzir ? 0.1 : 0.2, ease: [0.16, 1, 0.3, 1] }}
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
  const { reduzir } = useAnimacao()
  const reduzirRef = useRef(reduzir)
  reduzirRef.current = reduzir
  const cortina = useRef<CortinaApi>(null)
  const [celebracao, setCelebracao] = useState<{ titulo: string; subtitulo: string } | null>(null)

  /** Troca de tela com a cortina de faixas. */
  const ir = useCallback((destino: Tela) => {
    if (cortina.current) cortina.current.cobrir(() => setTela(destino))
    else setTela(destino)
  }, [])

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
    // Abertura cinematográfica: no mínimo 1,3 s, a não ser que as animações estejam desligadas.
    const minimo = new Promise((ok) => setTimeout(ok, reduzirRef.current ? 0 : 1300))
    Promise.all([dados.sessaoAtiva(), minimo]).then(([ok]) => {
      if (ok) {
        carregar()
        ir(proxima())
      } else ir('login')
    })
  }, [carregar, proxima, ir])

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
    ir('lendo')
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
    ir('conferir')
  }

  function processarCodigo(codigo: string) {
    const pareceRastreio = !/s/.test(codigo) && codigo.length >= 8 && codigo.length <= 30
    setRascunho(novoRascunho({ codigo, ...(pareceRastreio ? { rastreio: codigo.toUpperCase() } : {}) }, codigo))
    ir('conferir')
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
      ir('inicio')
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
      const nome = entrega.destinatario_nome
      await dados.confirmarEntrega({ encomenda: entrega, entreguePor: turno, ...d })
      await carregar()
      setEntrega(null)
      setCelebracao({ titulo: 'Entrega confirmada', subtitulo: `Entregue a ${nome}` })
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
              ir(proxima())
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
              ir('inicio')
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
            aoNova={() => ir('escolha')}
            aoEntregar={(e) => {
              setErro(null)
              setEntrega(e)
              ir('entrega')
            }}
            aoTrocarTurno={() => ir('turno')}
            aoRecarregar={carregar}
            aoSair={
              dados.precisaLogin
                ? async () => {
                    await dados.sair()
                    ir('login')
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
              ir('inicio')
            }}
          />
        ) : null
      case 'escolha':
        return (
          <Escolha aoFoto={() => ir('foto')} aoCodigo={() => ir('codigo')} aoVoltar={() => ir('inicio')} />
        )
      case 'foto':
        return (
          <Pagina>
            <Cabecalho titulo="Fotografar etiqueta" passo={2} voltar={() => ir('escolha')} />
            <CapturaFoto aoCapturar={processarFoto} />
          </Pagina>
        )
      case 'codigo':
        return (
          <Pagina>
            <Cabecalho titulo="Escanear código" passo={2} voltar={() => ir('escolha')} />
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
              ir('inicio')
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
      <Cortina ref={cortina} />
      {celebracao && (
        <Celebracao
          titulo={celebracao.titulo}
          subtitulo={celebracao.subtitulo}
          aoMeio={() => setTela('inicio')}
          aoFim={() => setCelebracao(null)}
        />
      )}
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

