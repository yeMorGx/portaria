import { Building2, ChevronRight, Plus, Search } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import type { Empresa, EmpresaEntrada, Encomenda } from '../lib/data'
import { useAnimacao } from '../lib/animacao'
import { Destinatarios, EMPRESA_VAZIA, FormEmpresa } from './Cadastro'
import { Folha } from './Folha'
import { Aviso, Botao } from './ui'

const comparavel = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

/** Empresas do prédio: lista em índice (linhas de 1 px) e painel lateral para editar e cuidar dos destinatários. */
export function GestaoEmpresas({
  empresas,
  encomendas,
  predioId,
  erro,
  aoMudar,
}: {
  empresas: Empresa[] | null
  encomendas: Encomenda[]
  predioId: string
  erro: boolean
  /** Avisa o App para recarregar a lista de empresas (nomes nas pilhas e no dashboard). */
  aoMudar: (e: Empresa) => void
}) {
  const { reduzir } = useAnimacao()
  const [busca, setBusca] = useState('')
  const [aberta, setAberta] = useState<EmpresaEntrada | Empresa | null>(null)

  const aguardando = useMemo(() => {
    const m = new Map<string, number>()
    for (const e of encomendas) if (e.status !== 'retirada' && e.empresa_id) m.set(e.empresa_id, (m.get(e.empresa_id) ?? 0) + 1)
    return m
  }, [encomendas])

  const filtradas = (empresas ?? []).filter((e) => !busca.trim() || comparavel(`${e.nome} ${e.sala ?? ''} ${e.andar ?? ''}`).includes(comparavel(busca.trim())))
  const ativas = (empresas ?? []).filter((e) => e.ativo).length
  const existente = aberta && 'id' in aberta && aberta.id ? (aberta as Empresa) : null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">Empresas</h2>
          <p className="num m-0 mt-1 text-sm text-muted">
            ({ativas}) ativas · ({(empresas?.length ?? 0) - ativas}) desativadas
          </p>
        </div>
        <Botao onClick={() => setAberta(EMPRESA_VAZIA)}>
          <Plus className="size-5" strokeWidth={1.75} />
          Nova empresa
        </Botao>
      </div>

      <section className="tile overflow-hidden" aria-label="Lista de empresas">
        <label className="flex items-center gap-3 border-b border-line px-4 md:px-6">
          <Search className="size-5 shrink-0 text-muted" strokeWidth={1.75} />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, andar ou sala"
            aria-label="Buscar empresa"
            className="min-h-14 w-full bg-transparent text-base outline-none placeholder:text-muted"
          />
        </label>

        {erro && (
          <div className="p-4 md:p-6">
            <Aviso>Não foi possível carregar as empresas.</Aviso>
          </div>
        )}
        {empresas === null && !erro && (
          <div aria-hidden className="space-y-3 p-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="esqueleto h-12" />
            ))}
          </div>
        )}
        {empresas?.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <Building2 className="size-10 text-muted" strokeWidth={1.5} />
            <p className="m-0 font-semibold">Nenhuma empresa cadastrada</p>
            <p className="m-0 text-sm text-muted">Cadastre as empresas do prédio para a portaria escolher na hora de receber.</p>
          </div>
        )}
        {!!empresas?.length && filtradas.length === 0 && <p className="m-0 px-6 py-10 text-center text-muted">Nenhuma empresa com “{busca}”.</p>}

        {!!filtradas.length && (
          <ul className="m-0 list-none divide-y divide-line p-0" data-testid="lista-empresas">
            <li aria-hidden className="rotulo hidden grid-cols-[1fr_190px_110px_110px_24px] gap-4 bg-s2 px-6 py-2 md:grid">
              <span>Empresa</span>
              <span>Local</span>
              <span>Aguardando</span>
              <span>Situação</span>
              <span />
            </li>
            {filtradas.map((e, i) => (
              <motion.li
                key={e.id}
                initial={reduzir ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: reduzir ? 0 : i * 0.02 }}
              >
                <button
                  type="button"
                  onClick={() => setAberta(e)}
                  aria-label={`Abrir ${e.nome}`}
                  className="grid w-full cursor-pointer grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-4 text-left transition duration-[120ms] hover:bg-s2 md:grid-cols-[1fr_190px_110px_110px_24px] md:px-6"
                >
                  <span className={`min-w-0 truncate font-semibold ${e.ativo ? '' : 'text-muted line-through'}`}>{e.nome}</span>
                  <span className="num order-3 col-span-2 text-sm text-muted md:order-none md:col-span-1">
                    {[e.andar && `${e.andar}º andar`, e.sala && `sala ${e.sala}`].filter(Boolean).join(' · ') || '—'}
                  </span>
                  <span className="num hidden text-sm md:block">
                    <span className="font-medium">{aguardando.get(e.id) ?? 0}</span>
                  </span>
                  <span className="justify-self-end md:justify-self-start">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        e.ativo ? 'bg-ok/15 text-ok' : 'bg-s2 text-muted'
                      }`}
                    >
                      {e.ativo ? 'Ativa' : 'Desativada'}
                    </span>
                  </span>
                  <ChevronRight className="hidden size-5 text-muted md:block" strokeWidth={1.75} />
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </section>

      <Folha
        aberta={!!aberta}
        aoFechar={() => setAberta(null)}
        titulo={existente ? existente.nome : 'Nova empresa'}
        descricao={existente ? 'Dados da empresa e quem recebe nela.' : 'Depois de salvar, cadastre quem recebe na empresa.'}
      >
        {aberta && (
          <>
            <FormEmpresa
              key={existente?.id ?? 'nova'}
              inicial={aberta}
              predioId={predioId}
              aoCancelar={() => setAberta(null)}
              aoSalvar={(salva) => {
                aoMudar(salva)
                setAberta(salva)
              }}
            />
            {existente && <Destinatarios key={existente.id} empresa={existente} />}
          </>
        )}
      </Folha>
    </div>
  )
}
