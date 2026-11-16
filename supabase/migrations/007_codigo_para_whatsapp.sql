-- 007: código de retirada para o aviso que o porteiro manda pelo WhatsApp.
-- O aviso automático (avisar_morador) só gera código para morador com telefone e consentimento.
-- Encomendas de empresa ficavam sem código. Esta função gera o código para qualquer encomenda
-- do prédio da conta logada, devolve o número uma única vez para entrar na mensagem e guarda só o hash.
-- A conferência na entrega continua em confirmar_entrega (mesma tabela, mesmas regras de 5 tentativas e 7 dias).

create or replace function public.gerar_codigo_retirada(p_encomenda uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  e public.encomendas%rowtype; v_codigo text;
begin
  if auth.uid() is null then raise exception 'não autenticado'; end if;
  if public.meu_papel() is null then return jsonb_build_object('ok', false, 'motivo', 'sem_acesso'); end if;
  select * into e from public.encomendas where id = p_encomenda for update;
  if not found or e.predio_id is distinct from public.meu_predio() then
    return jsonb_build_object('ok', false, 'motivo', 'nao_encontrada');
  end if;
  if e.status = 'retirada' then return jsonb_build_object('ok', false, 'motivo', 'ja_retirada'); end if;

  v_codigo := lpad((('x' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))::bit(32)::bigint % 1000000)::text, 6, '0');
  insert into public.codigos_retirada (encomenda_id, hash)
  values (p_encomenda, encode(sha256(convert_to(p_encomenda::text || ':' || v_codigo, 'UTF8')), 'hex'))
  on conflict (encomenda_id) do update
    set hash = excluded.hash, gerado_em = now(), expira_em = now() + interval '7 days',
        tentativas = 0, bloqueado_ate = null, usado_em = null;

  update public.encomendas set status = 'avisada', avisado_em = now() where id = p_encomenda and status <> 'retirada';
  return jsonb_build_object('ok', true, 'codigo', v_codigo);
end;
$$;

revoke all on function public.gerar_codigo_retirada(uuid) from public, anon;
grant execute on function public.gerar_codigo_retirada(uuid) to authenticated;
