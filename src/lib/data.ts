import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { gerarCodigo, guardarCodigoSimulado, hashCodigo } from './codigo'
import type { Morador } from './parser'

export type Status = 'recebida' | 'avisada' | 'retirada'
export type TipoPacote = 'caixa' | 'envelope' | 'sacola' | 'volume_grande'
export type Condicao = 'ok' | 'amassado' | 'aberto' | 'fragil' | 'refrigerado'

export interface Encomenda {
  id: string
  morador_id: string | null
  empresa_id?: string | null
  destinatario_id?: string | null
  destinatario_nome: string
  apartamento: string
  bloco: string | null
  loja: string | null
  transportadora: string | null
  vendedor: string | null
  pedido: string | null
  rastreio: string | null
  origem_cidade: string | null
  origem_uf: string | null
  tipo: TipoPacote
  volumes: number
  condicao: Condicao
  local_guarda: string | null
  observacao: string | null
  codigo_lido: string | null
  foto_path: string | null
  foto_url?: string | null
  foto_pacote_path: string | null
  foto_pacote_url?: string | null
  recebido_em: string
  recebido_por: string | null
  status: Status
  avisado_em: string | null
  retirado_em: string | null
  retirado_por_nome: string | null
  entregue_por: string | null
  assinatura_path: string | null
  assinatura_url?: string | null
  entrega_sem_codigo: boolean
  justificativa_sem_codigo: string | null
}

export interface NovaEncomenda {
  morador: Morador | null
  empresa_id: string | null
  destinatario_id: string | null
  destinatario_nome: string
  apartamento: string
  loja: string | null
  transportadora: string | null
  vendedor: string | null
  pedido: string | null
  rastreio: string | null
  origem_cidade: string | null
  origem_uf: string | null
  tipo: TipoPacote
  volumes: number
  condicao: Condicao
  local_guarda: string | null
  observacao: string | null
  codigo_lido: string | null
  foto: Blob | null
  foto_pacote: Blob | null
  recebido_por: string
}

export interface ConfirmarEntrega {
  encomenda: Encomenda
  codigo: string
  semCodigo: boolean
  justificativa: string
  /** Opcional: por enquanto a entrega é confirmada só pelo código (ou pela justificativa). */
  assinatura: Blob | null
  entreguePor: string
}

export type MotivoErroEntrega =
  | 'codigo_incorreto'
  | 'bloqueado'
  | 'expirado'
  | 'codigo_usado'
  | 'sem_codigo_gerado'
  | 'ja_retirada'
  | 'justificativa_curta'
  | 'sem_assinatura'
  | 'nao_encontrada'
  | 'erro'

/** Recusa da confirmação de entrega, com o motivo devolvido pelo servidor. */
export class ErroEntrega extends Error {
  motivo: MotivoErroEntrega
  restantes?: number
  constructor(motivo: MotivoErroEntrega, restantes?: number) {
    super(motivo)
    this.motivo = motivo
    this.restantes = restantes
  }
}

/** Conta do sistema: quem está logado, em qual prédio e com qual papel. */
export interface Perfil {
  nome: string
  papel: 'porteiro' | 'sindico' | 'administradora'
  predio_id: string
}

export interface Empresa {
  id: string
  predio_id: string
  nome: string
  cnpj: string | null
  andar: string | null
  sala: string | null
  responsavel_nome: string | null
  responsavel_contato: string | null
  ativo: boolean
}

export interface Destinatario {
  id: string
  empresa_id: string
  nome: string
  tipo: 'pessoa' | 'setor'
  ativo: boolean
  /** WhatsApp do destinatário, só dígitos com 55 e DDD (coluna da migração 006). */
  telefone?: string | null
}

export type Papel = Perfil['papel']

/** Conta do prédio vista pela gestão (síndico e administradora). */
export interface UsuarioGestao {
  id: string
  nome: string
  papel: Papel
  ativo: boolean
  email: string | null
  ultimo_acesso: string | null
  criado_em: string
  /** É a conta de quem está usando agora. */
  sou_eu: boolean
}

export type MotivoUsuario = 'sem_permissao' | 'nao_encontrado' | 'papel_invalido' | 'proprio_usuario' | 'ultimo_gestor' | 'erro'

export type EmpresaEntrada = Omit<Empresa, 'id' | 'predio_id'> & { id?: string }
export type DestinatarioEntrada = Omit<Destinatario, 'id' | 'empresa_id'> & { id?: string }

