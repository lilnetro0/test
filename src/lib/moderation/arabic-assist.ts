/**
 * Assistive Arabic / Arabizi signals for moderators (AF3).
 * NEVER auto-ban or auto-delete from these alone — humans decide.
 * Preserve original report text; this only highlights possible matches.
 */

export type AssistSignal = {
  id: string;
  labelEn: string;
  labelAr: string;
  /** Matched snippet (from original text) when available */
  sample?: string;
};

/** Conservative patterns — expand via MENA-MODERATION-GUIDE playbooks. */
const RULES: { id: string; labelEn: string; labelAr: string; re: RegExp }[] = [
  {
    id: "arabizi_ksm",
    labelEn: "Possible Arabizi insult (ksm…)",
    labelAr: "إشارة عربيزي محتملة (كس…)",
    re: /\bk+\s*s+\s*m\b|\bksm\b|\bk\*sm\b/i,
  },
  {
    id: "arabizi_5ra",
    labelEn: "Possible Arabizi insult (5ra…)",
    labelAr: "إشارة عربيزي محتملة (خرا…)",
    re: /\b5+\s*r+a+\b|\bkhara\b|\bk\*ara\b/i,
  },
  {
    id: "ar_slur_script",
    labelEn: "Possible Arabic-script curse word",
    labelAr: "كلمة بذيئة محتملة بالعربية",
    re: /كس ام|كس أم|يا ابن|يا شرموط|شرموطة|عرص|منيوك|لبوة|قحبة/i,
  },
  {
    id: "nationality_attack",
    labelEn: "Possible nationality / ethnic attack framing",
    labelAr: "إشارة محتملة لتهجم قومي/عرقي",
    re: /يا سعودي ابن|يا مصري ابن|يا اماراتي ابن|يا خليجي ابن|كل ال(سعاودة|مصريين|الشوام)/i,
  },
  {
    id: "sectarian",
    labelEn: "Possible sectarian framing",
    labelAr: "إشارة محتملة لخطاب طائفي",
    re: /يا شيعي|يا سني كافر|روافض|نواصب/i,
  },
  {
    id: "stretched",
    labelEn: "Stretched / disguised characters",
    labelAr: "تمطيط أحرف / تمويه",
    re: /(.)\1{4,}|[\u0640]{3,}/,
  },
];

export function scanArabicAssistSignals(text: string | null | undefined): AssistSignal[] {
  const raw = (text ?? "").trim();
  if (!raw) return [];
  const out: AssistSignal[] = [];
  for (const rule of RULES) {
    const m = raw.match(rule.re);
    if (m) {
      out.push({
        id: rule.id,
        labelEn: rule.labelEn,
        labelAr: rule.labelAr,
        sample: m[0]?.slice(0, 40),
      });
    }
  }
  return out;
}

export type ModResponseTemplate = {
  id: string;
  en: string;
  ar: string;
};

/** Predefined Arabic-first moderator note templates (paste into resolution note). */
export const MOD_RESPONSE_TEMPLATES: ModResponseTemplate[] = [
  {
    id: "warn",
    en: "Warning issued: please keep chat respectful. Repeat abuse may lead to a ban.",
    ar: "تحذير: يُرجى الالتزام بالاحترام في الدردشة. تكرار المخالفة قد يؤدي إلى الحظر.",
  },
  {
    id: "resolved_action",
    en: "Action taken on the reported content. Thank you for the report.",
    ar: "تم اتخاذ إجراء بشأن المحتوى المبلَّغ عنه. شكرًا على البلاغ.",
  },
  {
    id: "dismiss_no_violation",
    en: "Reviewed — no community guidelines violation found in context.",
    ar: "تمت المراجعة — لم يُرصد انتهاك لإرشادات المجتمع في هذا السياق.",
  },
  {
    id: "ban",
    en: "Account restricted for violating community guidelines (harassment / abuse).",
    ar: "تم تقييد الحساب لمخالفة إرشادات المجتمع (مضايقة / إساءة).",
  },
];
