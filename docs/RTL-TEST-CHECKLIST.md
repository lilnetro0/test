# RTL / Arabic test checklist — Nexus

Use this gate for every **major user-facing** change. A feature is not done until relevant rows pass.

## Environments

- [ ] Arabic · desktop  
- [ ] Arabic · mobile (Cap or narrow viewport)  
- [ ] English · desktop  
- [ ] English · mobile  

## Language & bootstrap

- [ ] Cleared `nexus.lang` + cookie; browser `ar` → first paint RTL + Arabic chrome  
- [ ] Language switcher works on auth (login/register) before onboarding  
- [ ] Settings language persists; reload keeps preference  
- [ ] Profile `lang` syncs when logged in  

## Layout

- [ ] Dock labels readable in Arabic (no clip)  
- [ ] Sheets / dialogs / menus open and close on the logical side  
- [ ] Primary CTAs follow RTL expectations  
- [ ] Back / close still intuitive on iOS  
- [ ] Brand / mic / play icons **not** incorrectly mirrored  

## Typography

- [ ] Arabic uses Noto (or approved stack); no tofu boxes  
- [ ] No forced uppercase on Arabic labels  
- [ ] Diacritics not clipped; line-height readable  

## Mixed direction (bidi)

- [ ] Message like `رانك Diamond` / `PS5 فقط` / `ID: Name#1234` does not scramble buttons/time  
- [ ] Author names with Latin + Arabic isolate correctly  
- [ ] Mentions / links remain tappable  

## Forms & keyboard

- [ ] Arabic keyboard: login, register, composer, search  
- [ ] Placeholders and errors in correct language  
- [ ] Fields align start; no LTR-only padding traps  

## Search (when touching search)

- [ ] فارورانت / Valorant style queries (as implemented synonyms/normalize)  
- [ ] Diacritics / tatweel stripped without breaking Latin usernames  

## Safety

- [ ] Report dialog fully Arabic when UI lang is AR  
- [ ] Guidelines readable in Arabic  

## Regression notes

Record broken screenshots or notes under the PR / phase summary **Arabic-first impact** section.

See also: [`I18N-RTL.md`](I18N-RTL.md) manual a11y smoke.
