# Admin Panel Vision — Product Architecture

**Product:** Nexus (Game Hub Connect)  
**Document type:** Product Architecture (not implementation)  
**Date:** 2026-07-17  
**Status:** Blueprint for the future Admin Panel  
**Supersedes as product direction:** the five-tab CRUD console documented in [`CURRENT-ADMIN-PANEL.md`](./CURRENT-ADMIN-PANEL.md)  
**Does not supersede:** [`ADMIN-SECURITY.md`](./ADMIN-SECURITY.md) security *principles* (durable roles, audit, server gates) — those expand, they are not discarded  

---

## 0. Intent

Nexus will eventually operate at the scale of a serious gaming social platform: millions of players, thousands of game communities, continuous chat and voice, and dedicated trust & safety teams.

The current Admin Panel is a **bootstrap operator toolkit**. It is not the target.

This document defines the **ideal operations console** — as if designing for Discord Trust & Safety, Reddit Admin, Steamworks-scale catalog ops, or Slack Enterprise Grid administration — adapted to Nexus’s Arabic-first MENA gaming mission.

**Rules for this document**

- Start from zero. Do not inherit the five-tab CRUD layout unless it wins on merit (it does not).
- Optimize for where Nexus should be, not where it is today.
- No code. No screen mockups. No per-page visual redesign.
- This is the blueprint Product, Design, and Engineering align on before any build.

---

## 1. Product definition

### What the Admin Panel is

**Nexus Control** — a **desktop-first SaaS operations console** for running the platform.

It is a separate product surface from the consumer app (player Game Home, chat, Discover). Operators live here for hours a day. Players never see it.

### What it is not

- Not a developer CRUD dump of tables  
- Not five pills inside the consumer bottom dock  
- Not “admin = whoever has the env UUID” as the long-term org model  
- Not a place to casually edit production without audit, reason codes, and least privilege  

### North-star outcomes

| Stakeholder | Outcome |
|-------------|---------|
| Executives | See platform health and growth without asking engineering |
| Ops / Community | Ship catalog & community changes safely and quickly |
| Moderation / T&S | Clear queues, SLAs, appeals, consistent enforcement |
| Support | Resolve user issues with full context and tools |
| Security | Roles, audit, abuse, rate limits, incident response |
| Developers | Flags, keys, jobs, health — without giving everyone god mode |

---

## 2. Operator personas (design for these humans)

| Persona | Primary jobs | Console posture |
|---------|--------------|-----------------|
| **Executive / Product Lead** | KPIs, growth, risk overview | Dashboard + Analytics; read-heavy |
| **Community Operations** | Games, hubs, channels, discovery, templates | Catalog & Communities; write with review |
| **Trust & Safety Moderator** | Reports, appeals, bans, voice incidents | Moderation queues; high volume, keyboard-first |
| **Community Manager (internal)** | Featured hubs, events announcements, regional campaigns | Growth + Announcements |
| **Player Support** | Lookups, account recovery assists, ban appeals triage | Users + Support tools |
| **Voice / Realtime Ops** | LiveKit health, room capacity, incidents | Voice Operations |
| **Platform Engineer** | Jobs, flags, API keys, rate limits, deploys health | Developer + System |
| **Security Officer** | Roles, audit, abuse, fraud, break-glass | Security + Audit |

The IA must support **role-scoped home screens** (same shell, different default landing and visible nav).

---

## 3. Architectural principles

1. **Separate product shell** — Control has its own layout (sidebar + top bar + content). No consumer bottom dock.
2. **URL = truth** — Every queue filter, entity, and drill-down is deep-linkable and shareable.
3. **List → Entity → Action** — Tables and queues first; detail drawers/pages second; destructive actions third with reason + audit.
4. **Queues over forms** — Moderation and incidents are work queues with SLAs, not “look up then ban.”
5. **Least privilege** — Permission matrix drives nav visibility and API capability. God-mode is break-glass only.
6. **Audit by default** — Sensitive reads (optional) and all writes are attributable.
7. **Arabic-first operations** — Moderation, templates, and search respect Arabic/bidi and MENA context as first-class, not a plugin.
8. **Scale assumptions** — Pagination, search, filters, bulk, exports, and async jobs from day one of the *architecture* (even if early phases ship thinner).
9. **Desktop-first density** — Information-dense, scan-friendly, keyboard operable. Mobile is secondary (incident triage lite, not full catalog editing).
10. **Realtime where it pays** — Live activity, voice rooms, queue counts; not live-updating every KPI chart.