export interface DataSource {
  readonly modo: 'supabase' | 'demo'
  precisaLogin: boolean
  sessaoAtiva(): Promise<boolean>
  /** Perfil da conta logada, ou null se a conta não tem acesso ao sistema. */
  perfil(): Promise<Perfil | null>
  entrar(email: string, senha: string): Promise<void>
  sair(): Promise<void>
  listarMoradores(): Promise<Morador[]>
  /** Cadastro de empresas e destinatários (síndico e administradora). */
  listarEmpresas(): Promise<Empresa[]>
  salvarEmpresa(e: EmpresaEntrada, predioId: string): Promise<Empresa>
  listarDestinatarios(empresaId: string): Promise<Destinatario[]>
  salvarDestinatario(d: DestinatarioEntrada, empresaId: string): Promise<Destinatario>
  listarEncomendas(): Promise<Encomenda[]>
  /** Para o dashboard: tudo recebido desde a data, mais o que ainda aguarda retirada (sem limite de 300). */
  listarEncomendasDesde(desdeIso: string): Promise<Encomenda[]>
  /** Gestão de usuários (síndico e administradora). */
  listarUsuarios(): Promise<UsuarioGestao[]>
  atualizarUsuario(id: string, mudanca: { papel?: Papel; ativo?: boolean }): Promise<{ ok: boolean; motivo?: MotivoUsuario }>
  /** Cria ou reaproveita a conta, vincula ao prédio e devolve o link de acesso para mandar à pessoa. */
  convidarUsuario(c: { nome: string; email: string; papel: Papel }): Promise<string>
  /** Quem entrou pelo link de convite cria a própria senha. */
  definirSenha(senha: string): Promise<void>
  /** O app abriu pelo link de convite (ou de recuperação): pedir para criar a senha. */
  readonly chegouPorConvite: boolean
  salvarEncomenda(e: NovaEncomenda): Promise<Encomenda>
  /** Gera um código novo e avisa o morador (modo simulado). Devolve se houve aviso. */
  reenviarCodigo(e: Encomenda): Promise<{ avisado: boolean }>
  /**
   * Gera um código de retirada único para as encomendas do lote e devolve o número uma vez,
   * para ir na mensagem do WhatsApp. Substitui códigos anteriores dessas encomendas.
   */
  gerarCodigoLote(ids: string[]): Promise<string>
  /** Grava o WhatsApp no cadastro: do destinatário ou, sem ele, o contato da empresa. */
  lembrarTelefone(alvo: { destinatarioId?: string | null; empresaId?: string | null }, telefone: string): Promise<boolean>
  confirmarEntrega(c: ConfirmarEntrega): Promise<Encomenda>
}

