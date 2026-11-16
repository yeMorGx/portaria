import * as ToggleGroup from '@radix-ui/react-toggle-group'
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Minus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { siWhatsapp } from 'simple-icons'
import { dados, type Empresa, type Encomenda } from '../lib/data'
import { marcaPorNome } from '../lib/marcas'
import { calcularPainel, desdeParaBuscar, variacao, type Periodo } from '../lib/painel'
import { NumeroAnimado } from './Cinema'
import { BarraIdade, BarrasPorDia, MiniGrafico, Ranking, type TipoMini } from './Graficos'
import { LogoMarca } from './Logo'
import { Logos } from './Pedido'
import { Aparecer, Aviso } from './ui'

const PERIODOS: Array<{ valor: Periodo; rotulo: string }> = [
  { valor: 1, rotulo: 'Hoje' },
  { valor: 7, rotulo: '7 dias' },
  { valor: 30, rotulo: '30 dias' },
]

const anteriorTexto = (p: Periodo) => (p === 1 ? 'ontem' : `${p} dias antes`)

function Variacao({ atual, anterior, periodo }: { atual: number | null; anterior: number | null; periodo: Periodo }) {
  const v = variacao(atual, anterior)
  if (v === null) return <p className="m-0 text-sm text-muted">sem base para comparar</p>
  const Icone = v > 0 ? ArrowUpRight : v < 0 ? ArrowDownRight : Minus
  return (
    <p className="m-0 flex items-center gap-1 text-sm text-muted">
      <Icone className="size-4" strokeWidth={2} aria-hidden />
      <span className="num font-medium text-ink">
        {v > 0 ? '+' : ''}
        {v}%
      </span>{' '}
      vs. {anteriorTexto(periodo)}
    </p>
  )
}

function Indicador({
  rotulo,
  valor,
  unidade,
  anterior,
  periodo,
  serie,
  tipo,
}: {
  rotulo: string
  valor: number | null
  unidade?: string
  anterior: number | null
  periodo: Periodo
  serie: number[]
  tipo: TipoMini
}) {
  return (
    <section className="tile flex h-full flex-col gap-3 p-5" aria-label={rotulo}>
      <div className="flex items-start justify-between gap-3">
        <p className="rotulo m-0">{rotulo}</p>
        <div className="w-24 shrink-0">
          <MiniGrafico valores={serie} tipo={tipo} rotulo={`Tendência de ${rotulo.toLowerCase()} por dia; o último ponto é hoje`} />
        </div>
      </div>
      <p className="m-0 flex items-baseline gap-1.5">
        {valor === null ? (
          <span className="num text-[44px] leading-none font-medium text-muted">—</span>
        ) : (
          <NumeroAnimado valor={Math.round(valor)} className="num m-0 text-[44px] leading-none font-medium tracking-[-0.03em]" />
        )}
        {unidade && valor !== null && <span className="text-sm text-muted">{unidade}</span>}
      </p>
      <Variacao atual={valor} anterior={anterior} periodo={periodo} />
    </section>
  )
}

function Bloco({ titulo, nota, children, className = '' }: { titulo: string; nota?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`tile flex h-full flex-col gap-5 p-6 ${className}`} aria-label={titulo}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold tracking-[-0.01em]">{titulo}</h3>
        {nota && <p className="rotulo m-0">{nota}</p>}
      </div>
      {children}
    </section>
  )
}

function Esqueleto() {
  return (
    <div aria-hidden className="grid gap-4 lg:grid-cols-12 lg:gap-6">
      <div className="esqueleto h-72 !rounded-tile lg:col-span-7" />
      <div className="esqueleto h-72 !rounded-tile lg:col-span-5" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="esqueleto h-36 !rounded-tile lg:col-span-3" />
      ))}
      <div className="esqueleto h-80 !rounded-tile lg:col-span-8" />
      <div className="esqueleto h-80 !rounded-tile lg:col-span-4" />
    </div>
  )
}

