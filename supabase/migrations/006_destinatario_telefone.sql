-- 006: telefone e consentimento para aviso por WhatsApp no destinatário (pessoa).
-- RASCUNHO: ainda não aplicado. Aplicar só depois de revisão e ensaio.
--
-- Regras:
-- - telefone: só dígitos, com 55 e DDD (ex.: 5513991925568). Opcional.
-- - consentimento_em: data em que a pessoa autorizou receber aviso por WhatsApp.
--   Sem essa data, nenhum aviso é enviado, mesmo com telefone preenchido.

alter table public.destinatarios
  add column if not exists telefone text,
  add column if not exists consentimento_em timestamptz;

alter table public.destinatarios
  drop constraint if exists destinatarios_telefone_formato;

alter table public.destinatarios
  add constraint destinatarios_telefone_formato
  check (telefone is null or telefone ~ '^[0-9]{12,13}$');

-- Ensaio (reverte tudo, sem gravar): descomentar para testar antes de aplicar.
-- do $ensaio$
-- begin
--   -- aplicar as alterações acima e checar as colunas
--   raise exception 'ENSAIO (revertido): 006 ok';
-- end
-- $ensaio$;
