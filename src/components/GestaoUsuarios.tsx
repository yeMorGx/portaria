import * as ToggleGroup from '@radix-ui/react-toggle-group'
import { Check, Copy, Eye, EyeOff, Search, UserPlus, Users } from 'lucide-react'
import { motion } from 'motion/react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { siWhatsapp } from 'simple-icons'
import { toast } from 'sonner'
import { useAnimacao } from '../lib/animacao'
import { dados, type MotivoUsuario, type Papel, type UsuarioGestao } from '../lib/data'
import { Confirmacao, Folha } from './Folha'
import { Aviso, Botao } from './ui'

const PAPEIS: Array<{ valor: Papel; rotulo: string; descricao: string }> = [
  { valor: 'porteiro', rotulo: 'Porteiro', descricao: 'Recebe, avisa e entrega encomendas.' },
  { valor: 'sindico', rotulo: 'Síndico', descricao: 'Tudo do porteiro, mais a gestão do prédio.' },
  { valor: 'administradora', rotulo: 'Administradora', descricao: 'Mesmo acesso do síndico.' },
]
const rotuloPapel = (p: Papel) => PAPEIS.find((x) => x.valor === p)?.rotulo ?? p

const MOTIVOS: Record<MotivoUsuario, string> = {
  sem_permissao: 'Sua conta não pode gerenciar usuários.',
  nao_encontrado: 'Usuário não encontrado.',
  papel_invalido: 'Papel inválido.',
  proprio_usuario: 'Você não pode desativar a própria conta nem tirar o próprio acesso de gestão.',
  ultimo_gestor: 'O prédio precisa de ao menos um síndico ou administradora ativo.',
  erro: 'Não foi possível salvar. Tente de novo.',
}

const campo = 'min-h-12 w-full rounded-botao border border-line bg-s2 px-4 text-base'
const comparavel = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

const relativo = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })
function ultimoAcesso(iso: string | null): string {
  if (!iso) return 'nunca entrou'
  const min = Math.round((new Date(iso).getTime() - Date.now()) / 60_000)
  if (Math.abs(min) < 60) return relativo.format(min, 'minute')
  const h = Math.round(min / 60)
  if (Math.abs(h) < 24) return relativo.format(h, 'hour')
  return relativo.format(Math.round(h / 24), 'day')
}

function Iniciais({ nome }: { nome: string }) {
  const ini = nome
    .split(/\s+/)
    .filter((p) => /^\p{L}/u.test(p))
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
  return (
    <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-s2 text-sm font-semibold text-ink ring-1 ring-line">
      {ini || '?'}
    </span>
  )
}

