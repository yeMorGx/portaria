import * as ToggleGroup from '@radix-ui/react-toggle-group'
import { Camera, Check, ChevronDown, LogOut, Plus, QrCode, ScanLine, TriangleAlert, UserRound } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo, useRef, useState } from 'react'
import { gsap, useGSAP } from '../lib/gsap'
import { dados, type Condicao, type Encomenda, type TipoPacote } from '../lib/data'
import type { Morador } from '../lib/parser'
import { Holofote, NumeroAnimado, TituloLetras } from './Cinema'
import { ControleAnimacao } from './ControleAnimacao'
import { CONDICOES, CartaoPedido, TIPOS } from './Pedido'
import { ChipsUnico, Contador, SeletorMarca, SeletorMorador } from './Selecao'
import { Aparecer, Aviso, Botao, Cabecalho, EsqueletoLista, EstadoVazio, Marca, Pagina, Titulo } from './ui'

const campo = 'min-h-12 w-full rounded-botao border border-line bg-s2 px-4 text-lg'
const campoPequeno = 'min-h-12 w-full rounded-botao border border-line bg-s2 px-4 text-base'

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

/** Turno: quem está na portaria. Sem gestão de funcionários, só um nome lembrado neste aparelho. */
export function Turno({ aoConfirmar }: { aoConfirmar: (nome: string) => void }) {
  const [nome, setNome] = useState('')
  return (
    <Pagina className="flex min-h-screen flex-col justify-center md:max-w-lg">
      <Aparecer>
        <form
          className="tile cantos flex flex-col gap-4 p-6 pt-10 md:p-8 md:pt-12"
          onSubmit={(e) => {
            e.preventDefault()
            if (nome.trim().length >= 2) aoConfirmar(nome.trim())
          }}
        >
          <Marca />
          <Titulo className="mt-4 md:!text-[32px] md:!leading-9">Quem está na portaria?</Titulo>
          <p className="m-0 text-muted">O nome fica registrado em cada encomenda recebida e entregue neste turno.</p>
          <input
            autoFocus
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome"
            aria-label="Seu nome"
            className={campo}
          />
          <Botao type="submit" disabled={nome.trim().length < 2} className="w-full">
            Começar turno
          </Botao>
        </form>
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

function agruparPorDia(itens: Encomenda[], campoData: 'recebido_em' | 'retirado_em'): Array<{ dia: string; itens: Encomenda[] }> {
  const grupos: Array<{ dia: string; itens: Encomenda[] }> = []
  for (const e of itens) {
    const dia = rotuloDia(new Date(e[campoData] ?? e.recebido_em))
    const ultimo = grupos[grupos.length - 1]
    if (ultimo?.dia === dia) ultimo.itens.push(e)
    else grupos.push({ dia, itens: [e] })
  }
  return grupos
}

function contar(lista: Encomenda[]) {
  const agora = new Date()
  return {
    aguardando: lista.filter((e) => e.status !== 'retirada').length,
    recebidasHoje: lista.filter((e) => mesmoDia(new Date(e.recebido_em), agora)).length,
  }
}

type Aba = 'aguardando' | 'retiradas'

export function Inicio({
  encomendas,
  erro,
  novoId,
  turno,
  aoNova,
  aoEntregar,
  aoTrocarTurno,
  aoSair,
  aoRecarregar,
}: {
  encomendas: Encomenda[] | null
  erro: string | null
  novoId: string | null
  turno: string
  aoNova: () => void
  aoEntregar: (e: Encomenda) => void
  aoTrocarTurno?: () => void
  aoSair?: () => void
  aoRecarregar: () => void
}) {
  const [aba, setAba] = useState<Aba>('aguardando')
  const { aguardando, recebidasHoje } = useMemo(() => contar(encomendas ?? []), [encomendas])
  const lista = useMemo(() => {
    const todas = encomendas ?? []
    return aba === 'aguardando'
      ? todas.filter((e) => e.status !== 'retirada')
      : todas.filter((e) => e.status === 'retirada').sort((a, b) => (b.retirado_em ?? '').localeCompare(a.retirado_em ?? ''))
  }, [encomendas, aba])
  const grupos = useMemo(() => agruparPorDia(lista, aba === 'aguardando' ? 'recebido_em' : 'retirado_em'), [lista, aba])
  const totalRetiradas = (encomendas?.length ?? 0) - aguardando
  const grade = useRef<HTMLDivElement>(null)
  const carregado = encomendas !== null

  // Linhas da lista entram em sequência ao abrir, ao trocar de aba e quando os dados chegam.
  useGSAP(
    () => {
      gsap.from('[data-linha]', { opacity: 0, y: 28, duration: 0.7, ease: 'expo.out', stagger: 0.06, delay: 0.85, clearProps: 'opacity,transform' })
    },
    { scope: grade, dependencies: [aba, carregado] },
  )

  return (
    <Pagina>
      <header className="mb-6 flex min-h-11 items-center justify-between gap-3 md:mb-8">
        <Marca />
        <div className="flex items-center gap-1">
          <ControleAnimacao />
          {aoTrocarTurno && (
            <Botao variante="fantasma" onClick={aoTrocarTurno} className="!min-h-11 !gap-2 !px-3" aria-label="Trocar turno">
              <UserRound className="size-5" strokeWidth={1.75} />
              <span className="max-w-[9ch] truncate md:max-w-none">{turno}</span>
            </Botao>
          )}
          {aoSair && (
            <Botao variante="fantasma" onClick={aoSair} className="!min-h-11 !gap-2 !px-3">
              <LogOut className="size-5" strokeWidth={1.75} />
              <span className="hidden md:inline">Sair</span>
            </Botao>
          )}
        </div>
      </header>

      <div ref={grade} className="grid grid-cols-2 gap-4 md:grid-cols-12 lg:gap-6">
        <Aparecer i={0} className="col-span-2 md:col-span-8">
          <Holofote className="rounded-tile">
          <button
            onClick={aoNova}
            className="cantos relative flex min-h-44 w-full cursor-pointer flex-col justify-between overflow-hidden rounded-tile bg-accent p-6 pt-10 text-left text-on-accent shadow-[var(--shadow-primary)] transition duration-[120ms] hover:-translate-y-0.5 hover:bg-accent-strong active:translate-y-px md:min-h-56 md:p-8 md:pt-12"
          >
            <span className="rotulo !text-on-accent/80">Novo</span>
            <span className="flex items-end justify-between gap-4">
              <span>
                <TituloLetras className="block text-[32px] leading-9 font-semibold tracking-[-0.02em] md:text-5xl md:leading-[48px] md:tracking-[-0.03em]">
                  Nova Encomenda
                </TituloLetras>
                <span className="mt-1 block text-on-accent/80">Fotografar a etiqueta ou escanear o código</span>
              </span>
              <span className="grid size-14 shrink-0 place-items-center rounded-botao bg-on-accent/15 md:size-16">
                <Plus className="size-8" strokeWidth={1.75} />
              </span>
            </span>
          </button>
          </Holofote>
        </Aparecer>

        <Aparecer i={1} className="col-span-2 md:col-span-4">
          <div className="tile flex h-full min-h-36 flex-col justify-between gap-4 p-6 md:min-h-56 md:p-8">
            <p className="rotulo m-0">Aguardando retirada</p>
            <div>
              <NumeroAnimado
                valor={aguardando}
                testid="contador-aguardando"
                className="num m-0 text-[72px] leading-[72px] font-medium tracking-[-0.04em]"
              />
              <p className="m-0 mt-2 text-muted">
                recebidas hoje <span className="num">{recebidasHoje}</span>
              </p>
            </div>
          </div>
        </Aparecer>

        <Aparecer i={2} className="col-span-2 md:col-span-12">
          <section className="tile overflow-hidden" aria-label="Encomendas">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-5 pb-3 md:px-6">
              <h2 className="text-2xl leading-8 font-semibold tracking-[-0.02em]">Encomendas</h2>
              <ToggleGroup.Root
                type="single"
                value={aba}
                aria-label="Filtrar encomendas"
                onValueChange={(v) => v && setAba(v as Aba)}
                className="inline-flex rounded-full bg-s2 p-1"
              >
                {(
                  [
                    ['aguardando', 'Aguardando', aguardando],
                    ['retiradas', 'Retiradas', totalRetiradas],
                  ] as const
                ).map(([valor, rotulo, n]) => (
                  <ToggleGroup.Item
                    key={valor}
                    value={valor}
                    className="min-h-11 cursor-pointer rounded-full px-4 text-sm font-medium transition duration-[120ms] data-[state=on]:bg-s1 data-[state=on]:shadow-sm"
                  >
                    {rotulo} <span className="num text-muted">{n}</span>
                  </ToggleGroup.Item>
                ))}
              </ToggleGroup.Root>
            </div>
            {erro && (
              <div className="px-4 pb-4 md:px-6">
                <Aviso aoRepetir={aoRecarregar}>{erro}</Aviso>
              </div>
            )}
            {encomendas === null && !erro && <EsqueletoLista />}
            {encomendas !== null && lista.length === 0 && (
              <EstadoVazio
                titulo={aba === 'aguardando' ? 'Nenhuma encomenda aguardando' : 'Nenhuma entrega registrada ainda'}
                texto={aba === 'aguardando' ? 'Toque em “Nova Encomenda” quando chegar um pacote.' : 'As entregas confirmadas aparecem aqui.'}
              />
            )}
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
                          initial={e.id === novoId ? { backgroundColor: 'var(--accent-soft)', y: -6, opacity: 0.4 } : false}
                          animate={{ backgroundColor: 'rgba(0,0,0,0)', y: 0, opacity: 1 }}
                          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                          className="flex items-center"
                        >
                          {e.status !== 'retirada' ? (
                            <button
                              onClick={() => aoEntregar(e)}
                              aria-label={`Entregar para ${e.destinatario_nome}`}
                              data-linha
                              className="flex w-full cursor-pointer items-center gap-3 px-4 py-4 text-left transition duration-[120ms] hover:bg-s2 md:px-6"
                            >
                              <div className="min-w-0 flex-1">
                                <CartaoPedido e={e} linha />
                              </div>
                              <time className="num shrink-0 self-start pt-1 text-base text-muted" dateTime={e.recebido_em}>
                                {hora.format(new Date(e.recebido_em))}
                              </time>
                            </button>
                          ) : (
                            <div data-linha className="flex w-full items-center gap-3 px-4 py-4 md:px-6">
                              <div className="min-w-0 flex-1">
                                <CartaoPedido e={e} linha />
                              </div>
                              <p className="num m-0 shrink-0 self-start pt-1 text-right text-sm text-muted">
                                <Check className="mr-1 inline size-4 text-ok" strokeWidth={2} />
                                {e.retirado_em ? hora.format(new Date(e.retirado_em)) : ''}
                              </p>
                            </div>
                          )}
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
              <span className="mt-1 block text-on-accent/80">Lê nome, apartamento, loja e transportadora.</span>
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
  loja: string
  transportadora: string
  vendedor: string
  pedido: string
  rastreio: string
  origem_cidade: string
  origem_uf: string
  tipo: TipoPacote
  volumes: number
  condicao: Condicao
  local_guarda: string
  observacao: string
  foto_pacote: Blob | null
}

const LOCAIS = ['Prateleira A', 'Prateleira B', 'Armário', 'Sala de encomendas', 'Geladeira']

function Tile({ rotulo, children, className = '' }: { rotulo?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`tile flex flex-col gap-4 p-6 ${className}`}>
      {rotulo && <p className="rotulo m-0">{rotulo}</p>}
      {children}
    </div>
  )
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
  aoSalvar: (r: Rascunho & { morador: Morador }) => void
  aoCancelar: () => void
}) {
  const [moradorId, setMoradorId] = useState(rascunho.morador?.id ?? '')
  const [f, setF] = useState(rascunho)
  const temDetalhe = !!(f.rastreio || f.pedido || f.vendedor || f.origem_cidade)
  const [detalhes, setDetalhes] = useState(temDetalhe)
  const morador = moradores.find((m) => m.id === moradorId) ?? null
  const identificado = !!rascunho.morador
  const mudar = <K extends keyof Rascunho>(k: K, v: Rascunho[K]) => setF((x) => ({ ...x, [k]: v }))
  const previaPacote = useMemo(() => (f.foto_pacote ? URL.createObjectURL(f.foto_pacote) : null), [f.foto_pacote])

  return (
    <Pagina>
      <Cabecalho titulo="Conferir encomenda" passo={3} voltar={aoCancelar} />
      <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
        <Aparecer i={0} className="lg:col-span-4 lg:row-span-3">
          <div className="tile overflow-hidden lg:h-full">
            {rascunho.fotoUrl ? (
              <img
                src={rascunho.fotoUrl}
                alt="Foto da etiqueta"
                className="max-h-64 w-full bg-s2 object-contain lg:h-full lg:max-h-none"
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

        <Aparecer i={1} className="lg:col-span-5">
          <Tile className={identificado ? 'pulso' : ''}>
            <p
              className={`m-0 flex items-center gap-2 text-sm font-medium ${identificado ? 'text-ok' : 'text-warn'}`}
              role="status"
            >
              {identificado ? <Check className="size-4" strokeWidth={2} /> : <TriangleAlert className="size-4" strokeWidth={2} />}
              {identificado ? 'Morador identificado. Confira e salve.' : 'Não foi possível identificar o morador. Selecione abaixo.'}
            </p>
            <div>
              <p className="rotulo m-0 mb-2">Morador</p>
              <SeletorMorador moradores={moradores} valor={moradorId} aoMudar={setMoradorId} />
            </div>
          </Tile>
        </Aparecer>

        <Aparecer i={2} className="lg:col-span-3">
          <Tile rotulo="Apartamento" className="h-full justify-end">
            <p className="num m-0 text-[72px] leading-[72px] font-medium tracking-[-0.04em]" data-testid="apto">
              {morador?.apartamento ?? '—'}
            </p>
            {morador?.bloco && <p className="m-0 -mt-2 text-muted">Bloco {morador.bloco}</p>}
          </Tile>
        </Aparecer>

        <Aparecer i={3} className="lg:col-span-8">
          <Tile rotulo="Onde foi comprado">
            <SeletorMarca tipo="loja" valor={f.loja} aoMudar={(v) => mudar('loja', v)} rotulo="Loja" />
          </Tile>
        </Aparecer>

        <Aparecer i={4} className="lg:col-span-8">
          <Tile rotulo="Transportadora">
            <SeletorMarca tipo="transportadora" valor={f.transportadora} aoMudar={(v) => mudar('transportadora', v)} rotulo="Transportadora" />
          </Tile>
        </Aparecer>

        <Aparecer i={5} className="lg:col-span-6">
          <Tile rotulo="Pacote">
            <ChipsUnico<TipoPacote> valor={f.tipo} aoMudar={(v) => v && mudar('tipo', v)} opcoes={TIPOS} rotulo="Tipo de pacote" />
            <div className="flex items-center justify-between gap-4">
              <span className="text-base font-medium">Volumes</span>
              <Contador valor={f.volumes} aoMudar={(n) => mudar('volumes', n)} rotulo="Volumes" />
            </div>
            <div>
              <p className="rotulo m-0 mb-2">Condição</p>
              <ChipsUnico<Condicao> valor={f.condicao} aoMudar={(v) => v && mudar('condicao', v)} opcoes={CONDICOES} rotulo="Condição do pacote" />
            </div>
            <div className="flex items-center gap-3">
              <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-botao border border-line bg-s2 px-4 text-sm font-medium transition duration-[120ms] hover:bg-s3 focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-accent">
                <Camera className="size-5" strokeWidth={1.75} />
                {f.foto_pacote ? 'Trocar foto do pacote' : 'Foto do pacote (opcional)'}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  data-testid="foto-pacote"
                  onChange={(e) => e.target.files?.[0] && mudar('foto_pacote', e.target.files[0])}
                />
              </label>
              {previaPacote && <img src={previaPacote} alt="Foto do pacote" className="size-11 rounded-campo object-cover" />}
            </div>
          </Tile>
        </Aparecer>

        <Aparecer i={6} className="lg:col-span-6">
          <Tile rotulo="Local de guarda">
            <ChipsUnico<string>
              valor={LOCAIS.includes(f.local_guarda) ? f.local_guarda : ''}
              aoMudar={(v) => mudar('local_guarda', v)}
              opcoes={LOCAIS.map((l) => ({ valor: l, rotulo: l }))}
              rotulo="Local de guarda"
              limpavel
            />
            <input
              value={f.local_guarda}
              onChange={(e) => mudar('local_guarda', e.target.value)}
              placeholder="Outro local"
              aria-label="Outro local de guarda"
              className={campoPequeno}
            />
          </Tile>
        </Aparecer>

        <Aparecer i={7} className="lg:col-span-12">
          <div className="tile overflow-hidden">
            <button
              type="button"
              onClick={() => setDetalhes((x) => !x)}
              aria-expanded={detalhes}
              className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 px-6 text-left transition duration-[120ms] hover:bg-s2"
            >
              <span className="rotulo">Mais detalhes (rastreio, pedido, remetente, origem, observação)</span>
              <ChevronDown className={`size-5 shrink-0 transition duration-200 ${detalhes ? 'rotate-180' : ''}`} strokeWidth={1.75} />
            </button>
            {detalhes && (
              <div className="grid gap-4 p-6 pt-2 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="rotulo">Código de rastreio</span>
                  <input value={f.rastreio} onChange={(e) => mudar('rastreio', e.target.value.toUpperCase())} className={`${campoPequeno} num`} aria-label="Código de rastreio" />
                </label>
                <label className="space-y-1">
                  <span className="rotulo">Número do pedido</span>
                  <input value={f.pedido} onChange={(e) => mudar('pedido', e.target.value)} className={`${campoPequeno} num`} aria-label="Número do pedido" />
                </label>
                <label className="space-y-1 md:col-span-2">
                  <span className="rotulo">Remetente ou vendedor</span>
                  <input value={f.vendedor} onChange={(e) => mudar('vendedor', e.target.value)} className={campoPequeno} aria-label="Remetente ou vendedor" />
                </label>
                <label className="space-y-1">
                  <span className="rotulo">Cidade de origem</span>
                  <input value={f.origem_cidade} onChange={(e) => mudar('origem_cidade', e.target.value)} className={campoPequeno} aria-label="Cidade de origem" />
                </label>
                <label className="space-y-1">
                  <span className="rotulo">UF</span>
                  <input value={f.origem_uf} maxLength={2} onChange={(e) => mudar('origem_uf', e.target.value.toUpperCase())} className={`${campoPequeno} num`} aria-label="UF de origem" />
                </label>
                <label className="space-y-1 md:col-span-2">
                  <span className="rotulo">Observação</span>
                  <textarea value={f.observacao} onChange={(e) => mudar('observacao', e.target.value)} rows={2} className="w-full rounded-botao border border-line bg-s2 p-4 text-base" aria-label="Observação" />
                </label>
              </div>
            )}
          </div>
        </Aparecer>

        <Aparecer i={8} className="lg:col-span-12">
          <div className="sticky bottom-4 z-10 space-y-3 lg:static">
            {erro && <Aviso>{erro}</Aviso>}
            <Botao grande className="w-full" disabled={!morador || salvando} onClick={() => morador && aoSalvar({ ...f, morador })}>
              {salvando ? 'Salvando…' : 'Salvar Encomenda'}
            </Botao>
          </div>
        </Aparecer>
      </div>
    </Pagina>
  )
}
