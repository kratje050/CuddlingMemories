-- Voeg pakketkeuzes toe aan het bestaande conversieoverzicht.
alter table public.site_conversion_events
  add column if not exists event_data jsonb not null default '{}'::jsonb;

alter table public.site_conversion_events
  drop constraint if exists site_conversion_events_event_key_check;

alter table public.site_conversion_events
  add constraint site_conversion_events_event_key_check
  check (event_key in ('packages_viewed', 'booking_opened', 'booking_started', 'package_selected', 'booking_completed'));

notify pgrst, 'reload schema';