function PilulaPapel({ papel }: { papel: Papel }) {
  const gestor = papel !== 'porteiro'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${gestor ? 'bg-accent-soft text-ink ring-1 ring-accent/40' : 'bg-s2 text-muted ring-1 ring-line'}`}>
      {rotuloPapel(papel)}
    </span>
  )
}

function EscolhaPapel({ valor, aoMudar }: { valor: Papel; aoMudar: (p: Papel) => void }) {
  return (
    <ToggleGroup.Root type="single" value={valor} onValueChange={(v) => v && aoMudar(v as Papel)} aria-label="Papel" className="grid gap-2">
      {PAPEIS.map((p) => (
        <ToggleGroup.Item
          key={p.valor}
          value={p.valor}
          className="flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-botao border border-line bg-s2 px-4 text-left transition duration-[120ms] hover:bg-s3 data-[state=on]:border-accent data-[state=on]:bg-accent-soft data-[state=on]:ring-1 data-[state=on]:ring-accent"
        >
          <span>
            <span className="block font-medium">{p.rotulo}</span>
            <span className="block text-sm text-muted">{p.descricao}</span>
          </span>
          {valor === p.valor && <Check className="size-5 shrink-0 text-accent" strokeWidth={2} />}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  )
}

function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="rotulo">{rotulo}</span>
      {children}
    </label>
  )
}

/** Link de acesso: escondido por padrão, com mostrar, copiar e mandar pelo WhatsApp. */
function LinkConvite({ nome, link }: { nome: string; link: string }) {
  const [visivel, setVisivel] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const mensagem = `Olá, ${nome}! Seu acesso ao sistema da portaria está pronto. Abra este link para entrar e criar sua senha: ${link}`
  return (
    <div className="space-y-4">
      <div className="rounded-botao border border-line bg-s2 p-4">
        <p className="rotulo m-0 mb-2">Link de acesso</p>
        <p className="num m-0 text-sm break-all" data-testid="link-convite">
          {visivel ? link : '•'.repeat(32)}
        </p>
      </div>
      <p className="m-0 text-sm text-muted">Mande só para {nome}. Quem tiver o link entra na conta.</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(mensagem)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-botao bg-[#25D366] px-5 font-semibold text-[#06290f] transition duration-[120ms] hover:bg-[#1fbe5b]"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
            <path d={siWhatsapp.path} />
          </svg>
          Mandar pelo WhatsApp
        </a>
        <Botao
          variante="secundario"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(link)
              setCopiado(true)
              toast.success('Link copiado.')
            } catch {
              setVisivel(true)
              toast.message('Não foi possível copiar. O link está visível para copiar à mão.')
            }
          }}
        >
          {copiado ? <Check className="size-5" strokeWidth={2} /> : <Copy className="size-5" strokeWidth={1.75} />}
          {copiado ? 'Copiado' : 'Copiar'}
        </Botao>
        <Botao variante="fantasma" onClick={() => setVisivel((v) => !v)} aria-pressed={visivel}>
          {visivel ? <EyeOff className="size-5" strokeWidth={1.75} /> : <Eye className="size-5" strokeWidth={1.75} />}
          {visivel ? 'Esconder' : 'Mostrar'}
        </Botao>
      </div>
    </div>
  )
}

function Convite({ aoConvidar }: { aoConvidar: () => void }) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [papel, setPapel] = useState<Papel>('porteiro')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [link, setLink] = useState<string | null>(null)

  if (link) return <LinkConvite nome={nome.trim().split(' ')[0]} link={link} />

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault()
        if (nome.trim().length < 2) return setErro('Informe o nome.')
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setErro('Confira o e-mail.')
        setEnviando(true)
        setErro(null)
        try {
          setLink(await dados.convidarUsuario({ nome: nome.trim(), email: email.trim(), papel }))
          aoConvidar()
        } catch {
          setErro('Não foi possível criar o convite. Confira o e-mail e tente de novo.')
        } finally {
          setEnviando(false)
        }
      }}
    >
      <Campo rotulo="Nome">
        <input className={campo} value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="off" aria-label="Nome" />
      </Campo>
      <Campo rotulo="E-mail">
        <input className={campo} value={email} onChange={(e) => setEmail(e.target.value)} type="email" inputMode="email" autoComplete="off" aria-label="E-mail" />
      </Campo>
      <div className="space-y-1.5">
        <span className="rotulo">Papel</span>
        <EscolhaPapel valor={papel} aoMudar={setPapel} />
      </div>
      {erro && <Aviso>{erro}</Aviso>}
      <Botao type="submit" grande className="w-full" disabled={enviando}>
        <UserPlus className="size-5" strokeWidth={1.75} />
        {enviando ? 'Criando convite…' : 'Criar convite'}
      </Botao>
    </form>
  )
}

function Gerenciar({ usuario, aoSalvar }: { usuario: UsuarioGestao; aoSalvar: () => void }) {
  const [papel, setPapel] = useState<Papel>(usuario.papel)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [confirmar, setConfirmar] = useState<null | 'desativar' | 'papel'>(null)

  async function aplicar(mudanca: { papel?: Papel; ativo?: boolean }, sucesso: string) {
    setSalvando(true)
    setErro(null)
    const r = await dados.atualizarUsuario(usuario.id, mudanca)
    setSalvando(false)
    setConfirmar(null)
    if (!r.ok) return setErro(MOTIVOS[r.motivo ?? 'erro'])
    toast.success(sucesso)
    aoSalvar()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Iniciais nome={usuario.nome} />
        <div className="min-w-0">
          <p className="m-0 truncate font-semibold">{usuario.nome}</p>
          <p className="m-0 truncate text-sm text-muted">{usuario.email ?? 'sem e-mail'} · {ultimoAcesso(usuario.ultimo_acesso)}</p>
        </div>
      </div>

      <div className="space-y-3">
        <span className="rotulo">Papel</span>
        <EscolhaPapel valor={papel} aoMudar={setPapel} />
        <Botao className="w-full" disabled={papel === usuario.papel || salvando} onClick={() => setConfirmar('papel')}>
          Salvar papel
        </Botao>
      </div>

      {erro && <Aviso>{erro}</Aviso>}

      <div className="space-y-2 border-t border-line pt-6">
        <p className="m-0 font-medium">{usuario.ativo ? 'Desativar acesso' : 'Reativar acesso'}</p>
        <p className="m-0 text-sm text-muted">
          {usuario.ativo
            ? 'A conta deixa de entrar no sistema. O histórico do que ela registrou continua.'
            : 'A conta volta a entrar com o mesmo papel.'}
        </p>
        <Botao
          variante="secundario"
          className={usuario.ativo ? '!text-danger' : ''}
          disabled={salvando || usuario.sou_eu}
          onClick={() => (usuario.ativo ? setConfirmar('desativar') : void aplicar({ ativo: true }, `${usuario.nome} reativado.`))}
        >
          {usuario.ativo ? 'Desativar' : 'Reativar'}
        </Botao>
        {usuario.sou_eu && <p className="m-0 text-sm text-muted">Esta é a sua conta: ela não pode ser desativada por você.</p>}
      </div>

      <Confirmacao
        aberta={confirmar === 'desativar'}
        titulo={`Desativar ${usuario.nome}?`}
        texto="A conta não vai mais conseguir entrar. Dá para reativar depois."
        acao="Desativar acesso"
        perigo
        aoCancelar={() => setConfirmar(null)}
        aoConfirmar={() => void aplicar({ ativo: false }, `${usuario.nome} desativado.`)}
      />
      <Confirmacao
        aberta={confirmar === 'papel'}
        titulo={`Mudar ${usuario.nome} para ${rotuloPapel(papel)}?`}
        texto={papel === 'porteiro' ? 'A conta perde o acesso à gestão do prédio.' : 'A conta passa a ver e mudar a gestão do prédio.'}
        acao={`Mudar para ${rotuloPapel(papel)}`}
        aoCancelar={() => setConfirmar(null)}
        aoConfirmar={() => void aplicar({ papel }, `Papel de ${usuario.nome} atualizado.`)}
      />
    </div>
  )
}

/** Contas do prédio: quem entra no sistema e com qual papel. */
export function GestaoUsuarios() {
  const { reduzir } = useAnimacao()
  const [lista, setLista] = useState<UsuarioGestao[] | null>(null)
  const [erro, setErro] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<'todos' | Papel>('todos')
  const [convidando, setConvidando] = useState(false)
  const [aberto, setAberto] = useState<UsuarioGestao | null>(null)

  const carregar = useCallback(() => {
    setErro(false)
    dados
      .listarUsuarios()
      .then(setLista)
      .catch(() => setErro(true))
  }, [])
  useEffect(carregar, [carregar])

  const filtrados = (lista ?? []).filter(
    (u) => (filtro === 'todos' || u.papel === filtro) && (!busca.trim() || comparavel(`${u.nome} ${u.email ?? ''}`).includes(comparavel(busca.trim()))),
  )
  const ativos = (lista ?? []).filter((u) => u.ativo).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">Usuários</h2>
          <p className="num m-0 mt-1 text-sm text-muted">
            ({ativos}) ativos · ({(lista?.length ?? 0) - ativos}) desativados
          </p>
        </div>
        <Botao onClick={() => setConvidando(true)}>
          <UserPlus className="size-5" strokeWidth={1.75} />
          Convidar usuário
        </Botao>
      </div>

      <section className="tile overflow-hidden" aria-label="Lista de usuários">
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3 md:flex-row md:items-center md:px-6">
          <label className="flex flex-1 items-center gap-3">
            <Search className="size-5 shrink-0 text-muted" strokeWidth={1.75} />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou e-mail"
              aria-label="Buscar usuário"
              className="min-h-11 w-full bg-transparent text-base outline-none placeholder:text-muted"
            />
          </label>
          <ToggleGroup.Root
            type="single"
            value={filtro}
            onValueChange={(v) => v && setFiltro(v as typeof filtro)}
            aria-label="Filtrar por papel"
            className="flex flex-wrap gap-1"
          >
            {(['todos', 'porteiro', 'sindico', 'administradora'] as const).map((f) => (
              <ToggleGroup.Item
                key={f}
                value={f}
                className="min-h-10 cursor-pointer rounded-full px-3.5 text-sm font-medium text-muted transition duration-[120ms] hover:text-ink data-[state=on]:bg-s2 data-[state=on]:text-ink data-[state=on]:ring-1 data-[state=on]:ring-line"
              >
                {f === 'todos' ? 'Todos' : rotuloPapel(f)}
              </ToggleGroup.Item>
            ))}
          </ToggleGroup.Root>
        </div>

        {erro && (
          <div className="p-4 md:p-6">
            <Aviso aoRepetir={carregar}>Não foi possível carregar os usuários.</Aviso>
          </div>
        )}
        {lista === null && !erro && (
          <div aria-hidden className="space-y-3 p-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="esqueleto h-14" />
            ))}
          </div>
        )}
        {lista?.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <Users className="size-10 text-muted" strokeWidth={1.5} />
            <p className="m-0 font-semibold">Nenhum usuário além de você</p>
            <p className="m-0 text-sm text-muted">Convide os porteiros e quem mais cuida do prédio.</p>
          </div>
        )}
        {!!lista?.length && filtrados.length === 0 && <p className="m-0 px-6 py-10 text-center text-muted">Ninguém com esse filtro.</p>}

        {!!filtrados.length && (
          <ul className="m-0 list-none divide-y divide-line p-0" data-testid="lista-usuarios">
            <li aria-hidden className="rotulo hidden grid-cols-[1fr_140px_150px_110px] gap-4 bg-s2 px-6 py-2 md:grid">
              <span>Usuário</span>
              <span>Papel</span>
              <span>Último acesso</span>
              <span>Situação</span>
            </li>
            {filtrados.map((u, i) => (
              <motion.li key={u.id} initial={reduzir ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: reduzir ? 0 : i * 0.02 }}>
                <button
                  type="button"
                  onClick={() => setAberto(u)}
                  aria-label={`Gerenciar ${u.nome}`}
                  className="grid w-full cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-3 text-left transition duration-[120ms] hover:bg-s2 md:grid-cols-[1fr_140px_150px_110px] md:gap-x-4 md:px-6"
                >
                  <span className="contents md:flex md:min-w-0 md:items-center md:gap-3">
                    <Iniciais nome={u.nome} />
                    <span className="min-w-0">
                      <span className={`block truncate font-medium ${u.ativo ? '' : 'text-muted line-through'}`}>
                        {u.nome}
                        {u.sou_eu && <span className="ml-2 text-xs font-normal text-muted">(você)</span>}
                      </span>
                      <span className="block truncate text-sm text-muted">{u.email ?? 'sem e-mail'}</span>
                    </span>
                  </span>
                  <span className="justify-self-end md:justify-self-start">
                    <PilulaPapel papel={u.papel} />
                  </span>
                  <span className="num col-span-3 pl-[52px] text-sm text-muted md:col-span-1 md:pl-0">{ultimoAcesso(u.ultimo_acesso)}</span>
                  <span className="hidden md:block">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${u.ativo ? 'bg-ok/15 text-ok' : 'bg-s2 text-muted'}`}>
                      {u.ativo ? 'Ativo' : 'Desativado'}
                    </span>
                  </span>
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </section>

      <Folha aberta={convidando} aoFechar={() => setConvidando(false)} titulo="Convidar usuário" descricao="A pessoa recebe um link para entrar e criar a própria senha.">
        {convidando && <Convite aoConvidar={carregar} />}
      </Folha>
      <Folha aberta={!!aberto} aoFechar={() => setAberto(null)} titulo={aberto?.nome ?? ''} descricao="Papel e acesso desta conta.">
        {aberto && (
          <Gerenciar
            key={aberto.id}
            usuario={aberto}
            aoSalvar={() => {
              carregar()
              setAberto(null)
            }}
          />
        )}
      </Folha>
    </div>
  )
}
