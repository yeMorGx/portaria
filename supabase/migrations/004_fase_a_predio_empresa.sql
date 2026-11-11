-- Fase A: modelo comercial (prédio → empresa → destinatário).
-- Cria as tabelas novas, liga as encomendas a elas e migra os dados de teste.
-- Não remove nada: moradores e as colunas antigas continuam até a limpeza final.
-- Revise antes de executar no SQL Editor do Supabase.

create table if not exists public.predios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  endereco text,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  criado_em timestamptz not null default now()
);

create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  predio_id uuid not null references public.predios(id) on delete restrict,
  nome text not null,
  cnpj text,
  andar text,
  sala text,
  responsavel_nome text,
  responsavel_contato text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
create index if not exists empresas_predio_idx on public.empresas (predio_id);

create table if not exists public.destinatarios (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete restrict,
  nome text not null,
  tipo text not null default 'pessoa' check (tipo in ('pessoa', 'setor')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
create index if not exists destinatarios_empresa_idx on public.destinatarios (empresa_id);

-- Usuários do sistema (porteiro, síndico ou administradora), ligados ao login do Supabase.
-- Vazia até a Fase B, que vincula as contas.
create table if not exists public.usuarios (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid not null references auth.users(id) on delete cascade,
  predio_id uuid not null references public.predios(id) on delete cascade,
  nome text not null,
  papel text not null check (papel in ('porteiro', 'sindico', 'administradora')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  unique (auth_id, predio_id)
);

-- Encomendas passam a apontar para prédio, empresa e destinatário. Continuam opcionais por enquanto,
-- para o app atual (que ainda usa morador) seguir gravando sem erro.
alter table public.encomendas
  add column if not exists predio_id uuid references public.predios(id) on delete restrict,
  add column if not exists empresa_id uuid references public.empresas(id) on delete restrict,
  add column if not exists destinatario_id uuid references public.destinatarios(id) on delete restrict;
create index if not exists encomendas_empresa_idx on public.encomendas (empresa_id);

alter table public.predios enable row level security;
alter table public.empresas enable row level security;
alter table public.destinatarios enable row level security;
alter table public.usuarios enable row level security;

-- Políticas provisórias: usuário autenticado lê e escreve, como hoje.
-- A Fase B troca estas regras por papel e por prédio.
drop policy if exists "predios: acesso autenticado" on public.predios;
create policy "predios: acesso autenticado" on public.predios for all to authenticated using (true) with check (true);

drop policy if exists "empresas: acesso autenticado" on public.empresas;
create policy "empresas: acesso autenticado" on public.empresas for all to authenticated using (true) with check (true);

drop policy if exists "destinatarios: acesso autenticado" on public.destinatarios;
create policy "destinatarios: acesso autenticado" on public.destinatarios for all to authenticated using (true) with check (true);

drop policy if exists "usuarios: ver a propria linha" on public.usuarios;
create policy "usuarios: ver a propria linha" on public.usuarios for select to authenticated using (auth_id = auth.uid());

-- Dados de teste: um prédio, uma empresa e um destinatário para cada morador de teste.
-- Ids fixos para o script ser repetível.
insert into public.predios (id, nome, endereco)
values ('11111111-1111-1111-1111-111111111111', 'Prédio de teste', 'Endereço de teste')
on conflict (id) do nothing;

insert into public.empresas (id, predio_id, nome, andar, sala)
values ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Empresa de teste', '1', '101')
on conflict (id) do nothing;

insert into public.destinatarios (empresa_id, nome, tipo)
select '22222222-2222-2222-2222-222222222222', m.nome, 'pessoa'
from public.moradores m
where not exists (
  select 1 from public.destinatarios d
  where d.empresa_id = '22222222-2222-2222-2222-222222222222' and d.nome = m.nome
);

update public.encomendas e
set predio_id = '11111111-1111-1111-1111-111111111111',
    empresa_id = '22222222-2222-2222-2222-222222222222',
    destinatario_id = d.id
from public.destinatarios d
where d.empresa_id = '22222222-2222-2222-2222-222222222222'
  and d.nome = e.destinatario_nome
  and e.empresa_id is null;
