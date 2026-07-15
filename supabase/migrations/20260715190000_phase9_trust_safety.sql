-- Phase 9 — Trust, safety, moderation
-- Deepen reports workflow, block DM sends when blocked, keep hub tools as-is.

-- ── Reports: DM targets + review metadata ───────────────────────────────────
alter table public.reports
  add column if not exists dm_message_id uuid references public.dm_messages (id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles (id) on delete set null,
  add column if not exists resolution_note text not null default '';

alter table public.reports drop constraint if exists reports_has_target;
alter table public.reports
  add constraint reports_has_target check (
    target_user_id is not null
    or message_id is not null
    or dm_message_id is not null
  );

alter table public.reports drop constraint if exists reports_resolution_note_len;
alter table public.reports
  add constraint reports_resolution_note_len check (char_length(resolution_note) <= 500);

-- Normalize any legacy free-text reasons before tightening CHECK.
update public.reports
set reason = 'other'
where reason not in ('abuse', 'spam', 'harassment', 'illegal', 'other');

alter table public.reports drop constraint if exists reports_reason_allowed;
alter table public.reports
  add constraint reports_reason_allowed check (
    reason in ('abuse', 'spam', 'harassment', 'illegal', 'other')
  );

create index if not exists reports_dm_message_idx on public.reports (dm_message_id)
  where dm_message_id is not null;

-- ── INSERT validation (policy) ──────────────────────────────────────────────
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
      )
    )
    and (
      dm_message_id is null
      or exists (
        select 1 from public.dm_messages d
        where d.id = dm_message_id
          and d.deleted_at is null
          and public.is_dm_participant(d.thread_id, auth.uid())
      )
    )
  );

-- ── Blocks: stop DM traffic after block (existing threads) ──────────────────
drop policy if exists "Participants send dm messages" on public.dm_messages;
create policy "Participants send dm messages"
  on public.dm_messages for insert to authenticated
  with check (
    author_id = auth.uid()
    and not public.is_banned(auth.uid())
    and public.is_dm_participant(thread_id, auth.uid())
    and not exists (
      select 1
      from public.dm_participants other
      where other.thread_id = thread_id
        and other.user_id <> auth.uid()
        and public.is_blocked_either(auth.uid(), other.user_id)
    )
  );

comment on column public.reports.dm_message_id is 'Optional DM message target (Phase 9).';
comment on column public.reports.reviewed_at is 'Set when status leaves open (Phase 9).';
comment on column public.reports.resolution_note is 'Optional admin note when closing a report.';

-- Per-target day cap should count DM message reports too.
create or replace function public.reports_enforce_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  hourly int;
  daily_same int;
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  select count(*) into hourly
  from public.reports r
  where r.reporter_id = new.reporter_id
    and r.created_at > now() - interval '1 hour';

  if hourly >= 10 then
    perform public.raise_rate_limited('report_hour');
  end if;

  if new.message_id is not null then
    select count(*) into daily_same
    from public.reports r
    where r.reporter_id = new.reporter_id
      and r.message_id = new.message_id
      and r.created_at > now() - interval '1 day';
  elsif new.dm_message_id is not null then
    select count(*) into daily_same
    from public.reports r
    where r.reporter_id = new.reporter_id
      and r.dm_message_id = new.dm_message_id
      and r.created_at > now() - interval '1 day';
  elsif new.target_user_id is not null then
    select count(*) into daily_same
    from public.reports r
    where r.reporter_id = new.reporter_id
      and r.target_user_id = new.target_user_id
      and r.message_id is null
      and r.dm_message_id is null
      and r.created_at > now() - interval '1 day';
  else
    daily_same := 0;
  end if;

  if daily_same >= 3 then
    perform public.raise_rate_limited('report_target_day');
  end if;

  return new;
end;
$$;
