-- Arabic-first Phase 2: regional discovery foundations
-- user_prefs.region (player home) + hubs.region (hub audience tag)

alter table public.user_prefs
  add column if not exists region text;

alter table public.hubs
  add column if not exists region text;

comment on column public.user_prefs.region is
  'ISO 3166-1 alpha-2 or MENA; empty/null = unset. Used for discover + locale soft hints.';

comment on column public.hubs.region is
  'Hub audience region tag: ISO country, MENA, or null = global.';

-- Soft constraint via check (allow null / empty / known codes)
alter table public.user_prefs
  drop constraint if exists user_prefs_region_check;

alter table public.user_prefs
  add constraint user_prefs_region_check
  check (
    region is null
    or region = ''
    or region in (
      'MENA','SA','AE','EG','KW','QA','BH','OM','JO','LB','IQ','MA','TN','DZ'
    )
  );

alter table public.hubs
  drop constraint if exists hubs_region_check;

alter table public.hubs
  add constraint hubs_region_check
  check (
    region is null
    or region = ''
    or region in (
      'MENA','SA','AE','EG','KW','QA','BH','OM','JO','LB','IQ','MA','TN','DZ'
    )
  );

-- Tag a few seeded official hubs as MENA-oriented when present (idempotent)
update public.hubs set region = 'MENA' where slug in ('valorant', 'fortnite', 'cod') and region is null;
update public.hubs set region = 'SA' where slug in ('fifa', 'rocket') and region is null;
