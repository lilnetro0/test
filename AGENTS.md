<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Design Language (UI / UX authority)

[`design.md`](design.md) is the **official Design Language and UX specification** for Nexus (premium, mobile-first, native iOS feel, Arabic-first). It outranks ad-hoc UI prompts unless explicitly overridden.

Before any UI/UX/frontend work:

1. Read `design.md`
2. Check [`docs/UI-AUDIT.md`](docs/UI-AUDIT.md) for known violations and the phased redesign roadmap (A→H)
3. Follow [`docs/UI-IMPLEMENTATION-PLAN.md`](docs/UI-IMPLEMENTATION-PLAN.md) for shared components, phase DoD, and order
4. Navigation IA: [`docs/NAVIGATION-SPEC.md`](docs/NAVIGATION-SPEC.md) + [`docs/UI-WIREFRAMES.md`](docs/UI-WIREFRAMES.md) (frozen). Phase A: [`docs/UI-PHASE-A.md`](docs/UI-PHASE-A.md). Phase B: [`docs/UI-PHASE-B.md`](docs/UI-PHASE-B.md) · [`docs/UI-DESIGN-SYSTEM.md`](docs/UI-DESIGN-SYSTEM.md). Phase C: [`docs/UI-PHASE-C.md`](docs/UI-PHASE-C.md). Phase D: [`docs/UI-PHASE-D.md`](docs/UI-PHASE-D.md). Phase E: [`docs/UI-PHASE-E.md`](docs/UI-PHASE-E.md). Phase F: [`docs/UI-PHASE-F.md`](docs/UI-PHASE-F.md). Phase G: [`docs/UI-PHASE-G.md`](docs/UI-PHASE-G.md) · [`docs/UI-MOTION.md`](docs/UI-MOTION.md). Phase H: [`docs/UI-PHASE-H.md`](docs/UI-PHASE-H.md) (A–H complete)
5. Prefer systematic phases over one-off screen tweaks — wait for approval before implementing redesign phases
6. Do not introduce new navigation patterns, layouts, or UX concepts during implementation — execute the frozen docs; stop and ask if architecture must change

## Arabic-first product direction

Nexus targets **Arabic-speaking gamers in Saudi Arabia and the wider MENA region**.
Arabic is the primary product language (English supported). Do **not** treat Arabic as a secondary translation layer after English UX is finished.

Standing docs (required reading for user-facing work):

- [`design.md`](design.md) — Design Language (UI/UX authority)
- [`docs/UI-AUDIT.md`](docs/UI-AUDIT.md) — Audit vs design.md + redesign roadmap
- [`docs/UI-IMPLEMENTATION-PLAN.md`](docs/UI-IMPLEMENTATION-PLAN.md) — Phase A–H blueprint (shared system first)
- [`docs/ARABIC-PRODUCT-GUIDELINES.md`](docs/ARABIC-PRODUCT-GUIDELINES.md)
- [`docs/ARABIC-TERMINOLOGY.md`](docs/ARABIC-TERMINOLOGY.md)
- [`docs/RTL-TEST-CHECKLIST.md`](docs/RTL-TEST-CHECKLIST.md)
- [`docs/MENA-MODERATION-GUIDE.md`](docs/MENA-MODERATION-GUIDE.md)
- [`docs/I18N-RTL.md`](docs/I18N-RTL.md)
- [`docs/ARABIC-FIRST-AUDIT.md`](docs/ARABIC-FIRST-AUDIT.md) — Phase 0 axis audit (gaps backlog)
- [`docs/ARABIC-FIRST-PHASE1.md`](docs/ARABIC-FIRST-PHASE1.md) — AF1 foundations (Done)
- [`docs/ARABIC-FIRST-PHASE2.md`](docs/ARABIC-FIRST-PHASE2.md) — AF2 regional discovery (Done)
- [`docs/ARABIC-FIRST-PHASE3.md`](docs/ARABIC-FIRST-PHASE3.md) — AF3 templates + moderation assist (Done)
- [`docs/ARABIC-FIRST-PHASE4.md`](docs/ARABIC-FIRST-PHASE4.md) — AF4 DB Arabic search norm (Done)
- [`docs/ARABIC-FIRST-PHASE5.md`](docs/ARABIC-FIRST-PHASE5.md) — AF5 admin + titles (Done)
- [`docs/ARABIC-FIRST-PHASE6.md`](docs/ARABIC-FIRST-PHASE6.md) — AF6 Discover LFG (Done)
- [`docs/ARABIC-FIRST-PHASE7.md`](docs/ARABIC-FIRST-PHASE7.md) — AF7 Games admin + LFG jump + fonts (Done)
- [`docs/ARABIC-FIRST-PHASE8.md`](docs/ARABIC-FIRST-PHASE8.md) — AF8 voice report + lang hydrate (Done)
- [`docs/ARABIC-FIRST-PHASE9.md`](docs/ARABIC-FIRST-PHASE9.md) — AF9 admin confirms i18n (Done)
- [`docs/ARABIC-FIRST-PHASE10.md`](docs/ARABIC-FIRST-PHASE10.md) — AF10 voice report column (Done)
- [`docs/ARABIC-FIRST-PHASE11.md`](docs/ARABIC-FIRST-PHASE11.md) — AF11 LFG post helper (Done)
- [`docs/ARABIC-FIRST-PHASE12.md`](docs/ARABIC-FIRST-PHASE12.md) — AF12 voice participant picker (Done)
- [`docs/ARABIC-FIRST-PHASE13.md`](docs/ARABIC-FIRST-PHASE13.md) — AF13 catalog search_norm (Done)
- [`docs/ARABIC-FIRST-PHASE14.md`](docs/ARABIC-FIRST-PHASE14.md) — AF14 ui/* logical CSS (Done)
- [`docs/ARABIC-FIRST-PHASE15.md`](docs/ARABIC-FIRST-PHASE15.md) — AF15 profile search norms (Done)
- [`docs/ARABIC-FIRST-PHASE16.md`](docs/ARABIC-FIRST-PHASE16.md) — AF16 cookie SSR lang/dir (Done)
- [`docs/ARABIC-FIRST-PHASE17.md`](docs/ARABIC-FIRST-PHASE17.md) — AF17 route/shell logical CSS (Done)
- [`docs/ARABIC-FIRST-PHASE18.md`](docs/ARABIC-FIRST-PHASE18.md) — AF18 self-hosted Noto Arabic (Done)
- [`docs/ARABIC-FIRST-PHASE19.md`](docs/ARABIC-FIRST-PHASE19.md) — AF19 thin LFG board (Done)
- [`docs/ARABIC-FIRST-PHASE20.md`](docs/ARABIC-FIRST-PHASE20.md) — AF20 self-hosted Latin fonts (Done)
- [`docs/ARABIC-FIRST-PHASE21.md`](docs/ARABIC-FIRST-PHASE21.md) — AF21 React SSR lang hydrate (Done)
- [`docs/ARABIC-FIRST-PHASE22.md`](docs/ARABIC-FIRST-PHASE22.md) — AF22 physical CSS mop-up (Done)

**Do not start large redesigns by default.** UI redesign follows `docs/UI-AUDIT.md` phases **after approval**. Arabic-first work: audit → incremental tested changes. Every future phase completion report must include an **Arabic-first impact** section (UI, RTL tests, bidi, search, moderation, unresolved).
