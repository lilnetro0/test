# Domain model — games vs hubs

**Status:** Phase 2 (production hardening)  
**Rule:** Catalog identity ≠ join/URL identity. Do not assume `hubs.slug === games.id` forever (seed often equals them; admin may diverge).

---

## Two tables, two jobs

| Concept | Table | Identity | Purpose |
|---------|--------|----------|---------|
| **Catalog game** | `public.games` | `games.id` (text, e.g. `valorant`) | Title, short code, category, tint, optional cover (`image_url`). **Not** membership. |
| **Hub (community)** | `public.hubs` | `hubs.id` (uuid) + **`hubs.slug`** (unique text) | Joinable community. FK `hubs.game_id → games.id`. Optional cover (`image_url`). |

**Cardinality (product policy):** schema allows **many hubs per game** (no `UNIQUE(game_id)`). That is intentional — regional / extra hubs are allowed. Seed and admin defaults still create one “official” hub with `slug = game_id`. Do **not** add a unique constraint unless product locks single-hub-per-game.

**Membership:** `hub_members` rows point at `hubs.id` (uuid). Users join hubs, not games.

**Channels / messages:** always under a hub (`text_channels.hub_id`, `voice_channels.hub_id`, `messages` → channel → hub).

---

## App / URL semantics

| Surface | Uses |
|---------|------|
| Discover tiles / dock cards | Flattened **HubCard** UI type historically named `Game` |
| `/?hub=` search param | **`hubs.slug`** |
| Join API | `joinHubBySlug(slug)` → resolve uuid → `hub_members` |
| Hero CSS presets (`HubHero`) | **`games.id`** (`HubCard.gameId`), not hub slug |
| Covers | Prefer `hubs.image_url`, else `games.image_url` |

### UI type `HubCard` (formerly / alias `Game`)

| Field | Meaning |
|-------|---------|
| `id` | **`hubs.slug`** — route / join / prefs key (`hub_order`, `hub_notif_modes`) |
| `gameId` | **`games.id`** — catalog / hero preset key (falls back to `id` in mock) |
| `hubUuid` | **`hubs.id`** when live |
| `name` | Catalog game display name |
| `hubName` | Hub display name (`hubs.name`) |
| `members` / `activeCount` | Hub counters (display; not live presence yet) |
| `imageUrl` | Resolved cover (hub then game) |

`export type Game = HubCard` remains as a deprecated alias. Mock-only type `Hub` in `mock-data.ts` is the **chat layout** (channels/messages), not the DB `hubs` row. Prefer `LiveHub` for live chat context.

---

## Images

1. Upload via admin → `hub-media` storage bucket.
2. Attach to a **game** and/or **hub** row (`image_url`).
3. Client catalog mapping: `hub.image_url || game.image_url`.

---

## Seed vs mock vs admin

| Source | Role |
|--------|------|
| `supabase/seed.sql` | Local/demo catalog + hubs (idempotent `ON CONFLICT`) |
| `supabase/migrations/*` | Forward-only schema (and catch-up hubs if needed) |
| `src/lib/mock-data.ts` | Offline UI when mock mode is on |
| Admin console | Creates games/hubs independently; FK requires game first |

**Discover** (live) lists **hubs** joined to games — not orphan catalog games. Seed should not advertise catalog-only games without a hub.

---

## Admin defaults

- Creating a hub: if `slug` omitted → **`game_id`** (not slugified hub name).
- Deleting a game **cascades** hubs (and channels/messages) — confirm before delete.
- Prefer explicit confirmation when `slug ≠ game_id` (supported, but breaks naive assumptions).

---

## Out of scope (later phases)

- Live `member_count` triggers
- Platform / hub permission matrices (Phases 3–4)
- Renaming all remaining `Game` aliases / `GAMES` constant in one PR (alias `HubCard` is the canonical UI type).

See also: `docs/DATABASE-OPERATIONS.md`, `docs/PRODUCTION-HARDENING-PLAN.md`.
