-- Manual apply: voice room soft capacity (Game Home IA)
-- See also: supabase/migrations/20260716180000_voice_channel_capacity.sql

alter table public.voice_channels
  add column if not exists capacity int;

comment on column public.voice_channels.capacity is
  'Soft max players for UI (e.g. 5/8). Null = show count only.';

update public.voice_channels
set capacity = 8
where capacity is null;
