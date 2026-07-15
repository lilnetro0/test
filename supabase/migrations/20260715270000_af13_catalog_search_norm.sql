-- Arabic-first Phase 13: DB-normalized Arabic search for hubs / games catalog
-- Reuses public.normalize_arabic_for_search from AF4.

alter table public.hubs
  add column if not exists name_search_norm text;

alter table public.games
  add column if not exists name_search_norm text;

comment on column public.hubs.name_search_norm is
  'Arabic-folded hub name for Discover / cmdk search (AF13).';
comment on column public.games.name_search_norm is
  'Arabic-folded game name for catalog search (AF13).';

create or replace function public.tg_set_hub_name_search_norm()
returns trigger
language plpgsql
as $$
begin
  new.name_search_norm := public.normalize_arabic_for_search(new.name);
  return new;
end;
$$;

create or replace function public.tg_set_game_name_search_norm()
returns trigger
language plpgsql
as $$
begin
  new.name_search_norm := public.normalize_arabic_for_search(new.name);
  return new;
end;
$$;

drop trigger if exists hubs_name_search_norm on public.hubs;
create trigger hubs_name_search_norm
  before insert or update of name on public.hubs
  for each row
  execute function public.tg_set_hub_name_search_norm();

drop trigger if exists games_name_search_norm on public.games;
create trigger games_name_search_norm
  before insert or update of name on public.games
  for each row
  execute function public.tg_set_game_name_search_norm();

update public.hubs
set name_search_norm = public.normalize_arabic_for_search(name)
where name_search_norm is distinct from public.normalize_arabic_for_search(name);

update public.games
set name_search_norm = public.normalize_arabic_for_search(name)
where name_search_norm is distinct from public.normalize_arabic_for_search(name);

create index if not exists hubs_name_search_norm_trgm_idx
  on public.hubs using gin (name_search_norm gin_trgm_ops);

create index if not exists games_name_search_norm_trgm_idx
  on public.games using gin (name_search_norm gin_trgm_ops);
