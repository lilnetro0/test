# Messages — soft-delete, edits & list reliability

**Phase:** 5 (+ follow-up)  
**Date:** 2026-07-15

## Model

| Column / table | Role |
|----------------|------|
| `edited_at` | Set on author edit |
| `message_edits` | Previous bodies (channel); trigger on body change; soft-delete does not record |
| `deleted_at` | Soft-delete; live lists require `IS NULL` |
| `pinned` | Cleared on channel soft-delete |

Hard `DELETE` on channel `messages` is reserved for **service_role**. Clients use `soft_delete_message` / `soft_delete_dm_message`.

## Soft-delete

**Channel** (`soft_delete_message`): author or hub mod; clears pin + attachments; placeholder body; mod deletes of others → `admin_audit_log`.

**DM** (`soft_delete_dm_message`): author only; same field wipe.

SELECT RLS hides `deleted_at is not null` rows (Realtime peers usually see DELETE).

Placeholder body is `' '` so `messages_body_len` / `dm_messages_body_len` stay valid (`deleted_at is not null` also allowed).

## List window & pagination

- Initial load: **latest N** (`order created_at desc` + `limit`, reverse for UI).
- Older pages: `before` = oldest loaded `createdAt` ISO → prepend.
- Hub UI: “Load older messages” when `hasMoreOlder`.

## Edit history API

`fetchMessageEdits(messageId)` — hub members can read prior bodies for live messages. No in-product history panel yet (edited flag remains on the message).

## Out of scope (later)

- Unread / presence (Phase 6) ✅
- Rate limits (Phase 7) ✅ — see `docs/RATE-LIMITS.md`
- Discord-style channel overrides
- Full edit-history UI chrome
