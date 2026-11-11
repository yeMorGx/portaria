import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Toaster, toast } from 'sonner'
import { CapturaFoto, LeitorCodigo } from './components/Camera'
import { Abertura, Celebracao, Cortina, type CortinaApi } from './components/Cinema'
import { Entrega } from './components/Entrega'
import { Conferencia, Escolha, Inicio, Login, Turno, type Rascunho } from './components/Telas'
import { Botao, Cabecalho, Pagina } from './components/ui'
import { Cadastro } from './components/Cadastro'
import { useAnimacao } from './lib/animacao'
import { gsap, useGSAP } from './lib/gsap'
import { dados, ErroEntrega, type Empresa, type Encomenda, type Perfil } from './lib/data'
import { lerTexto, reduzirImagem } from './lib/ocr'
import { extrairDados, normalizar, type Morador } from './lib/parser'

type Tela = 'carregando' | 'login' | 'semacesso' | 'cadastro' | 'turno' | 'inicio' | 'escolha' | 'foto' | 'codigo' | 'lendo' | 'conferir' | 'entrega'

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
const ORDEM: Record<Tela, number> = {
  carregando: -1,
  login: 0,
  semacesso: 0,
  cadastro: 0,
  turno: 0,
  inicio: 1,
  escolha: 2,
  entrega: 2,
  foto: 3,
  codigo: 3,
  lendo: 4,
  conferir: 5,
}

type Etapa = 'ocr' | 'busca'

/** Empresa cujo nome aparece no texto lido da etiqueta (ignora acento e caixa). */
function empresaNoTexto(texto: string, empresas: Empresa[]): Empresa | null {
  const alvo = ` ${normalizar(texto)} `
  let melhor: Empresa | null = null
  for (const e of empresas) {
    const nome = normalizar(e.nome)
    if (nome.length >= 3 && alvo.includes(` ${nome} `) && (!melhor || nome.length > normalizar(melhor.nome).length)) melhor = e
  }
  return melhor
}

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

/** Troca de tela do dia a dia: deslize curto na direção do fluxo, com fade. */
function Transicao({ id, direcao, children }: { id: string; direcao: 1 | -1; children: ReactNode }) {
  const { reduzir } = useAnimacao()
  const dx = reduzir ? 0 : 36
  return (
    <motion.div
      key={id}
      custom={direcao}
      variants={{
        entra: (d: number) => ({ opacity: 0, x: dx * d }),
        fica: { opacity: 1, x: 0 },
        sai: (d: number) => ({ opacity: 0, x: -dx * d }),
      }}
      initial="entra"
      animate="fica"
      exit="sai"
      transition={{ duration: reduzir ? 0.1 : 0.24, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  const [tela, setTela] = useState<Tela>('carregando')
  const [encomendas, setEncomendas] = useState<Encomenda[] | null>(null)
  const [moradores, setMoradores] = useState<Morador[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
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

  const [direcao, setDirecao] = useState<1 | -1>(1)
  const telaAtual = useRef<Tela>('carregando')

  /**
   * Troca de tela. A cortina de faixas fica só para os momentos de entrada (abertura, login, início do turno);
   * no dia a dia a troca é um deslize curto, para frente ou para trás.
   */
  const ir = useCallback((destino: Tela, opcoes?: { cortina?: boolean }) => {
    setDirecao(ORDEM[destino] >= ORDEM[telaAtual.current] ? 1 : -1)
    telaAtual.current = destino
    if (opcoes?.cortina && cortina.current) cortina.current.cobrir(() => setTela(destino))
    else setTela(destino)
  }, [])

  const proxima = useCallback(() => (lerTurno() ? 'inicio' : 'turno') as Tela, [])

  const carregar = useCallback(async () => {
    try {
      setErro(null)
      const [e, m, emp] = await Promise.all([dados.listarEncomendas(), dados.listarMoradores(), dados.listarEmpresas()])
      setEncomendas(e)
      setMoradores(m)
      setEmpresas(emp)
    } catch {
      setErro('Não foi possível carregar as encomendas. Verifique a conexão e tente de novo.')
    }
  }, [])

  const [perfil, setPerfil] = useState<Perfil | null>(null)

  /** Depois do login: a conta define o prédio, o nome do turno e o papel. Sem perfil, a conta não entra. */
  const entrarNoApp = useCallback(async () => {
    try {
      const p = await dados.perfil()
      if (dados.precisaLogin && !p) {
        ir('semacesso', { cortina: true })
        return
      }
      if (p) {
        setPerfil(p)
        setTurno(p.nome)
        carregar()
        ir('inicio', { cortina: true })
        return
      }
      carregar()
      ir(proxima(), { cortina: true })
    } catch {
      ir('login', { cortina: true })
    }
  }, [carregar, proxima, ir])

  useEffect(() => {
    // Abertura cinematográfica: no mínimo 1,3 s, a não ser que as animações estejam desligadas.
    const minimo = new Promise((ok) => setTimeout(ok, reduzirRef.current ? 0 : 1300))
    Promise.all([dados.sessaoAtiva(), minimo]).then(([ok]) => {
      if (ok) void entrarNoApp()
      else ir('login', { cortina: true })
    })
  }, [entrarNoApp, ir])

  function novoRascunho(parcial: Partial<Rascunho>, texto = ''): Rascunho {
    const r = extrairDados(texto, moradores)
    const empresa = empresaNoTexto(texto, empresas)
    return {
      foto: null,
      fotoUrl: null,
      codigo: null,
      morador: r.morador,
      empresa_id: empresa?.id ?? null,
      destinatario_id: null,
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

  async function salvar(r: Rascunho) {
    const empresa = empresas.find((e) => e.id === r.empresa_id)
    if (!empresa) return
    setSalvando(true)
    setErro(null)
    try {
      const vazio = (v: string) => v.trim() || null
      const destinatarios = await dados.listarDestinatarios(empresa.id)
      const destinatario = destinatarios.find((d) => d.id === r.destinatario_id)
      const salva = await dados.salvarEncomenda({
        morador: null,
        empresa_id: empresa.id,
        destinatario_id: destinatario?.id ?? null,
        destinatario_nome: destinatario?.nome ?? empresa.nome,
        apartamento: empresa.sala ?? empresa.andar ?? '-',
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
            aoEntrar={() => void entrarNoApp()}
          />
        )
      case 'cadastro':
        return perfil ? <Cadastro predioId={perfil.predio_id} aoVoltar={() => ir('inicio')} /> : null
      case 'semacesso':
        return (
          <Pagina className="flex min-h-screen flex-col justify-center md:max-w-lg">
            <div className="tile p-6 md:p-8">
              <h1 className="text-2xl font-semibold tracking-[-0.02em]">Conta sem acesso</h1>
              <p className="mt-3 text-muted">Esta conta não está liberada para o sistema. Peça ao administrador do prédio para cadastrá-la.</p>
              <Botao
                variante="secundario"
                className="mt-6 w-full"
                onClick={async () => {
                  await dados.sair()
                  ir('login', { cortina: true })
                }}
              >
                Sair
              </Botao>
            </div>
          </Pagina>
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
              ir('inicio', { cortina: true })
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
            aoTrocarTurno={perfil ? undefined : () => ir('turno')}
            aoCadastro={perfil && (perfil.papel === 'sindico' || perfil.papel === 'administradora') ? () => ir('cadastro') : undefined}
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
            empresas={empresas}
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
      <AnimatePresence mode="wait" initial={false} custom={direcao}>
        <Transicao id={tela} direcao={direcao}>
          {conteudo()}
        </Transicao>
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

