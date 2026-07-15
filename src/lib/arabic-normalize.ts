/**
 * Arabic search normalization — MENA / Arabic-first.
 * For search indexes only. Do not use to rewrite stored usernames or report text.
 */

/** Strip tatweel/diacritics and unify common alef / yeh / teh-marbuta forms. */
export function normalizeArabicForSearch(input: string): string {
  let s = input.normalize("NFKC");
  // Tatweel
  s = s.replace(/\u0640/g, "");
  // Combining Arabic diacritics + Quranic marks (common range)
  s = s.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "");
  // Alef variants → ا
  s = s.replace(/[أإآٱ]/g, "ا");
  // Yeh / alef maqsura
  s = s.replace(/ى/g, "ي");
  // Teh marbuta → heh (search folding only)
  s = s.replace(/ة/g, "ه");
  // Arabic-Indic digits → Western
  s = s.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  return s.toLowerCase();
}

/** Compare haystack/needle with Arabic folding + Latin lowercasing. */
export function arabicSearchIncludes(haystack: string, needle: string): boolean {
  if (!needle.trim()) return true;
  return normalizeArabicForSearch(haystack).includes(normalizeArabicForSearch(needle));
}

/**
 * Thin synonym map for discover / hub search (expand over time).
 * Keys and values are matched after normalizeArabicForSearch.
 */
export const GAME_SEARCH_ALIASES: Record<string, string[]> = {
  valorant: ["فالورانت", "فالورنت", "valorant"],
  "marvel rivals": ["مارفل رايفلز", "مارفل", "marvel rivals"],
  pubg: ["ببجي", "ببجي موبايل", "pubg"],
  fifa: ["فيفا", "fc", "fifa", "ea fc"],
  "whiteout survival": ["وايت اوت", "وايتآوت", "whiteout"],
};