---

## 4. Ideal information architecture

### Mental model (three layers)

```
┌─────────────────────────────────────────────────────────┐
│  COMMAND LAYER     Dashboard · Search · Incidents       │
├─────────────────────────────────────────────────────────┤
│  WORK LAYER        Moderation · Users · Communities ·   │
│                    Games · Voice · Media · Growth         │
├─────────────────────────────────────────────────────────┤
│  PLATFORM LAYER    Analytics · System · Security ·      │
│                    Developer · Settings · Audit           │
└─────────────────────────────────────────────────────────┘
```

Operators enter through **Command** (what needs attention), spend most time in **Work**, and use **Platform** for governance and engineering.

### Recommended primary navigation (left sidebar)

Grouped, collapsible sections:

```
Nexus Control
│
├─ Command
│   ├─ Dashboard
│   ├─ Inbox (cross-team work items)
│   └─ Global Search
│
├─ Trust & Safety
│   ├─ Moderation Queue
│   ├─ Appeals
│   ├─ Enforcement History
│   └─ Abuse & Fraud Signals
│
├─ People
│   ├─ Users
│   ├─ Roles & Access
│   └─ Support Cases (optional phase)
│
├─ Catalog & Communities
│   ├─ Games
│   ├─ Communities (Hubs)
│   ├─ Channels
│   └─ Discovery & Featured
│
├─ Realtime
│   ├─ Voice Operations
│   ├─ Live Sessions
│   └─ LiveKit & SFU Health
│
├─ Content
│   ├─ Media Library
│   ├─ Announcements
│   └─ Notification Center
│
├─ Insights
│   ├─ Analytics
│   ├─ Growth
│   └─ Community Health
│
├─ Platform
│   ├─ System Health
│   ├─ Background Jobs
│   ├─ Feature Flags
│   ├─ API Keys & Webhooks
│   └─ Rate Limits
│
└─ Governance
    ├─ Audit Logs
    ├─ Security Center
    └─ Control Settings
```

**Why this beats five flat tabs**

- Separates **reactive work** (moderation) from **catalog CRUD**  
- Gives executives a home without forcing them through Hubs forms  
- Makes Voice a first-class ops domain (Nexus is chat + voice)  
- Puts Security / Audit / Flags where platform teams expect them  
- Scales by **adding children**, not more top-level pills  

---

## 5. Complete navigation tree (detailed)

### 5.1 Dashboard

| | |
|--|--|
| **Purpose** | Single pane of “is the platform healthy and what needs attention now?” |
| **Who** | All roles (scoped widgets); Executives default here |
| **Why** | Without this, ops starts in random CRUD and misses fires |
| **Main workflows** | Scan KPIs → open incident cards → jump to queues → acknowledge alerts |
| **Child pages** | `/control` (home); optional `/control/dashboard/custom` later |
| **Important metrics** | DAU/WAU, messages/min, voice concurrent, open reports, P1 incidents, error budget, new hubs/day, ban rate |
| **Important actions** | Acknowledge alert, open queue, pin announcement to operators |
| **Expected scale** | Aggregates from warehouses/metrics store; never raw table scans |
| **Future expansion** | Role-based dashboards; saved views; anomaly highlights |

### 5.2 Inbox (cross-team)

| | |
|--|--|
| **Purpose** | Unified “work assigned to me / my team” across moderation, support, ops approvals |
| **Who** | Moderators, Support, Community Ops |
| **Why** | Stops tribal knowledge of “check Reports tab and also Slack” |
| **Workflows** | Claim → work → resolve; filter by type/SLA |
| **Children** | Inbox list; item deep-link into source domain |
| **Metrics** | Open by SLA, aging, mine vs unassigned |
| **Actions** | Claim, reassign, snooze, escalate |
| **Scale** | Millions of historical items; inbox is filtered active set |
| **Future** | Auto-routing by skill/language/region |

### 5.3 Global Search

