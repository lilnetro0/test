# Nexus Control — Product Blueprint (Frozen)

**Product name:** Nexus Control  
**Document type:** Final product blueprint (single source of truth)  
**Date:** 2026-07-17  
**Status:** **FROZEN** pending implementation approval  
**Parent vision:** `[ADMIN-PANEL-VISION.md](./ADMIN-PANEL-VISION.md)` (approved)  
**As-built (legacy):** `[CURRENT-ADMIN-PANEL.md](./CURRENT-ADMIN-PANEL.md)`  
**Security principles (still valid):** `[ADMIN-SECURITY.md](./ADMIN-SECURITY.md)`

---

## 0. How to use this document


| Audience        | Use                                                       |
| --------------- | --------------------------------------------------------- |
| **Product**     | Scope phases; decide what ships when                      |
| **UX / Design** | Layout, patterns, flows — no inventing new IA             |
| **Engineering** | Routes, entities, permissions — no inventing new sections |


**This document freezes:**

1. Operator daily workflows by role
2. System entities and lifecycles
3. Global UI patterns
4. Complete URL architecture
5. Page hierarchy (shell + routes)

**This document does not include:** code, components, visual mockups, colors, or database DDL.

**Conflict rule:** If vision and blueprint disagree, **blueprint wins** for product shape. Vision remains rationale.

---



## 1. Product shell (frozen)



### Name & audience

**Nexus Control** is a **desktop-first operations console**. Players never use it. Operators use it for hours.

### Shell structure (every page)

```
┌──────────────────────────────────────────────────────────────────┐
│ TOPBAR                                                           │
│  [Env]  Nexus Control   ⌘K Search   Inbox(n)   Alerts   Operator │
├────────────┬─────────────────────────────────────────────────────┤
│ SIDEBAR    │  BREADCRUMBS                                        │
│ (grouped)  │  PAGE TITLE + PRIMARY ACTIONS                       │
│            │  ─────────────────────────────────────────────────  │
│            │  CONTENT (table / queue / dashboard / entity)        │
│            │                                                     │
└────────────┴─────────────────────────────────────────────────────┘
```

- **No consumer bottom dock.**  
- **Sidebar** = primary navigation (permission-filtered).  
- **Topbar** = environment, global search, inbox, system alerts, operator menu.  
- **URL = truth** for section, entity, filters, and saved view id.



### Default landing (by role)


| Role                           | Default route after login                        |
| ------------------------------ | ------------------------------------------------ |
| Owner / Executive / Analyst    | `/control` (Dashboard)                           |
| T&S Moderator                  | `/control/moderation`                            |
| T&S Lead                       | `/control/moderation` (or Inbox if SLA breaches) |
| Support Agent                  | `/control/support`                               |
| Community Ops / Catalog Editor | `/control/communities`                           |
| Community Manager (Growth)     | `/control/growth`                                |
| Voice Ops                      | `/control/voice`                                 |
| Platform Engineer              | `/control/system`                                |
| Security Officer               | `/control/security`                              |
| Break-glass                    | `/control` + Security banner                     |


If a role lacks permission for its default, fall back to first allowed sidebar item.

---



## 2. Operator roles — daily workflows



### 2.1 Executive / Product Lead


|                         |                                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Lands on**            | `/control` Dashboard                                                                                                                        |
| **Immediately sees**    | Attention strip (P1 incidents, queue SLA breaches); KPI strip (DAU, messages, voice concurrent, open reports); 7-day trends; regional pulse |
| **Daily tasks**         | Check health & growth; spot anomalies; open Analytics for deeper questions; review featured/campaign outcomes                               |
| **Navigation flow**     | Dashboard → Analytics / Growth / Community Health → (rarely) Moderation overview metrics                                                    |
| **Shortest paths**      | KPI click → pre-filtered Analytics view; Alert click → System Incident or Queue                                                             |
| **Almost never visits** | Channel editors, API Keys, Background Jobs, Rate Limits                                                                                     |
| **Hours spent in**      | Dashboard, Analytics (short sessions, high frequency)                                                                                       |




### 2.2 Trust & Safety Moderator


|                         |                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Lands on**            | `/control/moderation`                                                                                         |
| **Immediately sees**    | Queue depth, SLA aging, “Next unclaimed”, filter chips (region/reason/language), keyboard hint strip          |
| **Daily tasks**         | Claim reports; review message/DM/voice context; warn/mute/ban/delete; apply template notes; move to next item |
| **Navigation flow**     | Moderation → Report detail → User detail (sidebar) → back to queue; occasional Appeals                        |
| **Shortest paths**      | `J/K` next/prev; `C` claim; `R` resolve; open user via `U`                                                    |
| **Almost never visits** | Feature Flags, Games catalog forms, API Keys, Growth campaigns                                                |
| **Hours spent in**      | Moderation Queue, Report detail, User enforcement tab                                                         |




### 2.3 Trust & Safety Lead


|                         |                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| **Lands on**            | `/control/moderation` or `/control/inbox` if breaches                                             |
| **Immediately sees**    | Team queue metrics, aging buckets, reopen rate, escalations                                       |
| **Daily tasks**         | Reassign work; handle escalations; review Appeals; spot policy inconsistencies; export case packs |
| **Navigation flow**     | Inbox → Moderation → Appeals → Enforcement History → Abuse Signals                                |
| **Shortest paths**      | Inbox “SLA breached” → queue filtered; Appeal → related Enforcement                               |
| **Almost never visits** | Media upload forms, Feature Flags, Developer keys                                                 |
| **Hours spent in**      | Moderation, Appeals, Abuse & Fraud, Enforcement                                                   |




