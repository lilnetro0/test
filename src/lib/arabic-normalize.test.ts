import { describe, expect, it } from "vitest";
import {
  arabicSearchIncludes,
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
