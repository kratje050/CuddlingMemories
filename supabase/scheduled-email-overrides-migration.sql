create table if not exists public.scheduled_email_overrides (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  template_key text not null,
  subject text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (booking_id, template_key)
);

drop trigger if exists trg_scheduled_email_overrides_updated_at on public.scheduled_email_overrides;
create trigger trg_scheduled_email_overrides_updated_at
  before update on public.scheduled_email_overrides
  for each row execute function public.set_updated_at();

create index if not exists idx_scheduled_email_overrides_booking
  on public.scheduled_email_overrides (booking_id, template_key);

alter table public.scheduled_email_overrides enable row level security;

drop policy if exists "scheduled_email_overrides_admin_all" on public.scheduled_email_overrides;
create policy "scheduled_email_overrides_admin_all" on public.scheduled_email_overrides
  for all using (public.is_admin()) with check (public.is_admin());

notify pgrst, 'reload schema';