| | |
|--|--|
| **Purpose** | Jump to any user, community, game, message id, report, voice room |
| **Who** | Everyone with Control access |
| **Why** | At scale, navigation alone fails; search is the primary locator |
| **Workflows** | Typeahead → entity → open detail |
| **Children** | Search results; recent searches |
| **Actions** | Open, copy id, quick-ban (permissioned) |
| **Scale** | Search index (users, hubs, games, report ids); not `ILIKE` alone |
| **Future** | Natural language “bans last 24h in MENA” |

---

### 5.4 Moderation Queue

| | |
|--|--|
| **Purpose** | Primary T&S workbench for user reports and automated flags |
| **Who** | Trust & Safety |
| **Why** | Core to platform trust; must be queue-native |
| **Workflows** | Triage → review context (message/DM/voice) → action → template note → next |
| **Children** | Queue; Report detail; Bulk tools; Saved filters (region, reason, priority) |
| **Metrics** | Queue depth, median handle time, reopen rate, by reason/language |
| **Actions** | Resolve, dismiss, warn, mute, ban, delete content, escalate, request more info |
| **Scale** | Tens of thousands open/day at maturity; keyboard shortcuts mandatory |
| **Future** | Auto-priority, similarity clustering, ML assist (human-in-loop) |

### 5.5 Appeals

| | |
|--|--|
| **Purpose** | Structured review of enforcement decisions |
| **Who** | Senior mods, Support leads |
| **Why** | Without appeals, bans become irreversible and brand-damaging |
| **Workflows** | User appeal → evidence pack → uphold/reduce/overturn |
| **Children** | Appeals queue; Appeal detail |
| **Metrics** | Overturn rate, time-to-decision |
| **Actions** | Uphold, reduce duration, overturn, note |
| **Scale** | High volume relative to bans |
| **Future** | Multi-stage review; conflict-of-interest checks |

### 5.6 Enforcement History

| | |
|--|--|
| **Purpose** | Chronological record of warnings, mutes, bans, content removals |
| **Who** | T&S, Support, Security |
| **Why** | Consistency and legal/compliance readiness |
| **Workflows** | Search user → see timeline → correlate with reports |
| **Children** | Global enforcement search; per-user timeline (also on User detail) |
| **Actions** | Export case pack |
| **Scale** | Append-only, indexed by user/time/action |
| **Future** | Policy version tagging |

### 5.7 Abuse & Fraud Signals

| | |
|--|--|
| **Purpose** | Proactive signals: spam rings, multi-account, scrape, voice abuse patterns |
| **Who** | Security + senior T&S |
| **Why** | Reactive reports alone lose to coordinated abuse |
| **Workflows** | Signal → investigate graph → enforce |
| **Children** | Signal feed; Investigation board |
| **Metrics** | True/false positive, prevented spam volume |
| **Actions** | Open investigation, mass-action (permissioned) |
| **Scale** | Stream processing; not manual SQL |
| **Future** | Device/IP risk scores (privacy-aware) |

---

### 5.8 Users

| | |
|--|--|
| **Purpose** | People directory and account operations |
| **Who** | Support, T&S, Ops |
| **Why** | Users are the atomic entity of the platform |
| **Workflows** | Search → profile → communities → messages sample → enforce / assist |
| **Children** | User list; User detail (overview, memberships, voice, reports, enforcement, notes) |
| **Metrics** | New users, banned %, verified (future), region mix |
| **Actions** | Ban/suspend/warn, reset sensitive flags, force logout, grant roles (permissioned), export |
| **Scale** | Millions of rows; search + cursor pagination only |
| **Future** | Identity verification, parental controls, device sessions |

### 5.9 Roles & Access

| | |
|--|--|
| **Purpose** | Platform RBAC for Control itself |
| **Who** | Security, Platform owners |
| **Why** | Single `platform_admin` cannot staff a real org |
| **Workflows** | Define roles → assign users → review permission matrix |
| **Children** | Roles list; Role detail; Permission matrix; Break-glass sessions |
| **Metrics** | Admins count, stale access, break-glass usage |
| **Actions** | Create role, assign, revoke, time-box access |
| **Scale** | Hundreds of operators |
| **Future** | SSO/SCIM; approval workflows for privilege grants |