### 2.4 Player Support Agent


|                         |                                                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| **Lands on**            | `/control/support`                                                                                    |
| **Immediately sees**    | Open cases assigned to me; SLA timers; quick search                                                   |
| **Daily tasks**         | Look up user; diagnose join/voice/login issues; triage ban appeals into Appeals; leave internal notes |
| **Navigation flow**     | Support Case → User detail → Community/Voice context → resolve case                                   |
| **Shortest paths**      | ⌘K Username#tag → User; Case “Open user”                                                              |
| **Almost never visits** | Feature Flags, Rate Limits, LiveKit SFU internals, Roles matrix                                       |
| **Hours spent in**      | Support Cases, Users, Global Search                                                                   |




### 2.5 Community Operations / Catalog Editor


|                         |                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Lands on**            | `/control/communities`                                                                                       |
| **Immediately sees**    | Communities table (health, region, members); create CTA; missing-art badges                                  |
| **Daily tasks**         | Create/edit communities; apply MENA templates; manage channels; fix artwork via Media; freeze unhealthy hubs |
| **Navigation flow**     | Communities → Community detail → Channels / Members / Voice → Games (when catalog gap) → Media Library       |
| **Shortest paths**      | Community row → detail; “Apply template”; Game detail → Artwork tab                                          |
| **Almost never visits** | Appeals, API Keys, Rate Limits, Abuse graph                                                                  |
| **Hours spent in**      | Communities, Games, Channels, Media Library, Discovery                                                       |




### 2.6 Community Manager (Growth / Regional)


|                         |                                                                              |
| ----------------------- | ---------------------------------------------------------------------------- |
| **Lands on**            | `/control/growth`                                                            |
| **Immediately sees**    | Active campaigns; Discover placement calendar; regional CTR                  |
| **Daily tasks**         | Feature hubs/games; schedule announcements; measure campaign lift            |
| **Navigation flow**     | Growth → Discovery & Featured → Announcements → Community Health → Analytics |
| **Shortest paths**      | Feature slot → pick community → schedule                                     |
| **Almost never visits** | Jobs, SFU Health, Roles, Rate Limits                                         |
| **Hours spent in**      | Growth, Discovery, Announcements, Community Health                           |




### 2.7 Voice / Realtime Ops


|                         |                                                                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Lands on**            | `/control/voice`                                                                                                              |
| **Immediately sees**    | Concurrent voice users/rooms; full-room reject rate; SFU status; live incidents                                               |
| **Daily tasks**         | Investigate join failures; inspect hot rooms; adjust capacity policies; force-disconnect abuse rooms; declare voice incidents |
| **Navigation flow**     | Voice Ops → Live Sessions → Room detail → LiveKit Health → System Incident                                                    |
| **Shortest paths**      | Alert → Room detail; Live map filter by hub                                                                                   |
| **Almost never visits** | Announcements, Growth campaigns, Games artwork                                                                                |
| **Hours spent in**      | Voice Operations, Live Sessions, LiveKit Health                                                                               |




### 2.8 Platform Engineer


|                         |                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| **Lands on**            | `/control/system`                                                                          |
| **Immediately sees**    | Service health board; failed jobs; error budget; flag kill-switches                        |
| **Daily tasks**         | Triage red services; retry jobs; ramp/kill flags; rotate keys; tune rate limits            |
| **Navigation flow**     | System Health → Jobs → Feature Flags → API Keys → Rate Limits → Audit (when investigating) |
| **Shortest paths**      | Failed job → retry; Flag → kill                                                            |
| **Almost never visits** | Appeals queue grinding, Discovery calendars, Support case writing                          |
| **Hours spent in**      | System Health, Jobs, Flags, Keys, Rate Limits                                              |




### 2.9 Security Officer


|                         |                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------- |
| **Lands on**            | `/control/security`                                                                   |
| **Immediately sees**    | Security alerts; break-glass usage; stale privileged accounts; sensitive audit spikes |
| **Daily tasks**         | Review access; investigate abuse/fraud; revoke sessions/roles; export audit packs     |
| **Navigation flow**     | Security Center → Roles & Access → Audit Logs → Abuse & Fraud → Users                 |
| **Shortest paths**      | Alert → actor audit filter; User → revoke Control access                              |
| **Almost never visits** | Channel topic editing, Announcement composers                                         |
| **Hours spent in**      | Security, Audit, Roles, Abuse & Fraud                                                 |




### 2.10 Owner (Break-glass capable)


|                      |                                                            |
| -------------------- | ---------------------------------------------------------- |
| **Lands on**         | `/control`                                                 |
| **Immediately sees** | Full Dashboard + security banner if break-glass active     |
| **Daily tasks**      | Rare high-impact approvals; access grants; emergency kills |
| **Navigation flow**  | Anywhere (full nav); prefers Dashboard → Security → Flags  |
| **Almost never**     | Day-to-day queue grinding (delegates)                      |
| **Hours spent in**   | Bursty: Security, Roles, Flags, Audit                      |


---



## 3. Permission families (product-level)

Permissions gate **nav visibility** and **actions**. Exact key naming is engineering’s later job; the families are frozen:


