# Arabic-first Phase 3 — Hub templates + MENA moderation assist

**Status:** Done  
**Date:** 2026-07-15  
**Track:** Arabic-first (AF3)  
**Policy:** [`ARABIC-PRODUCT-GUIDELINES.md`](ARABIC-PRODUCT-GUIDELINES.md) · [`MENA-MODERATION-GUIDE.md`](MENA-MODERATION-GUIDE.md)

## Goals

Continue AF2 discovery + audit #2 moderation:

1. Arabic/MENA **hub channel templates** (text + voice)  
2. Admin **hub region** editor (ties to Discover filters)  
3. **Assistive** Arabic/Arabizi signals on report queue (never auto-ban)  
4. Moderator **AR/EN response templates** + Reports chrome i18n  
5. Appeal copy on `/help`

## Done

| Item | Detail |
|------|--------|
| Templates | `src/lib/hub-templates.ts` — عام، LFG، رانكد، كاجوال، أخبار، مساعدة + voice |
| Admin API | `region` on upsert; `adminApplyMenaChannelTemplate`; seed on create checkbox |
| Admin UI | Hub region select; apply template on Channels; Reports assist + templates |
| Assist | `src/lib/moderation/arabic-assist.ts` + unit tests |
| Appeals | `/help` appeal block → `safety@nexus.app` |

## Explicitly deferred

- Full admin i18n (all tabs)  
- Auto-ban / ML classifiers  
- Voice-session report attach  
- LFG product surface beyond channel name  
- DB normalized search column  

## Arabic-first impact

| Area | Note |
|------|------|
| Arabic UI | Reports filters/actions localized; hub channel names Arabic |
| RTL | Admin inherits `html dir` |
| Bidi | Report details / notes `dir=auto` |
| Search | Unchanged |
| Moderation | Assist chips + templates; humans still decide |
| Unresolved | Full admin i18n; richer playbooks; DB search |
