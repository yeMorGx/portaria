import { Bell, Check, PackageCheck, PackageOpen, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Encomenda } from '../lib/data'
import { CartaoPedido } from './Pedido'
import { Aparecer, Cabecalho, Pagina } from './ui'

const dataHora = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const quando = (iso: string) => dataHora.format(new Date(iso))

function Evento({ icone, titulo, data, children, ultimo }: { icone: ReactNode; titulo: string; data: string; children?: ReactNode; ultimo?: boolean }) {
  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {!ultimo && <span aria-hidden className="absolute top-10 bottom-0 left-5 w-px bg-line" />}
      <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-s2 text-muted">{icone}</span>
      <div className="min-w-0 pt-1.5">
        <p className="m-0 font-semibold">{titulo}</p>
        <p className="num m-0 text-sm text-muted">{data}</p>
        {children && <div className="mt-1 text-sm text-muted">{children}</div>}
      </div>
    </li>
  )
}

function Imagem({ rotulo, url, claro }: { rotulo: string; url?: string | null; claro?: boolean }) {
  return (
    <figure className="m-0 space-y-2">
      <figcaption className="rotulo">{rotulo}</figcaption>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-botao border border-line">
          <img src={url} alt={rotulo} className={`h-48 w-full object-contain ${claro ? 'bg-white' : 'bg-s2'}`} />
        </a>
      ) : (
        <div className="grid h-48 place-items-center rounded-botao border border-dashed border-line text-sm text-muted">Sem imagem</div>
      )}
    </figure>
  )
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string | null }) {
  if (!valor) return null
  return (
    <div>
      <dt className="rotulo">{rotulo}</dt>
      <dd className="m-0 mt-1 break-words">{valor}</dd>
    </div>
  )
}

/** Histórico de uma encomenda retirada: quem recebeu, quem retirou, como foi entregue e as imagens. */
export function DetalheEncomenda({ e, aoVoltar }: { e: Encomenda; aoVoltar: () => void }) {
  const temDados = !!(e.rastreio || e.pedido || e.vendedor || e.origem_cidade || e.observacao || e.codigo_lido)
  return (
    <Pagina>
      <Cabecalho titulo="Encomenda retirada" voltar={aoVoltar} />
      <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
        <Aparecer i={0} className="lg:col-span-12">
          <CartaoPedido e={e} destaque />
        </Aparecer>

        <Aparecer i={1} className="lg:col-span-5">
          <section className="tile h-full p-6" aria-label="Linha do tempo">
            <p className="rotulo m-0 mb-5">Linha do tempo</p>
            <ol className="m-0 list-none p-0">
              <Evento icone={<PackageOpen className="size-5" strokeWidth={1.75} />} titulo="Recebida na portaria" data={quando(e.recebido_em)}>
                {e.recebido_por && <>Por {e.recebido_por}</>}
              </Evento>
              {e.avisado_em && (
                <Evento icone={<Bell className="size-5" strokeWidth={1.75} />} titulo="Aviso enviado" data={quando(e.avisado_em)} />
              )}
              {e.retirado_em && (
                <Evento icone={<PackageCheck className="size-5" strokeWidth={1.75} />} titulo="Retirada" data={quando(e.retirado_em)} ultimo>
                  {e.retirado_por_nome && (
                    <p className="m-0 flex items-center gap-1.5">
                      <Check className="size-4 text-ok" strokeWidth={2} />
                      Retirada por <span className="font-medium text-ink">{e.retirado_por_nome}</span>
                    </p>
                  )}
                  {e.entregue_por && <p className="m-0">Entregue por {e.entregue_por}</p>}
                  <p className="m-0">{e.entrega_sem_codigo ? 'Sem código de retirada' : 'Com código de retirada'}</p>
                </Evento>
              )}
            </ol>
            {e.entrega_sem_codigo && e.justificativa_sem_codigo && (
              <div className="mt-6 flex gap-2 rounded-botao border border-line bg-s2 p-4 text-sm">
                <TriangleAlert className="size-4 shrink-0 text-warn" strokeWidth={2} />
                <p className="m-0">
                  <span className="font-medium">Justificativa:</span> {e.justificativa_sem_codigo}
                </p>
              </div>
            )}
          </section>
        </Aparecer>

        <Aparecer i={2} className="lg:col-span-7">
          <section className="tile grid h-full gap-4 p-6 sm:grid-cols-2" aria-label="Imagens">
            <Imagem rotulo="Assinatura" url={e.assinatura_url} claro />
            <Imagem rotulo="Foto do pacote" url={e.foto_pacote_url} />
            <div className="sm:col-span-2">
              <Imagem rotulo="Etiqueta" url={e.foto_url} />
            </div>
          </section>
        </Aparecer>

        {temDados && (
          <Aparecer i={3} className="lg:col-span-12">
            <section className="tile p-6" aria-label="Dados do pedido">
              <dl className="m-0 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Dado rotulo="Código de rastreio" valor={e.rastreio} />
                <Dado rotulo="Número do pedido" valor={e.pedido} />
                <Dado rotulo="Remetente ou vendedor" valor={e.vendedor} />
                <Dado rotulo="Origem" valor={e.origem_cidade ? `${e.origem_cidade}${e.origem_uf ? `/${e.origem_uf}` : ''}` : null} />
                <Dado rotulo="Código lido" valor={e.codigo_lido} />
                <Dado rotulo="Observação" valor={e.observacao} />
              </dl>
            </section>
          </Aparecer>
        )}
      </div>
    </Pagina>
  )
}
