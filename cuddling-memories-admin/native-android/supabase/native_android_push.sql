-- Native Android push basis voor Cuddling Memories Admin.
-- Voer dit alleen uit als deze tabellen nog niet bestaan.

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete cascade,
  type text not null default 'general',
  title text not null,
  body text,
  related_table text,
  related_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_admin_read
  on notifications (admin_user_id, is_read, created_at desc);

create table if not exists push_tokens (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  platform text not null default 'android',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table notifications enable row level security;
alter table push_tokens enable row level security;

drop policy if exists "notifications_admin_all" on notifications;
create policy "notifications_admin_all" on notifications
for all
using (exists (select 1 from admin_profiles where user_id = auth.uid()))
with check (exists (select 1 from admin_profiles where user_id = auth.uid()));

drop policy if exists "push_tokens_admin_all" on push_tokens;
create policy "push_tokens_admin_all" on push_tokens
for all
using (exists (select 1 from admin_profiles where user_id = auth.uid()))
with check (exists (select 1 from admin_profiles where user_id = auth.uid()));

-- Server-side FCM verzenden moet via Supabase Edge Function of Netlify Function.
-- Zet Firebase server credentials nooit in de Android app.
