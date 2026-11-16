// Edge Function: convida uma conta nova para o prédio de quem chama.
// Só síndico ou administradora ativos. Cria (ou reaproveita) a conta, vincula ao prédio com o papel
// escolhido e devolve o link de acesso, que o gestor manda para a pessoa. A chave de administrador
// do Supabase (SUPABASE_SERVICE_ROLE_KEY) existe só aqui no servidor.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const PAPEIS = ['porteiro', 'sindico', 'administradora']

function resposta(corpo: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(corpo), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return resposta({ ok: false, motivo: 'metodo' }, 405)

  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Quem chama: a conta do token enviado pelo app.
    const comoUsuario = createClient(url, anon, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } })
    const {
      data: { user },
    } = await comoUsuario.auth.getUser()
    if (!user) return resposta({ ok: false, motivo: 'nao_autenticado' }, 401)

    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: eu } = await admin
      .from('usuarios')
      .select('predio_id, papel')
      .eq('auth_id', user.id)
      .eq('ativo', true)
      .limit(1)
      .maybeSingle()
    if (!eu || !['sindico', 'administradora'].includes(eu.papel)) return resposta({ ok: false, motivo: 'sem_permissao' }, 403)

    const corpo = await req.json().catch(() => ({}))
    const nome = String(corpo.nome ?? '').trim()
    const email = String(corpo.email ?? '').trim().toLowerCase()
    const papel = String(corpo.papel ?? '')
    const redirectTo = typeof corpo.redirectTo === 'string' ? corpo.redirectTo : undefined
    if (nome.length < 2) return resposta({ ok: false, motivo: 'nome' }, 400)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return resposta({ ok: false, motivo: 'email' }, 400)
    if (!PAPEIS.includes(papel)) return resposta({ ok: false, motivo: 'papel' }, 400)

    // Conta nova: convite (a pessoa cria a senha). Conta que já existe: link de acesso.
    let link: string
    let authId: string
    const convite = await admin.auth.admin.generateLink({ type: 'invite', email, options: { redirectTo } })
    if (!convite.error && convite.data.user) {
      link = convite.data.properties.action_link
      authId = convite.data.user.id
    } else {
      const acesso = await admin.auth.admin.generateLink({ type: 'magiclink', email, options: { redirectTo } })
      if (acesso.error || !acesso.data.user) return resposta({ ok: false, motivo: 'link' }, 400)
      link = acesso.data.properties.action_link
      authId = acesso.data.user.id
    }

    const { error } = await admin
      .from('usuarios')
      .upsert({ auth_id: authId, predio_id: eu.predio_id, nome, papel, ativo: true }, { onConflict: 'auth_id,predio_id' })
    if (error) return resposta({ ok: false, motivo: 'vinculo' }, 500)

    return resposta({ ok: true, link })
  } catch {
    return resposta({ ok: false, motivo: 'erro' }, 500)
  }
})
