================================================================================
NEXUS — DESIGN & CODE README (v3, i18n + bottom-dock era)
================================================================================

This document is the single source of truth for anyone continuing work on the
Nexus frontend (in Cursor, Lovable, or plain VSCode). Read it end-to-end before
touching UI. Nothing here is negotiable — deviation breaks the design language.

Frontend-only. No backend, no persistence beyond localStorage. All data lives
in `src/lib/mock-data.ts`.

================================================================================
1. STACK
================================================================================

- TanStack Start (React 19) + Vite 7
- File-based routing under `src/routes/`
- Tailwind CSS v4 (CSS-first config in `src/styles.css`)
- shadcn/ui component library (headless, restyled to our tokens)
- lucide-react for ALL icons
- Custom i18n (`src/lib/i18n.tsx`) — English + Arabic with full RTL support
- No global state library — component state + Context for i18n only

================================================================================
2. DESIGN LANGUAGE — "MINIMAL MODERN CYBER-STEALTH"
================================================================================

Dark, quiet, mostly monochrome. One cyan accent (#00F0FF / --accent). Motion
is minimal (color transitions, subtle scale on press). No gradients on primary
UI — gradients reserved for hero banners and 404. NEVER use purple/indigo/
magenta accents.

Typography:
- Display / headers → `font-display` = Space Grotesk 500/700, ALL CAPS for
  headings, `tracking-tight`
- Body → `font-sans` = Inter 400/500/600/700, sentence case
- Metadata / labels → `text-[10px]` or `text-[11px]`, `uppercase`,
  `tracking-widest`, `text-stone-500`

Density:
- Base padding scale: `p-2` (dense list rows) → `p-4` (cards) → `p-6` (page
  sections)
- Rounded corners: `rounded-lg` (buttons/inputs), `rounded-xl` (cards),
  `rounded-2xl` (sheets, elevated tiles), full for pills/avatars

================================================================================
3. DESIGN TOKENS — src/styles.css
================================================================================

All tokens live in `src/styles.css` under `:root { ... }` and are mapped to
Tailwind utilities via `@theme inline { ... }`. NEVER hardcode colors in
components — use the semantic classes below.

Color tokens (Tailwind class → CSS var):
- `bg-background`        → `--background`      base app canvas (near-black)
- `bg-surface-left`      → `--surface-left`    bottom dock, nav rails
- `bg-surface-mid`       → `--surface-mid`     panels, sheets, cards
- `bg-surface-right`     → `--surface-right`   right-side panels
- `border-border-subtle` → `--border-subtle`   1px hairlines everywhere
- `bg-accent` / `text-accent` → `--accent` (cyan) primary action, focus, brand
- `bg-online` / `text-online` → `--online` (emerald) presence, voice active
- `bg-danger` / `text-danger` → `--danger` (rose) destructive, alerts

Shadow / glow tokens:
- `shadow-[var(--shadow-glow-accent)]` — cyan halo on active brand/CTA
- `shadow-[var(--shadow-glow-online)]` — emerald halo on speaking avatars

Custom variants (defined in styles.css):
- `dark:` — reserved, currently unused (app is dark-only)
- `rtl:` / `ltr:` — apply styles conditionally on `<html dir>`. USE THESE
  instead of physical left/right classes for anything directional.

================================================================================
4. INTERNATIONALIZATION (i18n) — CRITICAL
================================================================================

Provider: `<LanguageProvider>` wraps the whole app in `src/routes/__root.tsx`.
API:  `const { t, lang, setLang, dir } = useT()`

Languages: `en` (default), `ar` (Arabic, RTL). Persisted in
`localStorage["nexus.lang"]`. The provider automatically sets:
  document.documentElement.lang = lang
  document.documentElement.dir  = "ltr" | "rtl"

Adding strings:
1. Add the key to BOTH `en` and `ar` dictionaries in `src/lib/i18n.tsx`.
2. Use it in components via `t("category.key")`.
3. Never leave a user-visible string untranslated. Message-body mock content
   is exempt (it's fake game chat).

RTL rules — non-negotiable:
- Use `me-*` / `ms-*` (margin-inline-end/start) instead of `mr-*` / `ml-*`.
- Use `pe-*` / `ps-*` instead of `pr-*` / `pl-*`.
- Use `rtl:` / `ltr:` variants for anything that needs absolute positioning
  (e.g. a badge at the top-right corner of an icon: `ltr:-right-1 rtl:-left-1`).
- `flex-row` auto-reverses in RTL — good. Do NOT set `flex-row-reverse`.
- Physical `text-left` / `text-right` are banned in shell chrome. Use
  `text-start` / `text-end`.
- Icons that convey direction (arrow-left / chevron) must swap in RTL if they
  represent "back" or "forward". Static icons (Hash, Bell, Users) don't.

Testing RTL:
- Open the app, go to Settings → Language → choose العربية.
- Every shell surface must remain readable and unbroken.

================================================================================
5. NAVIGATION MODEL — "BOTTOM DOCK + FLOATING SHEETS"
================================================================================

There is ONE persistent navigation surface: the bottom dock. Same on desktop,
tablet, and mobile. Absolutely no Discord-style left rail. Anyone who adds a
persistent left/right nav column is off-brand.

Bottom dock (`src/components/bottom-dock.tsx`) — 5 slots:
  Home ● Discover ● [Nexus brand — center, elevated] ● Messages ● You

- Center brand is the ONLY floating/elevated element. On `/` it opens the
  hub-and-channel sheet; on any other route it links home.
- "You" slot opens a menu with Friends, Notifications, Settings, Log out,
  plus a mini profile card. Red dot indicates unread alerts.
- Dock text labels come from `t("nav.home")` etc — never hardcoded.

Contextual surfaces use `<Sheet>` from `src/components/app-shell.tsx`:
- Bottom sheet: hub picker, channel list (opened via brand button)
- Right sheet: hub roster / members panel (opened via header Users icon)
- All sheets: closable via backdrop tap AND Escape key.

Route inventory:
  /                       home / chat canvas (index.tsx)
  /discover               hub directory
  /dm                     direct messages list + thread
  /friends                friends list (Online/All/Pending/Blocked/Add)
  /notifications          alerts inbox
  /settings               settings hub with left section nav
  /profile/$username      public profile
  /help                   keyboard shortcuts + tips
  /login, /register, /forgot-password, /reset-password  auth
  * (unmatched)           branded 404 in `__root.tsx`

Add a new page → create a route file in `src/routes/` + link from the You
menu or command palette. Do NOT add anything else to the bottom dock.

================================================================================
6. GLOBAL BEHAVIOURS
================================================================================

Wired in `src/routes/__root.tsx`:
- `<CommandPalette />` — ⌘K / Ctrl+K anywhere. Jumps to any page, hub,
  channel, friend, or DM. Uses shadcn Command.
- `<GlobalHotkeys />` — two-key `g` sequences (g h/d/m/f/s/n/?), plus
  `Shift+?` → /help. Ignored in inputs.
- `<Onboarding />` — first-visit 5-step tour, localStorage flag
  `nexus.onboarding.seen.v1`.
- Skip-link `#main-content` for keyboard users (a11y).
- PWA manifest at `/site.webmanifest`.

Toast notifications via `sonner` (`import { toast } from "sonner"`).

================================================================================
7. COMPONENT PATTERNS
================================================================================

App shell:
  <AppShell onBrandClick={...} brandActive={...}>{content}</AppShell>
- ALWAYS the outer wrapper for any authenticated route.
- Sets `#main-content` for the skip-link. Renders the bottom dock.
- Auth routes (login/register) use `<AuthShell>` instead — no bottom dock.

Sheet (`import { Sheet } from "@/components/app-shell"`):
  <Sheet open={...} onClose={...} title={t("...")}
         side="bottom" | "right" | "left">{content}</Sheet>
- Titles are always translated.
- Close button is a "✕" glyph (universal), not the word "Close".
- Automatically closes on Escape.

Buttons:
- Primary CTA: `bg-accent text-accent-foreground uppercase tracking-wide
  font-bold text-xs rounded-lg px-4 py-2 hover:brightness-110`
- Secondary: `border border-border-subtle bg-white/5 hover:bg-white/10 …`
- Icon-only: `grid size-9 place-items-center rounded-lg text-stone-400
  hover:bg-white/5 hover:text-white` + `aria-label={t("…")}`
- Every icon button MUST have an aria-label.

Cards:
- `rounded-xl border border-border-subtle bg-surface-mid p-4`
- Group with `divide-y divide-border-subtle overflow-hidden rounded-xl`

Chat message toolbar (hover reveal):
- `<MessageItem>` shows reaction/reply/pin/menu on hover.
- The message list container is `role="log" aria-live="polite"`.

================================================================================
8. ICONOGRAPHY
================================================================================

- lucide-react only. Never mix icon libraries.
- Standard sizes: `size-3` (metadata), `size-3.5` (row), `size-4` (default),
  `size-5` (dock/nav), `size-6` (feature blocks).
- Approved core set: Home, Compass, MessageSquare, User, Users, Bell, Hash,
  Mic, MicOff, Headphones, Search, Send, Plus, Settings, LogOut, UserCircle,
  ChevronDown, Pin, Menu, X, HelpCircle, Command, Keyboard, Gamepad2,
  Sparkles, Trophy, Shield, ArrowLeft, Volume2, Info, Palette, Globe,
  CreditCard, CheckCheck.
- Feel free to add lucide icons for new features — no other libraries.

================================================================================
9. MOTION
================================================================================

Minimal by design.
- Color transitions: `transition-colors` (150ms default).
- Sheets: `animate-in slide-in-from-bottom-8 | slide-in-from-right-8` etc.
- Buttons: `active:scale-95` only when tactile feedback matters (dock, CTAs).
- Onboarding card: `animate-in zoom-in-95 duration-200`.
- No spring physics, no parallax, no bouncing avatars, no lottie.

================================================================================
10. ACCESSIBILITY BASELINE
================================================================================

- Every route has semantic `<main>`.
- `#main-content` skip-link at the top of the DOM (translated).
- Every icon-only button has `aria-label`.
- Message log has `role="log" aria-live="polite"`.
- Sheets close on Escape.
- Focus rings inherit `ring-accent` via `--color-ring: var(--accent)`.
- Preserve keyboard tab order in DOM even when visual order flips in RTL.

Still to do (open backlog):
- Full `prefers-reduced-motion` disable pass on sheets/onboarding.
- High-contrast token variant.

================================================================================
11. FILE MAP
================================================================================

src/
  assets/
    nexus-logo.png          brand mark used in bottom dock and 404
  components/
    app-shell.tsx           AppShell + Sheet (frame everything)
    bottom-dock.tsx         Bottom dock + YouMenu
    command-palette.tsx     ⌘K palette
    composer.tsx            Chat message composer
    global-hotkeys.tsx      g-sequences + Shift+?
    message-item.tsx        Chat row with hover toolbar
    onboarding.tsx          First-visit tour
    user-hover-card.tsx     Hover profile card
    voice-dock.tsx          Bottom-right pinned voice status
    ui/                     shadcn primitives (don't edit unless restyling)
  hooks/
    use-hotkey.ts           Generic mod+key hook
  lib/
    i18n.tsx                LanguageProvider + useT + dict
    mock-data.ts            All fake data: GAMES, HUBS, FRIENDS, DMs, etc.
    utils.ts                cn() helper
  routes/
    __root.tsx              LanguageProvider + globals + 404 + head meta
    index.tsx               Home / chat canvas
    discover.tsx            Discover hub directory
    dm.tsx                  Direct messages
    friends.tsx             Friends list
    notifications.tsx       Alerts inbox
    settings.tsx            Settings hub with language switcher
    help.tsx                Shortcuts + tips
    profile.$username.tsx   Public profile
    login.tsx, register.tsx, forgot-password.tsx, reset-password.tsx
    sitemap[.]xml.ts        SEO
  styles.css                Tailwind v4 config + tokens + rtl/ltr variants
public/
  favicon.ico
  robots.txt
  site.webmanifest          PWA install metadata

================================================================================
12. HARD RULES FOR ANYONE CONTINUING THIS APP
================================================================================

1. NEVER add a persistent left/right rail. Bottom dock only.
2. NEVER hardcode colors. Use semantic tokens or Tailwind classes that map
   to tokens.
3. NEVER use purple/indigo/magenta as an accent (except the discover hero
   gradient which is intentional).
4. NEVER add a user-visible string without adding both `en` and `ar`
   translations.
5. NEVER use physical `mr-*`/`ml-*`/`pr-*`/`pl-*` in shell chrome. Use
   logical `me-*`/`ms-*`/`pe-*`/`ps-*` or `ltr:`/`rtl:` variants.
6. NEVER remove `<Outlet />` from a parent route (breaks all children).
7. NEVER add another icon library. lucide-react only.
8. ALWAYS wrap authenticated routes in `<AppShell>` so the dock stays.
9. ALWAYS write `aria-label` on icon-only buttons.
10. ALWAYS make sheets closeable via backdrop AND Escape.
11. Space Grotesk uppercase for headings, Inter sentence-case for body.
12. When adding backend later: keep all UI on-brand; the design system is
    already complete — you only wire data through it.

================================================================================
13. BACKLOG + BACKEND PHASES
================================================================================

Frontend polish (done):
- Per-game hero art, `/` composer focus, message search, `/me`, hub reorder,
  empty states, reduce-motion / high-contrast, What's new, AR Settings/Composer

Backend (Supabase) — see BACKEND.md:
  Phase 0 Foundation …… DONE
  Phase 1 Auth + profiles …… DONE (/me + prefs + username uniqueness + reset password)
  Phase 2 Hubs + text Realtime …… DONE (set VITE_USE_MOCK=0)

  Phase 3 Friends + DMs …… DONE (run 02_phase3_friends_dms.sql)
  Phase 4 Notifications …… DONE (run 03_phase4_notifications.sql)
  Phase 5 Voice (LiveKit) …… DONE (set LIVEKIT_* + VITE_USE_MOCK=0)
  Phase 6 Launch hardening …… DONE (see LAUNCH.md + 04_phase6_launch.sql)

UI stays design-locked. New work wires data through existing components.

================================================================================
END OF FILE — designreadme.txt v3
================================================================================
