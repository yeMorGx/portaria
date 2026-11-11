-- Fase B: acesso por conta e por papel (porteiro, síndico, administradora).
-- Cada conta enxerga só o próprio prédio. Porteiro registra e entrega; síndico e administradora também cadastram.
-- Revise antes de executar no SQL Editor do Supabase.

-- Prédio e papel da conta logada (security definer, para as regras não se recursarem).
create or replace function public.meu_predio() returns uuid
language sql stable security definer set search_path = public as $$
  select predio_id from public.usuarios where auth_id = auth.uid() and ativo limit 1
$$;

create or replace function public.meu_papel() returns text
language sql stable security definer set search_path = public as $$
  select papel from public.usuarios where auth_id = auth.uid() and ativo limit 1
$$;

revoke all on function public.meu_predio() from public, anon;
revoke all on function public.meu_papel() from public, anon;
grant execute on function public.meu_predio() to authenticated;
grant execute on function public.meu_papel() to authenticated;

-- Encomendas criadas pelo app ainda não informam o prédio: o banco preenche com o prédio da conta logada.
create or replace function public.preencher_predio() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.predio_id is null then
    new.predio_id := public.meu_predio();
  end if;
  return new;
end;
$$;

drop trigger if exists encomendas_preencher_predio on public.encomendas;
create trigger encomendas_preencher_predio before insert on public.encomendas
  for each row execute function public.preencher_predio();

-- Políticas por papel.
drop policy if exists "predios: acesso autenticado" on public.predios;
create policy "predios: ver o proprio" on public.predios for select to authenticated
  using (id = public.meu_predio());

drop policy if exists "empresas: acesso autenticado" on public.empresas;
create policy "empresas: ver do proprio predio" on public.empresas for select to authenticated
  using (predio_id = public.meu_predio());
create policy "empresas: gerir (sindico e administradora)" on public.empresas for all to authenticated
  using (predio_id = public.meu_predio() and public.meu_papel() in ('sindico', 'administradora'))
  with check (predio_id = public.meu_predio() and public.meu_papel() in ('sindico', 'administradora'));

drop policy if exists "destinatarios: acesso autenticado" on public.destinatarios;
create policy "destinatarios: ver do proprio predio" on public.destinatarios for select to authenticated
  using (exists (select 1 from public.empresas e where e.id = empresa_id and e.predio_id = public.meu_predio()));
create policy "destinatarios: gerir (sindico e administradora)" on public.destinatarios for all to authenticated
  using (public.meu_papel() in ('sindico', 'administradora')
    and exists (select 1 from public.empresas e where e.id = empresa_id and e.predio_id = public.meu_predio()))
  with check (public.meu_papel() in ('sindico', 'administradora')
    and exists (select 1 from public.empresas e where e.id = empresa_id and e.predio_id = public.meu_predio()));

drop policy if exists "usuarios: ver a propria linha" on public.usuarios;
create policy "usuarios: ver a propria linha" on public.usuarios for select to authenticated
  using (auth_id = auth.uid());

drop policy if exists "encomendas: leitura autenticada" on public.encomendas;
drop policy if exists "encomendas: inclusao autenticada" on public.encomendas;
create policy "encomendas: ver do proprio predio" on public.encomendas for select to authenticated
  using (predio_id = public.meu_predio());
create policy "encomendas: registrar no proprio predio" on public.encomendas for insert to authenticated
  with check (predio_id = public.meu_predio() and status = 'recebida' and retirado_em is null and assinatura_path is null);

drop policy if exists "mensagens: leitura autenticada" on public.mensagens;
create policy "mensagens: ver do proprio predio" on public.mensagens for select to authenticated
  using (exists (select 1 from public.encomendas e where e.id = encomenda_id and e.predio_id = public.meu_predio()));

