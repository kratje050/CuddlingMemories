-- Automatisch de eerstvolgende geschikte persoon op de wachtlijst benaderen.
alter table public.waitlist_entries
  add column if not exists auto_contact_enabled boolean not null default true,
  add column if not exists invitation_token text,
  add column if not exists invitation_sent_at timestamptz,
  add column if not exists invitation_expires_at timestamptz,
  add column if not exists offered_date date,
  add column if not exists offered_start_time time,
  add column if not exists offered_end_time time,
  add column if not exists invitation_count integer not null default 0;

create unique index if not exists idx_waitlist_invitation_token
  on public.waitlist_entries (invitation_token)
  where invitation_token is not null;

create index if not exists idx_waitlist_auto_contact
  on public.waitlist_entries (status, auto_contact_enabled, created_at)
  where auto_contact_enabled = true;

create index if not exists idx_waitlist_active_invitation
  on public.waitlist_entries (shoot_type, invitation_expires_at)
  where invitation_token is not null;

insert into public.email_templates (template_key, label, subject, body, is_active)
values (
  'waitlist_slot_available',
  'Plek vrijgekomen voor wachtlijst',
  'Er is een plek vrij voor je {{shoot_type}}',
  E'Hoi {{customer_name}},\n\nEr is een plek vrijgekomen voor je {{shoot_type}} op {{offered_date}} van {{offered_start_time}} tot {{offered_end_time}}.\n\nVia onderstaande persoonlijke link kun je deze plek aanvragen:\n{{booking_link}}\n\nDit aanbod is geldig tot {{offer_expires_at}}. De plek is pas definitief gereserveerd nadat je de boekingsaanvraag hebt verstuurd en deze is bevestigd. Reageer daarom op tijd.',
  true
)
on conflict (template_key) do nothing;
