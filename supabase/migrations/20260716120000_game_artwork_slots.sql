-- Game artwork slots (admin-managed official assets)
-- cover remains games.image_url; add banner / background / icon.
-- Bump hub-media size for high-res promotional art (8 MiB).

alter table public.games
  add column if not exists banner_url text,
  add column if not exists background_url text,
  add column if not exists icon_url text;

comment on column public.games.image_url is 'Official cover / card image (primary)';
comment on column public.games.banner_url is 'Wide hero / banner for Discover and featured';
comment on column public.games.background_url is 'Optional atmospheric background';
comment on column public.games.icon_url is 'Square logo / icon for lists and hub chrome';

update storage.buckets
set file_size_limit = 8388608
where id = 'hub-media';
