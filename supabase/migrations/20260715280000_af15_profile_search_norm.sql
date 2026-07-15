-- Arabic-first Phase 15: Profile name search norms
-- username fold (case) + display_name Arabic fold for people lookup / profile routes.

alter table public.profiles
  add column if not exists username_search_norm text,
  add column if not exists display_name_search_norm text;

comment on column public.profiles.username_search_norm is
  'Folded username for lookup (AF15).';
comment on column public.profiles.display_name_search_norm is
  'Arabic-folded display_name for people search (AF15).';

create or replace function public.tg_set_profile_search_norm()
returns trigger
language plpgsql
as $$
begin
  new.username_search_norm := public.normalize_arabic_for_search(new.username);
  new.display_name_search_norm := public.normalize_arabic_for_search(coalesce(new.display_name, ''));
  return new;
end;
$$;

drop trigger if exists profiles_search_norm on public.profiles;
create trigger profiles_search_norm
  before insert or update of username, display_name on public.profiles
  for each row
  execute function public.tg_set_profile_search_norm();

update public.profiles
set
  username_search_norm = public.normalize_arabic_for_search(username),
  display_name_search_norm = public.normalize_arabic_for_search(coalesce(display_name, ''))
where username_search_norm is distinct from public.normalize_arabic_for_search(username)
   or display_name_search_norm is distinct from public.normalize_arabic_for_search(coalesce(display_name, ''));

create index if not exists profiles_username_search_norm_trgm_idx
  on public.profiles using gin (username_search_norm gin_trgm_ops);

create index if not exists profiles_display_name_search_norm_trgm_idx
  on public.profiles using gin (display_name_search_norm gin_trgm_ops);