| Family                                                        | Examples               |
| ------------------------------------------------------------- | ---------------------- |
| `control.access`                                              | Enter Control          |
| `dashboard.read`                                              | View dashboard widgets |
| `inbox.*`                                                     | Read/claim/reassign    |
| `moderation.*`                                                | Queue, act, escalate   |
| `appeals.*`                                                   | Review appeals         |
| `users.read` / `users.enforce`                                | Lookup vs ban/suspend  |
| `roles.*`                                                     | Manage Control roles   |
| `support.*`                                                   | Support cases          |
| `games.*` / `communities.*` / `channels.*`                    | Catalog write          |
| `discovery.*`                                                 | Featured placements    |
| `voice.*`                                                     | Voice ops actions      |
| `media.*`                                                     | Library                |
| `announcements.*` / `notifications.*`                         | Comms                  |
| `analytics.read` / `growth.*` / `health.read`                 | Insights               |
| `system.*` / `jobs.*` / `flags.*` / `keys.*` / `ratelimits.*` | Platform               |
| `audit.read` / `security.*`                                   | Governance             |
| `settings.*`                                                  | Control settings       |
| `export.*`                                                    | Exports                |
| `bulk.*`                                                      | Bulk actions           |


**Rule:** UI never shows an action the operator cannot execute. API enforces the same permission.

---



## 4. System entities (frozen)



### 4.1 User


| Field             | Definition                                                                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**       | A player account on Nexus                                                                                                                          |
| **Owner**         | Trust & Safety + Support (ops); user owns profile content                                                                                          |
| **Relationships** | Memberships → Communities; Reports (as reporter/target); Enforcement events; Voice sessions; Support cases; Control Role assignments (if operator) |
| **Lifecycle**     | Created → Active → (Warned / Muted / Suspended / Banned) → Deleted/Anonymized (policy)                                                             |
| **Statuses**      | `active`, `warned`, `muted`, `suspended`, `banned`, `deleted`                                                                                      |
| **Actions**       | View, warn, mute, suspend, ban, unban, force logout, add note, export case pack, grant/revoke Control role                                         |
| **Permissions**   | `users.read`, `users.enforce`, `users.notes`, `roles.assign`                                                                                       |
| **Audit**         | All enforcement and role changes; optional sensitive profile views                                                                                 |




### 4.2 Community (Hub)


| Field             | Definition                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| **Purpose**       | A game community home (chat + voice + identity)                                                  |
| **Owner**         | Community Ops; hub Owner (player) for in-hub admin                                               |
| **Relationships** | Belongs to Game; has Channels, Voice Rooms, Members (Users), Reports, Media, Featured placements |
| **Lifecycle**     | Draft/Create → Active → Featured/Frozen → Archived → Deleted                                     |
| **Statuses**      | `active`, `frozen`, `archived`, `deleted`                                                        |
| **Actions**       | Create, edit identity, transfer ownership, apply template, freeze, archive, feature, delete      |
| **Permissions**   | `communities.read`, `communities.write`, `communities.destructive`                               |
| **Audit**         | Create/update/freeze/delete/ownership transfer/template apply                                    |




### 4.3 Game


| Field             | Definition                                                 |
| ----------------- | ---------------------------------------------------------- |
| **Purpose**       | Catalog title that communities attach to                   |
| **Owner**         | Catalog Editors / Community Ops                            |
| **Relationships** | Has many Communities; Artwork assets; Discovery placements |
| **Lifecycle**     | Created → Published → Hidden → Merged/Deprecated           |
| **Statuses**      | `published`, `hidden`, `deprecated`                        |
| **Actions**       | Create, edit, upload art, publish/hide, merge, delete      |
| **Permissions**   | `games.read`, `games.write`, `games.destructive`           |
| **Audit**         | All writes and art replacements                            |




### 4.4 Channel (Text)


| Field             | Definition                                                 |
| ----------------- | ---------------------------------------------------------- |
| **Purpose**       | Text channel inside a Community                            |
| **Owner**         | Community Ops / Community Owner                            |
| **Relationships** | Belongs to Community; Messages; Reports targeting messages |
| **Lifecycle**     | Created → Active → Archived → Deleted                      |
| **Statuses**      | `active`, `archived`, `deleted`                            |
| **Actions**       | Create, edit (name/topic/slug/position), archive, delete   |
| **Permissions**   | `channels.read`, `channels.write`                          |
| **Audit**         | Create/update/archive/delete                               |




### 4.5 Voice Room


| Field             | Definition                                                                       |
| ----------------- | -------------------------------------------------------------------------------- |
| **Purpose**       | Voice channel / LiveKit room bound to a Community                                |
| **Owner**         | Community Ops (config); Voice Ops (runtime)                                      |
| **Relationships** | Belongs to Community; Live sessions; Capacity policy; Reports with voice context |
| **Lifecycle**     | Created → Idle/Active → Full → Frozen → Archived                                 |
| **Statuses**      | `idle`, `active`, `full`, `frozen`, `archived`                                   |
| **Actions**       | Create, edit capacity/name, freeze, force disconnect participants, archive       |
| **Permissions**   | `channels.write`, `voice.read`, `voice.act`                                      |
| **Audit**         | Config changes; force disconnects; freezes                                       |




### 4.6 Report


