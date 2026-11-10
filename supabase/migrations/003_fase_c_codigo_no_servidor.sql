-- Fase C: código de retirada validado no servidor.
-- O hash do código sai da tabela encomendas (legível pelo navegador) e vai para uma tabela
-- que a API não expõe. A confirmação da entrega passa a ser uma função, com validade e limite de tentativas.

create table if not exists public.codigos_retirada (
  encomenda_id uuid primary key references public.encomendas(id) on delete cascade,
  hash text not null,
  gerado_em timestamptz not null default now(),
  expira_em timestamptz not null default now() + interval '7 days',
  tentativas integer not null default 0,
  bloqueado_ate timestamptz,
  usado_em timestamptz
);
alter table public.codigos_retirada enable row level security;
revoke all on public.codigos_retirada from anon, authenticated;

-- Registro das mensagens ao morador. Em modo simulado o texto traz o código (só para demonstração).
create table if not exists public.mensagens (
  id uuid primary key default gen_random_uuid(),
  encomenda_id uuid references public.encomendas(id) on delete cascade,
  morador_id uuid references public.moradores(id) on delete set null,
  canal text not null default 'whatsapp',
  modo text not null default 'simulado' check (modo in ('simulado', 'enviado')),
  texto text not null,
  criado_em timestamptz not null default now()
);
alter table public.mensagens enable row level security;
drop policy if exists "mensagens: leitura autenticada" on public.mensagens;
create policy "mensagens: leitura autenticada" on public.mensagens for select to authenticated using (true);

-- Traz para a nova tabela os códigos das encomendas ainda não retiradas e remove o hash da encomenda.
insert into public.codigos_retirada (encomenda_id, hash)
select id, codigo_retirada_hash from public.encomendas
where codigo_retirada_hash is not null and status <> 'retirada'
on conflict (encomenda_id) do nothing;

alter table public.encomendas drop column if exists codigo_retirada_hash;

-- O navegador não atualiza mais encomendas diretamente, e só cria encomendas recém-recebidas.
drop policy if exists "encomendas: atualizacao autenticada" on public.encomendas;
drop policy if exists "encomendas: inclusao autenticada" on public.encomendas;
create policy "encomendas: inclusao autenticada" on public.encomendas
  for insert to authenticated
  with check (status = 'recebida' and retirado_em is null and assinatura_path is null);

-- Gera o código, guarda só o hash e registra a mensagem ao morador.
-- Modo simulado: devolve o código ao navegador para a demonstração.
-- Com provedor real de WhatsApp, esta função deixa de devolver o código e a função de borda faz o envio.
create or replace function public.avisar_morador(p_encomenda uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  e public.encomendas%rowtype;
  m public.moradores%rowtype;
  v_codigo text;
  v_origem text;
begin
  if auth.uid() is null then
    raise exception 'não autenticado';
  end if;
  select * into e from public.encomendas where id = p_encomenda;
  if not found then
    return jsonb_build_object('ok', false, 'motivo', 'nao_encontrada');
  end if;
  if e.status = 'retirada' then
    return jsonb_build_object('ok', false, 'motivo', 'ja_retirada');
  end if;
  select * into m from public.moradores where id = e.morador_id;
  if not found or m.telefone is null or m.consentimento_em is null then
    return jsonb_build_object('ok', true, 'avisado', false, 'motivo', 'sem_contato');
  end if;

  v_codigo := lpad(
    (('x' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))::bit(32)::bigint % 1000000)::text, 6, '0');

  insert into public.codigos_retirada (encomenda_id, hash)
  values (p_encomenda, encode(sha256(convert_to(p_encomenda::text || ':' || v_codigo, 'UTF8')), 'hex'))
  on conflict (encomenda_id) do update
    set hash = excluded.hash, gerado_em = now(), expira_em = now() + interval '7 days',
        tentativas = 0, bloqueado_ate = null, usado_em = null;

  v_origem := concat_ws(' · ', e.loja, e.transportadora);
  insert into public.mensagens (encomenda_id, morador_id, modo, texto)
  values (
    p_encomenda, m.id, 'simulado',
    'Olá, ' || split_part(e.destinatario_nome, ' ', 1) || '! Chegou uma encomenda para você na portaria'
      || case when v_origem <> '' then ' (' || v_origem || ')' else '' end
      || '. Código de retirada: ' || v_codigo || '. Informe o código ao funcionário na entrega.'
  );

  update public.encomendas set status = 'avisada', avisado_em = now()
  where id = p_encomenda and status <> 'retirada';

  return jsonb_build_object('ok', true, 'avisado', true, 'simulado', true, 'codigo', v_codigo);
