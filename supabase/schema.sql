-- Registro de Encomendas: esquema do banco (Supabase / Postgres)
-- Execute no SQL Editor do Supabase.

create extension if not exists "pgcrypto";

create table if not exists public.moradores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  apartamento text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists public.encomendas (
  id uuid primary key default gen_random_uuid(),
  morador_id uuid references public.moradores(id) on delete set null,
  destinatario_nome text not null,
  apartamento text not null,
  transportadora text,
  codigo_lido text,
  foto_path text,
  recebido_em timestamptz not null default now()
);

create index if not exists encomendas_recebido_em_idx
  on public.encomendas (recebido_em desc);

-- Segurança: apenas usuários autenticados (conta da portaria) acessam os dados.
alter table public.moradores enable row level security;
alter table public.encomendas enable row level security;

create policy "moradores: leitura autenticada" on public.moradores
  for select to authenticated using (true);
create policy "moradores: escrita autenticada" on public.moradores
  for all to authenticated using (true) with check (true);

create policy "encomendas: leitura autenticada" on public.encomendas
  for select to authenticated using (true);
create policy "encomendas: inclusao autenticada" on public.encomendas
  for insert to authenticated with check (true);

-- Bucket privado para as fotos das etiquetas.
insert into storage.buckets (id, name, public)
values ('etiquetas', 'etiquetas', false)
on conflict (id) do nothing;

create policy "etiquetas: leitura autenticada" on storage.objects
  for select to authenticated using (bucket_id = 'etiquetas');
create policy "etiquetas: envio autenticado" on storage.objects
  for insert to authenticated with check (bucket_id = 'etiquetas');
