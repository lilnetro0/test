/**
 * Default MENA / Arabic-first hub channel set (AF3).
 * Display names in Arabic; slugs Latin for URLs / LiveKit.
 * Glossary: docs/ARABIC-TERMINOLOGY.md
 */

export type HubTextChannelTemplate = {
  name: string;
  slug: string;
  topic: string | null;
  position: number;
};

export type HubVoiceChannelTemplate = {
  name: string;
  slug: string;
  position: number;
  capacity?: number;
};

/** Official / regional hub starter pack — apply from admin Channels tab. */
export const MENA_HUB_TEXT_TEMPLATE: HubTextChannelTemplate[] = [
  { name: "عام", slug: "general", topic: "الدردشة العامة للمجتمع", position: 0 },
  { name: "البحث عن فريق", slug: "lfg", topic: "ابحث عن فريق أو اعلام جاهزيتك", position: 1 },
  { name: "الرانكد", slug: "ranked", topic: "نقاش الرانكد والتحديات", position: 2 },
  { name: "الكاجوال", slug: "casual", topic: "لعب مرتاح بدون ضغط", position: 3 },
  { name: "الأخبار", slug: "news", topic: "تحديثات اللعبة والباتشات", position: 4 },
  { name: "المساعدة", slug: "help", topic: "أسئلة المجتمع والإعدادات", position: 5 },
];

export const MENA_HUB_VOICE_TEMPLATE: HubVoiceChannelTemplate[] = [
  { name: "صوت عام", slug: "lobby", position: 0, capacity: 8 },
  { name: "الرانكد", slug: "ranked-vc", position: 1, capacity: 5 },
  { name: "فريق", slug: "squad", position: 2, capacity: 5 },
];
