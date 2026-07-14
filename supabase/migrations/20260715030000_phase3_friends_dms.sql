-- Phase 3: RPCs that bypass RLS for friend accept (bidirectional rows)
-- and DM thread creation (insert thread + both participants).

create or replace function public.accept_friend_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.friend_requests%rowtype;
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select * into r
  from public.friend_requests
  where id = p_request_id
    and to_user_id = me
    and status = 'pending'
  for update;

  if not found then
    raise exception 'Friend request not found';
  end if;

  update public.friend_requests
  set status = 'accepted'
  where id = r.id;

  insert into public.friendships (user_id, friend_id)
  values
    (r.from_user_id, r.to_user_id),
    (r.to_user_id, r.from_user_id)
  on conflict do nothing;
end;
$$;

create or replace function public.decline_friend_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  update public.friend_requests
  set status = 'declined'
  where id = p_request_id
    and to_user_id = me
    and status = 'pending';

  if not found then
    raise exception 'Friend request not found';
  end if;
end;
$$;

create or replace function public.remove_friend(p_friend_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.friendships
  where (user_id = me and friend_id = p_friend_id)
     or (user_id = p_friend_id and friend_id = me);
end;
$$;

-- Create or return existing 1:1 DM thread between auth.uid() and p_other_user_id.
create or replace function public.get_or_create_dm_thread(p_other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  tid uuid;
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  if p_other_user_id = me then
    raise exception 'Cannot DM yourself';
  end if;
  if not exists (select 1 from public.profiles where id = p_other_user_id) then
    raise exception 'User not found';
  end if;

  select dp1.thread_id into tid
  from public.dm_participants dp1
  inner join public.dm_participants dp2 on dp1.thread_id = dp2.thread_id
  where dp1.user_id = me
    and dp2.user_id = p_other_user_id
  limit 1;

  if tid is not null then
    return tid;
  end if;

  insert into public.dm_threads default values
  returning id into tid;

  insert into public.dm_participants (thread_id, user_id)
  values
    (tid, me),
    (tid, p_other_user_id);

  return tid;
end;
$$;

grant execute on function public.accept_friend_request(uuid) to authenticated;
grant execute on function public.decline_friend_request(uuid) to authenticated;
grant execute on function public.remove_friend(uuid) to authenticated;
grant execute on function public.get_or_create_dm_thread(uuid) to authenticated;

-- Allow participants to bump updated_at when sending DMs
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'dm_threads'
      and policyname = 'Participants update threads'
  ) then
    create policy "Participants update threads"
      on public.dm_threads for update to authenticated
      using (public.is_dm_participant(id, auth.uid()));
  end if;
end $$;
