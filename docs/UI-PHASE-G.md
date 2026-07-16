# Phase G — Motion & Interactions

**Status:** Implemented — approved; Phase H complete  
**Authority:** Frozen plan §11 · `docs/UI-MOTION.md`

---

## Delivered

1. **Motion tokens** — `--nx-motion-*` + sheet/tab utilities; reduced-motion still global.
2. **App Sheet** — faster iOS-like enter; scrim fade; `nx-title` header (no uppercase chrome).
3. **Radix sheets** — enter/exit durations tied to tokens (Confirm / Filter / Report / message actions).
4. **Report** — bottom sheet (export still `ReportDialog`); touch-friendly reasons/CTAs.
5. **Friends** — message/block actions always visible (no hover-only opacity).
6. **Dock** — `nx-tab-active` transitions.

## Explicitly deferred / out of scope

- `/admin` `confirm()` calls — admin out of A–H scope per implementation plan.
- Full route push transitions — optional; not required for DoD.

## Testing checklist

- [x] Report uses sheet presentation  
- [x] Consumer kick/delete already on ConfirmSheet (F/E)  
- [x] Friends actions not hover-only  
- [x] Sheet motion tokens applied  
- [ ] Manual VoiceOver / reduce-motion glance  

## Approval

| Field | Value |
|-------|--------|
| Phase G product approval | **Approved** (continue → Phase H) |
| Approved by | Product |
| Date | 2026-07-16 |