| Field             | Definition                                                           |
| ----------------- | -------------------------------------------------------------------- |
| **Purpose**       | A moderation work item from user report or automated flag            |
| **Owner**         | Trust & Safety                                                       |
| **Relationships** | Reporter User; Target User; optional Message/DM/Voice Room/Community |
| **Lifecycle**     | Open → Reviewing → Resolved / Dismissed → (Reopened)                 |
| **Statuses**      | `open`, `reviewing`, `resolved`, `dismissed`, `reopened`             |
| **Actions**       | Claim, reassign, resolve, dismiss, escalate, link enforcement        |
| **Permissions**   | `moderation.read`, `moderation.act`                                  |
| **Audit**         | Status changes, claims, linked enforcements                          |




### 4.7 Appeal


| Field             | Definition                                                               |
| ----------------- | ------------------------------------------------------------------------ |
| **Purpose**       | Request to review an Enforcement decision                                |
| **Owner**         | T&S Lead / senior reviewers                                              |
| **Relationships** | User; Enforcement Event; related Reports                                 |
| **Lifecycle**     | Submitted → In review → Upheld / Reduced / Overturned                    |
| **Statuses**      | `submitted`, `in_review`, `upheld`, `reduced`, `overturned`, `withdrawn` |
| **Actions**       | Assign, uphold, reduce, overturn, note                                   |
| **Permissions**   | `appeals.read`, `appeals.decide`                                         |
| **Audit**         | Every decision with reason code                                          |




### 4.8 Enforcement Event


| Field             | Definition                                                       |
| ----------------- | ---------------------------------------------------------------- |
| **Purpose**       | Record of a trust action (warn/mute/suspend/ban/content removal) |
| **Owner**         | Trust & Safety                                                   |
| **Relationships** | Target User; Actor Operator; optional Report/Appeal              |
| **Lifecycle**     | Created → Active → Expired/Revoked                               |
| **Statuses**      | `active`, `expired`, `revoked`                                   |
| **Actions**       | Create (via enforce flows), revoke, export                       |
| **Permissions**   | `users.enforce`, `audit.read`                                    |
| **Audit**         | Self-auditing entity; always immutable create                    |




### 4.9 Media Asset


| Field             | Definition                                                  |
| ----------------- | ----------------------------------------------------------- |
| **Purpose**       | Stored file (artwork, future uploads) with usage references |
| **Owner**         | Catalog Ops; T&S for takedown                               |
| **Relationships** | Used by Game/Community; uploaded by Operator/User           |
| **Lifecycle**     | Uploaded → Active → Replaced → Quarantined → Deleted        |
| **Statuses**      | `active`, `quarantined`, `deleted`                          |
| **Actions**       | Upload, replace, quarantine, delete, view usage             |
| **Permissions**   | `media.read`, `media.write`, `media.takedown`               |
| **Audit**         | Upload/replace/takedown/delete                              |




### 4.10 Announcement


| Field             | Definition                                                   |
| ----------------- | ------------------------------------------------------------ |
| **Purpose**       | Player-facing platform or segment message                    |
| **Owner**         | Growth / Community Manager                                   |
| **Relationships** | Targeting (region/game/community); Delivery metrics          |
| **Lifecycle**     | Draft → Scheduled → Published → Unpublished → Archived       |
| **Statuses**      | `draft`, `scheduled`, `published`, `unpublished`, `archived` |
| **Actions**       | Create, schedule, publish, unpublish, archive                |
| **Permissions**   | `announcements.`*                                            |
| **Audit**         | Publish/unpublish/schedule changes                           |




### 4.11 Feature Flag


| Field             | Definition                                         |
| ----------------- | -------------------------------------------------- |
| **Purpose**       | Progressive delivery / kill switch                 |
| **Owner**         | Product + Engineering                              |
| **Relationships** | Targeting rules; Audit of changes                  |
| **Lifecycle**     | Created → Off/On/Ramp → Archived                   |
| **Statuses**      | `off`, `on`, `percentage`, `allowlist`, `archived` |
| **Actions**       | Create, toggle, ramp, allowlist, kill, archive     |
| **Permissions**   | `flags.read`, `flags.write`                        |
| **Audit**         | Every change with before/after                     |




### 4.12 Audit Event


| Field             | Definition                                                    |
| ----------------- | ------------------------------------------------------------- |
| **Purpose**       | Immutable record of an operator (or system) action in Control |
| **Owner**         | Security / Compliance                                         |
| **Relationships** | Actor; Target entity; Action type; Metadata                   |
| **Lifecycle**     | Append-only; retained per policy                              |
| **Statuses**      | N/A (immutable)                                               |
| **Actions**       | Read, filter, export (no edit/delete in product)              |
| **Permissions**   | `audit.read`, `export.audit`                                  |
| **Audit**         | Exports of audit are themselves audited                       |




### 4.13 Role (Control Role)


| Field             | Definition                                               |
| ----------------- | -------------------------------------------------------- |
| **Purpose**       | Named bundle of Control permissions                      |
| **Owner**         | Security / Owner                                         |
| **Relationships** | Assigned to Users (operators); maps to permission matrix |
| **Lifecycle**     | Created → Active → Deprecated                            |
| **Statuses**      | `active`, `deprecated`                                   |
| **Actions**       | Create, edit permissions, assign, revoke, deprecate      |
| **Permissions**   | `roles.`*                                                |
| **Audit**         | All role and assignment changes                          |




### 4.14 Support Case


