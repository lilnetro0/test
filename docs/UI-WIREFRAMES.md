# Nexus — Low-Fidelity Wireframes

**Status:** Proposal — UX validation only  
**Fidelity:** Boxes, labels, spacing marks. No colors, typography polish, or visual design.  
**Authority:** Aligns with `design.md`, `docs/NAVIGATION-SPEC.md`, `docs/UI-IMPLEMENTATION-PLAN.md`  
**Do not implement UI until wireframes + navigation are approved.**

---

## How to read these wireframes

| Mark | Meaning |
|------|---------|
| `═══` | Screen edge |
| `---` | Soft divider / section break |
| `[ Button ]` | Primary or secondary action |
| `(…)` | Secondary / progressive disclosure |
| `▼` | Opens sheet |
| `←` | Back |
| `· 8 ·` | Approximate spacing unit (8pt scale). Not final tokens. |
| `████` | Content block / media placeholder |
| Dock | Always: Home · Discover · Messages · Friends · You |

**Shared chrome (every primary tab screen):**

```
┌─ safe area top ─────────────────────────┐
│  SCREEN CONTENT                         │
│                                         │
├─ dock clearance ────────────────────────┤
│ Home │ Discover │ Messages │ Friends │ You │
└─ home indicator / safe ─────────────────┘
```

Sheets and nested screens sit **above** the dock unless noted as full-screen push (DM thread, Profile, Settings).

---

## Screen map (IA)

```
Discover ──► Game ──► Hub (preview) ──► Join ──► Home / Chat
Home ──────► Hub sheet (switch) ──► Chat (channel)
Messages ──► DM thread (chat pattern, private)
Friends ───► Profile
You ───────► Notifications | Profile | Settings
```

| Wireframe | Job | Typical route (today / proposed) |
|-----------|-----|----------------------------------|
| Home | Active hub workspace shell | `/` |
| Discover | Inspire: games → hubs → people | `/discover` |
| Game | Game landing inside Discover | `/discover?game=` or future `/game/:id` |
| Hub | Community identity / join / about | Preview from Discover; live context on Home |
| Chat | Channel transcript + composer | Home channel view |
| Messages | DM inbox → thread | `/dm`, `/dm?thread=` |
| Friends | Social list + requests | `/friends` |
| Notifications | Event inbox | `/notifications` |
| Profile | Self or other user | `/me`, `/profile/:user` |
| Settings | Account / app prefs | `/settings` |

---

# 1. Home

**Job:** One active hub. Channels + entry to chat/voice. Not a dashboard.

**Hierarchy:** Hub context → channel list / active channel cue → (chat lives in §5) → dock

**Primary actions:** Switch hub · Open channel · Join voice (if available)

```
╔══════════════════════════════════════════╗
║  status / safe                           ║  · 8 ·
║                                          ║
║  [ Hub name            ▼ ]    ( ··· )    ║  HEADER · 16 ·
║    ← tap opens Hub sheet                 ║
║  ──────────────────────────────────────  ║  · 8 ·
║                                          ║
║  TEXT CHANNELS                           ║  section label · 12 ·
║  · 8 ·                                   ║
║  # general                    (2)        ║  list row · 44+
║  # lfg                                   ║
║  # clips                                 ║
║                                          ║
║  · 16 ·                                  ║
║  VOICE                                   ║
║  · 8 ·                                   ║
║  🔊 Lobby            [ Join ]            ║  primary in-row
║     3 in voice                           ║
║                                          ║
║  · 16 ·                                  ║
║  (Members)  (Pins)  (Search)             ║  progressive — not chrome wall
║                                          ║
║           ↕ scroll if long list          ║
║                                          ║
╠══════════════════════════════════════════╣
║ Home │ Discover │ Messages │ Friends │You║
╚══════════════════════════════════════════╝
```

**Spacing:** Header 16 from top content; section gaps 16; rows ≥44 tall; dock clearance below list.

**Nav:** Dock Home active. Hub sheet overlays (§4 related). Selecting a text channel → **Chat** (§5) in same Home tab.

**Empty (no hub):** Title + one sentence + `[ Discover hubs ]` + `[ Create hub ]`.

---

