-- Phase 6 follow-up — unread totals RPC for dock badges
-- Typing remains ephemeral (Realtime broadcast, no table).

create or replace function public.user_message_unread_totals()
returns table (channel_unread bigint, dm_unread bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  ch bigint := 0;
  dm bigint := 0;
begin
  if actor is null then
    channel_unread := 0;
    dm_unread := 0;
    return next;
    return;
  end if;

  select coalesce(sum(u.unread), 0)::bigint into ch
  from public.hub_members hm
  cross join lateral public.hub_channel_unreads(hm.hub_id) u
  where hm.user_id = actor;

  select coalesce(sum(public.dm_thread_unread(dp.thread_id)), 0)::bigint into dm
  from public.dm_participants dp
  where dp.user_id = actor;

  channel_unread := coalesce(ch, 0);
  dm_unread := coalesce(dm, 0);
  return next;
end;
$$;

revoke all on function public.user_message_unread_totals() from public;
grant execute on function public.user_message_unread_totals() to authenticated, service_role;

comment on function public.user_message_unread_totals() is
  'Sum of channel + DM unreads for the caller (dock badges).';