**Suggested role families (product, not final schema):** Owner, Security Admin, T&S Lead, Moderator, Support Agent, Community Ops, Catalog Editor, Voice Ops, Analyst (read), Developer Ops, Break-glass.

### 5.10 Support Cases (optional but recommended)

| | |
|--|--|
| **Purpose** | Ticket-like workspace for player issues that are not pure reports |
| **Who** | Support |
| **Why** | Separates “abuse report” from “I can’t join voice” |
| **Workflows** | Case → user context → resolve |
| **Children** | Cases queue; Case detail |
| **Future** | Email/in-app intake |

---

### 5.11 Games

| | |
|--|--|
| **Purpose** | Authoritative game catalog (identity, artwork, category, discovery) |
| **Who** | Community Ops, Catalog Editors |
| **Why** | Games are the spine of Game Home / Discover |
| **Workflows** | Create/edit game → artwork → publish → feature |
| **Children** | Games list; Game detail; Artwork manager; Bulk import |
| **Metrics** | Catalog coverage, missing art, hubs per game |
| **Actions** | Publish/hide, feature, merge duplicates, upload art |
| **Scale** | Thousands of titles over time; still searchable |
| **Future** | Publisher partnerships, store metadata sync |

### 5.12 Communities (Hubs)

| | |
|--|--|
| **Purpose** | Operate game communities as living products |
| **Who** | Community Ops, T&S (for enforcement on hub) |
| **Why** | Hubs are where retention happens |
| **Workflows** | Create hub → seed template → assign owners → monitor health → intervene |
| **Children** | Communities list; Community detail (members, channels, voice, reports, settings, invites) |
| **Metrics** | Active members, retention, report rate, voice occupancy, LFG health |
| **Actions** | Transfer ownership, freeze hub, feature, delete/archive, apply templates |
| **Scale** | Thousands of hubs; health scoring required |
| **Future** | Official vs community hubs; partner program |

### 5.13 Channels

| | |
|--|--|
| **Purpose** | Cross-hub and per-hub channel governance |
| **Who** | Community Ops |
| **Why** | Channel sprawl becomes unmanageable without structure |
| **Workflows** | Inspect hub channels → reorder → capacity → archive |
| **Children** | Channel explorer (hub-scoped); Templates library |
| **Actions** | CRUD, reorder, set topic, set voice capacity, archive |
| **Scale** | Many channels per hub × thousands of hubs |
| **Future** | Channel types marketplace; permission presets |

### 5.14 Discovery & Featured

| | |
|--|--|
| **Purpose** | Control what players see in Discover / home recommendations |
| **Who** | Growth + Community Ops |
| **Why** | Catalog CRUD ≠ discovery ranking |
| **Workflows** | Feature games/hubs → regional campaigns → schedule |
| **Children** | Featured slots; Regional placements; Experiments |
| **Metrics** | CTR, join conversion, regional lift |
| **Actions** | Schedule feature, A/B placement |
| **Scale** | Campaign calendar, not one checkbox |
| **Future** | Personalization controls / fairness constraints |

---

### 5.15 Voice Operations

| | |
|--|--|
| **Purpose** | Operate voice as a production system, not DB rows |
| **Who** | Voice Ops, On-call |
| **Why** | Nexus differentiates on voice; outages and abuse are high severity |
| **Workflows** | Monitor capacity → inspect room → kick/mute (platform) → incident |
| **Children** | Voice overview; Room list; Room detail; Capacity policies |
| **Metrics** | Concurrent users, rooms, join failures, full-room rejects, region latency |
| **Actions** | Force disconnect, adjust soft caps, freeze channel type |
| **Scale** | Thousands of concurrent rooms |
| **Future** | Auto-scale policies; quality scores |

### 5.16 Live Sessions

| | |
|--|--|
| **Purpose** | Realtime map of who is where (hubs/voice) for ops and incidents |
| **Who** | Voice Ops, T&S during raids |
| **Why** | Static DB lists lie during incidents |
| **Workflows** | Filter live → drill room → act |
| **Children** | Live map; Session detail |
| **Metrics** | Concurrent by region/game |
| **Actions** | Jump to moderation, voice actions |
| **Scale** | Streaming occupancy feeds |
| **Future** | Heatmaps; anomaly “raid” detection |

### 5.17 LiveKit & SFU Health

