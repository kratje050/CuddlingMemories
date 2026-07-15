alter table public.packages
  add column if not exists is_addon boolean not null default false;

create table if not exists public.booking_addons (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  package_id uuid references public.packages(id) on delete set null,
  title_snapshot text not null,
  price_snapshot numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (booking_id, package_id)
);

create index if not exists idx_booking_addons_booking_id
  on public.booking_addons (booking_id);

alter table public.booking_addons enable row level security;
drop policy if exists "booking_addons_admin_all" on public.booking_addons;
create policy "booking_addons_admin_all" on public.booking_addons
  for all using (public.is_admin()) with check (public.is_admin());

notify pgrst, 'reload schema';
