-- Phase 5 follow-up — edit history, DM soft-delete, body constraint for soft-delete
-- Pagination is app-layer (before cursor); this migration enables durable history + DMs.

-- Allow soft-deleted rows to keep a placeholder body with no attachment.
alter table public.messages drop constraint if exists messages_body_len;
alter table public.messages
  add constraint messages_body_len check (
    char_length(body) <= 4000
    and (
      deleted_at is not null
      or char_length(body) >= 1
      or attachment_url is not null
    )
  );

-- ---------------------------------------------------------------------------
-- message_edits (channel messages only)
-- ---------------------------------------------------------------------------
create table if not exists public.message_edits (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages (id) on delete cascade,
  editor_id uuid not null references public.profiles (id) on delete cascade,
  previous_body text not null,
  created_at timestamptz not null default now()
);

create index if not exists message_edits_message_created_idx
  on public.message_edits (message_id, created_at desc);

alter table public.message_edits enable row level security;

drop policy if exists "Members read message edits" on public.message_edits;
create policy "Members read message edits"
  on public.message_edits for select to authenticated
  using (
    exists (
      select 1
      from public.messages m
      where m.id = message_id
        and m.deleted_at is null
        and public.is_hub_member(public.channel_hub_id(m.channel_id), auth.uid())
    )
  );

-- No direct client inserts; trigger only (security definer).
revoke insert, update, delete on public.message_edits from authenticated, anon;

create or replace function public.messages_record_edit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and old.deleted_at is null
     and new.deleted_at is null
     and old.body is distinct from new.body
  then
    insert into public.message_edits (message_id, editor_id, previous_body)
    values (
      old.id,
      coalesce(auth.uid(), old.author_id),
      old.body
    );
  end if;
  return new;
end;
$$;

drop trigger if exists messages_record_edit on public.messages;
create trigger messages_record_edit
  after update of body on public.messages
  for each row
  execute function public.messages_record_edit();

-- ---------------------------------------------------------------------------
-- DM soft-delete (author only)
-- ---------------------------------------------------------------------------
alter table public.dm_messages
  add column if not exists deleted_at timestamptz;

alter table public.dm_messages drop constraint if exists dm_messages_body_len;
alter table public.dm_messages
  add constraint dm_messages_body_len check (
    char_length(body) <= 4000
    and (
      deleted_at is not null
      or char_length(coalesce(body, '')) >= 1
      or attachment_url is not null
    )
  );

create index if not exists dm_messages_thread_live_created_idx
  on public.dm_messages (thread_id, created_at desc)
  where deleted_at is null;

create or replace function public.soft_delete_dm_message(p_message_id uuid)
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

  select m.id, m.author_id, m.deleted_at, m.thread_id
  into msg
  from public.dm_messages m
  where m.id = p_message_id
  for update;

  if msg.id is null then
    raise exception 'Message not found';
  end if;
  if msg.deleted_at is not null then
    return;
  end if;
  if msg.author_id is distinct from actor then
    raise exception 'Not allowed to delete this message';
  end if;
  if not public.is_dm_participant(msg.thread_id, actor) then
    raise exception 'Not a participant';
  end if;

  update public.dm_messages
  set
    deleted_at = now(),
    body = ' ',
    attachment_url = null,
    attachment_name = null,
    attachment_mime = null
  where id = p_message_id;
end;
$$;

revoke all on function public.soft_delete_dm_message(uuid) from public;
grant execute on function public.soft_delete_dm_message(uuid) to authenticated, service_role;

drop policy if exists "Participants read dm messages" on public.dm_messages;
create policy "Participants read dm messages"
  on public.dm_messages for select to authenticated
  using (
    deleted_at is null
    and public.is_dm_participant(thread_id, auth.uid())
  );

-- Immutable soft-deleted DM rows for JWT clients
create or replace function public.dm_messages_protect_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and coalesce(auth.role(), '') is distinct from 'service_role' then
    new.id := old.id;
    new.thread_id := old.thread_id;
    new.author_id := old.author_id;
    new.created_at := old.created_at;
    if old.deleted_at is not null then
      new.deleted_at := old.deleted_at;
      new.body := old.body;
      new.attachment_url := old.attachment_url;
      new.attachment_name := old.attachment_name;
      new.attachment_mime := old.attachment_mime;
      return new;
    end if;
    if new.deleted_at is not null and old.deleted_at is null then
      new.body := ' ';
      new.attachment_url := null;
      new.attachment_name := null;
      new.attachment_mime := null;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists dm_messages_protect_identity on public.dm_messages;
create trigger dm_messages_protect_identity
  before update on public.dm_messages
  for each row
  execute function public.dm_messages_protect_identity();

comment on table public.message_edits is
  'Previous bodies for channel message edits (Phase 5 follow-up).';
comment on function public.soft_delete_dm_message(uuid) is
  'Author soft-deletes a DM message.';
