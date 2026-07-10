-- Cuddling Memories Admin apps - Fase 1 basis
-- Voer dit uit na de bestaande schema.sql en policies.sql.

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text,
  related_type text,
  related_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_admin_read
  on notifications (admin_user_id, is_read, created_at desc);

create table if not exists push_tokens (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null default 'android',
  expo_push_token text not null,
  device_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (expo_push_token)
);

drop trigger if exists trg_push_tokens_updated_at on push_tokens;
create trigger trg_push_tokens_updated_at
  before update on push_tokens
  for each row execute function set_updated_at();

create table if not exists web_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  platform text not null default 'iphone-pwa',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_web_push_subscriptions_updated_at on web_push_subscriptions;
create trigger trg_web_push_subscriptions_updated_at
  before update on web_push_subscriptions
  for each row execute function set_updated_at();

create table if not exists admin_device_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  device_name text,
  platform text not null,
  last_seen_at timestamptz not null default now(),
  push_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;
alter table push_tokens enable row level security;
alter table web_push_subscriptions enable row level security;
alter table admin_device_sessions enable row level security;

drop policy if exists "notifications_admin_all" on notifications;
create policy "notifications_admin_all" on notifications
  for all using (is_admin()) with check (is_admin());

drop policy if exists "push_tokens_admin_all" on push_tokens;
create policy "push_tokens_admin_all" on push_tokens
  for all using (is_admin()) with check (is_admin());

drop policy if exists "web_push_subscriptions_admin_all" on web_push_subscriptions;
create policy "web_push_subscriptions_admin_all" on web_push_subscriptions
  for all using (is_admin()) with check (is_admin());

drop policy if exists "admin_device_sessions_admin_all" on admin_device_sessions;
create policy "admin_device_sessions_admin_all" on admin_device_sessions
  for all using (is_admin()) with check (is_admin());
