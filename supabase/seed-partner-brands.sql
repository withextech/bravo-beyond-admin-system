with seed_brands (brand_name, sort_order) as (
  values
    ('DQ', 1),
    ('Old Spice', 2),
    ('Globe', 3),
    ('KTO', 4),
    ('Disney', 5),
    ('Food Panda', 6),
    ('Jollibee', 7),
    ('Skin1004', 8),
    ('Dr. Wong''s', 9),
    ('Coins.ph', 10),
    ('Shopee', 11),
    ('Amplify', 12),
    ('In Circle', 13),
    ('Nestle', 14),
    ('P&G', 15),
    ('Pantene', 16),
    ('Olay', 17),
    ('BDO', 18),
    ('Lazada', 19),
    ('SUI SUI', 20),
    ('Nivea', 21),
    ('CeraVe', 22)
)
insert into public.client_logos (
  brand_name,
  sort_order,
  is_featured,
  status,
  published_at,
  updated_at
)
select
  seed_brands.brand_name,
  seed_brands.sort_order,
  true,
  'published',
  now(),
  now()
from seed_brands
where not exists (
  select 1
  from public.client_logos existing
  where lower(existing.brand_name) = lower(seed_brands.brand_name)
    and existing.status <> 'archived'
);
