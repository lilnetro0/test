-- Phase 4 — hub roles & moderation permissions
-- Hub mod/admin can pin/delete messages and kick; hub admin can set roles.
-- Platform god-mode (service_role / Phase 3) unchanged. No per-channel overrides.

create or replace function public.is_hub_mod(p_hub_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.hub_members m
    where m.hub_id = p_hub_id
      and m.user_id = p_user_id
      and m.role in ('mod', 'admin')
  );
$$;

create or replace function public.is_hub_admin(p_hub_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.hub_members m
    where m.hub_id = p_hub_id
      and m.user_id = p_user_id
      and m.role = 'admin'
  );
$$;

revoke all on function public.is_hub_mod(uuid, uuid) from public;
revoke all on function public.is_hub_admin(uuid, uuid) from public;
grant execute on function public.is_hub_mod(uuid, uuid) to authenticated, service_role;
grant execute on function public.is_hub_admin(uuid, uuid) to authenticated, service_role;

-- Authors may edit body; only hub mods (or service_role) may change pinned.
create or replace function public.messages_protect_pinned()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and new.pinned is distinct from old.pinned
     and coalesce(auth.role(), '') is distinct from 'service_role'
     and not public.is_hub_mod(public.channel_hub_id(old.channel_id), auth.uid())
  then
    new.pinned := old.pinned;
  end if;
  return new;
end;
$$;

drop trigger if exists messages_protect_pinned on public.messages;
create trigger messages_protect_pinned
  before update on public.messages
  for each row
  execute function public.messages_protect_pinned();

drop policy if exists "Hub mods update messages" on public.messages;
create policy "Hub mods update messages"
  on public.messages for update to authenticated
  using (public.is_hub_mod(public.channel_hub_id(channel_id), auth.uid()))
  with check (public.is_hub_mod(public.channel_hub_id(channel_id), auth.uid()));

drop policy if exists "Hub mods delete messages" on public.messages;
create policy "Hub mods delete messages"
  on public.messages for delete to authenticated
  using (public.is_hub_mod(public.channel_hub_id(channel_id), auth.uid()));

-- Role protect: service_role OR transaction-local nexus.allow_hub_role_write=1
create or replace function public.hub_members_protect_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if coalesce(auth.role(), '') is distinct from 'service_role'
       and current_setting('nexus.allow_hub_role_write', true) is distinct from '1'
    then
      new.role := 'member';
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if coalesce(auth.role(), '') is distinct from 'service_role'
       and current_setting('nexus.allow_hub_role_write', true) is distinct from '1'
    then
      new.role := old.role;
    end if;
    return new;
  end if;

  return new;
end;
$$;

create or replace function public.hub_kick_member(p_hub_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  target_role text;
begin
  if actor is null then
    raise exception 'Not authenticated';
  end if;
  if p_user_id = actor then
    raise exception 'Cannot kick yourself — leave the hub instead';
  end if;
  if not public.is_hub_mod(p_hub_id, actor) then
    raise exception 'Not a hub moderator';
  end if;

  select m.role into target_role
  from public.hub_members m
  where m.hub_id = p_hub_id and m.user_id = p_user_id;

  if target_role is null then
    raise exception 'User is not a hub member';
  end if;

  if target_role = 'admin' and not public.is_hub_admin(p_hub_id, actor) then
    raise exception 'Only hub admins can kick hub admins';
  end if;

  delete from public.hub_members
  where hub_id = p_hub_id and user_id = p_user_id;
end;
$$;

create or replace function public.hub_set_member_role(
  p_hub_id uuid,
  p_user_id uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  old_role text;
  admin_count int;
begin
  if actor is null then
    raise exception 'Not authenticated';
  end if;
  if p_role not in ('admin', 'mod', 'member') then
    raise exception 'Invalid role';
  end if;
  if not public.is_hub_admin(p_hub_id, actor) then
    raise exception 'Not a hub admin';
  end if;

  select m.role into old_role
  from public.hub_members m
  where m.hub_id = p_hub_id and m.user_id = p_user_id;

  if old_role is null then
    raise exception 'User is not a hub member';
  end if;

  if old_role = 'admin' and p_role is distinct from 'admin' then
    select count(*)::int into admin_count
    from public.hub_members
    where hub_id = p_hub_id and role = 'admin';
    if admin_count <= 1 then
      raise exception 'Cannot demote the last hub admin';
    end if;
  end if;

  perform set_config('nexus.allow_hub_role_write', '1', true);

  update public.hub_members
  set role = p_role
  where hub_id = p_hub_id and user_id = p_user_id;
end;
$$;

revoke all on function public.hub_kick_member(uuid, uuid) from public;
revoke all on function public.hub_set_member_role(uuid, uuid, text) from public;
grant execute on function public.hub_kick_member(uuid, uuid) to authenticated, service_role;
grant execute on function public.hub_set_member_role(uuid, uuid, text) to authenticated, service_role;

comment on function public.is_hub_mod(uuid, uuid) is 'True if user is hub mod or hub admin';
comment on function public.hub_kick_member(uuid, uuid) is 'Hub mod+ kick; hub admin required to kick hub admins';
comment on function public.hub_set_member_role(uuid, uuid, text) is 'Hub admin only; cannot demote last hub admin';
