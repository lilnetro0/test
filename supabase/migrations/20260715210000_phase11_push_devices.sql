-- Phase 11 — Push device registry + prefs

alter table public.user_prefs
  add column if not exists push_enabled boolean not null default false;

comment on column public.user_prefs.push_enabled is
  'User opted into OS/browser push (Phase 11).';

create table if not exists public.push_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null check (platform in ('web', 'ios', 'android')),
  token text not null,
  enabled boolean not null default true,
  user_agent text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint push_devices_token_len check (char_length(token) between 8 and 4096),
  constraint push_devices_platform_token_key unique (platform, token)
);

create index if not exists push_devices_user_enabled_idx
  on public.push_devices (user_id)
  where enabled;

alter table public.push_devices enable row level security;

drop policy if exists "Users read own push devices" on public.push_devices;
create policy "Users read own push devices"
  on public.push_devices for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users insert own push devices" on public.push_devices;
create policy "Users insert own push devices"
  on public.push_devices for insert to authenticated
  with check (user_id = auth.uid() and not public.is_banned(auth.uid()));

drop policy if exists "Users update own push devices" on public.push_devices;
create policy "Users update own push devices"
  on public.push_devices for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users delete own push devices" on public.push_devices;
create policy "Users delete own push devices"
  on public.push_devices for delete to authenticated
  using (user_id = auth.uid());

comment on table public.push_devices is
  'Web PushSubscription JSON or Cap device tokens (Phase 11).';
