-- Cuddling Memories Fotografie — Row Level Security
-- Voer dit uit ná schema.sql (zelfde SQL Editor).

-- ---------------------------------------------------------------------------
-- Helper: is de huidige ingelogde gebruiker een admin?
-- security definer + vaste search_path zodat de check zelf niet vastloopt in
-- RLS-recursie op admin_profiles en niet gevoelig is voor search_path-tricks.
-- ---------------------------------------------------------------------------
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from admin_profiles where user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- site_settings — publiek leesbaar (geen gevoelige data), alleen admin schrijft.
-- ---------------------------------------------------------------------------
alter table site_settings enable row level security;

create policy "site_settings_public_read" on site_settings
  for select using (true);

create policy "site_settings_admin_write" on site_settings
  for all using (is_admin()) with check (is_admin());

-- Bezoekersstatistieken zijn alleen voor admins leesbaar. Registratie loopt
-- via een Netlify-function met service-role en krijgt geen publieke policy.
alter table site_visitors enable row level security;
create policy "site_visitors_admin_read" on site_visitors
  for select using (is_admin());

alter table site_visitor_days enable row level security;
create policy "site_visitor_days_admin_read" on site_visitor_days
  for select using (is_admin());

alter table site_conversion_events enable row level security;
create policy "site_conversion_events_admin_read" on site_conversion_events
  for select using (is_admin());

-- ---------------------------------------------------------------------------
-- pages
-- ---------------------------------------------------------------------------
alter table pages enable row level security;

create policy "pages_public_read" on pages
  for select using (is_published = true or is_admin());

create policy "pages_admin_write" on pages
  for insert with check (is_admin());
create policy "pages_admin_update" on pages
  for update using (is_admin()) with check (is_admin());
create policy "pages_admin_delete" on pages
  for delete using (is_admin());

-- ---------------------------------------------------------------------------
-- page_sections
-- ---------------------------------------------------------------------------
alter table page_sections enable row level security;

create policy "page_sections_public_read" on page_sections
  for select using (is_visible = true or is_admin());

create policy "page_sections_admin_write" on page_sections
  for insert with check (is_admin());
create policy "page_sections_admin_update" on page_sections
  for update using (is_admin()) with check (is_admin());
create policy "page_sections_admin_delete" on page_sections
  for delete using (is_admin());

-- ---------------------------------------------------------------------------
-- portfolio_albums
-- ---------------------------------------------------------------------------
alter table portfolio_albums enable row level security;

create policy "portfolio_albums_public_read" on portfolio_albums
  for select using (is_published = true or is_admin());

create policy "portfolio_albums_admin_write" on portfolio_albums
  for insert with check (is_admin());
create policy "portfolio_albums_admin_update" on portfolio_albums
  for update using (is_admin()) with check (is_admin());
create policy "portfolio_albums_admin_delete" on portfolio_albums
  for delete using (is_admin());

-- ---------------------------------------------------------------------------
-- portfolio_photos — zichtbaarheid volgt het album (geen eigen is_visible-kolom).
-- ---------------------------------------------------------------------------
alter table portfolio_photos enable row level security;

create policy "portfolio_photos_public_read" on portfolio_photos
  for select using (
    is_admin() or exists (
      select 1 from portfolio_albums a
      where a.id = portfolio_photos.album_id and a.is_published = true
    ) or exists (
      select 1
      from portfolio_photo_albums pa
      join portfolio_albums a on a.id = pa.album_id
      where pa.photo_id = portfolio_photos.id and a.is_published = true
    )
  );

create policy "portfolio_photos_admin_write" on portfolio_photos
  for insert with check (is_admin());
create policy "portfolio_photos_admin_update" on portfolio_photos
  for update using (is_admin()) with check (is_admin());
create policy "portfolio_photos_admin_delete" on portfolio_photos
  for delete using (is_admin());

-- ---------------------------------------------------------------------------
-- portfolio_photo_albums
-- ---------------------------------------------------------------------------
alter table portfolio_photo_albums enable row level security;

create policy "portfolio_photo_albums_public_read" on portfolio_photo_albums
  for select using (
    is_admin() or exists (
      select 1 from portfolio_albums a
      where a.id = portfolio_photo_albums.album_id and a.is_published = true
    )
  );
create policy "portfolio_photo_albums_admin_insert" on portfolio_photo_albums
  for insert with check (is_admin());
create policy "portfolio_photo_albums_admin_delete" on portfolio_photo_albums
  for delete using (is_admin());

-- Openbare beeldpublicaties worden door de service-role Function geschreven.
-- Ingelogde admins mogen alleen hun eigen taakstatus lezen.
alter table public_image_publish_jobs enable row level security;
create policy "public_image_jobs_admin_read" on public_image_publish_jobs
  for select using (is_admin() and admin_user_id = auth.uid());

