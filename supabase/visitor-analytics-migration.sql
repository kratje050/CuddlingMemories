-- Privacyvriendelijke bezoekersstatistieken.
-- Er worden geen IP-adressen, namen of e-mailadressen opgeslagen.

create table if not exists site_visitors (
  visitor_hash text primary key,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  last_path text,
  created_at timestamptz not null default now()
);

create table if not exists site_visitor_days (
  visitor_hash text not null references site_visitors(visitor_hash) on delete cascade,
  visit_date date not null default current_date,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  primary key (visitor_hash, visit_date)
);

create index if not exists idx_site_visitors_last_seen on site_visitors(last_seen desc);
create index if not exists idx_site_visitor_days_date on site_visitor_days(visit_date desc);

alter table site_visitors enable row level security;
alter table site_visitor_days enable row level security;

drop policy if exists "site_visitors_admin_read" on site_visitors;
create policy "site_visitors_admin_read" on site_visitors
  for select using (is_admin());

drop policy if exists "site_visitor_days_admin_read" on site_visitor_days;
create policy "site_visitor_days_admin_read" on site_visitor_days
  for select using (is_admin());

notify pgrst, 'reload schema';
