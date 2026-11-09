import { useMemo, useState } from 'react'
import { dados, type Encomenda } from '../lib/data'
import type { Morador } from '../lib/parser'
import { Aviso, Botao, Cabecalho } from './ui'

export function Login({ aoEntrar }: { aoEntrar: () => void }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Portaria</h1>
      <p className="mb-8 text-muted">Entre com a conta da portaria para registrar encomendas.</p>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          setEnviando(true)
          setErro(null)
          try {
            await dados.entrar(email, senha)
            aoEntrar()
          } catch (err) {
            setErro((err as Error).message)
          } finally {
            setEnviando(false)
          }
        }}
      >
        <input
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail"
          aria-label="E-mail"
          className="min-h-12 w-full rounded-xl border border-line bg-card px-4"
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Senha"
          aria-label="Senha"
          className="min-h-12 w-full rounded-xl border border-line bg-card px-4"
        />
        {erro && <Aviso>{erro}</Aviso>}
        <Botao type="submit" disabled={enviando} className="w-full">
          {enviando ? 'Entrando…' : 'Entrar'}
        </Botao>
      </form>
    </main>
  )
}

const formatador = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export function Inicio({
  encomendas,
  erro,
  aoNova,
  aoSair,
}: {
  encomendas: Encomenda[] | null
  erro: string | null
  aoNova: () => void
  aoSair?: () => void
}) {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Cabecalho
        titulo="Encomendas"
        direita={
          aoSair && (
            <Botao variante="fantasma" onClick={aoSair}>
              Sair
            </Botao>
          )
        }
      />
      <Botao grande onClick={aoNova} className="mb-10 w-full sm:w-auto">
        + Nova Encomenda
      </Botao>
      {erro && <Aviso>{erro}</Aviso>}
      {encomendas === null && !erro && <p className="text-muted">Carregando…</p>}
      {encomendas?.length === 0 && (
        <p className="rounded-2xl border border-dashed border-line px-6 py-12 text-center text-muted">
          Nenhuma encomenda registrada ainda.
        </p>
      )}
      {!!encomendas?.length && (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card" data-testid="lista">
          {encomendas.map((e) => (
            <li key={e.id} className="flex items-center gap-4 px-5 py-4">
              {e.foto_url ? (
                <img src={e.foto_url} alt="" className="size-14 rounded-lg object-cover" />
              ) : (
                <div className="size-14 rounded-lg bg-brand-soft" aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-semibold">{e.destinatario_nome}</p>
                <p className="text-muted">
                  Apto {e.apartamento}
                  {e.transportadora ? ` · ${e.transportadora}` : ''}
                </p>
              </div>
              <time className="shrink-0 text-sm text-muted" dateTime={e.recebido_em}>
                {formatador.format(new Date(e.recebido_em))}
              </time>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export function Escolha({
  aoFoto,
  aoCodigo,
  aoVoltar,
}: {
  aoFoto: () => void
  aoCodigo: () => void
  aoVoltar: () => void
}) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Cabecalho titulo="Nova Encomenda" voltar={aoVoltar} />
      <div className="grid gap-5 sm:grid-cols-2">
        <button
          onClick={aoFoto}
          className="cursor-pointer rounded-2xl border border-line bg-card p-8 text-left transition hover:border-brand hover:shadow-lg"
        >
          <span className="text-4xl" aria-hidden>
            📷
          </span>
          <span className="mt-4 block text-2xl font-bold">Fotografar etiqueta</span>
          <span className="mt-1 block text-muted">Lê nome, apartamento e transportadora da foto.</span>
        </button>
        <button
          onClick={aoCodigo}
          className="cursor-pointer rounded-2xl border border-line bg-card p-8 text-left transition hover:border-brand hover:shadow-lg"
        >
          <span className="text-4xl" aria-hidden>
            ▦
          </span>
          <span className="mt-4 block text-2xl font-bold">Escanear código</span>
          <span className="mt-1 block text-muted">Código de barras ou QR Code da etiqueta.</span>
        </button>
      </div>
    </main>
  )
}

export interface Rascunho {
  foto: Blob | null
  fotoUrl: string | null
  codigo: string | null
  morador: Morador | null
  nome: string
  apartamento: string
  transportadora: string
}

export function Conferencia({
  rascunho,
  moradores,
  salvando,
  erro,
  aoSalvar,
  aoCancelar,
}: {
  rascunho: Rascunho
  moradores: Morador[]
  salvando: boolean
  erro: string | null
  aoSalvar: (r: Rascunho) => void
  aoCancelar: () => void
}) {
  const [moradorId, setMoradorId] = useState(rascunho.morador?.id ?? '')
  const [transportadora, setTransportadora] = useState(rascunho.transportadora)
  const [busca, setBusca] = useState('')

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    const lista = q
      ? moradores.filter((m) => `${m.nome} ${m.apartamento}`.toLowerCase().includes(q))
      : moradores
    const sel = moradores.find((m) => m.id === moradorId)
    return sel && !lista.includes(sel) ? [sel, ...lista] : lista
  }, [busca, moradores, moradorId])

  const morador = moradores.find((m) => m.id === moradorId) ?? null
  const identificado = !!rascunho.morador

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Cabecalho titulo="Conferir encomenda" voltar={aoCancelar} />
      <div className="grid gap-8 sm:grid-cols-[1fr_1.2fr]">
        {rascunho.fotoUrl ? (
          <img src={rascunho.fotoUrl} alt="Foto da etiqueta" className="w-full rounded-2xl border border-line object-contain" />
        ) : (
          <div className="rounded-2xl border border-dashed border-line p-6 text-muted">
            Sem foto.
            {rascunho.codigo && (
              <p className="mt-2 break-all text-sm">
                Código lido: <code>{rascunho.codigo}</code>
              </p>
            )}
          </div>
        )}
        <div className="space-y-5">
          {!identificado && (
            <p className="rounded-lg bg-brand-soft px-4 py-3 text-sm">
              Não foi possível identificar o morador. Selecione na lista abaixo.
            </p>
          )}
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-muted">Morador</span>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou apartamento"
              aria-label="Buscar morador"
              className="mb-2 min-h-11 w-full rounded-xl border border-line bg-card px-4"
            />
            <select
              value={moradorId}
              onChange={(e) => setMoradorId(e.target.value)}
              aria-label="Morador"
              className="min-h-12 w-full rounded-xl border border-line bg-card px-4 text-lg"
            >
              <option value="">Selecione…</option>
              {filtrados.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome} — Apto {m.apartamento}
                </option>
              ))}
            </select>
          </label>
          <div>
            <span className="mb-1 block text-sm font-semibold text-muted">Apartamento</span>
            <p className="min-h-12 rounded-xl bg-brand-soft px-4 py-3 text-lg font-semibold" data-testid="apto">
              {morador?.apartamento ?? '—'}
            </p>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-muted">Transportadora</span>
            <input
              value={transportadora}
              onChange={(e) => setTransportadora(e.target.value)}
              placeholder="Opcional"
              className="min-h-12 w-full rounded-xl border border-line bg-card px-4 text-lg"
            />
          </label>
          {erro && <Aviso>{erro}</Aviso>}
          <Botao
            grande
            className="w-full"
            disabled={!morador || salvando}
            onClick={() =>
              morador &&
              aoSalvar({
                ...rascunho,
                morador,
                nome: morador.nome,
                apartamento: morador.apartamento,
                transportadora,
              })
            }
          >
            {salvando ? 'Salvando…' : 'Salvar Encomenda'}
          </Botao>
        </div>
      </div>
    </main>
  )
}
