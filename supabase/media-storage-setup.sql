insert into storage.buckets (id, name, public)
values ('media-assets', 'media-assets', true)
on conflict (id) do update set public = true;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public media assets are readable'
  ) then
    create policy "Public media assets are readable"
      on storage.objects for select
      using (bucket_id = 'media-assets');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated admins can upload media assets'
  ) then
    create policy "Authenticated admins can upload media assets"
      on storage.objects for insert
      with check (bucket_id = 'media-assets' and auth.role() = 'authenticated');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated admins can update media assets'
  ) then
    create policy "Authenticated admins can update media assets"
      on storage.objects for update
      using (bucket_id = 'media-assets' and auth.role() = 'authenticated')
      with check (bucket_id = 'media-assets' and auth.role() = 'authenticated');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated admins can delete media assets'
  ) then
    create policy "Authenticated admins can delete media assets"
      on storage.objects for delete
      using (bucket_id = 'media-assets' and auth.role() = 'authenticated');
  end if;
end $$;