# 2. Discover

**Job:** Inspire. Games first, communities second, people third. Filters not on the first paint.

**Hierarchy:** Title → light search → Games strip → Communities → People → dock

**Primary actions:** Open game · Open hub · View person · (Filters)

```
╔══════════════════════════════════════════╗
║                                          ║
║  Discover                                ║  title · 16 ·
║  Find games & communities                ║  one line support · 8 ·
║                                          ║
║  [ 🔍 Search games, hubs, people    ]    ║  field · 12 ·
║                                          ║
║  ( Filters ▼ )                           ║  opens filter sheet — not chip wall
║                                          ║
║  · 16 ·                                  ║
║  GAMES                                   ║
║  · 8 ·                                   ║
║  ┌──────┐ ┌──────┐ ┌──────┐ →            ║  horizontal strip
║  │████  │ │████  │ │████  │              ║  game tiles
║  │Game A│ │Game B│ │Game C│              ║
║  └──────┘ └──────┘ └──────┘              ║
║                                          ║
║  · 24 ·                                  ║
║  COMMUNITIES                             ║
║  · 8 ·                                   ║
║  ████ Hub name           1.2k · [ Open ] ║  list rows, not card grid
║  ████ Hub name             800 · [ Open ]║
║  ████ Hub name             320 · [ Open ]║
║                                          ║
║  · 24 ·                                  ║
║  PEOPLE                                  ║
║  · 8 ·                                   ║
║  ○ Name · game tag          [ Add ]      ║
║  ○ Name · game tag          [ Add ]      ║
║                                          ║
╠══════════════════════════════════════════╣
║ Home │ Discover │ Messages │ Friends │You║
╚══════════════════════════════════════════╝
```

**Filter sheet (secondary):**

```
╔══════════════════════════════════════════╗
║  dimmed Discover                         ║
║  ┌────────────────────────────────────┐  ║
║  │ Filters                      [ Done]│  ║
║  │ Region · Genre · LFG only           │  ║
║  │ (controls)                          │  ║
║  └────────────────────────────────────┘  ║
╠══════════════════════════════════════════╣
║                 dock                     ║
╚══════════════════════════════════════════╝
```

**Nav:** Tile → **Game**. Community row → **Hub** preview. Person → **Profile**. Open/Join success → **Home**.

---

# 3. Game

**Job:** Land on a game. Show atmosphere + related hubs. Not a filter form.

**Hierarchy:** Back → game identity → short pitch → hubs for this game → dock (Discover still active)

**Primary actions:** Open hub · See all hubs · (Follow game — optional later)

```
╔══════════════════════════════════════════╗
║  ← Discover                              ║  · 8 ·
║                                          ║
║  ████████████████████████████████████    ║  full-bleed game media · edge
║  ████████████████████████████████████    ║
║                                          ║
║  · 16 ·                                  ║
║  Game name                               ║
║  Short line: why play here               ║  one sentence
║                                          ║
║  · 24 ·                                  ║
║  HUBS FOR THIS GAME                      ║
║  · 8 ·                                   ║
║  Hub A · region · online     [ Open ]    ║
║  Hub B · region · online     [ Open ]    ║
║  Hub C · region · online     [ Open ]    ║
║                                          ║
║  [ See all in Discover ]                 ║  secondary
║                                          ║
╠══════════════════════════════════════════╣
║ Home │ Discover │ Messages │ Friends │You║
╚══════════════════════════════════════════╝
```

**Nav:** Back → Discover. Open → **Hub** preview (or join straight to Home if already member).

**Note:** Route may be query-driven at first (`/discover` + game context). Wireframe is IA, not URL lock.

---

# 4. Hub

Two related surfaces share hub identity: **preview** (before/without living in chat) and **sheet** (switch hubs on Home).

## 4a. Hub preview (from Discover / Game)

**Job:** Decide join / open. Community identity, not Discord server settings.

**Hierarchy:** Back → identity → stats one line → about → CTA → dock

**Primary actions:** Join / Open · Share invite (secondary)

