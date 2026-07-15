-- Laat een portfoliofoto in meerdere albums verschijnen.
-- Voer dit bestand eenmalig uit in de Supabase SQL Editor.

create table if not exists public.portfolio_photo_albums (
  photo_id uuid not null references public.portfolio_photos(id) on delete cascade,
  album_id uuid not null references public.portfolio_albums(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (photo_id, album_id)
);

create index if not exists idx_portfolio_photo_albums_album
  on public.portfolio_photo_albums (album_id, photo_id);

insert into public.portfolio_photo_albums (photo_id, album_id)
select id, album_id
from public.portfolio_photos
where album_id is not null
on conflict (photo_id, album_id) do nothing;

alter table public.portfolio_photo_albums enable row level security;

drop policy if exists "portfolio_photo_albums_public_read" on public.portfolio_photo_albums;
create policy "portfolio_photo_albums_public_read" on public.portfolio_photo_albums
  for select using (
    is_admin() or exists (
      select 1 from public.portfolio_albums a
      where a.id = portfolio_photo_albums.album_id and a.is_published = true
    )
  );

drop policy if exists "portfolio_photo_albums_admin_insert" on public.portfolio_photo_albums;
create policy "portfolio_photo_albums_admin_insert" on public.portfolio_photo_albums
  for insert with check (is_admin());

drop policy if exists "portfolio_photo_albums_admin_delete" on public.portfolio_photo_albums;
create policy "portfolio_photo_albums_admin_delete" on public.portfolio_photo_albums
  for delete using (is_admin());

drop policy if exists "portfolio_photos_public_read" on public.portfolio_photos;
create policy "portfolio_photos_public_read" on public.portfolio_photos
  for select using (
    is_admin() or exists (
      select 1 from public.portfolio_albums a
      where a.id = portfolio_photos.album_id and a.is_published = true
    ) or exists (
      select 1
      from public.portfolio_photo_albums pa
      join public.portfolio_albums a on a.id = pa.album_id
      where pa.photo_id = portfolio_photos.id and a.is_published = true
    )
  );
