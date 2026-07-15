-- Phase 4 follow-up: founder promotion + hub moderation → admin_audit_log
-- Idempotent amendments to role protect + RPCs from 20260715140000.

-- First member of a hub becomes hub admin (founder).
create or replace function public.hub_members_protect_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing int;
begin
  if tg_op = 'INSERT' then
    if coalesce(auth.role(), '') = 'service_role'
       or current_setting('nexus.allow_hub_role_write', true) = '1'
    then
      return new;
    end if;

    select count(*)::int into existing
    from public.hub_members m
    where m.hub_id = new.hub_id;

    if existing = 0 then
      new.role := 'admin';
    else
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

create or replace function public.hub_write_mod_audit(
  p_actor uuid,
  p_action text,
  p_target_type text,
  p_target_id text,
  p_meta jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_actor is null then
    return;
  end if;
  insert into public.admin_audit_log (actor_id, action, target_type, target_id, meta)
  values (p_actor, p_action, p_target_type, p_target_id, coalesce(p_meta, '{}'::jsonb));
exception
  when others then
    -- Never fail the primary action if audit table missing / FK fails
    null;
end;
$$;

revoke all on function public.hub_write_mod_audit(uuid, text, text, text, jsonb) from public;
grant execute on function public.hub_write_mod_audit(uuid, text, text, text, jsonb) to service_role;

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

  perform public.hub_write_mod_audit(
    actor,
    'hub_member.kick',
    'user',
    p_user_id::text,
    jsonb_build_object('hub_id', p_hub_id, 'target_role', target_role)
  );
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

  perform public.hub_write_mod_audit(
    actor,
    'hub_member.set_role',
    'user',
    p_user_id::text,
    jsonb_build_object('hub_id', p_hub_id, 'from', old_role, 'to', p_role)
  );
end;
$$;

-- Audit hub-mod pin flips (authors are blocked from pin; service_role skipped)
create or replace function public.messages_audit_mod_pin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and new.pinned is distinct from old.pinned
     and coalesce(auth.role(), '') is distinct from 'service_role'
     and public.is_hub_mod(public.channel_hub_id(old.channel_id), auth.uid())
  then
    perform public.hub_write_mod_audit(
      auth.uid(),
      case when new.pinned then 'message.pin' else 'message.unpin' end,
      'message',
      old.id::text,
      jsonb_build_object('hub_id', public.channel_hub_id(old.channel_id))
    );
  end if;
  return new;
end;
$$;

drop trigger if exists messages_audit_mod_pin on public.messages;
create trigger messages_audit_mod_pin
  after update on public.messages
  for each row
  execute function public.messages_audit_mod_pin();

-- Audit deletes of others' messages by hub mods (not self-delete)
create or replace function public.messages_audit_mod_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') is distinct from 'service_role'
     and old.author_id is distinct from auth.uid()
     and public.is_hub_mod(public.channel_hub_id(old.channel_id), auth.uid())
  then
    perform public.hub_write_mod_audit(
      auth.uid(),
      'message.delete',
      'message',
      old.id::text,
      jsonb_build_object(
        'hub_id', public.channel_hub_id(old.channel_id),
        'author_id', old.author_id
      )
    );
  end if;
  return old;
end;
$$;

drop trigger if exists messages_audit_mod_delete on public.messages;
create trigger messages_audit_mod_delete
  after delete on public.messages
  for each row
  execute function public.messages_audit_mod_delete();

comment on function public.hub_write_mod_audit(uuid, text, text, text, jsonb) is
  'Append hub moderation events to admin_audit_log (soft-fail).';
