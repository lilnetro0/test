# App Store & launch readiness — Nexus

**Phase:** 18  
**Date:** 2026-07-15  

Single ASC / TestFlight / public-launch index. Domain runbooks stay in their docs.

| Doc | Role |
|-----|------|
| [LAUNCH.md](../LAUNCH.md) | Operator go/no-go before cutting traffic |
| [CAPACITOR.md](CAPACITOR.md) | Remote-shell dual-mode + Codemagic IPA |
| [OPS.md](OPS.md) | Health + incident starters |
| [TESTING-SECURITY.md](TESTING-SECURITY.md) | CI gates |
| This file | App Store Connect + store copy + review notes |

## Product identity (ASC)

| Field | Value |
|-------|-------|
| App name | **Nexus** |
| Bundle ID | `com.lilnetro0.nexus` |
| Category (suggested) | Social Networking |
| Age rating base | **13+** (in-app age gate; UGC chat/voice) |
| Platforms | iPhone (iPad orientations listed; primary phone) |
| Load model | Capacitor **remote HTTPS shell** (`CAPACITOR_SERVER_URL`) — see CAPACITOR.md |

## Store listing — English draft

**Subtitle (30 chars):** `Voice & chat for gamers`

**Promotional text (optional):**  
Jump between game hubs. Chat, DM friends, and hop into voice — built for play sessions, not meetings.

**Description:**  
Nexus is a game-first chat and voice app. Every game is a hub with text channels and voice rooms. Discover hubs, chat in real time, manage friends and DMs, and join LiveKit voice when you are ready to talk.

- Game hubs with channels and roster  
- Real-time chat (edit, react, pin, attachments)  
- Friends, blocks, and direct messages  
- Hub + DM voice (mic permission)  
- English and Arabic (RTL)  
- Account export and deletion in Settings  

Requires a Nexus account. Some features need a network connection. Voice uses your microphone; photos may be used for avatars or attachments.

**Keywords (100 chars, comma-separated):**  
nexus,gaming,voice chat,game hubs,discord alternative,live chat,friends,dm

**Support URL:** `https://YOUR_ORIGIN/help`  
**Privacy Policy URL:** `https://YOUR_ORIGIN/privacy`  
**Marketing URL (optional):** `https://YOUR_ORIGIN/`

**Arabic listing:** translate Subtitle / Description / Keywords before submission; keep Brand = Nexus.

## Screenshots (ops — not generated in repo)

Prepare for **6.7"** and **6.1"** (and iPad if shipping iPad):

1. Hub chat (home)  
2. Discover / hub list  
3. DM thread  
4. Voice dock joined  
5. Friends  
6. Settings / account (export & delete visible)  

Use dark Nexus UI; no mock/demo banners; no competitor trademarks in art.

## App Privacy (ASC questionnaire — draft)

Align with `ios/App/App/PrivacyInfo.xcprivacy` + product behavior. **Not tracking.**

| Data type | Linked to user? | Used for tracking? | Purpose |
|-----------|-----------------|--------------------|---------|
| Email Address | Yes | No | App Functionality (auth) |
| User ID | Yes | No | App Functionality |
| Audio Data | Yes (during voice) | No | App Functionality (LiveKit) |
| Photos / Videos | Yes (if user uploads) | No | App Functionality (avatar / attachments) |
| Other User Content | Yes (messages) | No | App Functionality |
| Product Interaction | Optionally declare if analytics added later | No | — |

Collected via your servers (Supabase / LiveKit). Update ASC if you add APM SDKs that collect device IDs.

## Export compliance

`ITSAppUsesNonExemptEncryption` = **false** in Info.plist (standard HTTPS only). Revisit if you add custom crypto.

## App Review Notes — paste template

```
Nexus is a social chat + voice product for gamers (13+).

TEST ACCOUNT
- Email: <reviewer@…>
- Password: <…>
- Pre-joined hub / notes: <…>

ARCHITECTURE
- The iOS binary is a Capacitor shell that loads our production HTTPS origin
  (CAPACITOR_SERVER_URL). Native capabilities in this binary include:
  • Custom URL scheme com.lilnetro0.nexus:// for OAuth callback
  • Microphone + background audio for LiveKit voice
  • Camera / photo library for avatars & chat attachments
  • Push notification registration (delivery backend may be web-push first)
  • Keyboard / safe-area chrome and offline connectivity banner
- This is not a thin website bookmark: accounts, Realtime chat, DMs, and voice
  are first-class product surfaces. Guideline 4.2 notes: native value is listed
  above; remote shell is required because server functions are origin-bound.
  See docs/CAPACITOR.md.

REQUIRED PERMISSIONS
- Microphone — hub / DM voice
- Photos / Camera — optional avatar & attachments
```

Honest **4.2** stance: native inventory **reduces** wrapper risk; it is **not** a claim of full mitigation versus a future bundled SPA. Do not overstate in Review Notes.

## TestFlight readiness

- [ ] Codemagic env group `test` has `CAPACITOR_SERVER_URL=https://…` (HTTPS, no trailing slash)  
- [ ] `ios-capacitor` workflow green → IPA → TestFlight  
- [ ] `npm run smoke:launch` green on the release commit  
- [ ] Internal testers: register, chat, DM, voice (LiveKit or stub disclosed)  
- [ ] Ban / report / block smoke with two accounts  
- [ ] Deep link: OAuth / `com.lilnetro0.nexus://auth/callback`  
- [ ] Offline strip appears when airplane mode on Cap  

## ASC packaging checklist (ops — keys stay out of git)

- [ ] Apple Developer Program membership active  
- [ ] App ID `com.lilnetro0.nexus` + Push (if using APNs) + Associated Domains only if added  
- [ ] Distribution cert + App Store provisioning profile  
- [ ] Codemagic integration `app_store_connect: test` matches ASC API key name  
- [ ] Version / build: Xcode `MARKETING_VERSION` + Codemagic `agvtool` build number  
- [ ] Privacy Policy + Support URLs live before submit  
- [ ] Age rating questionnaire completed (UGC → 13+)  
- [ ] Review Notes filled with test account  

Certs and `.p8` / profiles **never** committed; Codemagic encrypted groups only.

## Store metadata package

Human + Fastlane-oriented copy: [`docs/store/`](store/README.md) (`en-US/listing.txt`, `REVIEW-NOTES.txt`, screenshot capture guide). Optional `fastlane/Deliverfile` for ops `deliver` runs.

## CI smoke

```bash
npm run smoke:launch
```

Asserts Info.plist usage strings / encryption / URL scheme / audio background, PrivacyInfo.xcprivacy, Cap `appId`, PWA icons (≥192/512), legal routes, ASC doc + store listing / Review Notes present.

## Still deferred

- Fully bundled Cap SPA — architecture limit (documented rationale in CAPACITOR.md); remote shell is the submit path  
- Live screenshot binary commits / Auto-frame generation  
- CallKit / VoIP push  
- FCM HTTP v1 (legacy key path shipped)  
- Play Console signing secrets automation  
