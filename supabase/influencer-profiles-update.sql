alter table public.influencer_profiles
  add column if not exists profile_image_url text,
  add column if not exists date_joined date,
  add column if not exists email_address text,
  add column if not exists instagram_username text,
  add column if not exists tiktok_username text,
  add column if not exists facebook_name text,
  add column if not exists youtube_channel_name text,
  add column if not exists featured_tiktok_video_url_1 text,
  add column if not exists featured_tiktok_video_url_2 text,
  add column if not exists featured_tiktok_video_url_3 text;
