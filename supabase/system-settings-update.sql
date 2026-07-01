create table if not exists public.system_settings (
  key text primary key,
  value text not null,
  updated_by uuid references public.admin_profiles(id),
  updated_at timestamptz not null default now()
);

alter table public.system_settings enable row level security;

create policy "Authenticated admins can manage system settings"
  on public.system_settings
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

insert into public.system_settings (key, value)
values
  ('session_inactivity_minutes', '60'),
  ('inquiry_recipient_emails', '')
on conflict (key) do nothing;
