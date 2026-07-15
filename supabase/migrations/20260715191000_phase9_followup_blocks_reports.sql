-- Phase 9 follow-up — hide blocked hub members; harden report targets

-- Reject reporting your own messages; target_user must match message author when set.
drop policy if exists "Users create reports" on public.reports;
create policy "Users create reports"
  on public.reports for insert to authenticated
  with check (
    reporter_id = auth.uid()
    and not public.is_banned(auth.uid())
    and (target_user_id is null or target_user_id <> auth.uid())
    and (
      message_id is null
      or exists (
        select 1 from public.messages m
        where m.id = message_id
          and m.deleted_at is null
          and m.author_id <> auth.uid()
          and (target_user_id is null or target_user_id = m.author_id)
      )
    )
    and (
      dm_message_id is null
      or exists (
        select 1 from public.dm_messages d
        where d.id = dm_message_id
          and d.deleted_at is null
          and d.author_id <> auth.uid()
          and public.is_dm_participant(d.thread_id, auth.uid())
          and (target_user_id is null or target_user_id = d.author_id)
      )
    )
  );

-- Hub roster for the caller, excluding either-direction blocks (and self still included).
create or replace function public.list_hub_members_visible(p_hub_id uuid)
returns table (
  user_id uuid,
  role text,
  username text,
  tag text,
  status text,
  status_text text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null or not public.is_hub_member(p_hub_id, actor) then
    return;
  end if;

  return query
  select
    hm.user_id,
    hm.role::text,
    p.username,
    p.tag,
    p.status::text,
    p.status_text
  from public.hub_members hm
  join public.profiles p on p.id = hm.user_id
  where hm.hub_id = p_hub_id
    and (
      hm.user_id = actor
      or not public.is_blocked_either(actor, hm.user_id)
    )
  order by p.username;
end;
$$;

revoke all on function public.list_hub_members_visible(uuid) from public;
grant execute on function public.list_hub_members_visible(uuid) to authenticated, service_role;

comment on function public.list_hub_members_visible(uuid) is
  'Hub member roster for caller; excludes mutual blocks (Phase 9 follow-up).';
