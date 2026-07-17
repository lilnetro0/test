-- Control P5 — feature flags (kill switches / progressive delivery stubs)

create table if not exists public.control_feature_flags (
  key text primary key,
  enabled boolean not null default false,
  description text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

create index if not exists control_feature_flags_updated_idx
  on public.control_feature_flags (updated_at desc);

alter table public.control_feature_flags enable row level security;

-- No anon/authenticated policies — service_role / Control admin API only.
drop policy if exists "control_feature_flags_deny_all" on public.control_feature_flags;
create policy "control_feature_flags_deny_all"
  on public.control_feature_flags
  for all
  to authenticated
  using (false)
  with check (false);

insert into public.control_feature_flags (key, enabled, description)
values
  ('voice.enabled', true, 'Allow LiveKit voice joins when configured'),
  ('lfg.enabled', true, 'Show LFG / looking-for-group surfaces'),
  ('discover.regional', true, 'MENA regional discovery ranking'),
  ('attachments.upload', true, 'Allow chat/DM attachments'),
  ('maintenance.banner', false, 'Show global maintenance banner to consumers')
on conflict (key) do nothing;
