-- 008: aviso de várias encomendas de uma vez, entrega sem assinatura e número lembrado no cadastro.

-- 1. Um código só para várias encomendas do mesmo destino.
-- O mesmo número de 6 dígitos vale para cada encomenda do lote (o hash é por encomenda: id + código).
-- Gerar de novo substitui o código anterior dessas encomendas: vale o da mensagem mais recente.
create or replace function public.gerar_codigo_lote(p_encomendas uuid[])
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_codigo text; v_id uuid;
begin
  if auth.uid() is null then raise exception 'não autenticado'; end if;
  if public.meu_papel() is null then return jsonb_build_object('ok', false, 'motivo', 'sem_acesso'); end if;
  if p_encomendas is null or coalesce(array_length(p_encomendas, 1), 0) = 0 or array_length(p_encomendas, 1) > 50 then
    return jsonb_build_object('ok', false, 'motivo', 'lote_invalido');
  end if;
  if exists (
    select 1 from unnest(p_encomendas) as u(id)
    left join public.encomendas e on e.id = u.id
    where e.id is null or e.predio_id is distinct from public.meu_predio() or e.status = 'retirada'
  ) then
    return jsonb_build_object('ok', false, 'motivo', 'nao_encontrada');
  end if;

  v_codigo := lpad((('x' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))::bit(32)::bigint % 1000000)::text, 6, '0');
  foreach v_id in array p_encomendas loop
    insert into public.codigos_retirada (encomenda_id, hash)
    values (v_id, encode(sha256(convert_to(v_id::text || ':' || v_codigo, 'UTF8')), 'hex'))
    on conflict (encomenda_id) do update
      set hash = excluded.hash, gerado_em = now(), expira_em = now() + interval '7 days',
          tentativas = 0, bloqueado_ate = null, usado_em = null;
    update public.encomendas set status = 'avisada', avisado_em = now() where id = v_id and status <> 'retirada';
  end loop;
  return jsonb_build_object('ok', true, 'codigo', v_codigo);
end;
$$;

revoke all on function public.gerar_codigo_lote(uuid[]) from public, anon;
grant execute on function public.gerar_codigo_lote(uuid[]) to authenticated;

-- 2. Entrega sem assinatura: a assinatura passa a ser opcional (o código continua sendo a prova).
-- Mesma função da migração 005, sem a recusa 'sem_assinatura'.
create or replace function public.confirmar_entrega(p_encomenda uuid, p_codigo text, p_sem_codigo boolean, p_justificativa text, p_assinatura_path text, p_entregue_por text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  e public.encomendas%rowtype; c public.codigos_retirada%rowtype; v_tent integer;
begin
  if auth.uid() is null then raise exception 'não autenticado'; end if;
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
    assinatura_path = nullif(trim(coalesce(p_assinatura_path, '')), ''), entrega_sem_codigo = coalesce(p_sem_codigo, false),
    justificativa_sem_codigo = case when p_sem_codigo then trim(p_justificativa) else null end
  where id = p_encomenda;
  return jsonb_build_object('ok', true);
end;
$$;

-- 3. O número digitado na hora do aviso fica no cadastro, para não digitar de novo.
-- Qualquer conta do prédio (inclusive porteiro) pode gravar só o telefone: do destinatário,
-- ou, sem destinatário, o contato da empresa.
create or replace function public.lembrar_telefone(p_destinatario uuid, p_empresa uuid, p_telefone text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  n integer := 0;
begin
  if auth.uid() is null then raise exception 'não autenticado'; end if;
  if public.meu_papel() is null then return jsonb_build_object('ok', false, 'motivo', 'sem_acesso'); end if;
  if p_telefone is null or p_telefone !~ '^[0-9]{12,13}$' then
    return jsonb_build_object('ok', false, 'motivo', 'telefone_invalido');
  end if;
  if p_destinatario is not null then
    update public.destinatarios d set telefone = p_telefone
      from public.empresas e
      where d.id = p_destinatario and e.id = d.empresa_id and e.predio_id = public.meu_predio();
    get diagnostics n = row_count;
  elsif p_empresa is not null then
    update public.empresas set responsavel_contato = p_telefone
      where id = p_empresa and predio_id = public.meu_predio();
    get diagnostics n = row_count;
  end if;
  return jsonb_build_object('ok', n > 0);
end;
$$;

revoke all on function public.lembrar_telefone(uuid, uuid, text) from public, anon;
grant execute on function public.lembrar_telefone(uuid, uuid, text) to authenticated;