| Field             | Definition                                                              |
| ----------------- | ----------------------------------------------------------------------- |
| **Purpose**       | Non-abuse player support work item                                      |
| **Owner**         | Support                                                                 |
| **Relationships** | User; optional Community/Voice; linked Appeal                           |
| **Lifecycle**     | Open → Pending player → Resolved → Closed                               |
| **Statuses**      | `open`, `pending`, `resolved`, `closed`                                 |
| **Actions**       | Create, assign, reply/note, resolve, escalate to T&S                    |
| **Permissions**   | `support.`*                                                             |
| **Audit**         | Status/assignment changes; privacy-sensitive fields redacted in exports |




### 4.15 API Key


| Field             | Definition                                        |
| ----------------- | ------------------------------------------------- |
| **Purpose**       | Machine credential for scoped platform access     |
| **Owner**         | Engineering / Partner ops                         |
| **Relationships** | Scopes; Creator; Webhooks (optional)              |
| **Lifecycle**     | Created → Active → Rotated → Revoked              |
| **Statuses**      | `active`, `revoked`, `expired`                    |
| **Actions**       | Create, rotate, revoke, view last-used            |
| **Permissions**   | `keys.`*                                          |
| **Audit**         | Create/rotate/revoke (secret values never logged) |




### 4.16 Background Job


| Field             | Definition                                              |
| ----------------- | ------------------------------------------------------- |
| **Purpose**       | Async unit of work (export, backfill, media processing) |
| **Owner**         | Engineering                                             |
| **Relationships** | Triggered by Operator/System; outputs files/results     |
| **Lifecycle**     | Queued → Running → Succeeded / Failed → Dead-letter     |
| **Statuses**      | `queued`, `running`, `succeeded`, `failed`, `dead`      |
| **Actions**       | Retry, cancel, inspect logs, download artifact          |
| **Permissions**   | `jobs.`*                                                |
| **Audit**         | Manual retries/cancels                                  |




### 4.17 System Incident


| Field             | Definition                                                        |
| ----------------- | ----------------------------------------------------------------- |
| **Purpose**       | Declared operational incident (platform or voice)                 |
| **Owner**         | On-call / Engineering / Voice Ops                                 |
| **Relationships** | Affected services; related Jobs/Flags; Updates timeline           |
| **Lifecycle**     | Detected → Investigating → Mitigating → Resolved → Postmortem     |
| **Statuses**      | `investigating`, `mitigating`, `resolved`, `postmortem`           |
| **Actions**       | Declare, update, mitigate (flag kill), resolve, attach postmortem |
| **Permissions**   | `system.incident`                                                 |
| **Audit**         | All status updates                                                |




### 4.18 Inbox Item


| Field             | Definition                                                 |
| ----------------- | ---------------------------------------------------------- |
| **Purpose**       | Cross-domain work pointer (report, appeal, case, approval) |
| **Owner**         | Assigned team/operator                                     |
| **Relationships** | Polymorphic link to Report/Appeal/Case/etc.                |
| **Lifecycle**     | Created → Claimed → Done / Snoozed                         |
| **Statuses**      | `open`, `claimed`, `snoozed`, `done`                       |
| **Actions**       | Claim, reassign, snooze, open source                       |
| **Permissions**   | `inbox.`*                                                  |
| **Audit**         | Claim/reassign                                             |




### 4.19 Featured Placement


| Field             | Definition                            |
| ----------------- | ------------------------------------- |
| **Purpose**       | Scheduled Discover/home feature slot  |
| **Owner**         | Growth / Community Manager            |
| **Relationships** | Game or Community; Region; Schedule   |
| **Lifecycle**     | Draft → Scheduled → Live → Ended      |
| **Statuses**      | `draft`, `scheduled`, `live`, `ended` |
| **Actions**       | Create, schedule, end early           |
| **Permissions**   | `discovery.`*                         |
| **Audit**         | Schedule/publish changes              |




### 4.20 Webhook (optional sibling of API Key)


| Field           | Definition                             |
| --------------- | -------------------------------------- |
| **Purpose**     | Outbound event delivery endpoint       |
| **Owner**       | Engineering                            |
| **Lifecycle**   | Active → Failing → Disabled            |
| **Actions**     | Create, rotate secret, disable, replay |
| **Permissions** | `keys.`*                               |
| **Audit**       | Config changes; replays                |


---



## 5. Global UI patterns (frozen)

All Control pages must reuse these patterns. No one-off behaviors.

### 5.1 Global Search

- Entry: Topbar field + **⌘K / Ctrl+K**  
- Groups results: Users, Communities, Games, Reports, Voice Rooms, Cases  
- Exact match shortcuts: `Username#1234`, UUID paste  
- Recent searches (local to operator)  
- Result action: navigate to entity URL



### 5.2 Command Palette

- Same chord as search, with mode toggle: **Search** | **Commands**  
- Commands: “Go to Moderation”, “Create community”, “Kill flag X”, “Declare incident” (permission-filtered)  
- Never exposes commands the operator cannot run



### 5.3 Tables

- Server pagination/cursor; page size options  
- Sticky header; compact/comfortable density  
- Sort: one active column  
- Column visibility picker (saved with view)  
- Row click → entity page (or drawer when pattern says so)  
- Optional checkbox column only if `bulk.*` allowed



### 5.4 Filters

- Horizontal filter bar under page title  
- Chip representation of active filters  
- Serialized into URL query  
- Reset + Save view actions always present on list/queue pages



### 5.5 Bulk Actions

