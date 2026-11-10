-- Fase 2: pedido completo, ciclo de retirada e confirmação do morador.
-- Só adiciona colunas e políticas. Não apaga nem altera dados existentes.
-- Revise antes de executar no SQL Editor do Supabase.

-- Moradores: contato e consentimento para avisos.
alter table public.moradores
  add column if not exists bloco text,
  add column if not exists telefone text,
  add column if not exists consentimento_em timestamptz;

-- Encomendas: informação completa do pedido.
alter table public.encomendas
  add column if not exists bloco text,
  add column if not exists loja text,
  add column if not exists vendedor text,
  add column if not exists pedido text,
  add column if not exists rastreio text,
  add column if not exists origem_cidade text,
  add column if not exists origem_uf text,
  add column if not exists tipo text not null default 'caixa',
  add column if not exists volumes integer not null default 1,
  add column if not exists condicao text not null default 'ok',
  add column if not exists local_guarda text,
  add column if not exists observacao text,
  add column if not exists foto_pacote_path text,
  add column if not exists recebido_por text,
  -- Ciclo e confirmação.
  add column if not exists status text not null default 'recebida',
  add column if not exists avisado_em timestamptz,
  add column if not exists codigo_retirada_hash text,
  add column if not exists retirado_em timestamptz,
  add column if not exists retirado_por_nome text,
  add column if not exists entregue_por text,
  add column if not exists assinatura_path text,
  add column if not exists entrega_sem_codigo boolean not null default false,
  add column if not exists justificativa_sem_codigo text;

alter table public.encomendas
  drop constraint if exists encomendas_status_check,
  drop constraint if exists encomendas_tipo_check,
  drop constraint if exists encomendas_condicao_check,
  drop constraint if exists encomendas_volumes_check;

alter table public.encomendas
  add constraint encomendas_status_check check (status in ('recebida', 'avisada', 'retirada')),
  add constraint encomendas_tipo_check check (tipo in ('caixa', 'envelope', 'sacola', 'volume_grande')),
  add constraint encomendas_condicao_check check (condicao in ('ok', 'amassado', 'aberto', 'fragil', 'refrigerado')),
  add constraint encomendas_volumes_check check (volumes between 1 and 99);

create index if not exists encomendas_status_idx on public.encomendas (status, recebido_em desc);
create index if not exists encomendas_rastreio_idx on public.encomendas (rastreio);

-- A confirmação da entrega atualiza a encomenda.
drop policy if exists "encomendas: atualizacao autenticada" on public.encomendas;
create policy "encomendas: atualizacao autenticada" on public.encomendas
  for update to authenticated using (true) with check (true);

-- Retenção (sugestão, não aplicada): apagar fotos e assinaturas 90 dias depois da retirada.
-- Requer a extensão pg_cron e uma função que remova os objetos do bucket 'etiquetas'.