alter table public_image_assets enable row level security;
create policy "public_image_assets_admin_read" on public_image_assets
  for select using (is_admin());

-- ---------------------------------------------------------------------------
-- packages
-- ---------------------------------------------------------------------------
alter table packages enable row level security;

create policy "packages_public_read" on packages
  for select using (is_published = true or is_admin());

create policy "packages_admin_write" on packages
  for insert with check (is_admin());
create policy "packages_admin_update" on packages
  for update using (is_admin()) with check (is_admin());
create policy "packages_admin_delete" on packages
  for delete using (is_admin());

-- ---------------------------------------------------------------------------
-- testimonials
-- ---------------------------------------------------------------------------
alter table testimonials enable row level security;

create policy "testimonials_public_read" on testimonials
  for select using (is_visible = true or is_admin());

create policy "testimonials_admin_write" on testimonials
  for insert with check (is_admin());
create policy "testimonials_admin_update" on testimonials
  for update using (is_admin()) with check (is_admin());
create policy "testimonials_admin_delete" on testimonials
  for delete using (is_admin());

-- ---------------------------------------------------------------------------
-- faq
-- ---------------------------------------------------------------------------
alter table faq enable row level security;

create policy "faq_public_read" on faq
  for select using (is_visible = true or is_admin());

create policy "faq_admin_write" on faq
  for insert with check (is_admin());
create policy "faq_admin_update" on faq
  for update using (is_admin()) with check (is_admin());
create policy "faq_admin_delete" on faq
  for delete using (is_admin());

-- ---------------------------------------------------------------------------
-- bookings — publiek mag alleen aanmaken (nooit lezen/wijzigen/verwijderen).
-- De WITH CHECK dwingt af dat een publieke insert nooit een al-afgeronde of
-- "belangrijk"-gemarkeerde boeking kan aanmaken. De echte insert-weg loopt
-- via de create-booking Netlify Function (service role, bypasst RLS); deze
-- policy is het vangnet voor eventuele rechtstreekse client-inserts.
-- ---------------------------------------------------------------------------
alter table bookings enable row level security;

create policy "bookings_public_insert" on bookings
  for insert
  with check (
    is_admin() or (
      status = 'Nieuw' and source = 'website' and is_important = false
    )
  );

create policy "bookings_admin_read" on bookings
  for select using (is_admin());
create policy "bookings_admin_update" on bookings
  for update using (is_admin()) with check (is_admin());
create policy "bookings_admin_delete" on bookings
  for delete using (is_admin());

alter table booking_addons enable row level security;
create policy "booking_addons_admin_all" on booking_addons
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- booking_notes / booking_status_history — uitsluitend voor admins.
-- ---------------------------------------------------------------------------
alter table booking_notes enable row level security;

create policy "booking_notes_admin_all" on booking_notes
  for all using (is_admin()) with check (is_admin());

alter table booking_status_history enable row level security;

create policy "booking_status_history_admin_all" on booking_status_history
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- admin_profiles — uitsluitend voor admins (geen publieke registratie/lezen).
-- ---------------------------------------------------------------------------
alter table admin_profiles enable row level security;

create policy "admin_profiles_admin_all" on admin_profiles
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- Storage: bucket 'portfolio' — publiek leesbaar, alleen admins uploaden/verwijderen.
-- ---------------------------------------------------------------------------
create policy "portfolio_bucket_public_read" on storage.objects
  for select using (bucket_id = 'portfolio');

create policy "portfolio_bucket_admin_write" on storage.objects
  for insert with check (bucket_id = 'portfolio' and is_admin());
create policy "portfolio_bucket_admin_update" on storage.objects
  for update using (bucket_id = 'portfolio' and is_admin()) with check (bucket_id = 'portfolio' and is_admin());
create policy "portfolio_bucket_admin_delete" on storage.objects
  for delete using (bucket_id = 'portfolio' and is_admin());

-- ---------------------------------------------------------------------------
-- Boekingssysteem: availability_rules, shoot_type_settings, blocked_periods,
-- manual_slots, booking_settings — volledig admin-only (ook lezen). Publieke
-- bezoekers krijgen beschikbaarheid nooit rechtstreeks uit deze tabellen,
-- uitsluitend via de berekende output van get_available_slots() (aangeroepen
-- met de service-role key vanuit netlify/functions/get-available-slots.ts).
-- Zo lekt er nooit interne info (bv. de reden achter een blokkade) naar de
-- site. book_slot()/reschedule_booking() zijn de enige schrijfpaden die
-- publieke bezoekers indirect raken, en die zijn security definer (zie
-- schema.sql) — geen aparte RLS-uitzondering hier nodig.
-- ---------------------------------------------------------------------------
alter table availability_rules enable row level security;
create policy "availability_rules_admin_all" on availability_rules
  for all using (is_admin()) with check (is_admin());

