/**
 * MENA / regional discovery helpers — Arabic-first Phase 2.
 * Region codes: ISO 3166-1 alpha-2 plus `MENA` (pan-region) and empty = unset.
 */

export type RegionCode =
  | "SA"
  | "AE"
  | "EG"
  | "KW"
  | "QA"
  | "BH"
  | "OM"
  | "JO"
  | "LB"
  | "IQ"
  | "MA"
  | "TN"
  | "DZ"
  | "MENA"
  | "";

export const REGION_STORAGE_KEY = "nexus.region";

/** Countries + pan-MENA for prefs / hub tags. */
export const REGION_OPTIONS: { code: Exclude<RegionCode, "">; en: string; ar: string }[] = [
  { code: "MENA", en: "MENA (wider)", ar: "الشرق الأوسط وشمال أفريقيا" },
  { code: "SA", en: "Saudi Arabia", ar: "السعودية" },
  { code: "AE", en: "United Arab Emirates", ar: "الإمارات" },
  { code: "EG", en: "Egypt", ar: "مصر" },
  { code: "KW", en: "Kuwait", ar: "الكويت" },
  { code: "QA", en: "Qatar", ar: "قطر" },
  { code: "BH", en: "Bahrain", ar: "البحرين" },
  { code: "OM", en: "Oman", ar: "عُمان" },
  { code: "JO", en: "Jordan", ar: "الأردن" },
  { code: "LB", en: "Lebanon", ar: "لبنان" },
  { code: "IQ", en: "Iraq", ar: "العراق" },
  { code: "MA", en: "Morocco", ar: "المغرب" },
  { code: "TN", en: "Tunisia", ar: "تونس" },
  { code: "DZ", en: "Algeria", ar: "الجزائر" },
];

const MENA_COUNTRY = new Set(
  REGION_OPTIONS.filter((o) => o.code !== "MENA").map((o) => o.code),
);

/** Timezones that imply Arabic-first default when no lang preference is stored. */
export const MENA_TIMEZONES = new Set([
  "Asia/Riyadh",
  "Asia/Dubai",
  "Asia/Qatar",
  "Asia/Kuwait",
  "Asia/Bahrain",
  "Asia/Muscat",
  "Asia/Amman",
  "Asia/Beirut",
  "Asia/Baghdad",
  "Africa/Cairo",
  "Africa/Casablanca",
  "Africa/Tunis",
  "Africa/Algiers",
]);

export function isValidRegionCode(value: string | null | undefined): value is Exclude<RegionCode, ""> {
  if (!value) return false;
  return REGION_OPTIONS.some((o) => o.code === value);
}

export function normalizeRegionCode(value: string | null | undefined): RegionCode {
  if (!value) return "";
  const v = value.trim().toUpperCase();
  if (v === "MENA") return "MENA";
  if (isValidRegionCode(v)) return v;
  return "";
}

export function readStoredRegion(): RegionCode {
  try {
    return normalizeRegionCode(window.localStorage.getItem(REGION_STORAGE_KEY));
  } catch {
    return "";
  }
}

export function persistRegion(code: RegionCode): void {
  try {
    if (!code) window.localStorage.removeItem(REGION_STORAGE_KEY);
    else window.localStorage.setItem(REGION_STORAGE_KEY, code);
  } catch {
    /* ignore */
  }
}

/** Soft region→Arabic hint for first launch (guidelines: prefs → browser → region → EN). */
export function detectMenaRegionHint(): boolean {
  try {
    if (readStoredRegion()) return true;
  } catch {
    /* ignore */
  }
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && MENA_TIMEZONES.has(tz)) return true;
  } catch {
    /* ignore */
  }
  try {
    const loc = (navigator.language || "").toLowerCase();
    if (/-sa\b|-ae\b|-eg\b|-kw\b|-qa\b|-bh\b|-om\b|-jo\b|-lb\b|-iq\b|-ma\b|-tn\b|-dz\b/.test(loc)) {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/**
 * Discover filter: selected UI chip vs hub.region.
 * - `all` / empty: pass
 * - Hub global (null/empty): always include (so catalog stays findable)
 * - `MENA` chip: hub MENA or any MENA country
 * - Country chip: hub that country, MENA, or that country’s gulf peers only if exact
 */
export function hubMatchesRegionFilter(
  hubRegion: string | null | undefined,
  filter: string,
): boolean {
  const f = normalizeRegionCode(filter);
  if (!f) return true;
  const h = normalizeRegionCode(hubRegion ?? "");
  if (!h) return true; // global hubs stay visible
  if (f === "MENA") return h === "MENA" || MENA_COUNTRY.has(h as Exclude<RegionCode, "" | "MENA">);
  if (h === "MENA") return true;
  return h === f;
}

export function regionLabel(code: RegionCode, lang: "en" | "ar"): string {
  if (!code) return lang === "ar" ? "غير محدد" : "Not set";
  const row = REGION_OPTIONS.find((o) => o.code === code);
  if (!row) return code;
  return lang === "ar" ? row.ar : row.en;
}
