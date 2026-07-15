-- Phase 10 — Account lifecycle audit trail
-- Survives Auth/profile wipe (no FK to profiles).

create table if not exists public.account_deletion_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  username text,
  email_hash text,
  requested_at timestamptz not null default now(),
  meta jsonb not null default '{}'::jsonb
);

create index if not exists account_deletion_log_requested_idx
  on public.account_deletion_log (requested_at desc);

alter table public.account_deletion_log enable row level security;

-- No client policies — service role only (self-delete writes before Auth wipe).

comment on table public.account_deletion_log is
  'Append-only self-deletion receipt (Phase 10). Survives cascade wipe.';
