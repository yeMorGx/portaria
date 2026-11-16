import { motion } from 'motion/react'
import { useId, useState } from 'react'
import { useAnimacao } from '../lib/animacao'
import type { DiaDoGrafico } from '../lib/painel'

/*
 * Gráficos próprios do dashboard, seguindo a skill de visualização de dados:
 * forma de ênfase (o dado que importa no destaque, o contexto em cinza), traço de 2 px,
 * marcadores de 8 px, pontas de 4 px arredondadas apoiadas na base, 2 px entre barras,
 * grade em linha fina, tooltip ao passar o mouse ou focar, e tabela para leitor de tela.
 */

const EASE = [0.16, 1, 0.3, 1] as const
const MUTED = 'var(--chart-muted)'
const ACCENT = 'var(--accent)'

export type TipoMini = 'area' | 'barras' | 'linha' | 'pontos'

/** Mini gráfico de um indicador: os últimos dias em cinza, hoje no destaque. */
export function MiniGrafico({ valores, tipo, rotulo }: { valores: number[]; tipo: TipoMini; rotulo: string }) {
  const { reduzir } = useAnimacao()
  const L = 132
  const A = 44
  const max = Math.max(1, ...valores)
  const n = valores.length
  const x = (i: number) => (n === 1 ? L / 2 : 4 + (i * (L - 8)) / (n - 1))
  const y = (v: number) => A - 5 - (v / max) * (A - 12)
  const pontos = valores.map((v, i) => [x(i), y(v)] as const)
  const linha = pontos.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ')
  const area = `${linha} L${x(n - 1).toFixed(1)},${A} L${x(0).toFixed(1)},${A} Z`
  const desenho = reduzir ? false : { pathLength: 0 }
  const ultimo = pontos[n - 1]

  return (
    <svg viewBox={`0 0 ${L} ${A}`} className="h-11 w-full max-w-[132px]" role="img" aria-label={rotulo} preserveAspectRatio="none">
      {tipo === 'barras' &&
        valores.map((v, i) => {
          const w = (L - 8) / n - 2
          const h = Math.max(2, (v / max) * (A - 8))
          return (
            <motion.rect
              key={i}
              x={4 + i * ((L - 8) / n)}
              y={A - h}
              width={Math.max(2, w)}
              height={h}
              rx={2}
              fill={i === n - 1 ? ACCENT : MUTED}
              initial={reduzir ? false : { scaleY: 0 }}
              animate={{ scaleY: 1 }}
              style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }}
              transition={{ duration: 0.5, delay: 0.25 + i * 0.03, ease: EASE }}
            />
          )
        })}
      {tipo === 'area' && (
        <>
          <motion.path d={area} fill="var(--accent-soft)" initial={reduzir ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }} />
          <motion.path d={linha} fill="none" stroke={MUTED} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" initial={desenho} animate={{ pathLength: 1 }} transition={{ duration: 0.7, delay: 0.2, ease: EASE }} />
        </>
      )}
      {tipo === 'linha' && (
        <motion.path d={linha} fill="none" stroke={MUTED} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" initial={desenho} animate={{ pathLength: 1 }} transition={{ duration: 0.7, delay: 0.2, ease: EASE }} />
      )}
      {tipo === 'pontos' &&
        pontos.map(([px, py], i) => (
          <motion.circle key={i} cx={px} cy={py} r={i === n - 1 ? 4 : 3} fill={i === n - 1 ? ACCENT : MUTED} initial={reduzir ? false : { opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.25 + i * 0.04 }} />
        ))}
      {(tipo === 'area' || tipo === 'linha') && ultimo && (
        <motion.circle cx={ultimo[0]} cy={ultimo[1]} r={4} fill={ACCENT} stroke="var(--surface-1)" strokeWidth={2} initial={reduzir ? false : { scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.3, delay: 0.85 }} />
      )}
    </svg>
  )
}

const diaCurto = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })
const diaLongo = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })

