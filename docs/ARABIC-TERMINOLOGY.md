# Arabic terminology glossary — Nexus

**Source of truth** for core UI / product terms. Prefer these over ad-hoc translations.

Tone: Modern Standard Arabic, clear and gamer-friendly — not stiff bureaucratic MSA, not forced slang.

| English | Approved Arabic | Context | Avoid / discouraged |
|---------|-----------------|---------|---------------------|
| Hubs (nav) | المراكز | Bottom dock / home | السيرفرات (Discord calque) |
| Discover | اكتشف | Discover route | الاستكشاف الثقيل / تصفح فقط as sole nav |
| Direct messages / DMs | الرسائل الخاصة | Dock + DM route | المحادثات الخاصة الطويلة |
| Notifications | الإشعارات | Dock + list | التنبيهات alone if confusing with system alerts |
| Friends | الأصدقاء | Social | الرفاق (ok casually, not primary UI) |
| Settings | الإعدادات | Settings | الضبط |
| Profile | الملف الشخصي | Me / profile | البروفايل as sole official label (ok in chat UGC) |
| Voice channels | القنوات الصوتية | Hub sidebar / voice | روم الصوت as sole UI (ok in UGC) |
| Text channels | القنوات النصية | Hub | الشات alone |
| Join hub / community | انضم إلى المجتمع | Discover CTA | انضمام إلى السيرفر |
| Looking for team / LFG | البحث عن فريق | Future channels / filters | LFG Latin-only as sole label |
| Ranked | الرانكد | Mode filter / channel template | التنافسي فقط when players say رانكد |
| Casual | الكاجوال | Mode filter | العشوائي when meaning casual play |
| Tournaments | البطولات | Events | التورنمنت as sole official (ok UGC) |
| News | الأخبار | Channel template | — |
| Updates | التحديثات | Channel template | — |
| Help | المساعدة | Channel / help route | العون |
| Online / connected now | متصل الآن | Presence | أونلاين only as dual (ok UGC) |
| Mute | كتم الصوت | Voice dock | ميوت as sole UI |
| Deafen | كتم السماعة | Voice dock | — |
| Report | بلاغ | Safety | إبلاغ ok |
| Block | حظر | Friends / safety | بلوك as sole UI |
| Messages | الرسائل | Generic | مسجات |
| Search | بحث | Discover / message search | فتّش as sole UI |
| Language | اللغة | Settings | — |
| Account | الحساب | Settings | — |
| Privacy & safety | الخصوصية والسلامة | Settings | الأمان alone |

## Game / platform names

Keep official Latin titles where users expect them (Valorant, PUBG, PS5). Arabic transliterations are for **search synonyms**, not forced rebranding of hub titles.

## Process

When adding a new user-visible string:

1. Add EN + AR keys to `src/lib/i18n.tsx` in the same change.  
2. If it is a recurring product noun, add a row here.  
3. Prefer existing glossary over synonyms.
