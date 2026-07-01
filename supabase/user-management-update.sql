alter table public.admin_profiles
  add column if not exists must_change_password boolean not null default false;

alter table public.admin_profiles
  add column if not exists username text;

create unique index if not exists admin_profiles_username_unique
  on public.admin_profiles (username)
  where username is not null;

update public.admin_profiles
set role = 'admin'
where role::text = 'owner';

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'admin_profiles'
      and policyname = 'Authenticated admins can manage admin profiles'
  ) then
    create policy "Authenticated admins can manage admin profiles"
      on public.admin_profiles for all
      using (auth.role() = 'authenticated')
      with check (auth.role() = 'authenticated');
  end if;
end $$;