// Lido antes de o Supabase processar e limpar o endereço: o link de convite (ou de recuperação) traz type=... no hash.
const veioDeConvite = typeof window !== 'undefined' && /[#&]type=(invite|recovery)\b/.test(window.location.hash)

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Aviso ao morador só sai se houver telefone e consentimento registrado. */
function podeAvisar(m: Morador | null): boolean {
  return !!m?.telefone && !!m.consentimento_em
}

function linhaNova(e: NovaEncomenda, id: string) {
  return {
    id,
    morador_id: e.morador?.id ?? null,
    empresa_id: e.empresa_id,
    destinatario_id: e.destinatario_id,
    destinatario_nome: e.destinatario_nome,
    apartamento: e.apartamento,
    bloco: e.morador?.bloco ?? null,
    loja: e.loja,
    transportadora: e.transportadora,
    vendedor: e.vendedor,
    pedido: e.pedido,
    rastreio: e.rastreio,
    origem_cidade: e.origem_cidade,
    origem_uf: e.origem_uf,
    tipo: e.tipo,
    volumes: e.volumes,
    condicao: e.condicao,
    local_guarda: e.local_guarda,
    observacao: e.observacao,
    codigo_lido: e.codigo_lido,
    recebido_por: e.recebido_por,
    entrega_sem_codigo: false,
  }
}

function criarSupabase(client: SupabaseClient): DataSource {
  // Assinatura já enviada: se o código estiver errado e o porteiro tentar de novo, não envia outra cópia.
  const assinaturasEnviadas = new WeakMap<Blob, string>()

  async function enviar(pasta: string, blob: Blob): Promise<string> {
    const caminho = `${pasta}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${blob.type === 'image/png' ? 'png' : 'jpg'}`
    const { error } = await client.storage.from('etiquetas').upload(caminho, blob, { contentType: blob.type || 'image/jpeg' })
    if (error) throw error
    return caminho
  }

  async function buscar(id: string): Promise<Encomenda> {
    const { data, error } = await client.from('encomendas').select('*').eq('id', id).single()
    if (error) throw error
    return data as Encomenda
  }

  async function avisar(id: string): Promise<{ avisado: boolean }> {
    const { data, error } = await client.rpc('avisar_morador', { p_encomenda: id })
    if (error) throw error
    const r = data as { ok: boolean; avisado?: boolean; codigo?: string }
    // Modo simulado: o servidor devolve o código para a demonstração. Com provedor real ele não devolve.
    if (r.codigo) guardarCodigoSimulado(id, r.codigo)
    return { avisado: !!r.avisado }
  }

  return {
    modo: 'supabase',
    precisaLogin: true,
    async sessaoAtiva() {
      const { data } = await client.auth.getSession()
      return !!data.session
    },
    async perfil() {
      const { data: u } = await client.auth.getUser()
      if (!u.user) return null
      const { data, error } = await client
        .from('usuarios')
        .select('nome,papel,predio_id')
        .eq('auth_id', u.user.id)
        .eq('ativo', true)
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return (data as Perfil | null) ?? null
    },
    async entrar(email, senha) {
      const { error } = await client.auth.signInWithPassword({ email, password: senha })
      if (error) throw new Error('E-mail ou senha incorretos.')
    },
    async sair() {
      await client.auth.signOut()
    },
    async listarEmpresas() {
      const { data, error } = await client.from('empresas').select('*').order('nome')
      if (error) throw error
      return data as Empresa[]
    },
    async salvarEmpresa(e, predioId) {
      const { id, ...campos } = e
      const q = id
        ? client.from('empresas').update(campos).eq('id', id).select().single()
        : client.from('empresas').insert({ ...campos, predio_id: predioId }).select().single()
      const { data, error } = await q
      if (error) throw error
      return data as Empresa
    },
    chegouPorConvite: veioDeConvite,
    async listarEncomendasDesde(desdeIso) {
      const { data, error } = await client
        .from('encomendas')
        .select('*')
        .or(`recebido_em.gte.${desdeIso},status.neq.retirada`)
        .order('recebido_em', { ascending: false })
        .limit(5000)
      if (error) throw error
      return data as Encomenda[]
    },
    async listarUsuarios() {
      const { data, error } = await client.rpc('listar_usuarios_predio')
      if (error) throw error
      return data as UsuarioGestao[]
    },
    async atualizarUsuario(id, mudanca) {
      const { data, error } = await client.rpc('atualizar_usuario', {
        p_id: id,
        p_papel: mudanca.papel ?? null,
        p_ativo: mudanca.ativo ?? null,
      })
      if (error) return { ok: false, motivo: 'erro' }
      return data as { ok: boolean; motivo?: MotivoUsuario }
    },
    async convidarUsuario(c) {
      const { data, error } = await client.functions.invoke('convidar-usuario', {
        body: { ...c, redirectTo: window.location.origin },
      })
      if (error) throw error
      const r = data as { ok: boolean; link?: string; motivo?: string }
      if (!r.ok || !r.link) throw new Error(r.motivo ?? 'erro')
      return r.link
    },
    async definirSenha(senha) {
      const { error } = await client.auth.updateUser({ password: senha })
      if (error) throw error
    },
    async listarDestinatarios(empresaId) {
      const { data, error } = await client.from('destinatarios').select('*').eq('empresa_id', empresaId).order('nome')
      if (error) throw error
      return data as Destinatario[]
    },
    async salvarDestinatario(dest, empresaId) {
      const { id, ...campos } = dest
      const q = id
        ? client.from('destinatarios').update(campos).eq('id', id).select().single()
        : client.from('destinatarios').insert({ ...campos, empresa_id: empresaId }).select().single()
      const { data, error } = await q
      if (error) throw error
      return data as Destinatario
    },
    async listarMoradores() {
      const { data, error } = await client
        .from('moradores')
        .select('id,nome,apartamento,bloco,telefone,consentimento_em,ativo')
        .eq('ativo', true)
        .order('nome')
      if (error) throw error
      return data as Morador[]
    },
    async listarEncomendas() {
      const { data, error } = await client
        .from('encomendas')
        .select('*')
        .order('recebido_em', { ascending: false })
        .limit(300)
      if (error) throw error
      const itens = data as Encomenda[]
      // Links temporários das imagens. Se um bucket recusar, a lista abre do mesmo jeito, só sem aquela imagem.
      const assinar = async (
        bucket: string,
        caminho: 'foto_path' | 'foto_pacote_path' | 'assinatura_path',
        destino: 'foto_url' | 'foto_pacote_url' | 'assinatura_url',
      ) => {
        const com = itens.filter((i) => i[caminho])
        if (!com.length) return
        const { data: urls } = await client.storage.from(bucket).createSignedUrls(com.map((i) => i[caminho] as string), 3600)
        urls?.forEach((u, idx) => {
          if (u.signedUrl) com[idx][destino] = u.signedUrl
        })
      }
      await Promise.all([
        assinar('etiquetas', 'foto_path', 'foto_url').catch(() => undefined),
        assinar('pacotes', 'foto_pacote_path', 'foto_pacote_url').catch(() => undefined),
        assinar('assinaturas', 'assinatura_path', 'assinatura_url').catch(() => undefined),
      ])
      return itens
    },
    async salvarEncomenda(e) {
      const id = crypto.randomUUID()
      const foto_path = e.foto ? await enviar('etiquetas', e.foto) : null
      const foto_pacote_path = e.foto_pacote ? await enviar('pacotes', e.foto_pacote) : null
      const { error } = await client.from('encomendas').insert({ ...linhaNova(e, id), foto_path, foto_pacote_path })
      if (error) throw error
      // O aviso não pode derrubar o recebimento: a encomenda já está gravada.
      await avisar(id).catch(() => undefined)
      return buscar(id)
    },
    reenviarCodigo(e) {
      return avisar(e.id)
    },
    async gerarCodigoLote(ids) {
      const { data, error } = await client.rpc('gerar_codigo_lote', { p_encomendas: ids })
      if (error) throw error
      const r = data as { ok: boolean; codigo?: string; motivo?: string }
      if (!r.ok || !r.codigo) throw new Error(r.motivo ?? 'erro')
      for (const id of ids) guardarCodigoSimulado(id, r.codigo)
      return r.codigo
    },
    async lembrarTelefone(alvo, telefone) {
      const { data, error } = await client.rpc('lembrar_telefone', {
        p_destinatario: alvo.destinatarioId ?? null,
        p_empresa: alvo.destinatarioId ? null : (alvo.empresaId ?? null),
        p_telefone: telefone,
      })
      if (error) throw error
      return !!(data as { ok: boolean }).ok
    },
    async confirmarEntrega(c) {
      let caminho: string | null = null
      if (c.assinatura) {
        caminho = assinaturasEnviadas.get(c.assinatura) ?? null
        if (!caminho) {
          caminho = await enviar('assinaturas', c.assinatura)
          assinaturasEnviadas.set(c.assinatura, caminho)
        }
      }
      const { data, error } = await client.rpc('confirmar_entrega', {
        p_encomenda: c.encomenda.id,
        p_codigo: c.semCodigo ? null : c.codigo,
        p_sem_codigo: c.semCodigo,
        p_justificativa: c.semCodigo ? c.justificativa : null,
        p_assinatura_path: caminho,
        p_entregue_por: c.entreguePor,
      })
      if (error) throw new ErroEntrega('erro')
      const r = data as { ok: boolean; motivo?: MotivoErroEntrega; restantes?: number }
      if (!r.ok) throw new ErroEntrega(r.motivo ?? 'erro', r.restantes)
      return buscar(c.encomenda.id)
    },
  }
}

/** Modo demonstração: dados em memória, sem login. Usado quando o Supabase não está configurado. */
function criarDemo(): DataSource {
  const empresasDemo: Empresa[] = [
    { id: '22222222-2222-2222-2222-222222222222', predio_id: '11111111-1111-1111-1111-111111111111', nome: 'Empresa de teste', cnpj: null, andar: '1', sala: '101', responsavel_nome: null, responsavel_contato: null, ativo: true },
  ]
  const destinatariosDemo: Destinatario[] = [
    { id: 'd1', empresa_id: '22222222-2222-2222-2222-222222222222', nome: 'Maria Fernanda Oliveira', tipo: 'pessoa', ativo: true, telefone: '5511999990202' },
    { id: 'd2', empresa_id: '22222222-2222-2222-2222-222222222222', nome: 'Financeiro', tipo: 'setor', ativo: true },
  ]
  const agora = new Date().toISOString()
  const moradores: Morador[] = [
    { id: '1', nome: 'João Carlos da Silva', apartamento: '101', bloco: 'A', telefone: '+5511999990101', consentimento_em: agora },
    { id: '2', nome: 'Maria Fernanda Oliveira', apartamento: '202', bloco: 'A', telefone: '+5511999990202', consentimento_em: agora },
    { id: '3', nome: 'Ana Paula Souza', apartamento: '303', bloco: 'B', telefone: null, consentimento_em: null },
    { id: '4', nome: 'José Almeida', apartamento: '404', bloco: 'B', telefone: '+5511999990404', consentimento_em: agora },
    { id: '5', nome: 'Beatriz Lima Costa', apartamento: '505', bloco: 'B', telefone: '+5511999990505', consentimento_em: agora },
  ]
  const encomendas: Encomenda[] = []
  const usuariosDemo: UsuarioGestao[] = [
    { id: 'u1', nome: 'Você (demonstração)', papel: 'administradora', ativo: true, email: 'gestao@exemplo.com', ultimo_acesso: agora, criado_em: agora, sou_eu: true },
    { id: 'u2', nome: 'Carlos Souza', papel: 'porteiro', ativo: true, email: 'carlos@exemplo.com', ultimo_acesso: agora, criado_em: agora, sou_eu: false },
    { id: 'u3', nome: 'Ana Ribeiro', papel: 'sindico', ativo: true, email: 'ana@exemplo.com', ultimo_acesso: null, criado_em: agora, sou_eu: false },
  ]
  // Mesma regra do servidor: hash do código, 5 tentativas e bloqueio.
  const codigos = new Map<string, { hash: string; tentativas: number }>()

  async function avisar(alvo: Encomenda): Promise<{ avisado: boolean }> {
    const morador = moradores.find((m) => m.id === alvo.morador_id) ?? null
    if (!podeAvisar(morador)) return { avisado: false }
    const codigo = gerarCodigo()
    codigos.set(alvo.id, { hash: await hashCodigo(alvo.id, codigo), tentativas: 0 })
    guardarCodigoSimulado(alvo.id, codigo)
    alvo.status = 'avisada'
    alvo.avisado_em = new Date().toISOString()
    return { avisado: true }
  }

  return {
    modo: 'demo',
    precisaLogin: false,
    sessaoAtiva: async () => true,
    perfil: async () => null,
    entrar: async () => {},
    sair: async () => {},
    listarMoradores: async () => moradores,
    listarEmpresas: async () => [...empresasDemo],
    async salvarEmpresa(e, predioId) {
      if (e.id) {
        const alvo = empresasDemo.find((x) => x.id === e.id)
        if (!alvo) throw new Error('Empresa não encontrada.')
        Object.assign(alvo, e)
        return alvo
      }
      const nova: Empresa = { ...e, id: crypto.randomUUID(), predio_id: predioId }
      empresasDemo.push(nova)
      return nova
    },
    chegouPorConvite: false,
    listarEncomendasDesde: async (desdeIso) =>
      encomendas.filter((e) => e.recebido_em >= desdeIso || e.status !== 'retirada'),
    listarUsuarios: async () => [...usuariosDemo],
    async atualizarUsuario(id, mudanca) {
      const u = usuariosDemo.find((x) => x.id === id)
      if (!u) return { ok: false, motivo: 'nao_encontrado' }
      const papel = mudanca.papel ?? u.papel
      const ativo = mudanca.ativo ?? u.ativo
      const gestor = (p: Papel) => p === 'sindico' || p === 'administradora'
      if (u.sou_eu && (!ativo || !gestor(papel))) return { ok: false, motivo: 'proprio_usuario' }
      const outros = usuariosDemo.filter((x) => x.id !== id && x.ativo && gestor(x.papel)).length
      if (outros === 0 && (!ativo || !gestor(papel))) return { ok: false, motivo: 'ultimo_gestor' }
      Object.assign(u, { papel, ativo })
      return { ok: true }
    },
    async convidarUsuario(c) {
      const existente = usuariosDemo.find((x) => x.email === c.email.toLowerCase())
      if (existente) Object.assign(existente, { nome: c.nome, papel: c.papel, ativo: true })
      else
        usuariosDemo.push({
          id: crypto.randomUUID(),
          nome: c.nome,
          papel: c.papel,
          ativo: true,
          email: c.email.toLowerCase(),
          ultimo_acesso: null,
          criado_em: new Date().toISOString(),
          sou_eu: false,
        })
      return `https://portaria.exemplo/convite#token=${crypto.randomUUID().replace(/-/g, '')}`
    },
    definirSenha: async () => {},
    listarDestinatarios: async (empresaId) => destinatariosDemo.filter((x) => x.empresa_id === empresaId),
    async salvarDestinatario(dest, empresaId) {
      if (dest.id) {
        const alvo = destinatariosDemo.find((x) => x.id === dest.id)
        if (!alvo) throw new Error('Destinatário não encontrado.')
        Object.assign(alvo, dest)
        return alvo
      }
      const novo: Destinatario = { ...dest, id: crypto.randomUUID(), empresa_id: empresaId }
      destinatariosDemo.push(novo)
      return novo
    },
    listarEncomendas: async () => [...encomendas],
    async salvarEncomenda(e) {
      const id = crypto.randomUUID()
      const nova: Encomenda = {
        ...linhaNova(e, id),
        foto_path: null,
        foto_url: e.foto ? URL.createObjectURL(e.foto) : null,
        foto_pacote_path: null,
        foto_pacote_url: e.foto_pacote ? URL.createObjectURL(e.foto_pacote) : null,
        recebido_em: new Date().toISOString(),
        status: 'recebida',
        avisado_em: null,
        retirado_em: null,
        retirado_por_nome: null,
        entregue_por: null,
        assinatura_path: null,
        justificativa_sem_codigo: null,
      }
      encomendas.unshift(nova)
      await avisar(nova)
      return nova
    },
    async reenviarCodigo(e) {
      const alvo = encomendas.find((x) => x.id === e.id)
      return alvo ? avisar(alvo) : { avisado: false }
    },
    async gerarCodigoLote(ids) {
      const alvos = ids.map((id) => encomendas.find((x) => x.id === id))
      if (!alvos.length || alvos.some((a) => !a || a.status === 'retirada')) throw new Error('nao_encontrada')
      const codigo = gerarCodigo()
      for (const alvo of alvos as Encomenda[]) {
        codigos.set(alvo.id, { hash: await hashCodigo(alvo.id, codigo), tentativas: 0 })
        guardarCodigoSimulado(alvo.id, codigo)
        alvo.status = 'avisada'
        alvo.avisado_em = new Date().toISOString()
      }
      return codigo
    },
    async lembrarTelefone(alvo, telefone) {
      if (alvo.destinatarioId) {
        const d = destinatariosDemo.find((x) => x.id === alvo.destinatarioId)
        if (d) d.telefone = telefone
        return !!d
      }
      const e = empresasDemo.find((x) => x.id === alvo.empresaId)
      if (e) e.responsavel_contato = telefone
      return !!e
    },
    async confirmarEntrega(c) {
      const alvo = encomendas.find((x) => x.id === c.encomenda.id)
      if (!alvo) throw new ErroEntrega('nao_encontrada')
      if (alvo.status === 'retirada') throw new ErroEntrega('ja_retirada')
      if (c.semCodigo) {
        if (c.justificativa.trim().length < 5) throw new ErroEntrega('justificativa_curta')
      } else {
        const reg = codigos.get(alvo.id)
        if (!reg) throw new ErroEntrega('sem_codigo_gerado')
        if (reg.tentativas >= 5) throw new ErroEntrega('bloqueado')
        if ((await hashCodigo(alvo.id, c.codigo)) !== reg.hash) {
          reg.tentativas += 1
          throw new ErroEntrega('codigo_incorreto', Math.max(5 - reg.tentativas, 0))
        }
        codigos.delete(alvo.id)
      }
      Object.assign(alvo, {
        status: 'retirada' as Status,
        retirado_em: new Date().toISOString(),
        retirado_por_nome: alvo.destinatario_nome,
        entregue_por: c.entreguePor,
        entrega_sem_codigo: c.semCodigo,
        justificativa_sem_codigo: c.semCodigo ? c.justificativa : null,
        assinatura_url: c.assinatura ? URL.createObjectURL(c.assinatura) : null,
      })
      return alvo
    },
  }
}

export const dados: DataSource = url && key ? criarSupabase(createClient(url, key)) : criarDemo()
