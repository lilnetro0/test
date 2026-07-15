# Read state & presence — Nexus

**Phase:** 6 (+ follow-up)  
**Date:** 2026-07-15

## Separation of concerns

| Signal | Source | UI |
|--------|--------|-----|
| Channel unread | `channel_member_states.last_read_at` vs live `messages` | Channel list + Home dock badge |
| DM unread | `dm_participants.last_read_at` vs live `dm_messages` | DM list + Messages dock badge |
| Dock alerts | `notifications.read_at` | You menu / alerts (unchanged) |
| Presence | `profiles.status` + `last_seen_at` | Roster + `/me` Availability |
| Typing | Ephemeral Realtime broadcast | Composer `typingLabel` |
| Hub “live” count | `refresh_hub_active_count` → `hubs.active_count` | Home/discover subtitle |

## Channel / DM read cursors

Unchanged from Phase 6 base: `mark_channel_read`, `mark_dm_read`, `hub_channel_unreads`, `dm_thread_unread`.

## Dock aggregates

`user_message_unread_totals()` → `{ channel_unread, dm_unread }` (capped at 99 in UI).  
Home dock = channel total; Messages dock = DM total. Poll + `nexus:unread-refresh` events.

Inactive DM threads bump badges via hub-wide / dm-wide Realtime INSERT while the DM page is open.

## Presence & DND

- Heartbeat: online → idle (5m) → offline on hide.
- **DND** (`/me` → Availability): heartbeat skips auto updates until the user picks another availability.
- `status_text` remains custom activity (separate field).

## Typing

`useTypingIndicator` on topic `channel:{id}` / `dm:{id}` — broadcast only, ~3s TTL, no SQL table.

## Migrations

- `20260715160000_phase6_read_state_presence.sql`
- `20260715161000_phase6_followup_unread_totals.sql`
