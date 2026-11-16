-- 009: gestão de usuários pelo síndico e pela administradora.
-- A criação da conta e o link de convite ficam na Edge Function `convidar-usuario` (chave de administrador só no servidor).
-- Aqui ficam a listagem e a troca de papel ou situação, com travas:
--   * só síndico e administradora ativos, e só do próprio prédio;
--   * ninguém se desativa nem tira o próprio papel de gestor;
--   * o prédio nunca fica sem um síndico ou administradora ativo.

create or replace function public.listar_usuarios_predio()
returns table (
  id uuid, nome text, papel text, ativo boolean, email text,
  ultimo_acesso timestamptz, criado_em timestamptz, sou_eu boolean
)
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'não autenticado'; end if;
  if public.meu_papel() is null or public.meu_papel() not in ('sindico', 'administradora') then
    return;
  end if;
  return query
    select u.id, u.nome, u.papel, u.ativo, a.email::text, a.last_sign_in_at, u.criado_em, (u.auth_id = auth.uid())
    from public.usuarios u
    left join auth.users a on a.id = u.auth_id
    where u.predio_id = public.meu_predio()
    order by u.ativo desc, u.nome;
end;
$$;

revoke all on function public.listar_usuarios_predio() from public, anon;
grant execute on function public.listar_usuarios_predio() to authenticated;

create or replace function public.atualizar_usuario(p_id uuid, p_papel text, p_ativo boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  u public.usuarios%rowtype; v_papel text; v_ativo boolean; v_gestores integer;
begin
  if auth.uid() is null then raise exception 'não autenticado'; end if;
  if public.meu_papel() is null or public.meu_papel() not in ('sindico', 'administradora') then
    return jsonb_build_object('ok', false, 'motivo', 'sem_permissao');
  end if;
  select * into u from public.usuarios where id = p_id and predio_id = public.meu_predio() for update;
  if not found then return jsonb_build_object('ok', false, 'motivo', 'nao_encontrado'); end if;
  if p_papel is not null and p_papel not in ('porteiro', 'sindico', 'administradora') then
    return jsonb_build_object('ok', false, 'motivo', 'papel_invalido');
  end if;

  v_papel := coalesce(p_papel, u.papel);
  v_ativo := coalesce(p_ativo, u.ativo);

  if u.auth_id = auth.uid() and (not v_ativo or v_papel not in ('sindico', 'administradora')) then
    return jsonb_build_object('ok', false, 'motivo', 'proprio_usuario');
  end if;

  select count(*) into v_gestores from public.usuarios
    where predio_id = u.predio_id and ativo and papel in ('sindico', 'administradora') and id <> u.id;
  if v_gestores = 0 and (not v_ativo or v_papel not in ('sindico', 'administradora')) then
    return jsonb_build_object('ok', false, 'motivo', 'ultimo_gestor');
  end if;

  update public.usuarios set papel = v_papel, ativo = v_ativo where id = u.id;
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.atualizar_usuario(uuid, text, boolean) from public, anon;
grant execute on function public.atualizar_usuario(uuid, text, boolean) to authenticated;
