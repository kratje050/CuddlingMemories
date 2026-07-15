-- Variantmetadata voor geoptimaliseerde Supabase-opslag en optionele R2-opslag.
-- De bestaande image_url blijft verplicht en blijft als terugval behouden.
-- Deze migratie is additief en verwijdert of wijzigt geen bestaande foto's.

alter table public.gallery_photos add column if not exists storage_provider text not null default 'supabase';
alter table public.gallery_photos add column if not exists object_key text;
alter table public.gallery_photos add column if not exists thumbnail_key text;
alter table public.gallery_photos add column if not exists medium_key text;
alter table public.gallery_photos add column if not exists image_width integer;
alter table public.gallery_photos add column if not exists image_height integer;
alter table public.gallery_photos add column if not exists image_variants jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'gallery_photos_storage_provider_check'
      and conrelid = 'public.gallery_photos'::regclass
  ) then
    alter table public.gallery_photos
      add constraint gallery_photos_storage_provider_check
      check (storage_provider in ('supabase', 'r2'));
  end if;
end $$;

create index if not exists idx_gallery_photos_storage_provider
  on public.gallery_photos (storage_provider, gallery_id);

notify pgrst, 'reload schema';
