-- =============================================================================
-- Run in Supabase SQL Editor if hub_members fails with:
--   hub_members_user_id_fkey
-- Meaning: you have auth.users rows but no matching public.profiles
-- (common after 00_reset_nexus.sql — auth logins survive, profiles were dropped).
-- =============================================================================

-- Requires schema already applied. Also adds insert policy if missing.
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

insert into public.profiles (id, username, tag, display_name, bio)
select
  u.id,
  left(
    case
      when char_length(
        coalesce(
          nullif(regexp_replace(coalesce(u.raw_user_meta_data ->> 'username', split_part(coalesce(u.email, 'player@x'), '@', 1), 'player'), '[^A-Za-z0-9_]', '', 'g'), ''),
          'player'
        )
      ) < 2 then 'player'
      else coalesce(
        nullif(regexp_replace(coalesce(u.raw_user_meta_data ->> 'username', split_part(coalesce(u.email, 'player@x'), '@', 1), 'player'), '[^A-Za-z0-9_]', '', 'g'), ''),
        'player'
      )
    end,
    32
  ),
  case
    when coalesce(nullif(trim(u.raw_user_meta_data ->> 'tag'), ''), '') ~ '^[0-9]{4}$'
      then trim(u.raw_user_meta_data ->> 'tag')
    else lpad((floor(random() * 10000))::text, 4, '0')
  end,
  coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'display_name'), ''),
    left(
      coalesce(
        nullif(regexp_replace(coalesce(u.raw_user_meta_data ->> 'username', split_part(coalesce(u.email, 'player@x'), '@', 1), 'player'), '[^A-Za-z0-9_]', '', 'g'), ''),
        'player'
      ),
      32
    )
  ),
  coalesce(u.raw_user_meta_data ->> 'bio', '')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

insert into public.user_prefs (user_id)
select p.id from public.profiles p
where not exists (select 1 from public.user_prefs up where up.user_id = p.id)
on conflict (user_id) do nothing;

-- Verify: every auth user should appear here
-- select u.id, u.email, p.username, p.tag
-- from auth.users u
-- left join public.profiles p on p.id = u.id;