| | |
|--|--|
| **Purpose** | Infrastructure health for realtime media |
| **Who** | Engineering, Voice Ops |
| **Why** | A green “configured” chip is not enough |
| **Workflows** | Check node health → degrade mode → incident |
| **Children** | SFU status; Regions; Probe history |
| **Metrics** | Reachability, error rates, auth failures, room service latency |
| **Actions** | Trigger probes, declare incident |
| **Scale** | Multi-region SFU |
| **Future** | TURN/ICE synthetics; canaries |

---

### 5.18 Media Library

| | |
|--|--|
| **Purpose** | Govern uploaded assets (hub/game art, future media) |
| **Who** | Catalog Ops, T&S (takedowns) |
| **Why** | Uploads without a library become orphaned URLs |
| **Workflows** | Browse → replace → takedown → usage references |
| **Children** | Library grid; Asset detail; Usage |
| **Actions** | Upload, replace, delete, scan |
| **Scale** | Large object store with CDN |
| **Future** | Virus/malware scan; rights metadata |

### 5.19 Announcements

| | |
|--|--|
| **Purpose** | Platform-wide or segment announcements to players |
| **Who** | Growth, Community, Product |
| **Why** | Ops need controlled communication, not Discord #announcements hacks |
| **Workflows** | Draft → target (region/game) → schedule → publish → measure |
| **Children** | Announcements list; Composer; Analytics |
| **Actions** | Publish, unpublish, schedule |
| **Scale** | Campaign volume moderate; targeting critical |
| **Future** | In-app + push + email |

### 5.20 Notification Center (operator + platform)

| | |
|--|--|
| **Purpose** | Configure platform notification policies; view delivery health |
| **Who** | Product Ops, Engineering |
| **Why** | Push/email failures are silent retention killers |
| **Workflows** | Inspect templates → delivery metrics → incident |
| **Children** | Templates; Delivery logs; Preferences defaults |
| **Metrics** | Delivery rate, opt-out, latency |
| **Actions** | Disable noisy templates, replay |
| **Future** | Multi-channel orchestration |

---

### 5.21 Analytics

| | |
|--|--|
| **Purpose** | Trusted platform metrics for decisions |
| **Who** | Executives, Product, Analysts |
| **Why** | CRUD does not answer “are we winning?” |
| **Workflows** | Choose time range → inspect KPI → drill to segment |
| **Children** | Overview; Engagement; Voice; Retention; Funnels |
| **Metrics** | DAU, messages, voice minutes, retention D1/D7/D30, join→message, region mix |
| **Actions** | Export, save view, share link |
| **Scale** | Pre-aggregated pipelines; Control never queries production OLTP for charts |
| **Future** | Self-serve exploration with guardrails |

### 5.22 Growth

| | |
|--|--|
| **Purpose** | Acquisition, activation, regional campaigns |
| **Who** | Growth, Marketing partners (limited) |
| **Why** | Separate from core analytics for campaign ops |
| **Workflows** | Campaign → placement → measure |
| **Children** | Campaigns; Referral (future); Regional playbooks |
| **Metrics** | Activation, Discover CTR, hub joins |
| **Future** | Influencer codes; partner dashboards |

### 5.23 Community Health

| | |
|--|--|
| **Purpose** | Per-community quality scores (toxicity, activity, voice vitality) |
| **Who** | Community Ops, T&S leads |
| **Why** | Find dying or toxic hubs before they churn the brand |
| **Workflows** | Sort unhealthy → intervene (feature, freeze, staff) |
| **Children** | Health leaderboard; Hub health detail |
| **Metrics** | Activity, report rate, voice fill, retention |
| **Future** | Auto recommendations |

---

### 5.24 System Health

| | |
|--|--|
| **Purpose** | Whole-platform reliability view |
| **Who** | Engineering, On-call |
| **Why** | Replace “two chips” with a real ops board |
| **Workflows** | Red item → runbook → incident |
| **Children** | Services status; Dependencies (Supabase, LiveKit, storage, push); Error budget |
| **Metrics** | Uptime, latency, error rates |
| **Actions** | Declare incident, silence alert |
| **Future** | Pager integration |

### 5.25 Background Jobs

