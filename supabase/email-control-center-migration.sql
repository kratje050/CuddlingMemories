-- Bewaar de gebruikte variabelen zodat een mislukte mail exact opnieuw kan worden verzonden.
alter table public.email_logs
  add column if not exists variables jsonb not null default '{}'::jsonb;

create index if not exists idx_email_logs_status_created_at
  on public.email_logs (status, created_at desc);
