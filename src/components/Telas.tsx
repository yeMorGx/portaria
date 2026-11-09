import { Check, LogOut, Plus, QrCode, ScanLine, TriangleAlert } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { dados, type Encomenda } from '../lib/data'
import type { Morador } from '../lib/parser'
import { SeletorMorador, SeletorTransportadora } from './Selecao'
import { Aparecer, Aviso, Botao, Cabecalho, EsqueletoLista, EstadoVazio, Marca, Pagina, Titulo } from './ui'

const campo = 'min-h-12 w-full rounded-botao border border-line bg-s2 px-4 text-lg'

export function Login({ aoEntrar }: { aoEntrar: () => void }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  return (
    <Pagina className="flex min-h-screen flex-col justify-center md:max-w-lg">
      <Aparecer>
        <div className="tile cantos p-6 pt-10 md:p-8 md:pt-12">
          <Marca />
          <Titulo className="mt-8 md:!text-[32px] md:!leading-9">Entrar na portaria</Titulo>
          <p className="m-0 mt-2 mb-6 text-muted">Use a conta da portaria para registrar encomendas.</p>
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
        </div>
      </Aparecer>
    </Pagina>
  )
}

const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
const diaCompleto = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

function mesmoDia(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}

function rotuloDia(d: Date): string {
  const hoje = new Date()
  const ontem = new Date()
  ontem.setDate(hoje.getDate() - 1)
  if (mesmoDia(d, hoje)) return 'Hoje'
  if (mesmoDia(d, ontem)) return 'Ontem'
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

function contarDias(lista: Encomenda[]) {
  const agora = new Date()
  const antes = new Date()
  antes.setDate(agora.getDate() - 1)
  return {
    hoje: lista.filter((e) => mesmoDia(new Date(e.recebido_em), agora)).length,
    ontem: lista.filter((e) => mesmoDia(new Date(e.recebido_em), antes)).length,
  }
}

export function Inicio({
  encomendas,
  erro,
  novoId,
  aoNova,
  aoSair,
  aoRecarregar,
}: {
  encomendas: Encomenda[] | null
  erro: string | null
  novoId: string | null
  aoNova: () => void
  aoSair?: () => void
  aoRecarregar: () => void
}) {
  const grupos = useMemo(() => agruparPorDia(encomendas ?? []), [encomendas])
  const { hoje, ontem } = useMemo(() => contarDias(encomendas ?? []), [encomendas])

  return (
    <Pagina>
      <header className="mb-6 flex min-h-11 items-center justify-between md:mb-8">
        <Marca />
        {aoSair && (
          <Botao variante="fantasma" onClick={aoSair} className="!min-h-11 !gap-2 !px-3">
            <LogOut className="size-5" strokeWidth={1.75} />
            Sair
          </Botao>
        )}
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-12 lg:gap-6">
        <Aparecer i={0} className="col-span-2 md:col-span-8">
          <button
            onClick={aoNova}
            className="cantos relative flex min-h-44 w-full cursor-pointer flex-col justify-between overflow-hidden rounded-tile bg-accent p-6 pt-10 text-left text-on-accent shadow-[var(--shadow-primary)] transition duration-[120ms] hover:bg-accent-strong active:translate-y-px md:min-h-56 md:p-8 md:pt-12"
          >
            <span className="rotulo !text-on-accent/80">Novo</span>
            <span className="flex items-end justify-between gap-4">
              <span>
                <span className="block text-[32px] leading-9 font-semibold tracking-[-0.02em] md:text-5xl md:leading-[48px] md:tracking-[-0.03em]">
                  Nova Encomenda
                </span>
                <span className="mt-1 block text-on-accent/80">Fotografar a etiqueta ou escanear o código</span>
              </span>
              <span className="grid size-14 shrink-0 place-items-center rounded-botao bg-on-accent/15 md:size-16">
                <Plus className="size-8" strokeWidth={1.75} />
              </span>
            </span>
          </button>
        </Aparecer>

        <Aparecer i={1} className="col-span-2 md:col-span-4">
          <div className="tile flex h-full min-h-36 flex-col justify-between gap-4 p-6 md:min-h-56 md:p-8">
            <p className="rotulo m-0">Hoje</p>
            <div>
              <p className="num m-0 text-[72px] leading-[72px] font-medium tracking-[-0.04em]" data-testid="contador-hoje">
                {hoje}
              </p>
              <p className="m-0 mt-2 text-muted">
                {hoje === 1 ? 'encomenda' : 'encomendas'} · ontem <span className="num">{ontem}</span>
              </p>
            </div>
          </div>
        </Aparecer>

        <Aparecer i={2} className="col-span-2 md:col-span-12">
          <section className="tile overflow-hidden" aria-label="Encomendas">
            <div className="flex items-center justify-between px-4 pt-5 pb-3 md:px-6">
              <h2 className="text-2xl leading-8 font-semibold tracking-[-0.02em]">Encomendas</h2>
              <span className="rotulo num">{encomendas?.length ?? 0}</span>
            </div>
            {erro && (
              <div className="px-4 pb-4 md:px-6">
                <Aviso aoRepetir={aoRecarregar}>{erro}</Aviso>
              </div>
            )}
            {encomendas === null && !erro && <EsqueletoLista />}
            {encomendas?.length === 0 && <EstadoVazio />}
            {!!grupos.length && (
              <div data-testid="lista">
                {grupos.map((g) => (
                  <section key={g.dia} aria-label={g.dia}>
                    <h3 className="rotulo flex items-center justify-between border-t border-line bg-s2 px-4 py-2 capitalize md:px-6">
                      <span>{g.dia}</span>
                      <span className="num">{g.itens.length}</span>
                    </h3>
                    <ul className="m-0 list-none divide-y divide-line p-0">
                      {g.itens.map((e) => (
                        <motion.li
                          key={e.id}
                          className="flex items-center gap-4 px-4 py-4 md:px-6"
                          initial={e.id === novoId ? { backgroundColor: 'var(--accent-soft)', y: -6, opacity: 0.4 } : false}
                          animate={{ backgroundColor: 'rgba(0,0,0,0)', y: 0, opacity: 1 }}
                          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                        >
                          {e.foto_url ? (
                            <img src={e.foto_url} alt="" className="size-14 shrink-0 rounded-campo object-cover" />
                          ) : (
                            <div
                              className="grid size-14 shrink-0 place-items-center rounded-campo bg-accent-soft text-accent"
                              aria-hidden
                            >
                              <QrCode className="size-6" strokeWidth={1.75} />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="m-0 line-clamp-2 text-lg leading-snug font-semibold">{e.destinatario_nome}</p>
                            <p className="m-0 text-muted">
                              Apto <span className="num font-medium text-ink">{e.apartamento}</span>
                              {e.transportadora ? ` · ${e.transportadora}` : ''}
                            </p>
                          </div>
                          <time className="num shrink-0 text-base text-muted" dateTime={e.recebido_em}>
                            {hora.format(new Date(e.recebido_em))}
                          </time>
                        </motion.li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </section>
        </Aparecer>
      </div>
    </Pagina>
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
    <Pagina>
      <Cabecalho titulo="Nova Encomenda" passo={1} voltar={aoVoltar} />
      <p className="m-0 mb-6 text-lg text-muted">Como você quer registrar este pacote?</p>
      <div className="grid gap-4 md:grid-cols-12 lg:gap-6">
        <Aparecer i={0} className="md:col-span-7">
          <button
            onClick={aoFoto}
            className="cantos relative flex min-h-44 w-full cursor-pointer flex-col justify-between rounded-tile bg-accent p-6 pt-10 text-left text-on-accent shadow-[var(--shadow-primary)] transition duration-[120ms] hover:bg-accent-strong active:translate-y-px md:min-h-64 md:p-8 md:pt-12"
          >
            <ScanLine className="size-10" strokeWidth={1.5} />
            <span>
              <span className="block text-[32px] leading-9 font-semibold tracking-[-0.02em]">Fotografar etiqueta</span>
              <span className="mt-1 block text-on-accent/80">Lê nome, apartamento e transportadora.</span>
            </span>
          </button>
        </Aparecer>
        <Aparecer i={1} className="md:col-span-5">
          <button
            onClick={aoCodigo}
            className="tile flex min-h-32 w-full cursor-pointer flex-col justify-between p-6 text-left transition duration-[120ms] hover:bg-s2 active:translate-y-px md:h-full md:min-h-64 md:p-8"
          >
            <QrCode className="size-8 text-accent" strokeWidth={1.5} />
            <span>
              <span className="block text-2xl leading-8 font-semibold tracking-[-0.02em]">Escanear código</span>
              <span className="mt-1 block text-muted">Código de barras ou QR Code.</span>
            </span>
          </button>
        </Aparecer>
      </div>
    </Pagina>
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
  const morador = moradores.find((m) => m.id === moradorId) ?? null
  const identificado = !!rascunho.morador

  return (
    <Pagina>
      <Cabecalho titulo="Conferir encomenda" passo={3} voltar={aoCancelar} />
      <div className="grid gap-4 md:grid-cols-12 lg:gap-6">
        <Aparecer i={0} className="md:col-span-5 md:row-span-3">
          <div className="tile overflow-hidden md:h-full">
            {rascunho.fotoUrl ? (
              <img
                src={rascunho.fotoUrl}
                alt="Foto da etiqueta"
                className="max-h-64 w-full bg-s2 object-contain md:max-h-none md:h-full"
              />
            ) : (
              <div className="p-6 text-muted">
                <p className="m-0">Sem foto.</p>
                {rascunho.codigo && (
                  <p className="m-0 mt-3 break-all text-sm">
                    Código lido: <code className="num">{rascunho.codigo}</code>
                  </p>
                )}
              </div>
            )}
          </div>
        </Aparecer>

        <Aparecer i={1} className="md:col-span-7">
          <div className={`tile flex flex-col gap-4 p-6 ${identificado ? 'pulso' : ''}`}>
            <p
              className={`m-0 flex items-center gap-2 text-sm font-medium ${identificado ? 'text-ok' : 'text-warn'}`}
              role="status"
            >
              {identificado ? (
                <Check className="size-4" strokeWidth={2} />
              ) : (
                <TriangleAlert className="size-4" strokeWidth={2} />
              )}
              {identificado ? 'Morador identificado. Confira e salve.' : 'Não foi possível identificar o morador. Selecione abaixo.'}
            </p>
            <div>
              <p className="rotulo m-0 mb-2">Morador</p>
              <SeletorMorador moradores={moradores} valor={moradorId} aoMudar={setMoradorId} />
            </div>
          </div>
        </Aparecer>

        <Aparecer i={2} className="md:col-span-7">
          <div className="tile flex items-end justify-between gap-4 p-6">
            <div>
              <p className="rotulo m-0">Apartamento</p>
              <p
                className="num m-0 text-[72px] leading-[72px] font-medium tracking-[-0.04em]"
                data-testid="apto"
              >
                {morador?.apartamento ?? '—'}
              </p>
            </div>
          </div>
        </Aparecer>

        <Aparecer i={3} className="md:col-span-7">
          <div className="tile p-6">
            <p className="rotulo m-0 mb-3">Transportadora</p>
            <SeletorTransportadora valor={transportadora} aoMudar={setTransportadora} />
          </div>
        </Aparecer>

        <Aparecer i={4} className="md:col-span-12">
          <div className="sticky bottom-4 z-10 space-y-3 md:static">
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
                  transportadora: transportadora.trim(),
                })
              }
            >
              {salvando ? 'Salvando…' : 'Salvar Encomenda'}
            </Botao>
          </div>
        </Aparecer>
      </div>
    </Pagina>
  )
}
