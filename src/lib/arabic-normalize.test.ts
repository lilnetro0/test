import { describe, expect, it } from "vitest";
import {
  arabicSearchIncludes,
  expandArabicSearchNormTerms,
  expandArabicSearchTerms,
  normalizeArabicForSearch,
} from "@/lib/arabic-normalize";

describe("normalizeArabicForSearch", () => {
  it("strips tatweel and diacritics", () => {
    expect(normalizeArabicForSearch("مَرْحَبًا")).toBe(normalizeArabicForSearch("مرحبا"));
    expect(normalizeArabicForSearch("الـسلام")).toContain("السلام");
  });

  it("unifies alef / yeh / teh marbuta", () => {
    expect(normalizeArabicForSearch("أحمد")).toBe(normalizeArabicForSearch("احمد"));
    expect(normalizeArabicForSearch("على")).toBe(normalizeArabicForSearch("علي"));
    expect(normalizeArabicForSearch("مدرسة")).toBe(normalizeArabicForSearch("مدرسه"));
  });

  it("folds Arabic-Indic digits", () => {
    expect(normalizeArabicForSearch("١٢٣")).toBe("123");
  });
});

describe("arabicSearchIncludes", () => {
  it("matches mixed queries", () => {
    expect(arabicSearchIncludes("Valorant جدة", "valorant")).toBe(true);
    expect(arabicSearchIncludes("فالورانت", "Valorant")).toBe(false); // different scripts without alias
    expect(arabicSearchIncludes("نحتاج Support", "support")).toBe(true);
  });
});

describe("expandArabicSearchTerms", () => {
  it("includes aliases for Arabic game names", () => {
    const terms = expandArabicSearchTerms("ببجي");
    expect(terms.some((t) => /pubg/i.test(t))).toBe(true);
    expect(terms).toContain("ببجي");
  });
});

describe("expandArabicSearchNormTerms", () => {
  it("returns folded terms for body_search_norm queries", () => {
    const terms = expandArabicSearchNormTerms("مَرْحَبًا");
    expect(terms).toContain(normalizeArabicForSearch("مرحبا"));
    const pubg = expandArabicSearchNormTerms("ببجي");
    expect(pubg.some((t) => t.includes("pubg"))).toBe(true);
  });
});
