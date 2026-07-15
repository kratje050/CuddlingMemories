-- Veilige tweefasenpublicatie van openbare afbeeldingen via GitHub en Netlify.
-- Voer dit eenmalig uit voordat de nieuwe admin-upload wordt gebruikt.

alter table public.portfolio_photos add column if not exists image_srcset text;
alter table public.portfolio_photos add column if not exists image_width integer;
alter table public.portfolio_photos add column if not exists image_height integer;
alter table public.portfolio_photos add column if not exists image_variants jsonb not null default '[]'::jsonb;
alter table public.portfolio_photos add column if not exists image_source text not null default 'supabase'
  check (image_source in ('supabase', 'netlify'));

-- Beelden die door de eerdere lokale migratie al een /images/-pad hebben,
-- zijn ook Netlify-beelden, ook al bestond deze kolom toen nog niet.
update public.portfolio_photos
set image_source = 'netlify'
where image_url like '/images/%';

create table if not exists public.public_image_publish_jobs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id) on delete restrict,
  target_type text not null check (target_type in ('portfolio_photo', 'page_section')),
  target_record_id uuid,
  target_payload jsonb not null default '{}'::jsonb,
  status text not null default 'processing' check (status in ('processing', 'deploying', 'ready', 'failed')),
  public_base_url text not null,
  primary_path text not null,
  public_paths jsonb not null default '[]'::jsonb,
  repo_paths jsonb not null default '[]'::jsonb,
  srcset text,
  variants jsonb not null default '[]'::jsonb,
  image_width integer,
  image_height integer,
  github_commit_sha text,
  github_branch text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.public_image_assets (
  id uuid primary key default gen_random_uuid(),
  publish_job_id uuid not null unique references public.public_image_publish_jobs(id) on delete restrict,
  target_type text not null,
  target_record_id uuid,
  primary_path text not null,
  srcset text,
  variants jsonb not null default '[]'::jsonb,
  width integer,
  height integer,
  alt_text text,
  category text,
  github_commit_sha text,
  created_at timestamptz not null default now()
);

create index if not exists idx_public_image_publish_jobs_admin_created
  on public.public_image_publish_jobs (admin_user_id, created_at desc);
create index if not exists idx_public_image_publish_jobs_status
  on public.public_image_publish_jobs (status, created_at);

drop trigger if exists trg_public_image_publish_jobs_updated_at on public.public_image_publish_jobs;
create trigger trg_public_image_publish_jobs_updated_at
  before update on public.public_image_publish_jobs
  for each row execute function set_updated_at();

alter table public.public_image_publish_jobs enable row level security;
alter table public.public_image_assets enable row level security;

drop policy if exists "public_image_jobs_admin_read" on public.public_image_publish_jobs;
create policy "public_image_jobs_admin_read" on public.public_image_publish_jobs
  for select using (is_admin() and admin_user_id = auth.uid());

drop policy if exists "public_image_assets_admin_read" on public.public_image_assets;
create policy "public_image_assets_admin_read" on public.public_image_assets
  for select using (is_admin());

notify pgrst, 'reload schema';
