-- Only needed if you applied an OLDER copy of 20260715000000_nexus_core.sql
-- that did not include "Users update own hub membership".
-- Fresh installs: skip this file (policy is already in the core migration).
-- Requires public.hub_members to already exist.

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'hub_members'
      and policyname = 'Users update own hub membership'
  ) then
    create policy "Users update own hub membership"
      on public.hub_members for update to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end $$;
