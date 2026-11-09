import { AnimatePresence, animate, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Toaster, toast } from 'sonner'
import { CapturaFoto, LeitorCodigo } from './components/Camera'
import { Conferencia, Escolha, Inicio, Login, type Rascunho } from './components/Telas'
import { Cabecalho, Marca, Pagina } from './components/ui'
import { dados, type Encomenda } from './lib/data'
import { lerTexto, reduzirImagem } from './lib/ocr'
import { extrairDados, type Morador } from './lib/parser'

type Tela = 'carregando' | 'login' | 'inicio' | 'escolha' | 'foto' | 'codigo' | 'lendo' | 'conferir'
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
  const reduzir = useReducedMotion()

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
        setTela('inicio')
        carregar()
      } else setTela('login')
    })
  }, [carregar])

  function novoRascunho(parcial: Partial<Rascunho>): Rascunho {
    return {
      foto: null,
      fotoUrl: null,
      codigo: null,
      morador: null,
      nome: '',
      apartamento: '',
      transportadora: '',
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
    const r = extrairDados(texto, moradores)
    if (!reduzir && texto) await new Promise((ok) => setTimeout(ok, 450))
    setRascunho(
      novoRascunho({
        foto,
        fotoUrl: URL.createObjectURL(foto),
        morador: r.morador,
        transportadora: r.transportadora ?? '',
      }),
    )
    setTela('conferir')
  }

  function processarCodigo(codigo: string) {
    const r = extrairDados(codigo, moradores)
    setRascunho(novoRascunho({ codigo, morador: r.morador, transportadora: r.transportadora ?? '' }))
    setTela('conferir')
  }

  async function salvar(r: Rascunho) {
    setSalvando(true)
    setErro(null)
    try {
      const salva = await dados.salvarEncomenda({
        morador_id: r.morador?.id ?? null,
        destinatario_nome: r.nome,
        apartamento: r.apartamento,
        transportadora: r.transportadora.trim() || null,
        codigo_lido: r.codigo,
        foto: r.foto,
      })
      await carregar()
      setNovoId(salva.id)
      setRascunho(null)
      setTela('inicio')
      toast.success('Encomenda salva')
    } catch {
      setErro('Não foi possível salvar. Tente novamente.')
    } finally {
      setSalvando(false)
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
              setTela('inicio')
              carregar()
            }}
          />
        )
      case 'inicio':
        return (
          <Inicio
            encomendas={encomendas}
            erro={erro}
            novoId={novoId}
            aoNova={() => setTela('escolha')}
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

