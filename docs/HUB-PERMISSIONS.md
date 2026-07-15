# Hub roles & permissions (Phase 4)

## Roles (`hub_members.role`)

| Role | Pin | Delete others | Kick | Set role |
|------|-----|---------------|------|----------|
| `member` | — | own only | — | — |
| `mod` | ✓ | ✓ | members + mods (not hub admin) | — |
| `admin` | ✓ | ✓ | ✓ (incl. other admins) | ✓ |
| Platform admin | ✓ | ✓ | ✓ | ✓ |

## Founder promotion

| Path | Behavior |
|------|----------|
| First join to an empty hub | Trigger promotes that member to **hub `admin`** |
| Platform creates hub in `/admin` | Creator is upserted as hub `admin` member |
| Later joins | Forced to `member` (unless service role / role RPC) |

## Enforcement

| Layer | Mechanism |
|-------|-----------|
| SQL helpers | `is_hub_mod`, `is_hub_admin` |
| Pin | `messages_protect_pinned` + hub-mod UPDATE policy |
| Delete others | hub-mod DELETE policy |
| Kick / set role | `hub_kick_member` / `hub_set_member_role` |
| App | `src/lib/hub/permissions.ts` + UI gates |
| Audit | Hub mod pin/delete/kick/set-role → `admin_audit_log` via `hub_write_mod_audit` |

## Intentional non-goals

- Per-channel permission overrides (Discord-style) — not planned in this phase stream
- Changing Phase 3 `platform_roles`

Migrations: `20260715140000_phase4_hub_roles.sql`, `20260715141000_phase4_founder_audit.sql`