```
╔══════════════════════════════════════════╗
║  ← Back                                  ║
║                                          ║
║  ████████████████████████████████████    ║  hub media (edge, not inset card)
║                                          ║
║  · 16 ·                                  ║
║  Hub name                                ║
║  Game · Region · 1.2k members            ║  one meta line
║                                          ║
║  · 16 ·                                  ║
║  About                                   ║
║  Two–three lines max…                    ║
║                                          ║
║  · 16 ·                                  ║
║  Channels preview (read-only list)       ║  optional, collapsed if long
║  # general  # lfg  🔊 Lobby              ║
║                                          ║
║  · 24 ·                                  ║
║  [ Join hub ]          ( Share )         ║  primary full width
║                                          ║
╠══════════════════════════════════════════╣
║ Home │ Discover │ Messages │ Friends │You║
╚══════════════════════════════════════════╝
```

**After Join:** Navigate Home with hub selected → Chat ready.

## 4b. Hub sheet (switcher on Home)

**Job:** Switch / create / join without leaving Home tab.

```
╔══════════════════════════════════════════╗
║  dimmed Home                             ║
║  ┌────────────────────────────────────┐  ║
║  │ Hubs                         ✕     │  ║
║  │ · 8 ·                              │  ║
║  │ ○ Current hub              ✓       │  ║
║  │ ○ Other hub                        │  ║
║  │ ○ Other hub                        │  ║
║  │ · 16 ·                             │  ║
║  │ [ Create hub ]                     │  ║
║  │ [ Join with invite ]               │  ║
║  │ ( Discover hubs )                  │  ║
║  └────────────────────────────────────┘  ║
║         sits above dock clearance        ║
╠══════════════════════════════════════════╣
║ Home │ Discover │ Messages │ Friends │You║
╚══════════════════════════════════════════╝
```

**Primary actions:** Select hub · Create · Join invite.

---

# 5. Chat

**Job:** Channel conversation inside the active hub. Dense, one-handed compose.

**Hierarchy:** Channel header → messages → composer → dock

**Primary actions:** Send · Attach · Join/leave voice (if voice channel) · (Long-press message actions)

```
╔══════════════════════════════════════════╗
║  ← Channels     # general      ( ··· )   ║  back to Home channel list if stacked
║                 Hub name                 ║  · 8 ·
║  ──────────────────────────────────────  ║
║                                          ║
║  · 8 ·                                   ║
║  Day separator (optional)                ║
║                                          ║
║  ○ Name · time                           ║  message block
║    Message body wraps…                   ║
║                                          ║
║  ○ Name · time                           ║
║    Message body…                         ║
║    [image]                               ║
║                                          ║
║  ○ You · time                            ║
║    …                                     ║
║                                          ║
║           ↕ transcript                   ║
║                                          ║
║  · 8 ·                                   ║
║  ┌────────────────────────────────────┐  ║
║  │ [+]  Message…              [ Send ]│  ║  composer · thumb zone
║  └────────────────────────────────────┘  ║
║  (+) opens attach / emoji sheet          ║
╠══════════════════════════════════════════╣
║ Home │ Discover │ Messages │ Friends │You║
╚══════════════════════════════════════════╝
```

**Message actions (long-press sheet):** React · Reply · Pin · Copy · Report · Delete (own)

```
║  ┌────────────────────────────────────┐  ║
║  │ Message actions                    │  ║
║  │ React | Reply | Pin | More…        │  ║
║  └────────────────────────────────────┘  ║
```

**Voice channel variant:** Same chat chrome + compact voice strip under header: participants · `[ Mute ]` `[ Leave ]` — not a second app.

**Nav:** Home tab active. `···` → channel info / pins sheet (progressive).

**Spacing:** Transcript padding 12–16; composer ≥44 height; clear keyboard inset above dock.

---

# 6. Messages

## 6a. Inbox

**Job:** Private threads list.

**Hierarchy:** Title → (search) → thread rows → dock

**Primary actions:** Open thread · (New DM)

