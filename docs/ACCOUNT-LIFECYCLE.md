# Account lifecycle — Nexus

**Phase:** 10 (+ follow-up)  
**Date:** 2026-07-15

## What you can do

| Action | Where | How |
|--------|--------|-----|
| Export my data | Settings → Account | JSON download via `exportMyData` |
| Delete my account | Settings → Account (danger zone) | Confirm username + `DELETE` → `deleteMyAccount` |
| Sign out all sessions | Settings / dock Log out | `signOut({ scope: "global" })` |
| Sign out other devices | Settings → Account | `signOut({ scope: "others" })` — keep current session |
| Unlink Google / Discord | Settings → Account | `unlinkIdentity` (must keep ≥1 identity) |

## Delete flow

1. Client sends JWT + username confirm + phrase `DELETE`.
2. Server `requireAuth` verifies the user.
3. Username must match `profiles.username`.
4. Insert `account_deletion_log` (survives wipe; email stored hashed).
5. Best-effort remove Storage objects under `{uid}/` in `avatars` + `attachments`.
6. `auth.admin.deleteUser(self)` — cascades wipe `profiles` and related rows.

Suspension (ban) remains separate: `profiles.banned_at` does **not** delete Auth.

Authored hub/DM messages are **hard-deleted** on cascade (intentional — not anonymized).

## Export contents

`schema_version: 1` JSON with: profile, prefs, hub memberships, latest 500 channel + 500 DM messages you authored, friendships, friend requests, blocks, reports you filed, latest 200 notifications.

Does **not** include other users’ private data or admin resolution notes.

## Migration

`20260715200000_phase10_account_lifecycle.sql` — `account_deletion_log` (no client RLS; service role write).

Follow-up (sessions + OAuth unlink) needs **no** migration.

## Env

Requires existing `SUPABASE_SERVICE_ROLE_KEY` on the server (same as admin). No new public env vars.

## Out of scope / unresolved

- Real 2FA / TOTP (Settings stub remains Soon)
- Per-device session list / selective revoke-by-id (Auth has no thin client list API)
- Soft-delete / “Deleted User” message rewrite (would need FK + UI changes)
- Push for deletion confirmation (Phase 11) — infra ready via `PUSH.md`; product template not wired
