import * as Tabs from '@radix-ui/react-tabs'
import { Building2, Eye, EyeOff, KeyRound, LayoutDashboard, Users } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { useAnimacao } from '../lib/animacao'
import { dados, type Empresa, type Encomenda } from '../lib/data'
import { GestaoEmpresas } from './GestaoEmpresas'
import { GestaoUsuarios } from './GestaoUsuarios'
import { VisaoGeral } from './Painel'
import { Aparecer, Aviso, Botao, Cabecalho, Marca, Pagina, Titulo } from './ui'

type Aba = 'visao' | 'empresas' | 'usuarios'
const ABAS: Array<{ valor: Aba; rotulo: string; icone: typeof Users }> = [
  { valor: 'visao', rotulo: 'Visão geral', icone: LayoutDashboard },
  { valor: 'empresas', rotulo: 'Empresas', icone: Building2 },
  { valor: 'usuarios', rotulo: 'Usuários', icone: Users },
]

/** Área de gestão do prédio (síndico e administradora): visão geral, empresas e usuários. */
export function Gestao({
  predioId,
  encomendas,
  aoVoltar,
  aoAvisar,
  aoEmpresasMudaram,
}: {
  predioId: string
  encomendas: Encomenda[]
  aoVoltar: () => void
  aoAvisar: (e: Encomenda) => void
  aoEmpresasMudaram: () => void
}) {
  const { reduzir } = useAnimacao()
  const [aba, setAba] = useState<Aba>('visao')
  const [empresas, setEmpresas] = useState<Empresa[] | null>(null)
  const [erroEmpresas, setErroEmpresas] = useState(false)

  const carregarEmpresas = useCallback(() => {
    setErroEmpresas(false)
    dados
      .listarEmpresas()
      .then(setEmpresas)
      .catch(() => setErroEmpresas(true))
  }, [])
  useEffect(carregarEmpresas, [carregarEmpresas])

  return (
    <Pagina>
      <Cabecalho titulo="Gestão" voltar={aoVoltar} />
      <Tabs.Root value={aba} onValueChange={(v) => setAba(v as Aba)}>
        <Tabs.List aria-label="Áreas da gestão" className="mb-8 flex w-full gap-1 rounded-full bg-s1 p-1 ring-1 ring-line md:inline-flex md:w-auto">
          {ABAS.map(({ valor, rotulo, icone: Icone }) => (
            <Tabs.Trigger
              key={valor}
              value={valor}
              className="relative flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full px-3 text-sm font-medium text-muted transition-colors duration-[120ms] hover:text-ink data-[state=active]:text-on-accent md:flex-none md:px-4"
            >
              {aba === valor && (
                <motion.span
                  layoutId="aba-gestao"
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-accent"
                  transition={reduzir ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 36 }}
                />
              )}
              <Icone className="relative hidden size-4 sm:block" strokeWidth={1.75} />
              <span className="relative">{rotulo}</span>
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={aba}
            initial={reduzir ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduzir ? { opacity: 1 } : { opacity: 0, y: -4 }}
            transition={{ duration: reduzir ? 0 : 0.24, ease: [0.16, 1, 0.3, 1] }}
          >
            <Tabs.Content value="visao" forceMount hidden={aba !== 'visao'}>
              {aba === 'visao' && <VisaoGeral empresas={empresas ?? []} aoAvisar={aoAvisar} />}
            </Tabs.Content>
            <Tabs.Content value="empresas" forceMount hidden={aba !== 'empresas'}>
              {aba === 'empresas' && (
                <GestaoEmpresas
                  empresas={empresas}
                  encomendas={encomendas}
                  predioId={predioId}
                  erro={erroEmpresas}
                  aoMudar={() => {
                    carregarEmpresas()
                    aoEmpresasMudaram()
                  }}
                />
              )}
            </Tabs.Content>
            <Tabs.Content value="usuarios" forceMount hidden={aba !== 'usuarios'}>
              {aba === 'usuarios' && <GestaoUsuarios />}
            </Tabs.Content>
          </motion.div>
        </AnimatePresence>
      </Tabs.Root>
    </Pagina>
  )
}

/** Quem entrou pelo link de convite cria a própria senha antes de usar o sistema. */
export function CriarSenha({ nome, aoConcluir }: { nome: string; aoConcluir: () => void }) {
  const [senha, setSenha] = useState('')
  const [repetir, setRepetir] = useState('')
  const [visivel, setVisivel] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const campo = 'min-h-12 w-full rounded-botao border border-line bg-s2 px-4 text-lg'
  const forte = senha.length >= 8

  return (
    <Pagina className="flex min-h-screen flex-col justify-center md:max-w-lg">
      <Aparecer>
        <form
          className="tile space-y-5 p-6 md:p-8"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!forte) return setErro('Use pelo menos 8 caracteres.')
            if (senha !== repetir) return setErro('As duas senhas não são iguais.')
            setEnviando(true)
            setErro(null)
            try {
              await dados.definirSenha(senha)
              aoConcluir()
            } catch {
              setErro('Não foi possível salvar a senha. Abra o link de novo ou peça um novo convite.')
            } finally {
              setEnviando(false)
            }
          }}
        >
          <Marca />
          <div>
            <Titulo className="md:!text-[32px] md:!leading-9">Crie sua senha</Titulo>
            <p className="m-0 mt-2 text-muted">{nome ? `${nome}, esta` : 'Esta'} é a senha para entrar na portaria daqui em diante.</p>
          </div>
          <label className="block space-y-1.5">
            <span className="rotulo">Nova senha</span>
            <span className="relative block">
              <input
                type={visivel ? 'text' : 'password'}
                autoComplete="new-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                aria-label="Nova senha"
                className={`${campo} pr-14`}
              />
              <button
                type="button"
                onClick={() => setVisivel((v) => !v)}
                aria-label={visivel ? 'Esconder senha' : 'Mostrar senha'}
                className="absolute top-1/2 right-1 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-botao text-muted hover:text-ink"
              >
                {visivel ? <EyeOff className="size-5" strokeWidth={1.75} /> : <Eye className="size-5" strokeWidth={1.75} />}
              </button>
            </span>
            <span className={`block text-sm ${forte ? 'text-ok' : 'text-muted'}`}>Pelo menos 8 caracteres.</span>
          </label>
          <label className="block space-y-1.5">
            <span className="rotulo">Repita a senha</span>
            <input type={visivel ? 'text' : 'password'} autoComplete="new-password" value={repetir} onChange={(e) => setRepetir(e.target.value)} aria-label="Repita a senha" className={campo} />
          </label>
          {erro && <Aviso>{erro}</Aviso>}
          <Botao type="submit" grande className="w-full" disabled={enviando}>
            <KeyRound className="size-5" strokeWidth={1.75} />
            {enviando ? 'Salvando…' : 'Salvar senha e entrar'}
          </Botao>
        </form>
      </Aparecer>
    </Pagina>
  )
}
