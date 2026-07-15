# Trust & safety — Nexus

**Phase:** 9 (+ follow-up)  
**Date:** 2026-07-15

## Surfaces

| Surface | Path / API |
|---------|------------|
| Community Guidelines | `/guidelines` (linked from register, settings, legal nav) |
| Report message (hub) | Message menu → reason dialog → `submitReport` (not on own msgs) |
| Report message (DM) | Same; stores `dm_message_id` |
| Report / Block user | Profile → Report + Block |
| Admin queue | `/admin` → Reports (filters + reviewing + notes) |
| Blocks | Friends → Blocked; friend/DM create + DM send gated; hub roster hides mutual blocks |

## Report reasons

Allowlisted: `abuse`, `spam`, `harassment`, `illegal`, `other` (DB CHECK + `src/lib/trust-safety.ts`).

Status flow: `open` → `reviewing` → `resolved` | `dismissed`. Clients **insert** only; status changes are service-role admin.

Review metadata: `reviewed_at`, `reviewed_by`, `resolution_note`.

INSERT rejects: banned reporters, self as target, own channel/DM messages, mismatched `target_user_id` vs message author.

## Rate limits

See `docs/RATE-LIMITS.md` — report hour + per-target day caps (incl. DM message targets).

## Hub roster

`list_hub_members_visible(hub_id)` — members of the hub for the caller; excludes `is_blocked_either` pairs (caller still sees themselves). Powers member sidebar + @mentions.

Channel message history from blocked users still appears (intentional).

## Migrations

- `20260715190000_phase9_trust_safety.sql` — DM report FK, reason CHECK, review columns, INSERT policy, DM send block gate
- `20260715191000_phase9_followup_blocks_reports.sql` — report author harden + `list_hub_members_visible`

## Hub moderation

Kick / role / pin / soft-delete remain Phase 4 (`HUB-PERMISSIONS.md`).

## Out of scope / unresolved

- Account deletion / data export → **Phase 10** ✅ (see `ACCOUNT-LIFECYCLE.md`)
- Reporter outcome emails / push → **Phase 11** ✅ infra (`PUSH.md`); dedicated reporter templates still deferred
- Auto-mod / ML / NSFW filter
- Hub-scoped report inbox for hub mods (needs SELECT/RPC + UI slice)
- AV malware scan (Phase 8 deferral)