-- As funções de aviso e de entrega (security definer) passam a recusar encomendas de outro prédio.
create or replace function public.avisar_morador(p_encomenda uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  e public.encomendas%rowtype; m public.moradores%rowtype; v_codigo text; v_origem text;
begin
  if auth.uid() is null then raise exception 'não autenticado'; end if;
  select * into e from public.encomendas where id = p_encomenda;
  if not found or e.predio_id is distinct from public.meu_predio() then
    return jsonb_build_object('ok', false, 'motivo', 'nao_encontrada');
  end if;
  if e.status = 'retirada' then return jsonb_build_object('ok', false, 'motivo', 'ja_retirada'); end if;
  select * into m from public.moradores where id = e.morador_id;
  if not found or m.telefone is null or m.consentimento_em is null then
    return jsonb_build_object('ok', true, 'avisado', false, 'motivo', 'sem_contato');
  end if;
  v_codigo := lpad((('x' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))::bit(32)::bigint % 1000000)::text, 6, '0');
  insert into public.codigos_retirada (encomenda_id, hash)
  values (p_encomenda, encode(sha256(convert_to(p_encomenda::text || ':' || v_codigo, 'UTF8')), 'hex'))
  on conflict (encomenda_id) do update
    set hash = excluded.hash, gerado_em = now(), expira_em = now() + interval '7 days', tentativas = 0, bloqueado_ate = null, usado_em = null;
  v_origem := concat_ws(' · ', e.loja, e.transportadora);
  insert into public.mensagens (encomenda_id, morador_id, modo, texto)
  values (p_encomenda, m.id, 'simulado',
    'Olá, ' || split_part(e.destinatario_nome, ' ', 1) || '! Chegou uma encomenda para você na portaria'
      || case when v_origem <> '' then ' (' || v_origem || ')' else '' end
      || '. Código de retirada: ' || v_codigo || '. Informe o código ao funcionário na entrega.');
  update public.encomendas set status = 'avisada', avisado_em = now() where id = p_encomenda and status <> 'retirada';
  return jsonb_build_object('ok', true, 'avisado', true, 'simulado', true, 'codigo', v_codigo);
end;
$$;

create or replace function public.confirmar_entrega(p_encomenda uuid, p_codigo text, p_sem_codigo boolean, p_justificativa text, p_assinatura_path text, p_entregue_por text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  e public.encomendas%rowtype; c public.codigos_retirada%rowtype; v_tent integer;
begin
  if auth.uid() is null then raise exception 'não autenticado'; end if;
  if p_assinatura_path is null or length(trim(p_assinatura_path)) = 0 then
    return jsonb_build_object('ok', false, 'motivo', 'sem_assinatura');
  end if;
  select * into e from public.encomendas where id = p_encomenda for update;
  if not found or e.predio_id is distinct from public.meu_predio() then
    return jsonb_build_object('ok', false, 'motivo', 'nao_encontrada');
  end if;
  if e.status = 'retirada' then return jsonb_build_object('ok', false, 'motivo', 'ja_retirada'); end if;
  if p_sem_codigo then
    if length(trim(coalesce(p_justificativa, ''))) < 5 then
      return jsonb_build_object('ok', false, 'motivo', 'justificativa_curta');
    end if;
  else
    select * into c from public.codigos_retirada where encomenda_id = p_encomenda for update;
    if not found then return jsonb_build_object('ok', false, 'motivo', 'sem_codigo_gerado'); end if;
    if c.usado_em is not null then return jsonb_build_object('ok', false, 'motivo', 'codigo_usado'); end if;
    if c.expira_em < now() then return jsonb_build_object('ok', false, 'motivo', 'expirado'); end if;
    if c.bloqueado_ate is not null and c.bloqueado_ate <= now() then
      update public.codigos_retirada set tentativas = 0, bloqueado_ate = null where encomenda_id = p_encomenda;
      c.tentativas := 0; c.bloqueado_ate := null;
    end if;
    if c.bloqueado_ate is not null then
      return jsonb_build_object('ok', false, 'motivo', 'bloqueado', 'ate', c.bloqueado_ate);
    end if;
    if encode(sha256(convert_to(p_encomenda::text || ':' || coalesce(p_codigo, ''), 'UTF8')), 'hex') <> c.hash then
      v_tent := c.tentativas + 1;
      update public.codigos_retirada
        set tentativas = v_tent, bloqueado_ate = case when v_tent >= 5 then now() + interval '15 minutes' else null end
        where encomenda_id = p_encomenda;
      return jsonb_build_object('ok', false, 'motivo', 'codigo_incorreto', 'restantes', greatest(5 - v_tent, 0));
    end if;
    update public.codigos_retirada set usado_em = now() where encomenda_id = p_encomenda;
  end if;
  update public.encomendas set
    status = 'retirada', retirado_em = now(), retirado_por_nome = destinatario_nome, entregue_por = p_entregue_por,
    assinatura_path = p_assinatura_path, entrega_sem_codigo = coalesce(p_sem_codigo, false),
    justificativa_sem_codigo = case when p_sem_codigo then trim(p_justificativa) else null end
  where id = p_encomenda;
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.meu_predio() from anon;