- Appear in sticky bulk bar when rows selected  
- Require confirmation dialog with count + reason when destructive  
- Progress UI; partial failure report  
- Creates Background Job when volume exceeds sync threshold



### 5.6 Detail Pages (Entity)

- Layout: Identity header (title, status chips, id copy) → Primary actions → Tabbed body  
- Tabs are nested routes (see URL section)  
- Right-side optional summary rail on wide screens (key facts, risk chips)



### 5.7 Side Drawers

- Used for: quick preview, claim note, lightweight edit, related list peek  
- Not used for primary entity editing of Games/Communities (those are full pages)  
- Esc closes; URL may use `?drawer=` or parallel route — engineering choice later, behavior frozen: shareable when it represents work state



### 5.8 Confirmation Dialogs

- Replace browser `confirm()`  
- Structure: title, consequence summary, **reason code** (required for destructive), optional note, Confirm/Cancel  
- Destructive confirms use delayed enable or type-name where severity is extreme (mass ban, delete community)



### 5.9 Empty States

- Explain why empty + one primary CTA if permitted  
- Distinguish “no data” vs “filters excluded everything” (offer Reset filters)



### 5.10 Error States

- Inline for field errors; page-level for load failures with Retry  
- Never show env var names, stack traces, or internal doc paths to operators  
- Permission errors: clear “you don’t have access” + request access CTA if applicable



### 5.11 Loading States

- Skeleton for tables and entity headers  
- Avoid full-page blanking after first paint  
- Queue auto-refresh must not reset scroll/focus mid-review



### 5.12 Pagination

- Cursor-based preferred for large sets  
- Show range + next/prev; jump-to-page optional only for small catalogs  
- Preserve filters in URL



### 5.13 Saved Views

- Name + visibility (private / team)  
- Stores filters, columns, sort, density  
- Addressable: `?view=:viewId`



### 5.14 Keyboard Shortcuts


| Shortcut     | Action                     |
| ------------ | -------------------------- |
| ⌘K           | Search / Command palette   |
| `g` then `d` | Go Dashboard               |
| `g` then `m` | Go Moderation              |
| `j` / `k`    | Next / previous queue item |
| `c`          | Claim                      |
| `r`          | Resolve (moderation)       |
| `u`          | Open related user          |
| `Esc`        | Close drawer/dialog        |
| `?`          | Shortcut help              |


Shortcuts are listed in Help and disabled while typing in inputs.

### 5.15 Breadcrumbs

- Always on entity and nested pages  
- Format: Section / Parent / Entity / Tab  
- Each crumb is a link



### 5.16 Notifications (operator)

- Topbar bell: Control-native alerts (job finished, assignment, SLA breach)  
- Not the player Notification Center  
- Deep-link into the relevant entity



### 5.17 Activity Timeline

- Shared pattern on User, Community, Report, Incident  
- Reverse chronological; filter by type  
- Entries link to Audit Event when applicable



### 5.18 Environment badge

- Always visible in topbar: `Production` | `Staging` | `Local`  
- Destructive styling emphasis on Production



### 5.19 Reason codes

- Required catalog for enforcement, freezes, mass actions, flag kills  
- Stored on Enforcement / Audit metadata

---



## 6. Complete URL architecture (frozen)

Base prefix: `/control`

All routes below are deep-linkable. Query params hold filters/views (`?status=open&region=MENA&view=`).

### 6.1 Command


| Route                    | Page                                          |
| ------------------------ | --------------------------------------------- |
| `/control`               | Dashboard                                     |
| `/control/inbox`         | Inbox                                         |
| `/control/inbox/:itemId` | Inbox item (redirects to source + highlights) |
| `/control/search`        | Search results (`?q=`)                        |




### 6.2 Trust & Safety


| Route                           | Page                       |
| ------------------------------- | -------------------------- |
| `/control/moderation`           | Moderation queue           |
| `/control/moderation/:reportId` | Report detail              |
| `/control/appeals`              | Appeals queue              |
| `/control/appeals/:appealId`    | Appeal detail              |
| `/control/enforcement`          | Enforcement history search |
| `/control/enforcement/:eventId` | Enforcement event detail   |
| `/control/abuse`                | Abuse & fraud signals      |
| `/control/abuse/:signalId`      | Signal / investigation     |




### 6.3 People


| Route                                | Page                      |
| ------------------------------------ | ------------------------- |
| `/control/users`                     | Users directory           |
| `/control/users/:userId`             | User overview             |
| `/control/users/:userId/memberships` | Memberships               |
| `/control/users/:userId/moderation`  | Reports & enforcement     |
| `/control/users/:userId/voice`       | Voice history             |
| `/control/users/:userId/notes`       | Internal notes            |
| `/control/roles`                     | Roles list                |
| `/control/roles/:roleId`             | Role detail + permissions |
| `/control/roles/matrix`              | Permission matrix         |
| `/control/support`                   | Support cases queue       |
| `/control/support/:caseId`           | Support case detail       |




### 6.4 Catalog & Communities