```
╔══════════════════════════════════════════╗
║                                          ║
║  Messages              [ + ]             ║  · 16 ·
║  · 8 ·                                   ║
║  [ 🔍 Search                         ]   ║  optional / progressive
║  · 16 ·                                  ║
║                                          ║
║  ○ Name          last msg…      2m  (3)  ║  row · 56–64
║  ○ Name          last msg…      1h       ║
║  ○ Name          last msg…      Yesterday║
║                                          ║
║  (empty: title + body + [ Find friends ])║
║                                          ║
╠══════════════════════════════════════════╣
║ Home │ Discover │ Messages │ Friends │You║
╚══════════════════════════════════════════╝
```

## 6b. Thread (full-screen push on mobile)

**Job:** 1:1 (or small group) chat. Same composer kit as Chat.

```
╔══════════════════════════════════════════╗
║  ← Messages     Name           ( ··· )   ║  no dock? → keep dock per AppShell
║  ──────────────────────────────────────  ║  proposal: keep dock for IA consistency
║                                          ║
║  (same transcript + composer as Chat)    ║
║                                          ║
╠══════════════════════════════════════════╣
║ Home │ Discover │ Messages │ Friends │You║
╚══════════════════════════════════════════╝
```

**Nav:** Back clears `thread` → inbox. Messages tab active. `···` → profile / mute (later).

**IA note:** No Video/Pin strip as primary chrome.

---

# 7. Friends

**Job:** Social graph, presence, requests.

**Hierarchy:** Title → requests (if any) → friends list → dock

**Primary actions:** Accept/decline request · Open profile · Message · Add friend

```
╔══════════════════════════════════════════╗
║                                          ║
║  Friends                 [ Add friend ]  ║  · 16 ·
║                                          ║
║  · 16 ·                                  ║
║  REQUESTS (2)            (if any)        ║
║  · 8 ·                                   ║
║  ○ Name                  [ Accept ][ ✕ ] ║
║                                          ║
║  · 24 ·                                  ║
║  ALL FRIENDS                             ║
║  · 8 ·                                   ║
║  ● Name · In hub X           ( Message ) ║  presence · row
║  ○ Name · Offline            ( Message ) ║
║  ● Name · Online             ( Message ) ║
║                                          ║
╠══════════════════════════════════════════╣
║ Home │ Discover │ Messages │ Friends │You║
╚══════════════════════════════════════════╝
```

**Nav:** Row / avatar → **Profile**. Message → **Messages** thread. Add friend → search sheet or Discover people.

**Empty:** “No friends yet” + `[ Discover people ]` + `[ Invite ]`.

---

# 8. Notifications

**Job:** Event inbox. Reach via You sheet (per NAVIGATION-SPEC).

**Hierarchy:** Back/You → title → list → dock

**Primary actions:** Open item target · Mark read (implicit on open)

```
╔══════════════════════════════════════════╗
║  ← (You)                                 ║  or title-only if from deep link
║                                          ║
║  Notifications                           ║  · 16 ·
║  · 16 ·                                  ║
║                                          ║
║  ● Friend request · Name        2m       ║  unread = emphasis, not heavy card
║  ○ Mention in #general          1h       ║
║  ○ Hub invite · Name            Yesterday║
║  ○ System                       3d       ║
║                                          ║
║  (empty: body + [ Find friends ]         ║
║          or [ Open Discover ])           ║
║                                          ║
╠══════════════════════════════════════════╣
║ Home │ Discover │ Messages │ Friends │You║  You accent
╚══════════════════════════════════════════╝
```

**Nav:** Tap row → deep link (Friends / Chat / Hub / Profile). You cluster active on dock.

---

# 9. Profile

## 9a. Own profile (`/me`)

**Job:** Identity + shortcuts. Not a settings dump.

**Hierarchy:** Back → identity → status → shortcuts → dock

**Primary actions:** Edit profile · Open Settings (account) · Share

```
╔══════════════════════════════════════════╗
║  ←                                       ║
║                                          ║
║       ████                               ║  avatar · 16 ·
║       Display name                       ║
║       @user · #tag                       ║
║       ● Status text                      ║
║                                          ║
║  · 16 ·                                  ║
║  [ Edit profile ]                        ║
║                                          ║
║  · 24 ·                                  ║
║  About                                   ║
║  Short bio…                              ║
║                                          ║
║  · 16 ·                                  ║
║  Playing / hubs (simple list)            ║  optional
║                                          ║
║  · 24 ·                                  ║
║  ( Settings )  ( Share )                 ║  secondary
║                                          ║
╠══════════════════════════════════════════╣
║ … dock — You accent …                    ║
╚══════════════════════════════════════════╝
```

