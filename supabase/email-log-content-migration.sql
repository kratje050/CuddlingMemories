alter table public.email_logs
  add column if not exists body_text text;

notify pgrst, 'reload schema';
