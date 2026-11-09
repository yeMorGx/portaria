import { useMemo, useState } from 'react'
import { dados, type Encomenda } from '../lib/data'
import type { Morador } from '../lib/parser'
import { IconeCamera, IconeCodigo, IconeMais, IconeSair } from './icons'
import { Aviso, Botao, Cabecalho, EstadoVazio, Marca } from './ui'

const campo = 'min-h-12 w-full rounded-xl border border-line bg-card px-4 text-lg'

export function Login({ aoEntrar }: { aoEntrar: () => void }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Marca />
      <h1 className="mt-10 text-3xl font-bold tracking-tight">Entrar na portaria</h1>
      <p className="mt-2 mb-8 text-muted">Use a conta da portaria para registrar encomendas.</p>
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
          className={campo}
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Senha"
          aria-label="Senha"
          className={campo}
        />
        {erro && <Aviso>{erro}</Aviso>}
        <Botao type="submit" disabled={enviando} className="w-full">
          {enviando ? 'Entrando…' : 'Entrar'}
        </Botao>
      </form>
    </main>
  )
}

const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
const diaCompleto = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

function rotuloDia(d: Date): string {
  const hoje = new Date()
  const ontem = new Date()
  ontem.setDate(hoje.getDate() - 1)
  if (d.toDateString() === hoje.toDateString()) return 'Hoje'
  if (d.toDateString() === ontem.toDateString()) return 'Ontem'
  return diaCompleto.format(d)
}

function agruparPorDia(itens: Encomenda[]): Array<{ dia: string; itens: Encomenda[] }> {
  const grupos: Array<{ dia: string; itens: Encomenda[] }> = []
  for (const e of itens) {
    const dia = rotuloDia(new Date(e.recebido_em))
    const ultimo = grupos[grupos.length - 1]
    if (ultimo?.dia === dia) ultimo.itens.push(e)
    else grupos.push({ dia, itens: [e] })
  }
  return grupos
}

export function Inicio({
  encomendas,
  erro,
  novoId,
  aoNova,
  aoSair,
}: {
  encomendas: Encomenda[] | null
  erro: string | null
  novoId: string | null
  aoNova: () => void
  aoSair?: () => void
}) {
  const grupos = useMemo(() => agruparPorDia(encomendas ?? []), [encomendas])

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-10 flex items-center justify-between">
        <Marca />
        {aoSair && (
          <Botao variante="fantasma" onClick={aoSair} className="!min-h-11 !gap-2 !px-3">
            <IconeSair className="size-5" />
            Sair
          </Botao>
        )}
      </div>
      <Botao grande onClick={aoNova} className="mb-12 w-full">
        <IconeMais className="size-7" />
        Nova Encomenda
      </Botao>
      <h1 className="mb-4 text-2xl font-bold tracking-tight">Encomendas</h1>
      {erro && <Aviso>{erro}</Aviso>}
      {encomendas === null && !erro && <p className="text-muted">Carregando…</p>}
      {encomendas?.length === 0 && <EstadoVazio />}
      {!!grupos.length && (
        <div className="space-y-8" data-testid="lista">
          {grupos.map((g) => (
            <section key={g.dia} aria-label={g.dia}>
              <h2 className="mb-2 text-sm font-semibold tracking-wide text-muted capitalize">
                {g.dia} <span className="num font-normal">· {g.itens.length}</span>
              </h2>
              <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
                {g.itens.map((e) => (
                  <li key={e.id} className={`flex items-center gap-4 px-5 py-4 ${e.id === novoId ? 'recem' : ''}`}>
                    {e.foto_url ? (
                      <img src={e.foto_url} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <div className="grid size-14 shrink-0 place-items-center rounded-lg bg-brand-soft text-xl text-brand" aria-hidden>
                        <IconeCodigo />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-lg font-semibold leading-snug">{e.destinatario_nome}</p>
                      <p className="text-muted">
                        Apto <span className="num font-semibold text-ink">{e.apartamento}</span>
                        {e.transportadora ? ` · ${e.transportadora}` : ''}
                      </p>
                    </div>
                    <time className="num shrink-0 text-base text-muted" dateTime={e.recebido_em}>
                      {hora.format(new Date(e.recebido_em))}
                    </time>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
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
    <main className="mx-auto max-w-3xl px-6 py-8">
      <Cabecalho titulo="Nova Encomenda" voltar={aoVoltar} />
      <p className="mb-6 text-lg text-muted">Como você quer registrar este pacote?</p>
      <div className="space-y-4">
        <Botao grande onClick={aoFoto} className="!min-h-28 w-full !justify-start !px-8 text-left">
          <IconeCamera className="size-10 shrink-0" />
          <span>
            <span className="block text-2xl">Fotografar etiqueta</span>
            <span className="block text-base font-normal opacity-85">Lê nome, apartamento e transportadora.</span>
          </span>
        </Botao>
        <Botao variante="secundario" onClick={aoCodigo} className="!min-h-20 w-full !justify-start !px-8 text-left text-lg">
          <IconeCodigo className="size-8 shrink-0 text-brand" />
          <span>
            <span className="block text-xl">Escanear código</span>
            <span className="block text-base font-normal text-muted">Código de barras ou QR Code.</span>
          </span>
        </Botao>
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
    <main className="mx-auto max-w-4xl px-6 py-8">
      <Cabecalho titulo="Conferir encomenda" voltar={aoCancelar} />
      <div className="grid gap-8 md:grid-cols-[1fr_1.2fr]">
        {rascunho.fotoUrl ? (
          <img
            src={rascunho.fotoUrl}
            alt="Foto da etiqueta"
            className="max-h-[28rem] w-full rounded-2xl border border-line bg-card object-contain"
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-line p-6 text-muted">
            Sem foto.
            {rascunho.codigo && (
              <p className="mt-2 break-all text-sm">
                Código lido: <code className="num">{rascunho.codigo}</code>
              </p>
            )}
          </div>
        )}
        <div className="space-y-5">
          <p
            className={`rounded-lg px-4 py-3 text-sm ring-1 ${
              identificado ? 'bg-brand-soft text-brand-strong ring-brand/25' : 'bg-card text-ink ring-line'
            }`}
          >
            {identificado
              ? 'Morador identificado. Confira e salve.'
              : 'Não foi possível identificar o morador. Selecione na lista abaixo.'}
          </p>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-muted">Morador</span>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou apartamento"
              aria-label="Buscar morador"
              className={`${campo} mb-2 !min-h-11 !text-base`}
            />
            <select
              value={moradorId}
              onChange={(e) => setMoradorId(e.target.value)}
              aria-label="Morador"
              className={campo}
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
            <p className="num min-h-12 rounded-xl bg-brand-soft px-4 py-3 text-lg font-semibold" data-testid="apto">
              {morador?.apartamento ?? '—'}
            </p>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-muted">Transportadora</span>
            <input
              value={transportadora}
              onChange={(e) => setTransportadora(e.target.value)}
              placeholder="Opcional"
              className={campo}
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
