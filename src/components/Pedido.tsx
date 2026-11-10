import { Box, Mail, MapPin, Package, ShoppingBag, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Condicao, Encomenda, TipoPacote } from '../lib/data'
import { marcaPorNome } from '../lib/marcas'
import { LogoMarca } from './Logo'

export const TIPOS: Array<{ valor: TipoPacote; rotulo: string; icone: ReactNode }> = [
  { valor: 'caixa', rotulo: 'Caixa', icone: <Package className="size-5" strokeWidth={1.75} /> },
  { valor: 'envelope', rotulo: 'Envelope', icone: <Mail className="size-5" strokeWidth={1.75} /> },
  { valor: 'sacola', rotulo: 'Sacola', icone: <ShoppingBag className="size-5" strokeWidth={1.75} /> },
  { valor: 'volume_grande', rotulo: 'Volume grande', icone: <Box className="size-5" strokeWidth={1.75} /> },
]

export const CONDICOES: Array<{ valor: Condicao; rotulo: string }> = [
  { valor: 'ok', rotulo: 'Tudo certo' },
  { valor: 'amassado', rotulo: 'Amassado' },
  { valor: 'aberto', rotulo: 'Aberto' },
  { valor: 'fragil', rotulo: 'Frágil' },
  { valor: 'refrigerado', rotulo: 'Refrigerado' },
]

const rotuloTipo = (t: TipoPacote) => TIPOS.find((x) => x.valor === t)?.rotulo ?? t
const rotuloCondicao = (c: Condicao) => CONDICOES.find((x) => x.valor === c)?.rotulo ?? c

export function diasParado(e: Encomenda): number {
  if (e.status === 'retirada') return 0
  return Math.floor((Date.now() - new Date(e.recebido_em).getTime()) / 86_400_000)
}

function Selo({ children, aviso }: { children: ReactNode; aviso?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        aviso ? 'bg-warn/15 text-warn' : 'bg-s2 text-muted'
      }`}
    >
      {children}
    </span>
  )
}

/** Logo da loja sobreposto ao da transportadora: dá para saber de onde veio e quem trouxe de relance. */
export function Logos({ e, tamanho = 40 }: { e: Pick<Encomenda, 'loja' | 'transportadora'>; tamanho?: number }) {
  const loja = marcaPorNome(e.loja, 'loja')
  const transp = marcaPorNome(e.transportadora, 'transportadora')
  if (!e.loja && !e.transportadora) {
    return (
      <span className="grid shrink-0 place-items-center rounded-campo bg-accent-soft text-accent" style={{ width: tamanho, height: tamanho }} aria-hidden>
        <Package className="size-5" strokeWidth={1.75} />
      </span>
    )
  }
  return (
    <span className="relative inline-flex shrink-0" style={{ width: tamanho + (e.loja && e.transportadora ? 18 : 0), height: tamanho }}>
      {e.loja && <LogoMarca marca={loja} nome={e.loja} tamanho={tamanho} />}
      {e.transportadora && (
        <span className={e.loja ? 'absolute -right-0 bottom-[-4px] rounded-campo ring-2 ring-[var(--surface-1)]' : ''}>
          <LogoMarca marca={transp} nome={e.transportadora} tamanho={e.loja ? Math.round(tamanho * 0.62) : tamanho} />
        </span>
      )}
    </span>
  )
}

/** Resumo do pedido para bater o olho: logos, destinatário, apartamento, tipo, condição, local e tempo parado. */
export function CartaoPedido({ e, destaque, linha }: { e: Encomenda; destaque?: boolean; linha?: boolean }) {
  const dias = diasParado(e)
  return (
    <div className={linha ? 'flex gap-4' : 'tile flex gap-4 p-4 md:p-6'}>
      <Logos e={e} tamanho={destaque ? 56 : 44} />
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <p className="m-0 text-xl leading-snug font-semibold tracking-[-0.01em]">{e.destinatario_nome}</p>
          <p className="m-0 text-muted">
            {e.bloco ? `Bloco ${e.bloco} · ` : ''}Apto <span className="num font-medium text-ink">{e.apartamento}</span>
          </p>
        </div>
        <p className="m-0 text-sm text-muted">
          {[e.loja && `Comprado em ${e.loja}`, e.transportadora && `Entrega ${e.transportadora}`].filter(Boolean).join(' · ') ||
            'Origem não informada'}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Selo>
            {rotuloTipo(e.tipo)}
            {e.volumes > 1 ? ` · ${e.volumes} volumes` : ''}
          </Selo>
          {e.condicao !== 'ok' && (
            <Selo aviso>
              <TriangleAlert className="size-3.5" strokeWidth={2} />
              {rotuloCondicao(e.condicao)}
            </Selo>
          )}
          {e.local_guarda && (
            <Selo>
              <MapPin className="size-3.5" strokeWidth={2} />
              {e.local_guarda}
            </Selo>
          )}
          {!linha && e.origem_cidade && (
            <Selo>
              De {e.origem_cidade}
              {e.origem_uf ? `/${e.origem_uf}` : ''}
            </Selo>
          )}
          {!linha && e.rastreio && <Selo>{e.rastreio}</Selo>}
          {dias >= 3 && <Selo aviso>Parado há {dias} dias</Selo>}
        </div>
      </div>
    </div>
  )
}
