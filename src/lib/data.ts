import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { gerarCodigo, guardarCodigoSimulado, hashCodigo } from './codigo'
import type { Morador } from './parser'

export type Status = 'recebida' | 'avisada' | 'retirada'
export type TipoPacote = 'caixa' | 'envelope' | 'sacola' | 'volume_grande'
export type Condicao = 'ok' | 'amassado' | 'aberto' | 'fragil' | 'refrigerado'

export interface Encomenda {
  id: string
  morador_id: string | null
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
  entrega_sem_codigo: boolean
  justificativa_sem_codigo: string | null
}

export interface NovaEncomenda {
  morador: Morador | null
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
  assinatura: Blob
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

export interface DataSource {
  readonly modo: 'supabase' | 'demo'
  precisaLogin: boolean
  sessaoAtiva(): Promise<boolean>
  entrar(email: string, senha: string): Promise<void>
  sair(): Promise<void>
  listarMoradores(): Promise<Morador[]>
  listarEncomendas(): Promise<Encomenda[]>
  salvarEncomenda(e: NovaEncomenda): Promise<Encomenda>
  /** Gera um código novo e avisa o morador (modo simulado). Devolve se houve aviso. */
  reenviarCodigo(e: Encomenda): Promise<{ avisado: boolean }>
  confirmarEntrega(c: ConfirmarEntrega): Promise<Encomenda>
}

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
    async entrar(email, senha) {
      const { error } = await client.auth.signInWithPassword({ email, password: senha })
      if (error) throw new Error('E-mail ou senha incorretos.')
    },
    async sair() {
      await client.auth.signOut()
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
      const comFoto = itens.filter((i) => i.foto_path)
      if (comFoto.length) {
        const { data: urls } = await client.storage
          .from('etiquetas')
          .createSignedUrls(comFoto.map((i) => i.foto_path as string), 3600)
        urls?.forEach((u, idx) => {
          comFoto[idx].foto_url = u.signedUrl
        })
      }
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
    async confirmarEntrega(c) {
      let caminho = assinaturasEnviadas.get(c.assinatura)
      if (!caminho) {
        caminho = await enviar('assinaturas', c.assinatura)
        assinaturasEnviadas.set(c.assinatura, caminho)
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
  const agora = new Date().toISOString()
  const moradores: Morador[] = [
    { id: '1', nome: 'João Carlos da Silva', apartamento: '101', bloco: 'A', telefone: '+5511999990101', consentimento_em: agora },
    { id: '2', nome: 'Maria Fernanda Oliveira', apartamento: '202', bloco: 'A', telefone: '+5511999990202', consentimento_em: agora },
    { id: '3', nome: 'Ana Paula Souza', apartamento: '303', bloco: 'B', telefone: null, consentimento_em: null },
    { id: '4', nome: 'José Almeida', apartamento: '404', bloco: 'B', telefone: '+5511999990404', consentimento_em: agora },
    { id: '5', nome: 'Beatriz Lima Costa', apartamento: '505', bloco: 'B', telefone: '+5511999990505', consentimento_em: agora },
  ]
  const encomendas: Encomenda[] = []
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
    entrar: async () => {},
    sair: async () => {},
    listarMoradores: async () => moradores,
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
      })
      return alvo
    },
  }
}

export const dados: DataSource = url && key ? criarSupabase(createClient(url, key)) : criarDemo()
