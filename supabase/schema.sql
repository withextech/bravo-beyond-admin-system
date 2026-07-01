create extension if not exists "pgcrypto";

create type public.content_status as enum ('draft', 'published', 'archived');
create type public.admin_role as enum ('admin', 'editor');
create type public.inquiry_status as enum ('new', 'read', 'replied', 'archived');

create table public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text not null,
  role public.admin_role not null default 'editor',
  must_change_password boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_type text not null,
  storage_path text not null,
  public_url text,
  alt_text text,
  caption text,
  uploaded_by uuid references public.admin_profiles(id),
  created_at timestamptz not null default now()
);

create table public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_key text not null,
  section_key text not null,
  title text,
  subtitle text,
  body text,
  cta_label text,
  cta_url text,
  media_asset_id uuid references public.media_assets(id),
  sort_order integer not null default 0,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_key, section_key)
);

create table public.influencer_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text,
  short_bio text,
  full_bio text,
  date_joined date,
  profile_image_id uuid references public.media_assets(id),
  profile_image_url text,
  email_address text,
  instagram_username text,
  instagram_url text,
  tiktok_username text,
  tiktok_url text,
  facebook_name text,
  facebook_url text,
  youtube_channel_name text,
  youtube_url text,
  featured_tiktok_video_url_1 text,
  featured_tiktok_video_url_2 text,
  featured_tiktok_video_url_3 text,
  follower_count integer,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text,
  description text,
  media_asset_id uuid references public.media_assets(id),
  sort_order integer not null default 0,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.showcases (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  brand_name text,
  summary text,
  description text,
  cover_media_id uuid references public.media_assets(id),
  campaign_type text,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.showcase_influencers (
  showcase_id uuid not null references public.showcases(id) on delete cascade,
  influencer_id uuid not null references public.influencer_profiles(id) on delete cascade,
  primary key (showcase_id, influencer_id)
);

create table public.client_logos (
  id uuid primary key default gen_random_uuid(),
  brand_name text not null,
  logo_media_id uuid references public.media_assets(id),
  website_url text,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  company text,
  inquiry_type text,
  message text not null,
  status public.inquiry_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_profiles enable row level security;
alter table public.media_assets enable row level security;
alter table public.page_sections enable row level security;
alter table public.influencer_profiles enable row level security;
alter table public.services enable row level security;
alter table public.showcases enable row level security;
alter table public.showcase_influencers enable row level security;
alter table public.client_logos enable row level security;
alter table public.contact_inquiries enable row level security;

create policy "Published page sections are public"
  on public.page_sections for select
  using (status = 'published');

create policy "Published influencers are public"
  on public.influencer_profiles for select
  using (status = 'published');

create policy "Published services are public"
  on public.services for select
  using (status = 'published');

create policy "Published showcases are public"
  on public.showcases for select
  using (status = 'published');

create policy "Published client logos are public"
  on public.client_logos for select
  using (status = 'published');

create policy "Anyone can create contact inquiries"
  on public.contact_inquiries for insert
  with check (true);

create policy "Authenticated admins can manage admin profiles"
  on public.admin_profiles for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated admins can manage CMS content"
  on public.page_sections for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated admins can manage influencers"
  on public.influencer_profiles for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated admins can manage services"
  on public.services for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated admins can manage showcases"
  on public.showcases for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated admins can manage client logos"
  on public.client_logos for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated admins can manage media"
  on public.media_assets for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated admins can view inquiries"
  on public.contact_inquiries for select
  using (auth.role() = 'authenticated');

create policy "Authenticated admins can update inquiries"
  on public.contact_inquiries for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