## 9b. Other profile

**Primary actions:** Add/Message · (Report / Block in ···)

```
╔══════════════════════════════════════════╗
║  ←                                       ║
║                                          ║
║       ████                               ║
║       Display name                       ║
║       @user · presence                   ║
║                                          ║
║  · 16 ·                                  ║
║  [ Message ]      [ Add friend ]         ║  primary pair
║                                          ║
║  · 24 ·                                  ║
║  About / games / mutual hubs             ║  simple sections
║                                          ║
║  ( ··· More )                            ║  report / block
║                                          ║
╠══════════════════════════════════════════╣
║ dock — accent from source tab if known   ║
╚══════════════════════════════════════════╝
```

---

# 10. Settings

**Job:** Preferences. Lightweight list → section. Not a desktop sidebar on phone.

**Hierarchy:** Back → section list → section detail → dock

**Primary actions:** Change a preference · Logout (end of list / You sheet also)

## 10a. Root list

```
╔══════════════════════════════════════════╗
║  ←                                       ║
║                                          ║
║  Settings                                ║  · 16 ·
║                                          ║
║  · 16 ·                                  ║
║  YOU                                     ║
║  Account                                 ║  rows · 44+
║  Privacy                                 ║
║  Billing                                 ║
║                                          ║
║  · 16 ·                                  ║
║  APP                                     ║
║  Appearance                              ║
║  Voice                                   ║
║  Notifications                           ║
║  Language                                ║
║                                          ║
║  · 24 ·                                  ║
║  Log out                                 ║  destructive, not in a card stack
║                                          ║
╠══════════════════════════════════════════╣
║ … dock — You accent …                    ║
╚══════════════════════════════════════════╝
```

## 10b. Section detail (example: Voice)

```
╔══════════════════════════════════════════╗
║  ← Settings                              ║
║                                          ║
║  Voice                                   ║
║  · 16 ·                                  ║
║                                          ║
║  Input device            [ Default ▼ ]   ║  row + control
║  Sensitivity             ────●──         ║
║  Push to talk            [  toggle  ]    ║
║  Noise suppression       [  toggle  ]    ║
║                                          ║
║  (no nested cards — spacing separates)   ║
║                                          ║
╠══════════════════════════════════════════╣
║                 dock                     ║
╚══════════════════════════════════════════╝
```

**Nav:** Back → Settings root → leave to prior surface. Deep link `?section=voice` opens 10b directly.

---

## Cross-screen flows (wireframe level)

### Discover → play

```
Discover → Game → Hub preview → [ Join ] → Home → Chat
```

### Switch community

```
Home → [ Hub name ▼ ] → Hub sheet → select → Home/Chat
```

### Social ping

```
You → Notifications → row → Friends / Chat / Profile
```

### Private message

```
Friends → Profile → [ Message ] → Messages thread
     or Messages inbox → thread
```

---

## UX validation checklist

Use this before visual design / Phase A code:

- [ ] Home is clearly “my hub,” not Discover  
- [ ] Discover shows games → communities → people without a filter wall  
- [ ] Game and Hub previews feel like destinations, not admin panels  
- [ ] Chat and DM thread share the same composer mental model  
- [ ] Friends is one dock tap (per NAVIGATION-SPEC)  
- [ ] Notifications / Settings sit under You without feeling lost  
- [ ] Primary actions are obvious on each screen (only one main CTA where possible)  
- [ ] Thumb zone: composer, dock, sheets; hub switch mitigated (header + optional long-press)  
- [ ] Empty states always offer a next step  
- [ ] RTL: same hierarchy; mirror chrome, not content meaning  

---

## Approval

| Field | Value |
|-------|--------|
| Status | **Proposed** |
| Approved by | _pending_ |
| Date | _pending_ |
| Amendments | _pending_ |

**Sequence:** Approve `NAVIGATION-SPEC.md` + this wireframe set → then Phase A (nav IA code) → Phase B (visual system). Still **no UI code** until approved.
)
