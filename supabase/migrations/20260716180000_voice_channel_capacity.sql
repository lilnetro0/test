-- Optional soft capacity for voice room cards (Game Home IA).
alter table public.voice_channels
  add column if not exists capacity int;

comment on column public.voice_channels.capacity is
  'Soft max players for UI (e.g. 5/8). Null = show count only.';

-- Sensible defaults for existing template-style rooms
update public.voice_channels
set capacity = 8
where capacity is null;