| Route                                          | Page                           |
| ---------------------------------------------- | ------------------------------ |
| `/control/games`                               | Games list                     |
| `/control/games/new`                           | Create game                    |
| `/control/games/:gameId`                       | Game overview                  |
| `/control/games/:gameId/artwork`               | Artwork                        |
| `/control/games/:gameId/communities`           | Communities for game           |
| `/control/communities`                         | Communities list               |
| `/control/communities/new`                     | Create community               |
| `/control/communities/:communityId`            | Community overview             |
| `/control/communities/:communityId/channels`   | Channels                       |
| `/control/communities/:communityId/voice`      | Voice rooms                    |
| `/control/communities/:communityId/members`    | Members & hub roles            |
| `/control/communities/:communityId/moderation` | Hub-scoped reports             |
| `/control/communities/:communityId/settings`   | Community settings             |
| `/control/channels`                            | Cross-hub channel explorer     |
| `/control/channels/templates`                  | Channel templates (MENA packs) |
| `/control/discovery`                           | Discovery & featured           |
| `/control/discovery/:placementId`              | Placement detail               |




### 6.5 Realtime


| Route                          | Page                      |
| ------------------------------ | ------------------------- |
| `/control/voice`               | Voice operations overview |
| `/control/voice/rooms`         | Room list                 |
| `/control/voice/rooms/:roomId` | Room detail               |
| `/control/voice/policies`      | Capacity / voice policies |
| `/control/live`                | Live sessions map         |
| `/control/livekit`             | LiveKit & SFU health      |




### 6.6 Content


| Route                                    | Page                           |
| ---------------------------------------- | ------------------------------ |
| `/control/media`                         | Media library                  |
| `/control/media/:assetId`                | Asset detail                   |
| `/control/announcements`                 | Announcements list             |
| `/control/announcements/new`             | Composer                       |
| `/control/announcements/:announcementId` | Announcement detail            |
| `/control/notifications`                 | Notification center (platform) |
| `/control/notifications/templates`       | Templates                      |
| `/control/notifications/delivery`        | Delivery logs                  |




### 6.7 Insights


| Route                                    | Page                         |
| ---------------------------------------- | ---------------------------- |
| `/control/analytics`                     | Analytics overview           |
| `/control/analytics/engagement`          | Engagement                   |
| `/control/analytics/voice`               | Voice analytics              |
| `/control/analytics/retention`           | Retention                    |
| `/control/growth`                        | Growth home                  |
| `/control/growth/campaigns`              | Campaigns                    |
| `/control/growth/campaigns/:campaignId`  | Campaign detail              |
| `/control/community-health`              | Community health leaderboard |
| `/control/community-health/:communityId` | Hub health detail            |




### 6.8 Platform


| Route                                   | Page                |
| --------------------------------------- | ------------------- |
| `/control/system`                       | System health       |
| `/control/system/incidents`             | Incidents list      |
| `/control/system/incidents/:incidentId` | Incident detail     |
| `/control/jobs`                         | Background jobs     |
| `/control/jobs/:jobId`                  | Job detail          |
| `/control/flags`                        | Feature flags       |
| `/control/flags/:flagId`                | Flag detail         |
| `/control/keys`                         | API keys            |
| `/control/keys/:keyId`                  | Key detail          |
| `/control/webhooks`                     | Webhooks            |
| `/control/webhooks/:webhookId`          | Webhook detail      |
| `/control/rate-limits`                  | Rate limit policies |
| `/control/rate-limits/:policyId`        | Policy detail       |




### 6.9 Governance


| Route                            | Page                 |
| -------------------------------- | -------------------- |
| `/control/audit`                 | Audit log explorer   |
| `/control/audit/:eventId`        | Audit event detail   |
| `/control/security`              | Security center      |
| `/control/security/break-glass`  | Break-glass sessions |
| `/control/settings`              | Control settings     |
| `/control/settings/moderation`   | Moderation policy    |
| `/control/settings/retention`    | Retention            |
| `/control/settings/localization` | Ops localization     |




### 6.10 Auth gate routes


| Route                  | Page                                       |
| ---------------------- | ------------------------------------------ |
| `/control/login`       | Operator login (if separate from consumer) |
| `/control/forbidden`   | No permission for resource                 |
| `/control/unavailable` | Control disabled / maintenance             |


---



## 7. Complete page hierarchy



### 7.1 Sidebar (grouped)

```
COMMAND
  Dashboard                         /control
  Inbox                             /control/inbox
  Search                            /control/search          (optional nav; also ⌘K)

TRUST & SAFETY
  Moderation                        /control/moderation
  Appeals                           /control/appeals
  Enforcement                       /control/enforcement
  Abuse & Fraud                     /control/abuse

PEOPLE
  Users                             /control/users
  Roles & Access                    /control/roles
  Support                           /control/support

CATALOG & COMMUNITIES
  Games                             /control/games
  Communities                       /control/communities
  Channels                          /control/channels
  Discovery                         /control/discovery

REALTIME
  Voice Ops                         /control/voice
  Live Sessions                     /control/live
  LiveKit Health                    /control/livekit

CONTENT
  Media Library                     /control/media
  Announcements                     /control/announcements
  Notifications                     /control/notifications

INSIGHTS
  Analytics                         /control/analytics
  Growth                            /control/growth
  Community Health                  /control/community-health

PLATFORM
  System Health                     /control/system
  Background Jobs                   /control/jobs
  Feature Flags                     /control/flags
  API Keys                          /control/keys
  Webhooks                          /control/webhooks
  Rate Limits                       /control/rate-limits

GOVERNANCE
  Audit Logs                        /control/audit
  Security                          /control/security
  Settings                          /control/settings
```

Sidebar items **hide** when the operator lacks the section’s read permission.

### 7.2 Topbar