| | |
|--|--|
| **Purpose** | Observe and retry async work (exports, backfills, media processing) |
| **Who** | Engineering |
| **Why** | Scale work cannot be synchronous UI |
| **Workflows** | Find failed job → retry / poison |
| **Children** | Job list; Job detail |
| **Metrics** | Queue depth, failure rate |
| **Future** | Cron catalog; DLQ UI |

### 5.26 Feature Flags

| | |
|--|--|
| **Purpose** | Progressive delivery and kills switches |
| **Who** | Product + Engineering |
| **Why** | Safe iteration at scale |
| **Workflows** | Create flag → target → ramp → kill |
| **Children** | Flags list; Flag detail; Audit of changes |
| **Actions** | Toggle, percentage rollout, allowlist |
| **Future** | Experiments linked to Analytics |

### 5.27 API Keys & Webhooks

| | |
|--|--|
| **Purpose** | Machine access and outbound events |
| **Who** | Developers, Partners |
| **Why** | Platform extensibility without sharing service role |
| **Workflows** | Create key → scope → rotate; configure webhook |
| **Children** | Keys; Webhooks; Delivery attempts |
| **Actions** | Rotate, revoke |
| **Future** | Partner apps |

### 5.28 Rate Limits

| | |
|--|--|
| **Purpose** | Policy UI for abuse and fairness limits |
| **Who** | Security, Engineering |
| **Why** | Hardcoded limits become invisible and un-tunable |
| **Workflows** | Adjust policy → observe impact |
| **Children** | Policies; Violations |
| **Future** | Per-tenant / per-region policies |

---

### 5.29 Audit Logs

| | |
|--|--|
| **Purpose** | Immutable operator action history |
| **Who** | Security, Compliance, Leads |
| **Why** | Without a viewer, `admin_audit_log` is theater |
| **Workflows** | Filter actor/action/target → inspect → export |
| **Children** | Audit explorer; Event detail |
| **Metrics** | Volume by action; sensitive action spikes |
| **Actions** | Export case pack |
| **Scale** | High write volume; indexed; retention policy |
| **Future** | Tamper-evident storage; SIEM export |

### 5.30 Security Center

| | |
|--|--|
| **Purpose** | Security posture and incident tools |
| **Who** | Security |
| **Why** | Centralize break-glass, session risks, policy |
| **Workflows** | Review alerts → revoke access → incident |
| **Children** | Alerts; Break-glass; Session revocation; Policy docs |
| **Actions** | Force logout all, revoke role, rotate secrets (process) |
| **Future** | Threat intel feeds |

### 5.31 Control Settings

| | |
|--|--|
| **Purpose** | Configuration of the Control product itself |
| **Who** | Owners |
| **Why** | Branding of console, retention defaults, SLA targets, locale defaults for ops |
| **Workflows** | Edit policy → save with audit |
| **Children** | General; Moderation policies; Retention; Localization (ops) |
| **Future** | Multi-workspace / environments (staging vs prod switcher) |

---

## 6. Cross-cutting product features (must be designed in)

These are not “nice pages” — they are **platform capabilities** present across sections:

| Capability | Behavior |
|------------|----------|
| **Permission Matrix** | Every nav item and action maps to a permission; UI hides/disables; API enforces |
| **Reason codes** | Destructive actions require coded reasons + free-text |
| **Bulk actions** | Multi-select on tables/queues with progress and partial failure |
| **Exports** | Async CSV/JSON jobs → download from Jobs |
| **Saved views** | Filters + columns per user/team |
| **Keyboard** | Queue next/prev, claim, resolve shortcuts |
| **Entity pages** | Consistent header: identity, status chips, actions, tabs |
| **Activity timeline** | Shared component on User / Community / Report |
| **Environment badge** | Staging vs Production always visible |
| **Operator language** | Ops UI supports AR/EN independently of player lang when needed |
| **Soft delete / freeze** | Prefer freeze/archive over hard delete for hubs/games |
| **Approvals (later)** | Dual control for mass ban, catalog wipe, flag kill |

---

## 7. UX principles

### Feel

Fast, clean, professional, minimal chrome, **information-dense**, easy to scan, easy to navigate, **desktop-first**, keyboard-friendly, suitable for daily operational work.

### Interaction philosophy (not colors)

