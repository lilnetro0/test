-- Arabic-first Phase 10: first-class voice channel target on reports
-- Complements AF8 details stamp; admins can filter/see voice_channel_id.

alter table public.reports
  add column if not exists voice_channel_id uuid
    references public.voice_channels (id) on delete set null;

comment on column public.reports.voice_channel_id is
  'Optional voice channel context for session reports (AF10).';

create index if not exists reports_voice_channel_idx
  on public.reports (voice_channel_id)
  where voice_channel_id is not null;

alter table public.reports drop constraint if exists reports_has_target;
alter table public.reports
  add constraint reports_has_target check (
    target_user_id is not null
    or message_id is not null
    or dm_message_id is not null
    or voice_channel_id is not null
  );

-- Allow voice-only reports when the reporter can see that voice channel (hub member).
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
    and (
      voice_channel_id is null
      or exists (
        select 1
        from public.voice_channels vc
        where vc.id = voice_channel_id
          and public.is_hub_member(vc.hub_id, auth.uid())
      )
    )
    and (
      target_user_id is not null
      or message_id is not null
      or dm_message_id is not null
      or voice_channel_id is not null
    )
  );
