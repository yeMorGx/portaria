import type { Empresa, Encomenda } from './data'
import { detectarMarca, marcaPorNome } from './marcas'

/** Período do dashboard, em dias contando com hoje. */
export type Periodo = 1 | 7 | 30

const DIA = 86_400_000

export interface DiaDoGrafico {
  /** Data local AAAA-MM-DD. */
  chave: string
  inicio: Date
  recebidas: number
  entregues: number
  /** Média de horas até a retirada das entregas do dia (0 sem entregas). */
  horas: number
  /** Percentual de entregas sem código no dia (0 sem entregas). */
  semCodigoPct: number
}

export interface Comparacao {
  atual: number
  anterior: number
}

export interface Painel {
  aguardando: number
  /** Dias da encomenda mais antiga que aguarda; null se nada aguarda. */
  maisAntigaDias: number | null
  idade: { ate1: number; de1a3: number; mais3: number }
  recebidas: Comparacao
  entregues: Comparacao
  /** Média de horas entre receber e entregar, das entregas do período. */
  horasAteRetirada: { atual: number | null; anterior: number | null }
  /** Percentual de entregas sem código no período. */
  semCodigo: { atual: number | null; anterior: number | null }
  /** Um ponto por dia (no mínimo 7), do mais antigo ao mais recente; o último é hoje. */
  dias: DiaDoGrafico[]
  porEmpresa: Array<{ id: string | null; nome: string; total: number; aguardando: number }>
  porMarca: Array<{ nome: string; total: number; tipo: 'loja' | 'transportadora' }>
  /** Aguardando há 3 dias ou mais, da mais antiga para a mais nova. */
  paradas: Encomenda[]
}

export function inicioDoDia(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function chaveDia(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Quantos dias de dados a tela precisa buscar: o período, o período anterior (para comparar) e ao menos 7 dias de gráfico. */
export function diasParaBuscar(periodo: Periodo): number {
  return Math.max(periodo * 2, 7)
}

export function desdeParaBuscar(periodo: Periodo, agora = new Date()): Date {
  return new Date(inicioDoDia(agora).getTime() - (diasParaBuscar(periodo) - 1) * DIA)
}

const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)

export function calcularPainel(lista: Encomenda[], periodo: Periodo, empresas: Empresa[] = [], agora = new Date()): Painel {
  const hoje = inicioDoDia(agora)
  const inicio = new Date(hoje.getTime() - (periodo - 1) * DIA)
  const inicioAnterior = new Date(inicio.getTime() - periodo * DIA)
  const dentro = (iso: string | null, de: Date, ate: Date) => !!iso && new Date(iso) >= de && new Date(iso) < ate
  const fim = new Date(hoje.getTime() + DIA)

  const aguardandoLista = lista.filter((e) => e.status !== 'retirada')
  const idadeDias = (e: Encomenda) => (agora.getTime() - new Date(e.recebido_em).getTime()) / DIA
  const idades = aguardandoLista.map(idadeDias)

  const recebidasNo = (de: Date, ate: Date) => lista.filter((e) => dentro(e.recebido_em, de, ate))
  const entreguesNo = (de: Date, ate: Date) => lista.filter((e) => e.status === 'retirada' && dentro(e.retirado_em, de, ate))
  const entregues = entreguesNo(inicio, fim)
  const entreguesAntes = entreguesNo(inicioAnterior, inicio)
  const horas = (xs: Encomenda[]) => media(xs.map((e) => (new Date(e.retirado_em!).getTime() - new Date(e.recebido_em).getTime()) / 3_600_000))
  const semCodigo = (xs: Encomenda[]) => (xs.length ? (xs.filter((e) => e.entrega_sem_codigo).length / xs.length) * 100 : null)

  const nDias = Math.max(periodo, 7)
  const dias: DiaDoGrafico[] = Array.from({ length: nDias }, (_, i) => {
    const d = new Date(hoje.getTime() - (nDias - 1 - i) * DIA)
    const prox = new Date(d.getTime() + DIA)
    const doDia = entreguesNo(d, prox)
    return {
      chave: chaveDia(d),
      inicio: d,
      recebidas: recebidasNo(d, prox).length,
      entregues: doDia.length,
      horas: horas(doDia) ?? 0,
      semCodigoPct: semCodigo(doDia) ?? 0,
    }
  })

  const doPeriodo = recebidasNo(inicio, fim)
  const nomeEmpresa = new Map(empresas.map((e) => [e.id, e.nome]))
  const empresasMap = new Map<string, { id: string | null; nome: string; total: number; aguardando: number }>()
  for (const e of [...doPeriodo, ...aguardandoLista]) {
    const id = e.empresa_id ?? null
    const chave = id ?? `apto:${e.apartamento}`
    if (!empresasMap.has(chave)) {
      empresasMap.set(chave, { id, nome: (id && nomeEmpresa.get(id)) || e.destinatario_nome, total: 0, aguardando: 0 })
    }
  }
  for (const e of doPeriodo) empresasMap.get(e.empresa_id ?? `apto:${e.apartamento}`)!.total++
  for (const e of aguardandoLista) empresasMap.get(e.empresa_id ?? `apto:${e.apartamento}`)!.aguardando++
  const porEmpresa = [...empresasMap.values()]
    .filter((x) => x.total > 0 || x.aguardando > 0)
    .sort((a, b) => b.total - a.total || b.aguardando - a.aguardando || a.nome.localeCompare(b.nome))
    .slice(0, 6)

  const marcas = new Map<string, { nome: string; total: number; tipo: 'loja' | 'transportadora' }>()
  const somar = (nome: string | null, tipo: 'loja' | 'transportadora') => {
    if (!nome?.trim()) return
    const m = marcaPorNome(nome, tipo) ?? detectarMarca(nome, tipo)
    const rotulo = m?.nome ?? nome.trim()
    const chave = `${tipo}:${rotulo.toLowerCase()}`
    const atual = marcas.get(chave) ?? { nome: rotulo, total: 0, tipo }
    atual.total++
    marcas.set(chave, atual)
  }
  for (const e of doPeriodo) {
    somar(e.loja, 'loja')
    somar(e.transportadora, 'transportadora')
  }
  const porMarca = [...marcas.values()].sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome)).slice(0, 8)

  return {
    aguardando: aguardandoLista.length,
    maisAntigaDias: idades.length ? Math.floor(Math.max(...idades)) : null,
    idade: {
      ate1: idades.filter((d) => d < 1).length,
      de1a3: idades.filter((d) => d >= 1 && d < 3).length,
      mais3: idades.filter((d) => d >= 3).length,
    },
    recebidas: { atual: doPeriodo.length, anterior: recebidasNo(inicioAnterior, inicio).length },
    entregues: { atual: entregues.length, anterior: entreguesAntes.length },
    horasAteRetirada: { atual: horas(entregues), anterior: horas(entreguesAntes) },
    semCodigo: { atual: semCodigo(entregues), anterior: semCodigo(entreguesAntes) },
    dias,
    porEmpresa,
    porMarca,
    paradas: aguardandoLista.filter((e) => idadeDias(e) >= 3).sort((a, b) => a.recebido_em.localeCompare(b.recebido_em)).slice(0, 5),
  }
}

/** Variação em % contra o período anterior; null quando não há base para comparar. */
export function variacao(atual: number | null, anterior: number | null): number | null {
  if (atual === null || anterior === null || anterior === 0) return null
  return Math.round(((atual - anterior) / anterior) * 100)
}
