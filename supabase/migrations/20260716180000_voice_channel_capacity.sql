-- Soft capacity for voice rooms (Game Home IA).
-- Enforced in createVoiceToken (ROOM_FULL) and shown in VoiceRoomCard UI.
-- This migration file is the single source of truth.
-- Manual paste twin: supabase/manual/10_voice_capacity.sql (must stay identical).

alter table public.voice_channels
  add column if not exists capacity int;

comment on column public.voice_channels.capacity is
  'Soft max players for UI + server token enforcement. Null = no soft cap.';

-- Sensible defaults for existing template-style rooms
update public.voice_channels
set capacity = 8
where capacity is null;
