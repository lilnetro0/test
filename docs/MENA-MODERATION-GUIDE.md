# MENA moderation guide — Nexus

Arabic-speaking communities need **first-class** moderation — not English keyword filters with AR bolted on.

Product policy: [`ARABIC-PRODUCT-GUIDELINES.md`](ARABIC-PRODUCT-GUIDELINES.md) §§14–15, 18.  
Technical trust surface: [`TRUST-SAFETY.md`](TRUST-SAFETY.md).

## Principles

1. Automated detection **assists**; humans make irreversible bans / deletions.  
2. Preserve **original** reported text; never replace it with a normalized form in the case record. Show both if you store a normalized index.  
3. Context matters (thread, voice session, repeated harassment, nationality/sectarian framing).  
4. 13+ defaults: easy report/block; no precise location; no public exact age; friends-only DMs when age warrants it.  

## What to cover in filters / playbooks (when building auto-assist)

- Arabic profanity and regional variants (Gulf / Saudi / Egyptian / Levantine / North Africa)  
- Arabizi and mixed Arabic–English abuse  
- Stretched characters, punctuation substitution, disguised slurs  
- Nationality- and sect-based harassment  
- Voice-session reports (timestamp + channel)  

Do **not** ship an English-only wordlist as “moderation complete.”

## Moderator tools (requirements)

Moderators must eventually be able to:

- Search Arabic report detail and message bodies  
- Review mixed-direction messages safely  
- Filter queues by language / broad region where legally appropriate  
- Write Arabic moderator notes and warnings  
- Use predefined Arabic response templates  
- See original + optional normalized text  

**Today:** report reasons + guidelines are localized; admin Reports queue has AR chrome + assist chips + response templates (AF3); voice session reports store `voice_channel_id` (AF10) plus details stamp (AF8). Remaining: participant picker, richer playbooks.

## Escalation

- Ban / unban via admin tools + `profiles.banned_at`  
- Appeal / support copy in Arabic: `/help` (`help.appeal`) → `safety@nexus.app`  

## Build order (incremental)

1. Keep reporter UX excellent in AR (done baseline).  
2. Admin AR chrome + notes.  
3. Assistive Arabic / Arabizi signals (never auto-ban alone).  
4. Voice report attach context.