alter table shoot_type_settings enable row level security;
create policy "shoot_type_settings_admin_all" on shoot_type_settings
  for all using (is_admin()) with check (is_admin());

alter table blocked_periods enable row level security;
create policy "blocked_periods_admin_all" on blocked_periods
  for all using (is_admin()) with check (is_admin());

alter table manual_slots enable row level security;
create policy "manual_slots_admin_all" on manual_slots
  for all using (is_admin()) with check (is_admin());

alter table booking_settings enable row level security;
create policy "booking_settings_admin_all" on booking_settings
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- Maandbeschikbaarheid: monthly_availability_settings, booking_display_settings
-- — zelfde patroon, volledig admin-only. Publiek krijgt alleen de berekende
-- output van calculate_month_status()/get_months_status() (service-role,
-- via netlify/functions/get-month-availability.ts, die zelf bepaalt welk
-- deel van de response publiek zichtbaar is).
-- ---------------------------------------------------------------------------
alter table monthly_availability_settings enable row level security;
create policy "monthly_availability_settings_admin_all" on monthly_availability_settings
  for all using (is_admin()) with check (is_admin());

alter table booking_display_settings enable row level security;
create policy "booking_display_settings_admin_all" on booking_display_settings
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- Uitbreiding: klantgalerijen, e-mails, wachtlijst, cadeaubonnen en mini-shoots.
-- ---------------------------------------------------------------------------
alter table client_galleries enable row level security;
create policy "client_galleries_admin_all" on client_galleries
  for all using (is_admin()) with check (is_admin());

alter table gallery_photos enable row level security;
create policy "gallery_photos_admin_all" on gallery_photos
  for all using (is_admin()) with check (is_admin());

create policy "client_gallery_bucket_public_read" on storage.objects
  for select using (bucket_id = 'client-galleries');
create policy "client_gallery_bucket_admin_write" on storage.objects
  for insert with check (bucket_id = 'client-galleries' and is_admin());
create policy "client_gallery_bucket_admin_update" on storage.objects
  for update using (bucket_id = 'client-galleries' and is_admin()) with check (bucket_id = 'client-galleries' and is_admin());
create policy "client_gallery_bucket_admin_delete" on storage.objects
  for delete using (bucket_id = 'client-galleries' and is_admin());

alter table email_templates enable row level security;
create policy "email_templates_admin_all" on email_templates
  for all using (is_admin()) with check (is_admin());

alter table email_logs enable row level security;
create policy "email_logs_admin_all" on email_logs
  for all using (is_admin()) with check (is_admin());

alter table scheduled_email_overrides enable row level security;
create policy "scheduled_email_overrides_admin_all" on scheduled_email_overrides
  for all using (is_admin()) with check (is_admin());

alter table waitlist_entries enable row level security;
create policy "waitlist_entries_admin_all" on waitlist_entries
  for all using (is_admin()) with check (is_admin());

alter table giftcards enable row level security;
create policy "giftcards_admin_all" on giftcards
  for all using (is_admin()) with check (is_admin());

alter table discount_codes enable row level security;
create policy "discount_codes_admin_all" on discount_codes
  for all using (is_admin()) with check (is_admin());

alter table mini_sessions enable row level security;
create policy "mini_sessions_public_read" on mini_sessions
  for select using ((is_published = true and status = 'Gepubliceerd') or is_admin());
create policy "mini_sessions_admin_all" on mini_sessions
  for all using (is_admin()) with check (is_admin());

alter table mini_session_slots enable row level security;
create policy "mini_session_slots_public_read" on mini_session_slots
  for select using (
    is_admin() or exists (
      select 1 from mini_sessions m
      where m.id = mini_session_slots.mini_session_id
        and m.is_published = true
        and m.status = 'Gepubliceerd'
    )
  );
create policy "mini_session_slots_admin_all" on mini_session_slots
  for all using (is_admin()) with check (is_admin());

alter table mini_session_bookings enable row level security;
create policy "mini_session_bookings_admin_all" on mini_session_bookings
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- Native Android admin-app: notifications/push_tokens — volledig admin-only.
-- Meldingen zijn bewust een gedeelde/broadcast-lijst voor alle admins (de
-- trigger-functies zetten geen specifieke admin_user_id), dus geen extra
-- "eigen rij"-beperking hier — zelfde eenvoudige patroon als de rest.
-- `drop policy if exists` maakt dit veilig herdraaibaar, ongeacht of
-- admin_app_phase1.sql/native_android_push.sql al eens gedraaid is.
-- ---------------------------------------------------------------------------
alter table notifications enable row level security;
drop policy if exists "notifications_admin_all" on notifications;
create policy "notifications_admin_all" on notifications
  for all using (is_admin()) with check (is_admin());

alter table push_tokens enable row level security;
drop policy if exists "push_tokens_admin_all" on push_tokens;
create policy "push_tokens_admin_all" on push_tokens
  for all using (is_admin()) with check (is_admin());
