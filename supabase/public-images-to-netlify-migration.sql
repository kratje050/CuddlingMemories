-- Migreert de huidige vaste openbare websitebeelden naar lokale Netlify-paden.
-- De originele Storage-objecten worden NIET verwijderd en blijven als back-up bestaan.
-- Updates zijn bewust gekoppeld aan zowel record-ID als de huidige Storage-URL.

create table if not exists public.public_image_path_backup (
  source_table text not null,
  record_id uuid not null,
  original_url text not null,
  local_url text not null,
  backed_up_at timestamptz not null default now(),
  primary key (source_table, record_id)
);

alter table public.public_image_path_backup enable row level security;

insert into public.public_image_path_backup (source_table, record_id, original_url, local_url)
select 'portfolio_photos', portfolio_photos.id, image_url, mapping.local_url
from public.portfolio_photos
join (values
  ('b83ed973-3328-47da-8865-d2910025d7ab'::uuid, '/images/portfolio/portret/portret-01-5332f06b5575-1600.webp'),
  ('58572ec6-02be-4f25-a341-d05d8edaf9fd'::uuid, '/images/portfolio/zwangerschap/zwangerschap-buik-5256a5b3dc57-1600.webp'),
  ('96cb5bcd-3442-486c-a811-16b57820b7df'::uuid, '/images/portfolio/cakesmash/cakesmash-01-1e7f21dd3936-1600.webp'),
  ('dca4e15f-8381-4d0c-b8cd-6fff3efc3a35'::uuid, '/images/portfolio/cakesmash/cakesmash-02-f931a695e212-1600.webp'),
  ('1f1dd21e-ff9c-495c-977f-a55c8d7d1f1d'::uuid, '/images/portfolio/bevalling/bevalling-01-b9a242dd9d78-1600.webp'),
  ('0d9c3cd5-d8b6-4f71-9c8d-faa9f913f796'::uuid, '/images/portfolio/bevalling/bevalling-02-ea82361cb3b5-1600.webp')
) as mapping(id, local_url) on mapping.id = portfolio_photos.id
where image_url ~ '^https?://'
on conflict (source_table, record_id) do nothing;

insert into public.public_image_path_backup (source_table, record_id, original_url, local_url)
select 'page_sections', id, content, '/images/home/herinnering-7d395cb82685-1440.webp'
from public.page_sections
where id = '183cc7cc-b7e1-44d1-b89c-c65307bc3975'
  and content ~ '^https?://'
on conflict (source_table, record_id) do nothing;

update public.portfolio_photos set image_url = '/images/portfolio/portret/portret-01-5332f06b5575-1600.webp'
where id = 'b83ed973-3328-47da-8865-d2910025d7ab' and image_url ~ '^https?://';
update public.portfolio_photos set image_url = '/images/portfolio/zwangerschap/zwangerschap-buik-5256a5b3dc57-1600.webp'
where id = '58572ec6-02be-4f25-a341-d05d8edaf9fd' and image_url ~ '^https?://';
update public.portfolio_photos set image_url = '/images/portfolio/cakesmash/cakesmash-01-1e7f21dd3936-1600.webp'
where id = '96cb5bcd-3442-486c-a811-16b57820b7df' and image_url ~ '^https?://';
update public.portfolio_photos set image_url = '/images/portfolio/cakesmash/cakesmash-02-f931a695e212-1600.webp'
where id = 'dca4e15f-8381-4d0c-b8cd-6fff3efc3a35' and image_url ~ '^https?://';
update public.portfolio_photos set image_url = '/images/portfolio/bevalling/bevalling-01-b9a242dd9d78-1600.webp'
where id = '1f1dd21e-ff9c-495c-977f-a55c8d7d1f1d' and image_url ~ '^https?://';
update public.portfolio_photos set image_url = '/images/portfolio/bevalling/bevalling-02-ea82361cb3b5-1600.webp'
where id = '0d9c3cd5-d8b6-4f71-9c8d-faa9f913f796' and image_url ~ '^https?://';

update public.page_sections set content = '/images/home/herinnering-7d395cb82685-1440.webp'
where id = '183cc7cc-b7e1-44d1-b89c-c65307bc3975'
  and content ~ '^https?://';

notify pgrst, 'reload schema';
