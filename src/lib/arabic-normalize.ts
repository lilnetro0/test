/**
 * Arabic search normalization — MENA / Arabic-first.
 * For search indexes only. Do not use to rewrite stored usernames or report text.
 * SQL twin: `public.normalize_arabic_for_search` in
 * `supabase/migrations/20260715240000_af4_arabic_search_norm.sql` — keep fold rules aligned.
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

/**
 * Expand a user query with folded form + game aliases (discover / message search).
 * Returns unique terms suitable for `ilike` OR-filters; always includes the original query.
 */
export function expandArabicSearchTerms(query: string): string[] {
  const raw = query.trim();
  if (!raw) return [];
  const folded = normalizeArabicForSearch(raw);
  const terms = new Set<string>([raw]);
  if (folded && folded !== raw.toLowerCase()) terms.add(folded);

  for (const [canonical, aliases] of Object.entries(GAME_SEARCH_ALIASES)) {
    const group = [canonical, ...aliases];
    const groupFolded = group.map(normalizeArabicForSearch);
    const hit = groupFolded.some(
      (a) => a === folded || (folded.length >= 2 && (a.includes(folded) || folded.includes(a))),
    );
    if (hit) {
      for (const g of group) terms.add(g);
    }
  }

  return [...terms].filter((t) => t.length > 0).slice(0, 8);
}

/**
 * Terms already folded for querying `body_search_norm` (AF4 DB column).
 * Prefer this over raw expand when searching the normalized index.
 */
export function expandArabicSearchNormTerms(query: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const term of expandArabicSearchTerms(query)) {
    const n = normalizeArabicForSearch(term).replace(/[%_]/g, "");
    if (n.length < 1 || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out.slice(0, 8);
}