end;
$$;

-- Confirma a entrega: valida o código (validade de 7 dias, 5 tentativas, bloqueio de 15 minutos)
-- ou registra a entrega sem código com justificativa.
create or replace function public.confirmar_entrega(
  p_encomenda uuid,
  p_codigo text,
  p_sem_codigo boolean,
  p_justificativa text,
  p_assinatura_path text,
  p_entregue_por text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  e public.encomendas%rowtype;
  c public.codigos_retirada%rowtype;
  v_tent integer;
begin
  if auth.uid() is null then
    raise exception 'não autenticado';
  end if;
  if p_assinatura_path is null or length(trim(p_assinatura_path)) = 0 then
    return jsonb_build_object('ok', false, 'motivo', 'sem_assinatura');
  end if;

  select * into e from public.encomendas where id = p_encomenda for update;
  if not found then
    return jsonb_build_object('ok', false, 'motivo', 'nao_encontrada');
  end if;
  if e.status = 'retirada' then
    return jsonb_build_object('ok', false, 'motivo', 'ja_retirada');
  end if;

  if p_sem_codigo then
    if length(trim(coalesce(p_justificativa, ''))) < 5 then
      return jsonb_build_object('ok', false, 'motivo', 'justificativa_curta');
    end if;
  else
    select * into c from public.codigos_retirada where encomenda_id = p_encomenda for update;
    if not found then
      return jsonb_build_object('ok', false, 'motivo', 'sem_codigo_gerado');
    end if;
    if c.usado_em is not null then
      return jsonb_build_object('ok', false, 'motivo', 'codigo_usado');
    end if;
    if c.expira_em < now() then
      return jsonb_build_object('ok', false, 'motivo', 'expirado');
    end if;
    if c.bloqueado_ate is not null and c.bloqueado_ate <= now() then
      update public.codigos_retirada set tentativas = 0, bloqueado_ate = null where encomenda_id = p_encomenda;
      c.tentativas := 0;
      c.bloqueado_ate := null;
    end if;
    if c.bloqueado_ate is not null then
      return jsonb_build_object('ok', false, 'motivo', 'bloqueado', 'ate', c.bloqueado_ate);
    end if;

    if encode(sha256(convert_to(p_encomenda::text || ':' || coalesce(p_codigo, ''), 'UTF8')), 'hex') <> c.hash then
      v_tent := c.tentativas + 1;
      update public.codigos_retirada
        set tentativas = v_tent,
            bloqueado_ate = case when v_tent >= 5 then now() + interval '15 minutes' else null end
        where encomenda_id = p_encomenda;
      return jsonb_build_object('ok', false, 'motivo', 'codigo_incorreto', 'restantes', greatest(5 - v_tent, 0));
    end if;
    update public.codigos_retirada set usado_em = now() where encomenda_id = p_encomenda;
  end if;

  update public.encomendas set
    status = 'retirada',
    retirado_em = now(),
    retirado_por_nome = destinatario_nome,
    entregue_por = p_entregue_por,
    assinatura_path = p_assinatura_path,
    entrega_sem_codigo = coalesce(p_sem_codigo, false),
    justificativa_sem_codigo = case when p_sem_codigo then trim(p_justificativa) else null end
  where id = p_encomenda;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.avisar_morador(uuid) from public, anon;
revoke all on function public.confirmar_entrega(uuid, text, boolean, text, text, text) from public, anon;
grant execute on function public.avisar_morador(uuid) to authenticated;
grant execute on function public.confirmar_entrega(uuid, text, boolean, text, text, text) to authenticated;