**Dashboards**  
- Above-the-fold: attention items (red/amber), then KPI strip, then trends.  
- Clicking a KPI always drills to a filtered list/queue — never a dead chart.  
- Defaults to last 24h / 7d with sticky range control.

**Tables**  
- Server-driven pagination/cursors; sticky header; density toggle (comfortable/compact).  
- Column picker; sort one primary column; multi-filter chips.  
- Row click opens detail (drawer on medium complexity, full page on high).  
- Selection checkbox for bulk only when user has bulk permission.

**Filters**  
- Always visible as a filter bar, not buried in a modal.  
- URL-serialized.  
- “Reset” and “Save view” always present on heavy pages.

**Search**  
- Global (⌘K) for entities; local search for table text.  
- Results grouped by type.  
- Exact id paste (UUID, Username#tag) jumps immediately.

**Navigation**  
- Persistent left sidebar with groups; collapse to icons.  
- Top bar: environment, global search, inbox count, operator menu.  
- Breadcrumbs on entity pages.  
- Deep links shareable in Slack/Teams.

**Drill-down**  
- List → Entity → Related (reports, memberships, voice) → Action with confirm.  
- Confirmations are **task dialogs** (reason, scope, consequences), not browser `confirm()`.  
- After action, return to next queue item when in queue context.

**Empty / error / loading**  
- Empty states teach the next action.  
- Errors are actionable and never dump env var names at operators.  
- Skeletons for tables; avoid full-page spinners after first paint.

**Realtime**  
- Badges and live rooms update without full refresh.  
- Queues can auto-refresh politely; never steal focus mid-review.

---

## 8. Visual direction (interaction only)

- **Density over decoration** — more data per viewport than the consumer app; still breathable spacing on headers.  
- **Hierarchy by typography and structure**, not by cards everywhere. Cards for KPI and incident summaries; tables for work.  
- **Status language** — consistent chips: Healthy / Degraded / Critical; Open / Reviewing / Resolved; Live / Full / Empty.  
- **Action gravity** — primary for progressive work (Resolve, Publish); danger for irreversible; secondary for navigation.  
- **Separate from consumer brand expression** — Control can share tokens but must feel like a tool, not Game Home.  
- **RTL-ready** — sidebar and tables must be correct in Arabic ops mode.

---

## 9. Target scale assumptions

Design decisions must remain valid when Nexus reaches approximately:

| Dimension | Target assumption |
|-----------|-------------------|
| Users | Millions |
| Communities | Thousands+ |
| Messages | Millions/day |
| Concurrent voice participants | Tens of thousands |
| Concurrent voice rooms | Thousands |
| Moderators | Dozens to hundreds across shifts |
| Community managers / ops | Multiple teams, regions |
| Support | Dedicated queue |
| Developers | Multiple squads with scoped flags/keys |
| Executives | Weekly/daily dashboard consumers |

**Implication:** OLTP admin queries are paginated/indexed; analytics are pre-aggregated; media is CDN-backed; voice ops use LiveKit/admin APIs and occupancy services — not “list all rooms in the browser.”

---

## 10. Relationship to current implementation

| Current concept | Fate in vision |
|-----------------|----------------|
| Single `/admin` five tabs | **Delete** as IA |
| Consumer `AppShell` wrapping admin | **Delete** |
| Hubs / Games / Channels CRUD | **Keep capability**; relocate under Catalog & Communities with entity pages |
| Users ban + lookup | **Keep**; expand into Users directory + enforcement |
| Platform admin grant/revoke | **Keep**; expand into Roles & Access matrix |
| Reports tab + Arabic assist | **Keep and elevate** into Moderation Queue + Appeals |
| Health chips | **Keep idea**; expand into System Health + LiveKit Health |
| `admin_audit_log` writes | **Keep**; **must** gain Audit Logs UI |
| `ADMIN_USER_IDS` bootstrap | **Keep as break-glass**; not the org model |
| Service-role mutations after gate | **Keep pattern short-term**; evolve toward narrower privileged paths |
| `adminSetHubRole` unused API | **Absorb** into Community detail → Members & roles |
| Monolithic `admin.tsx` | **Delete** as structure |

---

## 11. End assessment

### 1) Overall architecture score

| | Score (1–10) | Note |
|--|--------------|------|
| **Current Admin Panel** | **3 / 10** | Useful bootstrap CRUD; fails as a platform control center |
| **Proposed Nexus Control** | **9 / 10** (as architecture) | Matches how serious platforms operate; score assumes phased delivery |

### 2) Biggest architectural mistakes in the current Admin Panel

1. Treating admin as **tabs on a consumer page** instead of a product.  
2. Optimizing for **forms** instead of **queues, entities, and KPIs**.  
3. **Single god-role** as the long-term access model.  
4. **No deep links / no IA depth** — cannot run a team on shareable work.  
5. **Write-only audit** and **chip-only health** — ops theater.  
6. **Voice as channel rows** — ignoring realtime operations.  
7. **Building for today’s size** (unbounded lists, exact lookup only).

### 3) Biggest improvements in the new architecture

1. Command / Work / Platform layering with persona-aware defaults.  
2. Moderation-first queues with appeals and enforcement history.  
3. Real RBAC + permission matrix.  
4. Analytics and community health as first-class.  
5. Voice & SFU operations as a domain.  
6. Audit, flags, jobs, keys, rate limits as platform primitives.  
7. Desktop-dense, keyboard, URL-driven UX suitable for 8-hour shifts.

### 4) What should be completely deleted (as product concepts)

- Five-tab horizontal CRUD as the primary IA  
- Admin inside consumer bottom navigation  
- Browser `confirm()` as the approval model  
- Denied screens that lecture about env vars  
- “Admin = full service-role UI for everyone who can open `/admin`” as the staffing model  
- Non-URL tab state as the only navigation  

### 5) What should be kept

- Server-side authorization gate pattern  
- Durable platform roles table (expanded)  
- Append-only audit log (with UI)  
- Break-glass bootstrap IDs (constrained)  
- Games / hubs / channels / media upload **capabilities**  
- Ban + report workflows (expanded)  
- Arabic moderation assist + templates (expanded into queue tooling)  
- MENA channel templates (moved under Templates / Communities)  
- Health probing concepts (expanded)  

### 6) Recommended implementation order

Phased so Nexus never loses bootstrap ops while growing into Control:

| Phase | Ship | Why first |
|-------|------|----------|
| **P0 — Foundation** | Separate Control shell; URL routes; authz permission stubs; Audit Logs viewer (read); Global Search (users/hubs/games) | Makes everything else buildable |
| **P1 — Trust & Safety** | Moderation Queue (replace Reports tab); User detail; Enforcement timeline; basic Appeals | Highest platform risk |
| **P2 — Catalog** | Games & Communities entity pages; Channels under community; Templates; Media Library v1 | Replaces CRUD tabs without losing capability |
| **P3 — Realtime** | Voice Operations + LiveKit Health + Live Sessions | Differentiator + incident readiness |
| **P4 — Insights** | Dashboard KPIs; Analytics overview; Community Health | Executive and ops visibility |
| **P5 — Platform** | Feature Flags; Jobs; API Keys; Rate Limits UI; System Health board | Engineering leverage |
| **P6 — Governance** | Full Roles & Permission Matrix; Security Center; Announcements; Discovery & Featured; Growth | Org scale + GTM |

**Hard rule:** Do not pixel-polish the old five tabs. Extract capabilities into the new IA; retire the monolith when P1–P2 cover parity.

---

## 12. Success criteria (when we know the vision is real)

- A moderator can clear a queue for a full shift **without** opening the consumer app.  
- An executive can answer “how is Nexus doing?” from Dashboard/Analytics without engineering.  
- A community operator can feature a MENA hub and fix artwork **with audit**.  
- A voice incident can be diagnosed from Voice Ops + SFU Health in minutes.  
- Access is least-privilege; break-glass is rare and logged.  
- Every critical action is findable later in Audit Logs.  

---

## 13. Explicit non-goals (for this vision doc)

- Choosing colors, fonts, or component libraries  
- Writing API schemas or migration DDL  
- Redesigning individual screens wire-by-wire  
- Deciding React file structure  
- Renaming the consumer product  

Those follow **after** this architecture is approved.

---

*End of Product Architecture blueprint. Next step after approval: navigation + permission matrix freeze, then phase P0 shell — still no ad-hoc page redesign before IA sign-off.*