/** Visão geral do prédio: o que aguarda, o ritmo do período e onde agir. */
export function VisaoGeral({ empresas, aoAvisar }: { empresas: Empresa[]; aoAvisar: (e: Encomenda) => void }) {
  const [periodo, setPeriodo] = useState<Periodo>(7)
  const [lista, setLista] = useState<Encomenda[] | null>(null)
  const [erro, setErro] = useState(false)

  // Busca uma vez o bastante para o maior período; trocar de período só recalcula.
  const carregar = useCallback(() => {
    setErro(false)
    dados
      .listarEncomendasDesde(desdeParaBuscar(30).toISOString())
      .then(setLista)
      .catch(() => setErro(true))
  }, [])
  useEffect(carregar, [carregar])

  const p = useMemo(() => (lista ? calcularPainel(lista, periodo, empresas) : null), [lista, periodo, empresas])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-[-0.02em]">Visão geral</h2>
        <ToggleGroup.Root
          type="single"
          value={String(periodo)}
          onValueChange={(v) => v && setPeriodo(Number(v) as Periodo)}
          aria-label="Período"
          className="inline-flex rounded-full bg-s1 p-1 ring-1 ring-line"
        >
          {PERIODOS.map((x) => (
            <ToggleGroup.Item
              key={x.valor}
              value={String(x.valor)}
              className="min-h-10 cursor-pointer rounded-full px-4 text-sm font-medium text-muted transition duration-[120ms] hover:text-ink data-[state=on]:bg-accent data-[state=on]:text-on-accent"
            >
              {x.rotulo}
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>
      </div>

      {erro && <Aviso aoRepetir={carregar}>Não foi possível carregar os números do prédio.</Aviso>}
      {!erro && !p && <Esqueleto />}

      {p && (
        <div className="grid gap-4 md:grid-cols-6 lg:grid-cols-12 lg:gap-6">
          <Aparecer i={0} className="md:col-span-6 lg:col-span-7">
            <section className="tile cantos relative flex h-full flex-col justify-between gap-8 overflow-hidden p-6 pt-10 md:p-8 md:pt-12" aria-label="Aguardando retirada">
              <div>
                <p className="rotulo m-0">Aguardando retirada · agora</p>
                <NumeroAnimado
                  valor={p.aguardando}
                  testid="painel-aguardando"
                  className="num m-0 mt-2 text-[96px] leading-[0.9] font-medium tracking-[-0.05em] md:text-[144px]"
                />
                <p className="m-0 mt-3 text-muted">
                  {p.maisAntigaDias === null
                    ? 'Nada aguardando retirada.'
                    : p.maisAntigaDias === 0
                      ? 'A mais antiga chegou hoje.'
                      : `A mais antiga está há ${p.maisAntigaDias} ${p.maisAntigaDias === 1 ? 'dia' : 'dias'}.`}
                </p>
              </div>
              <BarraIdade {...p.idade} />
            </section>
          </Aparecer>

          <Aparecer i={1} className="md:col-span-6 lg:col-span-5">
            <Bloco titulo="Paradas há 3 dias ou mais" nota={p.paradas.length ? `${p.idade.mais3} no total` : undefined}>
              {p.paradas.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
                  <CheckCircle2 className="size-10 text-ok" strokeWidth={1.5} />
                  <p className="m-0 font-semibold">Nada parado</p>
                  <p className="m-0 text-sm text-muted">Todas as encomendas que aguardam chegaram há menos de 3 dias.</p>
                </div>
              ) : (
                <ul className="m-0 list-none divide-y divide-line p-0">
                  {p.paradas.map((e) => {
                    const dias = Math.floor((Date.now() - new Date(e.recebido_em).getTime()) / 86_400_000)
                    return (
                      <li key={e.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                        <Logos e={e} tamanho={32} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{e.destinatario_nome}</span>
                          <span className="num block text-sm text-muted">há {dias} dias · {e.local_guarda ?? 'sem local'}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => aoAvisar(e)}
                          aria-label={`Avisar ${e.destinatario_nome} no WhatsApp`}
                          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full bg-[#25D366] text-[#06290f] transition duration-[120ms] hover:bg-[#1fbe5b]"
                        >
                          <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
                            <path d={siWhatsapp.path} />
                          </svg>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Bloco>
          </Aparecer>

          <Aparecer i={2} className="md:col-span-3 lg:col-span-3">
            <Indicador rotulo="Recebidas" valor={p.recebidas.atual} anterior={p.recebidas.anterior} periodo={periodo} serie={p.dias.map((d) => d.recebidas)} tipo="area" />
          </Aparecer>
          <Aparecer i={3} className="md:col-span-3 lg:col-span-3">
            <Indicador rotulo="Entregues" valor={p.entregues.atual} anterior={p.entregues.anterior} periodo={periodo} serie={p.dias.map((d) => d.entregues)} tipo="barras" />
          </Aparecer>
          <Aparecer i={4} className="md:col-span-3 lg:col-span-3">
            <Indicador
              rotulo="Tempo até a retirada"
              valor={p.horasAteRetirada.atual}
              unidade="h em média"
              anterior={p.horasAteRetirada.anterior}
              periodo={periodo}
              serie={p.dias.map((d) => d.horas)}
              tipo="linha"
            />
          </Aparecer>
          <Aparecer i={5} className="md:col-span-3 lg:col-span-3">
            <Indicador
              rotulo="Entregues sem código"
              valor={p.semCodigo.atual}
              unidade="%"
              anterior={p.semCodigo.anterior}
              periodo={periodo}
              serie={p.dias.map((d) => d.semCodigoPct)}
              tipo="pontos"
            />
          </Aparecer>

          <Aparecer i={6} className="md:col-span-6 lg:col-span-8">
            <Bloco titulo="Recebidas por dia" nota={periodo === 30 ? 'últimos 30 dias · hoje em destaque' : 'últimos 7 dias · hoje em destaque'}>
              <BarrasPorDia dias={p.dias} />
            </Bloco>
          </Aparecer>

          <Aparecer i={7} className="md:col-span-6 lg:col-span-4">
            <Bloco titulo="Por empresa" nota="recebidas no período">
              {p.porEmpresa.length ? (
                <Ranking itens={p.porEmpresa.map((x) => ({ chave: x.id ?? x.nome, nome: x.nome, valor: x.total, detalhe: `${x.aguardando} aguardando` }))} />
              ) : (
                <p className="m-0 text-muted">Nenhuma encomenda no período.</p>
              )}
            </Bloco>
          </Aparecer>

          <Aparecer i={8} className="md:col-span-6 lg:col-span-12">
            <Bloco titulo="Lojas e transportadoras" nota="recebidas no período">
              {p.porMarca.length ? (
                <ul className="m-0 grid list-none gap-x-8 gap-y-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
                  {p.porMarca.map((m) => (
                    <li key={`${m.tipo}-${m.nome}`} className="flex items-center gap-3">
                      <LogoMarca marca={marcaPorNome(m.nome, m.tipo)} nome={m.nome} tamanho={28} />
                      <span className="min-w-0 truncate">
                        <span className="num text-muted">({m.total})</span> <span className="font-medium">{m.nome}</span>
                      </span>
                      <span className="rotulo ml-auto shrink-0">{m.tipo === 'loja' ? 'loja' : 'entrega'}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="m-0 text-muted">Sem loja ou transportadora registrada no período.</p>
              )}
            </Bloco>
          </Aparecer>
        </div>
      )}
    </div>
  )
}
