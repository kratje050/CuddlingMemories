-- Privacyvriendelijke conversietrechter voor unieke bezoekers.
create table if not exists public.site_conversion_events (
  visitor_hash text not null references public.site_visitors(visitor_hash) on delete cascade,
  event_key text not null check (event_key in ('packages_viewed', 'booking_opened', 'booking_started', 'package_selected', 'booking_completed')),
  event_data jsonb not null default '{}'::jsonb,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  primary key (visitor_hash, event_key)
);

create index if not exists idx_site_conversion_events_last_seen
  on public.site_conversion_events (last_seen desc);

alter table public.site_conversion_events enable row level security;
drop policy if exists "site_conversion_events_admin_read" on public.site_conversion_events;
create policy "site_conversion_events_admin_read" on public.site_conversion_events
  for select using (is_admin());

notify pgrst, 'reload schema';
