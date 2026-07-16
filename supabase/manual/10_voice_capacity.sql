-- Manual apply helper ONLY.
-- Source of truth: supabase/migrations/20260716180000_voice_channel_capacity.sql
--
-- Prefer applying via `supabase db push` / migration history.
-- Paste this file in the Supabase SQL editor only when migrations cannot run
-- (e.g. Lovable-linked projects without CLI access). Keep SQL identical to the
-- migration — do not diverge.

alter table public.voice_channels
  add column if not exists capacity int;

comment on column public.voice_channels.capacity is
  'Soft max players for UI + server token enforcement. Null = no soft cap.';

update public.voice_channels
set capacity = 8
where capacity is null;
