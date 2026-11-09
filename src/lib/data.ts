import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Morador } from './parser'

export interface Encomenda {
  id: string
  destinatario_nome: string
  apartamento: string
  transportadora: string | null
  codigo_lido: string | null
  foto_path: string | null
  foto_url?: string | null
  recebido_em: string
}

export interface NovaEncomenda {
  morador_id: string | null
  destinatario_nome: string
  apartamento: string
  transportadora: string | null
  codigo_lido: string | null
  foto: Blob | null
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
}

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

function criarSupabase(client: SupabaseClient): DataSource {
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
        .select('id,nome,apartamento,ativo')
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
        .limit(200)
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
      let foto_path: string | null = null
      if (e.foto) {
        foto_path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.jpg`
        const { error } = await client.storage
          .from('etiquetas')
          .upload(foto_path, e.foto, { contentType: 'image/jpeg' })
        if (error) throw error
      }
      const { data, error } = await client
        .from('encomendas')
        .insert({
          morador_id: e.morador_id,
          destinatario_nome: e.destinatario_nome,
          apartamento: e.apartamento,
          transportadora: e.transportadora,
          codigo_lido: e.codigo_lido,
          foto_path,
        })
        .select()
        .single()
      if (error) throw error
      return data as Encomenda
    },
  }
}

/** Modo demonstração: dados em memória, sem login. Usado quando o Supabase não está configurado. */
function criarDemo(): DataSource {
  const moradores: Morador[] = [
    { id: '1', nome: 'João Carlos da Silva', apartamento: '101' },
    { id: '2', nome: 'Maria Fernanda Oliveira', apartamento: '202' },
    { id: '3', nome: 'Ana Paula Souza', apartamento: '303' },
    { id: '4', nome: 'José Almeida', apartamento: '404' },
    { id: '5', nome: 'Beatriz Lima Costa', apartamento: '505' },
  ]
  const encomendas: Encomenda[] = []
  return {
    modo: 'demo',
    precisaLogin: false,
    sessaoAtiva: async () => true,
    entrar: async () => {},
    sair: async () => {},
    listarMoradores: async () => moradores,
    listarEncomendas: async () => [...encomendas],
    async salvarEncomenda(e) {
      const nova: Encomenda = {
        id: crypto.randomUUID(),
        destinatario_nome: e.destinatario_nome,
        apartamento: e.apartamento,
        transportadora: e.transportadora,
        codigo_lido: e.codigo_lido,
        foto_path: null,
        foto_url: e.foto ? URL.createObjectURL(e.foto) : null,
        recebido_em: new Date().toISOString(),
      }
      encomendas.unshift(nova)
      return nova
    },
  }
}

export const dados: DataSource =
  url && key ? criarSupabase(createClient(url, key)) : criarDemo()
