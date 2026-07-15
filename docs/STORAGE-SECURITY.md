# Storage security — Nexus

**Phase:** 8 (+ follow-up)  
**Date:** 2026-07-15

## Buckets

| Bucket | Public | Max size | Allowlisted MIME | Who uploads |
|--------|--------|----------|------------------|---------------|
| `avatars` | yes | 2 MiB | jpeg, png, webp, gif | Owner (`{uid}/…`) |
| `attachments` | **no** | 10 MiB | images + `video/mp4`, `application/pdf`, `text/plain` | Owner (`{uid}/…`) |
| `hub-media` | yes | 5 MiB | jpeg, png, webp, gif | Service role (admin) |

Source of truth for app constants: `src/lib/supabase/storage-policy.ts`  
SQL: `20260715180000_phase8_storage_security.sql`, `20260715181000_phase8_followup_private_attachments.sql`

## Path rules

- Object key first folder must equal `auth.uid()` for avatar/attachment uploads.
- `..` and backslashes rejected in Storage INSERT/UPDATE policies.
- Client refuses empty user ids or path-like user ids.

## Message rows

`messages.attachment_mime` / `dm_messages.attachment_mime` CHECK: null or allowlisted type (same list as attachments bucket).

Persisted attachment URL is a private ref: `storage://attachments/{uid}/{file}` (legacy public `/object/public/attachments/…` URLs still resolve via `resolveAttachmentUrl`).

## Client defense

- Size + MIME checks before upload (`uploadAvatar` / `uploadAttachment`).
- Magic-byte content sniff (`assertMimeMatchesContent`) — declared MIME must match sniffed type.
- Composer `accept` = exact MIME list (not `image/*`).
- Blocked extensions: exe/dll/html/svg/js/… (extra layer; bucket MIME is primary).
- No fallback to `application/octet-stream`.
- Per-user soft quota: **100 MiB** total under `{uid}/` in `attachments` (`attachment_bytes_used` RPC).

## Private attachments

- Bucket `attachments` is private; SELECT requires `authenticated`.
- UI loads files via short-lived signed URLs (`resolveAttachmentUrl`, 1h TTL).
- Avatars / hub-media remain public CDN-style URLs.

## Out of scope / unresolved

- Malware / antivirus scanning pipeline (intentional deferral — magic-byte sniff ≠ AV)
