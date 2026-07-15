/**
 * Discover / command-palette hub matching (Arabic-first).
 * Prefers DB `name_search_norm` when present (AF13); falls back to client fold.
 */
import {
  arabicSearchIncludes,
  expandArabicSearchNormTerms,
  GAME_SEARCH_ALIASES,
  normalizeArabicForSearch,
} from "@/lib/arabic-normalize";
import { catalogGameId, type HubCard } from "@/lib/mock-data";

export function hubMatchesQuery(h: HubCard, query: string): boolean {
  const q = query.trim();
  if (!q) return true;

  const displayFields = [h.name, h.hubName, h.id, catalogGameId(h)];
  if (displayFields.some((f) => arabicSearchIncludes(f, q))) return true;

  const normFields = [h.nameSearchNorm, h.gameNameSearchNorm].filter(
    (x): x is string => Boolean(x && x.trim()),
  );
  if (normFields.length > 0) {
    const terms = expandArabicSearchNormTerms(q);
    if (terms.some((term) => normFields.some((f) => f.includes(term)))) {
      return true;
    }
  }

  const nq = normalizeArabicForSearch(q);
  for (const [canonical, aliases] of Object.entries(GAME_SEARCH_ALIASES)) {
    const group = [canonical, ...aliases].map(normalizeArabicForSearch);
    if (!group.some((a) => a.includes(nq) || nq.includes(a))) continue;
    if (displayFields.some((f) => group.some((a) => normalizeArabicForSearch(f).includes(a)))) {
      return true;
    }
    if (normFields.some((f) => group.some((a) => f.includes(a)))) {
      return true;
    }
  }
  return false;
}
