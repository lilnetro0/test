-- Idempotent: policy may already exist in core migration.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
      and policyname = 'Users insert own profile'
  ) then
    create policy "Users insert own profile"
      on public.profiles for insert to authenticated
      with check (auth.uid() = id);
  end if;
end $$;

-- Backfill profiles for auth users that are missing a public.profiles row.
-- Safe to re-run.
insert into public.profiles (id, username, tag, display_name, bio)
select
  u.id,
  left(
    coalesce(
      nullif(regexp_replace(coalesce(u.raw_user_meta_data ->> 'username', split_part(u.email, '@', 1), 'player'), '[^A-Za-z0-9_]', '', 'g'), ''),
      'player'
    ),
    32
  ),
  coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'tag'), ''),
    lpad((floor(random() * 10000))::text, 4, '0')
  ),
  coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'display_name'), ''),
    left(
      coalesce(
        nullif(regexp_replace(coalesce(u.raw_user_meta_data ->> 'username', split_part(u.email, '@', 1), 'player'), '[^A-Za-z0-9_]', '', 'g'), ''),
        'player'
      ),
      32
    )
  ),
  coalesce(u.raw_user_meta_data ->> 'bio', '')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

-- Fix tags that fail the 4-digit check after backfill of dirty metadata
update public.profiles
set tag = lpad((floor(random() * 10000))::text, 4, '0')
where tag !~ '^[0-9]{4}$';

insert into public.user_prefs (user_id)
select p.id from public.profiles p
where not exists (select 1 from public.user_prefs up where up.user_id = p.id)
on conflict (user_id) do nothing;
