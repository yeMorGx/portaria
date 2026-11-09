import { useCallback, useEffect, useState } from 'react'
import { CapturaFoto, LeitorCodigo } from './components/Camera'
import { Conferencia, Escolha, Inicio, Login, type Rascunho } from './components/Telas'
import { Cabecalho } from './components/ui'
import { dados, type Encomenda } from './lib/data'
import { lerTexto, reduzirImagem } from './lib/ocr'
import { extrairDados, type Morador } from './lib/parser'

function Lendo({ previa }: { previa: string | null }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6" role="status">
      <div className="relative w-full overflow-hidden rounded-2xl border border-line bg-card">
        {previa && <img src={previa} alt="" className="max-h-80 w-full object-contain" />}
        <div className="varredura absolute inset-x-0 top-0 h-1 bg-brand shadow-[0_0_24px_4px_var(--color-brand)]" />
      </div>
      <p className="text-xl font-semibold">Lendo a etiqueta…</p>
    </main>
  )
}

type Tela = 'carregando' | 'login' | 'inicio' | 'escolha' | 'foto' | 'codigo' | 'lendo' | 'conferir'

export default function App() {
  const [tela, setTela] = useState<Tela>('carregando')
  const [encomendas, setEncomendas] = useState<Encomenda[] | null>(null)
  const [moradores, setMoradores] = useState<Morador[]>([])
  const [rascunho, setRascunho] = useState<Rascunho | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [novoId, setNovoId] = useState<string | null>(null)
  const [previa, setPrevia] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    try {
      setErro(null)
      const [e, m] = await Promise.all([dados.listarEncomendas(), dados.listarMoradores()])
      setEncomendas(e)
      setMoradores(m)
    } catch {
      setErro('Não foi possível carregar os dados. Verifique a conexão.')
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
    setTela('lendo')
    setErro(null)
    const foto = await reduzirImagem(original).catch(() => original)
    let texto = ''
    try {
      texto = await lerTexto(foto)
    } catch {
      setErro('Não foi possível ler a etiqueta automaticamente. Selecione o morador manualmente.')
    }
    const r = extrairDados(texto, moradores)
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
    } catch {
      setErro('Não foi possível salvar. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  switch (tela) {
    case 'carregando':
      return <p className="p-10 text-muted">Carregando…</p>
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
      return <Escolha aoFoto={() => setTela('foto')} aoCodigo={() => setTela('codigo')} aoVoltar={() => setTela('inicio')} />
    case 'foto':
      return (
        <main className="mx-auto max-w-3xl px-6 py-10">
          <Cabecalho titulo="Fotografar etiqueta" voltar={() => setTela('escolha')} />
          <CapturaFoto aoCapturar={processarFoto} />
        </main>
      )
    case 'codigo':
      return (
        <main className="mx-auto max-w-3xl px-6 py-10">
          <Cabecalho titulo="Escanear código" voltar={() => setTela('escolha')} />
          <LeitorCodigo aoLer={processarCodigo} />
        </main>
      )
    case 'lendo':
      return (
        <Lendo previa={previa} />
      )
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