| Element           | Behavior                                         |
| ----------------- | ------------------------------------------------ |
| Environment badge | Always visible                                   |
| Product name      | “Nexus Control” → `/control`                     |
| Search            | Opens Global Search / Command Palette            |
| Inbox badge       | Count of open assigned/unassigned-for-team items |
| Alerts            | System/security alerts                           |
| Operator menu     | Profile, language (ops), shortcut help, sign out |




### 7.3 Entity pages (canonical)


| Entity       | Canonical URL                            | Primary tabs                                             |
| ------------ | ---------------------------------------- | -------------------------------------------------------- |
| User         | `/control/users/:userId`                 | Overview, Memberships, Moderation, Voice, Notes          |
| Community    | `/control/communities/:communityId`      | Overview, Channels, Voice, Members, Moderation, Settings |
| Game         | `/control/games/:gameId`                 | Overview, Artwork, Communities                           |
| Report       | `/control/moderation/:reportId`          | Context, Actions, History                                |
| Appeal       | `/control/appeals/:appealId`             | Case, Decision                                           |
| Voice Room   | `/control/voice/rooms/:roomId`           | Live, Config, History                                    |
| Media        | `/control/media/:assetId`                | Preview, Usage                                           |
| Flag         | `/control/flags/:flagId`                 | Rules, Audit                                             |
| Job          | `/control/jobs/:jobId`                   | Status, Logs, Artifact                                   |
| Incident     | `/control/system/incidents/:incidentId`  | Timeline, Actions                                        |
| Role         | `/control/roles/:roleId`                 | Permissions, Members                                     |
| Support Case | `/control/support/:caseId`               | Thread, User, Links                                      |
| Announcement | `/control/announcements/:announcementId` | Content, Targeting, Metrics                              |
| API Key      | `/control/keys/:keyId`                   | Scopes, Activity                                         |
| Audit Event  | `/control/audit/:eventId`                | Raw event                                                |




### 7.4 Relationship pages

Cross-links must always use canonical entity URLs, e.g.:

- User → Community membership → `/control/communities/:id`  
- Community → Game → `/control/games/:id`  
- Report → User → `/control/users/:id`  
- Report → Voice room → `/control/voice/rooms/:id`



### 7.5 Settings pages

Under `/control/settings/*` — Control product configuration only (not player Settings).

### 7.6 Operational pages

Queues and live boards (not entity CRUD):

- `/control/moderation`, `/control/appeals`, `/control/inbox`  
- `/control/live`, `/control/voice`, `/control/system`  
- `/control/community-health`, `/control/discovery`

---



## 8. Core daily task → shortest path map


| Task                      | Shortest path                                     |
| ------------------------- | ------------------------------------------------- |
| Clear abuse reports       | `/control/moderation` → claim → act → next        |
| Decide a ban appeal       | `/control/appeals/:id` → decision                 |
| Find a player             | ⌘K → User                                         |
| Ban a player from report  | Report detail → Enforce → reason code             |
| Create MENA community     | `/control/communities/new` → apply template       |
| Fix game artwork          | `/control/games/:id/artwork`                      |
| Feature a hub in Discover | `/control/discovery` → new placement              |
| Kick toxic voice room     | `/control/live` or room detail → force disconnect |
| Kill a bad release        | `/control/flags/:id` → kill                       |
| Retry failed export       | `/control/jobs/:id` → retry                       |
| See who changed a hub     | `/control/audit?target=community&id=`             |
| Check if LiveKit is down  | `/control/livekit` or `/control/system`           |


---



## 9. Parity bridge (legacy → Control)


| Legacy five-tab capability | New home                                                  |
| -------------------------- | --------------------------------------------------------- |
| Hubs tab                   | `/control/communities`                                    |
| Games tab                  | `/control/games`                                          |
| Channels tab               | `/control/communities/:id/channels` + `/control/channels` |
| Users tab                  | `/control/users` + `/control/roles`                       |
| Reports tab                | `/control/moderation`                                     |
| Health chips               | `/control` + `/control/system` + `/control/livekit`       |
| Audit writes without UI    | `/control/audit`                                          |


Legacy `/admin` redirects to `/control` (retired after P1–P2 parity). Control CRUD continues to reuse `src/lib/admin/api.ts` server functions.

---



## 10. Implementation readiness checklist (still no code)

Before writing code, Product/UX/Eng confirm:

- [ ] This blueprint is the SoT  
- [ ] Role → default landing table accepted  
- [ ] Entity list accepted (additions require blueprint amendment)  
- [ ] URL prefix `/control` accepted  
- [ ] Global patterns accepted  
- [ ] Phase order from vision P0–P6 still stands  

**Amendment rule:** Any new sidebar section, entity, or URL family requires an explicit blueprint update — not a silent PR.

---



## 11. Final freeze statement

**Nexus Control** is frozen as:

1. A **separate desktop operations product** with sidebar + topbar
2. **Role-based daily workflows** with explicit landings and time sinks
3. A defined **entity model** with lifecycles, actions, permissions, and audit rules
4. A consistent **UI pattern language** for queues, tables, entities, and confirmations
5. A complete **deep-linkable** `/control/...` **URL tree**
6. A clear **page hierarchy** connecting shell, entities, relationships, settings, and ops boards

No implementation begins until this blueprint is treated as the contract.

---

*End of frozen blueprint. Next approved step: UX wireframes against these routes/patterns, then engineering P0 shell — still without inventing new IA.*