-- Cuddling Memories Admin — Android-app aanvulling
-- Voegt toe: korting-velden op bookings, en de ontbrekende server-kant van
-- de pushmeldingen-pijplijn (notifications/push_tokens bestonden al deels
-- via admin_app_phase1.sql of native-android/supabase/native_android_push.sql
-- — alles hieronder is bewust idempotent en repareert ontbrekende kolommen
-- i.p.v. blind te herscheppen, dus veilig te draaien ongeacht wat al bestaat).
-- Voer dit één keer volledig uit in de Supabase SQL Editor.

-- =============================================================================
-- Deel 1 — korting-velden op bookings
-- =============================================================================
alter table bookings
  add column if not exists discount_type text
    check (discount_type is null or discount_type in ('vast_bedrag', 'percentage', 'giveaway', 'winactie')),
  add column if not exists discount_value numeric(10,2),
  add column if not exists discount_note text;

-- =============================================================================
-- Deel 2 — notifications/push_tokens (idempotent) + reparatie ontbrekende kolommen
-- =============================================================================
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
  token text,
  platform text not null default 'android',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Reparatie voor het geval alleen admin_app_phase1.sql (Expo-variant, kolom
-- expo_push_token i.p.v. token) al gedraaid is.
alter table push_tokens add column if not exists token text;
alter table push_tokens add column if not exists platform text not null default 'android';
alter table push_tokens add column if not exists is_active boolean not null default true;
alter table push_tokens add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'push_tokens_token_key') then
    begin
      alter table push_tokens add constraint push_tokens_token_key unique (token);
    exception when others then
      raise notice 'Kon geen unieke constraint op push_tokens.token toevoegen (mogelijk dubbele/lege waarden) - los dit zo nodig handmatig op.';
    end;
  end if;
end $$;

drop trigger if exists trg_push_tokens_updated_at on push_tokens;
create trigger trg_push_tokens_updated_at
  before update on push_tokens
  for each row execute function set_updated_at();

alter table notifications enable row level security;
drop policy if exists "notifications_admin_all" on notifications;
create policy "notifications_admin_all" on notifications
  for all using (is_admin()) with check (is_admin());

alter table push_tokens enable row level security;
drop policy if exists "push_tokens_admin_all" on push_tokens;
create policy "push_tokens_admin_all" on push_tokens
  for all using (is_admin()) with check (is_admin());

-- =============================================================================
-- Deel 3 — pushmeldingen-pijplijn: pg_net + fn_notify_admins + triggers
-- =============================================================================
create extension if not exists pg_net with schema extensions;

-- Legt een melding vast + roept (best-effort, faalt de transactie nooit)
-- de Netlify Function aan die de FCM-push echt verstuurt.
create or replace function fn_notify_admins(
  p_type text,
  p_title text,
  p_body text,
  p_related_table text default null,
  p_related_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text;
begin
  -- Toestaan voor anon (publieke boekingsformulier-triggers draaien als de
  -- inserterende rol, hier meestal service_role/postgres via de trigger) én
  -- authenticated (test-pushknop in de app) — maar een ingelogde gebruiker
  -- moet wel echt admin zijn, anders geen effect.
  if auth.uid() is not null and not is_admin() then
    return;
  end if;

  insert into notifications (type, title, body, related_table, related_id)
  values (p_type, p_title, p_body, p_related_table, p_related_id);

  begin
    select decrypted_secret into v_secret
    from vault.decrypted_secrets
    where name = 'internal_webhook_secret'
    limit 1;

    if v_secret is not null then
      perform net.http_post(
        url := 'https://cuddlingmemories.nl/api/send-push-notification',
        headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', v_secret),
        body := jsonb_build_object('type', p_type, 'title', p_title, 'body', p_body)
      );
    end if;
  exception when others then
    raise notice 'Pushmelding versturen is mislukt (melding is wel opgeslagen): %', sqlerrm;
  end;
end;
$$;

create or replace function fn_notify_new_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform fn_notify_admins('booking', 'Nieuwe boekingsaanvraag', new.customer_name || ' — ' || new.shoot_type, 'bookings', new.id);
  return new;
end;
$$;

drop trigger if exists trg_notify_new_booking on bookings;
create trigger trg_notify_new_booking
  after insert on bookings
  for each row execute function fn_notify_new_booking();

create or replace function fn_notify_new_waitlist_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform fn_notify_admins('waitlist', 'Nieuwe wachtlijst-aanmelding', new.customer_name || ' — ' || new.shoot_type, 'waitlist_entries', new.id);
  return new;
end;
$$;

drop trigger if exists trg_notify_new_waitlist_entry on waitlist_entries;
create trigger trg_notify_new_waitlist_entry
  after insert on waitlist_entries
  for each row execute function fn_notify_new_waitlist_entry();

create or replace function fn_notify_new_giftcard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform fn_notify_admins('giftcard', 'Nieuwe cadeaubon-aanvraag', new.purchaser_name || ' — ' || new.giftcard_type, 'giftcards', new.id);
  return new;
end;
$$;

drop trigger if exists trg_notify_new_giftcard on giftcards;
create trigger trg_notify_new_giftcard
  after insert on giftcards
  for each row execute function fn_notify_new_giftcard();

create or replace function fn_notify_new_mini_session_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform fn_notify_admins('mini_session', 'Nieuwe mini-shoot boeking', new.customer_name, 'mini_session_bookings', new.id);
  return new;
end;
$$;

drop trigger if exists trg_notify_new_mini_session_booking on mini_session_bookings;
create trigger trg_notify_new_mini_session_booking
  after insert on mini_session_bookings
  for each row execute function fn_notify_new_mini_session_booking();

-- =============================================================================
-- Deel 4 — ÉÉN keer, met je EIGEN geheime waarde (niet deze placeholder!),
-- los uitvoeren in de SQL Editor. Dit geheim wordt zo nooit gecommit in git.
-- Kies zelf een lange willekeurige string en gebruik die ook als
-- INTERNAL_WEBHOOK_SECRET-omgevingsvariabele in Netlify (zie README).
-- =============================================================================
-- select vault.create_secret('jouw-eigen-lange-geheime-waarde', 'internal_webhook_secret', 'Deelt boekingsmeldingen met send-push-notification.ts');
