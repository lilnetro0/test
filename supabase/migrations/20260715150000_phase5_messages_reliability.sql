-- Phase 5 — message soft-delete + reliability helpers
-- Soft-delete prefers deleted_at; hard DELETE reserved for service_role.
-- Keeps Phase 4 pin/mod behavior. No message_edits history table this phase.

alter table public.messages
  add column if not exists deleted_at timestamptz;

create index if not exists messages_channel_live_created_idx
  on public.messages (channel_id, created_at desc)
  where deleted_at is null;

create index if not exists messages_channel_pinned_live_idx
  on public.messages (channel_id)
  where pinned = true and deleted_at is null;

-- Soft-delete for author or hub mod. Clears pin + media; blanks body.
create or replace function public.soft_delete_message(p_message_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  msg record;
begin
  if actor is null then
    raise exception 'Not authenticated';
  end if;

  select m.id, m.channel_id, m.author_id, m.deleted_at
  into msg
  from public.messages m
  where m.id = p_message_id
  for update;

  if msg.id is null then
    raise exception 'Message not found';
  end if;
  if msg.deleted_at is not null then
    return;
  end if;

  if msg.author_id is distinct from actor
     and not public.is_hub_mod(public.channel_hub_id(msg.channel_id), actor)
  then
    raise exception 'Not allowed to delete this message';
  end if;

  update public.messages
  set
    deleted_at = now(),
    pinned = false,
    body = ' ',
    attachment_url = null,
    attachment_name = null,
    attachment_mime = null
  where id = p_message_id;

  -- Audit when mod deletes someone else's message
  if msg.author_id is distinct from actor then
    perform public.hub_write_mod_audit(
      actor,
      'message.soft_delete',
      'message',
      p_message_id::text,
      jsonb_build_object(
        'hub_id', public.channel_hub_id(msg.channel_id),
        'author_id', msg.author_id
      )
    );
  end if;
end;
$$;

revoke all on function public.soft_delete_message(uuid) from public;
grant execute on function public.soft_delete_message(uuid) to authenticated, service_role;

-- Authors/mods no longer hard-delete via RLS (use soft_delete_message).
drop policy if exists "Authors delete own messages" on public.messages;
drop policy if exists "Hub mods delete messages" on public.messages;

-- Guard: lock identity columns; block edits on soft-deleted rows; no client undelete.
create or replace function public.messages_protect_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if coalesce(auth.role(), '') is distinct from 'service_role' then
      new.id := old.id;
      new.channel_id := old.channel_id;
      new.author_id := old.author_id;
      new.created_at := old.created_at;

      if old.deleted_at is not null then
        -- Keep soft-deleted rows immutable for JWT clients
        new.deleted_at := old.deleted_at;
        new.body := old.body;
        new.pinned := old.pinned;
        new.edited_at := old.edited_at;
        new.reply_to := old.reply_to;
        new.attachment_url := old.attachment_url;
        new.attachment_name := old.attachment_name;
        new.attachment_mime := old.attachment_mime;
        return new;
      end if;

      -- Normalize soft-delete payload for any client UPDATE that sets deleted_at
      if new.deleted_at is not null and old.deleted_at is null then
        new.pinned := false;
        new.body := ' ';
        new.attachment_url := null;
        new.attachment_name := null;
        new.attachment_mime := null;
      end if;
    else
      -- service_role: still normalize soft-delete field wipe
      if new.deleted_at is not null and old.deleted_at is null then
        new.pinned := false;
        new.body := ' ';
        new.attachment_url := null;
        new.attachment_name := null;
        new.attachment_mime := null;
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists messages_protect_identity on public.messages;
create trigger messages_protect_identity
  before update on public.messages
  for each row
  execute function public.messages_protect_identity();

-- Soft-delete may clear pin; service_role (admin API) may pin.
create or replace function public.messages_protect_pinned()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
begin
  if tg_op = 'UPDATE' and old.pinned is distinct from new.pinned then
    if coalesce(auth.role(), '') = 'service_role' then
      return new;
    end if;
    if new.deleted_at is not null then
      return new;
    end if;
    if actor is null or not public.is_hub_mod(public.channel_hub_id(new.channel_id), actor) then
      raise exception 'Only hub mods can change pin state';
    end if;
  end if;
  return new;
end;
$$;

-- Live channel reads hide soft-deleted rows (Realtime then emits DELETE to peers).
drop policy if exists "Members read channel messages" on public.messages;
create policy "Members read channel messages"
  on public.messages for select to authenticated
  using (
    deleted_at is null
    and public.is_hub_member(public.channel_hub_id(channel_id), auth.uid())
  );

-- Soft-delete is audited in soft_delete_message; skip pin.unset noise on same UPDATE.
create or replace function public.messages_audit_mod_pin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and new.deleted_at is not null
     and old.deleted_at is null
  then
    return new;
  end if;
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

comment on column public.messages.deleted_at is
  'Soft-delete timestamp. Live lists filter WHERE deleted_at IS NULL.';
comment on function public.soft_delete_message(uuid) is
  'Author or hub mod soft-deletes a message; hard DELETE is service_role only.';
