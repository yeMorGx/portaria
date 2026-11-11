import { ChevronRight, Plus } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { dados, type Destinatario, type Empresa, type EmpresaEntrada } from '../lib/data'
import { Aparecer, Aviso, Botao, Cabecalho, Pagina } from './ui'

const campo = 'min-h-12 w-full rounded-botao border border-line bg-s2 px-4 text-base'

function Rotulo({ texto, children }: { texto: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="rotulo">{texto}</span>
      {children}
    </label>
  )
}

const VAZIA: EmpresaEntrada = {
  nome: '',
  cnpj: null,
  andar: null,
  sala: null,
  responsavel_nome: null,
  responsavel_contato: null,
  ativo: true,
}

function FormEmpresa({
  inicial,
  aoSalvar,
  aoCancelar,
  predioId,
}: {
  inicial: EmpresaEntrada
  aoSalvar: (e: Empresa) => void
  aoCancelar: () => void
  predioId: string
}) {
  const [f, setF] = useState<EmpresaEntrada>(inicial)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const set = <K extends keyof EmpresaEntrada>(k: K, v: EmpresaEntrada[K]) => setF((x) => ({ ...x, [k]: v }))
  const txt = (v: string) => v.trim() || null

  return (
    <form
      className="tile space-y-4 p-6"
      onSubmit={async (e) => {
        e.preventDefault()
        if (f.nome.trim().length < 2) return setErro('Informe o nome da empresa.')
        setSalvando(true)
        setErro(null)
        try {
          const salva = await dados.salvarEmpresa(
            { ...f, nome: f.nome.trim(), cnpj: txt(f.cnpj ?? ''), andar: txt(f.andar ?? ''), sala: txt(f.sala ?? ''), responsavel_nome: txt(f.responsavel_nome ?? ''), responsavel_contato: txt(f.responsavel_contato ?? '') },
            predioId,
          )
          aoSalvar(salva)
        } catch {
          setErro('Não foi possível salvar a empresa. Verifique se a sua conta pode cadastrar.')
        } finally {
          setSalvando(false)
        }
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Rotulo texto="Nome da empresa">
          <input className={campo} value={f.nome} onChange={(e) => set('nome', e.target.value)} aria-label="Nome da empresa" />
        </Rotulo>
        <Rotulo texto="CNPJ (opcional)">
          <input className={`${campo} num`} value={f.cnpj ?? ''} onChange={(e) => set('cnpj', e.target.value)} aria-label="CNPJ" />
        </Rotulo>
        <Rotulo texto="Andar">
          <input className={campo} value={f.andar ?? ''} onChange={(e) => set('andar', e.target.value)} aria-label="Andar" />
        </Rotulo>
        <Rotulo texto="Sala">
          <input className={campo} value={f.sala ?? ''} onChange={(e) => set('sala', e.target.value)} aria-label="Sala" />
        </Rotulo>
        <Rotulo texto="Responsável">
          <input className={campo} value={f.responsavel_nome ?? ''} onChange={(e) => set('responsavel_nome', e.target.value)} aria-label="Responsável" />
        </Rotulo>
        <Rotulo texto="Contato do responsável">
          <input className={`${campo} num`} value={f.responsavel_contato ?? ''} onChange={(e) => set('responsavel_contato', e.target.value)} placeholder="+55 11 99999-0000" aria-label="Contato do responsável" />
        </Rotulo>
      </div>
      <label className="flex min-h-11 items-center gap-3 text-base">
        <input type="checkbox" checked={f.ativo} onChange={(e) => set('ativo', e.target.checked)} className="size-5 accent-[var(--accent)]" />
        Empresa ativa (recebe encomendas)
      </label>
      {erro && <Aviso>{erro}</Aviso>}
      <div className="flex flex-wrap gap-3">
        <Botao type="submit" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar empresa'}
        </Botao>
        <Botao type="button" variante="fantasma" onClick={aoCancelar}>
          Cancelar
        </Botao>
      </div>
    </form>
  )
}

function Destinatarios({ empresa }: { empresa: Empresa }) {
  const [lista, setLista] = useState<Destinatario[] | null>(null)
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<'pessoa' | 'setor'>('pessoa')
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    dados
      .listarDestinatarios(empresa.id)
      .then((l) => !cancelado && setLista(l))
      .catch(() => !cancelado && setErro('Não foi possível carregar os destinatários.'))
    return () => {
      cancelado = true
    }
  }, [empresa.id])

  async function adicionar(e: React.FormEvent) {
    e.preventDefault()
    if (nome.trim().length < 2) return
    try {
      const novo = await dados.salvarDestinatario({ nome: nome.trim(), tipo, ativo: true }, empresa.id)
      setLista((l) => [...(l ?? []), novo].sort((a, b) => a.nome.localeCompare(b.nome)))
      setNome('')
    } catch {
      setErro('Não foi possível adicionar. Verifique se a sua conta pode cadastrar.')
    }
  }

  async function alternar(d: Destinatario) {
    try {
      const salvo = await dados.salvarDestinatario({ ...d, ativo: !d.ativo }, empresa.id)
      setLista((l) => (l ?? []).map((x) => (x.id === salvo.id ? salvo : x)))
    } catch {
      setErro('Não foi possível alterar o destinatário.')
    }
  }

  return (
    <div className="tile space-y-4 p-6">
      <p className="rotulo">Destinatários de {empresa.nome}</p>
      <p className="text-sm text-muted">Quem recebe na empresa: uma pessoa ou um setor (recepção, RH, financeiro).</p>
      {erro && <Aviso>{erro}</Aviso>}
      {lista === null && !erro && <p className="text-muted">Carregando…</p>}
      {lista?.length === 0 && <p className="text-muted">Nenhum destinatário cadastrado.</p>}
      {!!lista?.length && (
        <ul className="divide-y divide-line" data-testid="destinatarios">
          {lista.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 py-3">
              <span className="min-w-0">
                <span className={`block truncate font-medium ${d.ativo ? '' : 'text-muted line-through'}`}>{d.nome}</span>
                <span className="rotulo">{d.tipo === 'setor' ? 'Setor' : 'Pessoa'}</span>
              </span>
              <Botao variante="secundario" className="!min-h-11" onClick={() => alternar(d)}>
                {d.ativo ? 'Desativar' : 'Reativar'}
              </Botao>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={adicionar} className="flex flex-col gap-3 border-t border-line pt-4 md:flex-row md:items-end">
        <Rotulo texto="Novo destinatário">
          <input className={campo} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome ou setor" aria-label="Novo destinatário" />
        </Rotulo>
        <div className="flex gap-2">
          {(['pessoa', 'setor'] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tipo === t}
              onClick={() => setTipo(t)}
              className={`min-h-12 cursor-pointer rounded-full border px-4 text-sm font-medium ${tipo === t ? 'border-accent bg-accent-soft' : 'border-line bg-s2'}`}
            >
              {t === 'pessoa' ? 'Pessoa' : 'Setor'}
            </button>
          ))}
        </div>
        <Botao type="submit" disabled={nome.trim().length < 2}>
          <Plus className="size-5" strokeWidth={1.75} />
          Adicionar
        </Botao>
      </form>
    </div>
  )
}

export function Cadastro({ predioId, aoVoltar }: { predioId: string; aoVoltar: () => void }) {
  const [empresas, setEmpresas] = useState<Empresa[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [editando, setEditando] = useState<EmpresaEntrada | null>(null)
  const [aberta, setAberta] = useState<Empresa | null>(null)

  useEffect(() => {
    dados
      .listarEmpresas()
      .then(setEmpresas)
      .catch(() => setErro('Não foi possível carregar as empresas.'))
  }, [])

  return (
    <Pagina>
      <Cabecalho titulo="Empresas e destinatários" voltar={aberta ? () => setAberta(null) : aoVoltar} />
      {erro && <Aviso>{erro}</Aviso>}

      {aberta ? (
        <div className="space-y-6">
          <Aparecer>
            <FormEmpresa
              key={aberta.id}
              inicial={aberta}
              predioId={predioId}
              aoCancelar={() => setAberta(null)}
              aoSalvar={(e) => {
                setEmpresas((l) => (l ?? []).map((x) => (x.id === e.id ? e : x)))
                setAberta(e)
              }}
            />
          </Aparecer>
          <Aparecer i={1}>
            <Destinatarios empresa={aberta} />
          </Aparecer>
        </div>
      ) : editando ? (
        <FormEmpresa
          inicial={editando}
          predioId={predioId}
          aoCancelar={() => setEditando(null)}
          aoSalvar={(e) => {
            setEmpresas((l) => [...(l ?? []), e].sort((a, b) => a.nome.localeCompare(b.nome)))
            setEditando(null)
            setAberta(e)
          }}
        />
      ) : (
        <div className="space-y-4">
          <Botao onClick={() => setEditando(VAZIA)}>
            <Plus className="size-5" strokeWidth={1.75} />
            Nova empresa
          </Botao>
          {empresas === null && !erro && <p className="text-muted">Carregando…</p>}
          {empresas?.length === 0 && <p className="text-muted">Nenhuma empresa cadastrada ainda.</p>}
          {!!empresas?.length && (
            <ul className="tile divide-y divide-line overflow-hidden">
              {empresas.map((e) => (
                <li key={e.id}>
                  <button
                    onClick={() => setAberta(e)}
                    className="flex min-h-16 w-full cursor-pointer items-center justify-between gap-3 px-5 py-3 text-left transition duration-[120ms] hover:bg-s2"
                  >
                    <span className="min-w-0">
                      <span className={`block truncate font-semibold ${e.ativo ? '' : 'text-muted line-through'}`}>{e.nome}</span>
                      <span className="text-sm text-muted">
                        {[e.andar && `${e.andar}º andar`, e.sala && `sala ${e.sala}`].filter(Boolean).join(' · ') || 'Sem andar informado'}
                      </span>
                    </span>
                    <ChevronRight className="size-5 shrink-0 text-muted" strokeWidth={1.75} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Pagina>
  )
}