/** Recebidas por dia: hoje no destaque, os outros dias em cinza. Tooltip com recebidas e entregues. */
export function BarrasPorDia({ dias }: { dias: DiaDoGrafico[] }) {
  const { reduzir } = useAnimacao()
  const [foco, setFoco] = useState<number | null>(null)
  const id = useId()
  const max = Math.max(1, ...dias.map((d) => d.recebidas))
  const passo = Math.max(1, Math.ceil(max / 3))
  const topo = passo * 3
  const linhas = [0, passo, passo * 2, topo]
  const cadaRotulo = dias.length > 14 ? 5 : 1

  return (
    <div className="relative pt-3">
      <div className="flex gap-3">
        {/* eixo: só os números, sem título; a grade é linha fina */}
        <div className="num relative w-6 shrink-0 text-right text-xs text-muted" aria-hidden>
          {linhas.map((v) => (
            <span key={v} className="absolute right-0 -translate-y-1/2" style={{ bottom: `${(v / topo) * 100}%` }}>
              {v}
            </span>
          ))}
        </div>
        <div className="relative h-56 flex-1 md:h-64">
          {linhas.map((v) => (
            <span key={v} aria-hidden className="absolute inset-x-0 h-px bg-line" style={{ bottom: `${(v / topo) * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end gap-[2px]" onMouseLeave={() => setFoco(null)}>
            {dias.map((d, i) => {
              const hoje = i === dias.length - 1
              const ativo = foco === i
              return (
                <button
                  key={d.chave}
                  type="button"
                  className="group relative flex h-full flex-1 cursor-default items-end outline-none"
                  onMouseEnter={() => setFoco(i)}
                  onFocus={() => setFoco(i)}
                  onBlur={() => setFoco(null)}
                  aria-label={`${diaLongo.format(d.inicio)}: ${d.recebidas} recebidas, ${d.entregues} entregues`}
                  aria-describedby={id}
                >
                  <span className={`absolute inset-x-0 top-0 bottom-0 rounded-t-[6px] transition-colors ${ativo ? 'bg-s2' : ''}`} aria-hidden />
                  <motion.span
                    aria-hidden
                    className="relative mx-auto block w-full max-w-10 rounded-t-[4px]"
                    style={{ background: hoje ? ACCENT : MUTED, opacity: foco === null || ativo ? 1 : 0.55 }}
                    initial={reduzir ? false : { height: 0 }}
                    animate={{ height: `${Math.max(d.recebidas ? 2 : 0, (d.recebidas / topo) * 100)}%` }}
                    transition={{ duration: reduzir ? 0 : 0.6, delay: reduzir ? 0 : 0.15 + i * 0.03, ease: EASE }}
                  />
                </button>
              )
            })}
          </div>
          {foco !== null && (
            <div
              role="status"
              className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-botao border border-line bg-s1 px-3 py-2 text-sm whitespace-nowrap shadow-[var(--shadow-overlay)]"
              style={{ left: `${((foco + 0.5) / dias.length) * 100}%` }}
            >
              <p className="m-0 font-medium capitalize">{diaLongo.format(dias[foco].inicio)}</p>
              <p className="num m-0 text-muted">
                <span className="text-ink">{dias[foco].recebidas}</span> recebidas · <span className="text-ink">{dias[foco].entregues}</span> entregues
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="num mt-2 ml-9 flex gap-[2px] text-[11px] text-muted" aria-hidden>
        {dias.map((d, i) => (
          <span key={d.chave} className={`flex-1 text-center ${i === dias.length - 1 ? 'font-semibold text-ink' : ''}`}>
            {i === dias.length - 1 ? 'hoje' : i % cadaRotulo === (dias.length - 1) % cadaRotulo ? diaCurto.format(d.inicio) : ''}
          </span>
        ))}
      </div>
      <p id={id} className="sr-only">
        Barras de encomendas recebidas por dia. O último dia é hoje.
      </p>
      <table className="sr-only">
        <caption>Encomendas por dia</caption>
        <thead>
          <tr>
            <th>Dia</th>
            <th>Recebidas</th>
            <th>Entregues</th>
          </tr>
        </thead>
        <tbody>
          {dias.map((d) => (
            <tr key={d.chave}>
              <td>{diaLongo.format(d.inicio)}</td>
              <td>{d.recebidas}</td>
              <td>{d.entregues}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Ranking em barras horizontais: o primeiro no destaque, os outros em cinza. Valor sempre escrito ao lado. */
export function Ranking({ itens }: { itens: Array<{ chave: string; nome: string; valor: number; detalhe?: string }> }) {
  const { reduzir } = useAnimacao()
  const max = Math.max(1, ...itens.map((i) => i.valor))
  return (
    <ol className="m-0 list-none space-y-4 p-0">
      {itens.map((it, i) => (
        <li key={it.chave} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate font-medium">{it.nome}</span>
            <span className="num shrink-0 text-sm text-muted">
              <span className="text-base font-medium text-ink">{it.valor}</span>
              {it.detalhe ? ` · ${it.detalhe}` : ''}
            </span>
          </div>
          <div className="h-2 rounded-full bg-s2" aria-hidden>
            <motion.div
              className="h-2 rounded-full"
              style={{ background: i === 0 ? ACCENT : MUTED }}
              initial={reduzir ? false : { width: 0 }}
              animate={{ width: `${Math.max(2, (it.valor / max) * 100)}%` }}
              transition={{ duration: reduzir ? 0 : 0.7, delay: reduzir ? 0 : 0.2 + i * 0.06, ease: EASE }}
            />
          </div>
        </li>
      ))}
    </ol>
  )
}

/** Barra de idade do que aguarda: até 1 dia, 1 a 3 dias, mais de 3 dias (no destaque, é o que preocupa). */
export function BarraIdade({ ate1, de1a3, mais3 }: { ate1: number; de1a3: number; mais3: number }) {
  const { reduzir } = useAnimacao()
  const total = ate1 + de1a3 + mais3
  const partes = [
    { chave: 'ate1', rotulo: 'até 1 dia', valor: ate1, cor: 'var(--chart-muted-2)' },
    { chave: 'de1a3', rotulo: '1 a 3 dias', valor: de1a3, cor: MUTED },
    { chave: 'mais3', rotulo: 'mais de 3 dias', valor: mais3, cor: ACCENT },
  ]
  return (
    <div className="space-y-3">
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-full bg-s2" role="img" aria-label={`Aguardando: ${ate1} até 1 dia, ${de1a3} de 1 a 3 dias, ${mais3} há mais de 3 dias`}>
        {total > 0 &&
          partes
            .filter((p) => p.valor > 0)
            .map((p, i) => (
              <motion.span
                key={p.chave}
                className="h-full first:rounded-l-full last:rounded-r-full"
                style={{ background: p.cor }}
                initial={reduzir ? false : { width: 0 }}
                animate={{ width: `${(p.valor / total) * 100}%` }}
                transition={{ duration: reduzir ? 0 : 0.7, delay: reduzir ? 0 : 0.4 + i * 0.08, ease: EASE }}
              />
            ))}
      </div>
      <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-1 p-0 text-sm text-muted">
        {partes.map((p) => (
          <li key={p.chave} className="flex items-center gap-2">
            <span aria-hidden className="size-2.5 rounded-full" style={{ background: p.cor }} />
            <span className="num font-medium text-ink">{p.valor}</span> {p.rotulo}
          </li>
        ))}
      </ul>
    </div>
  )
}
