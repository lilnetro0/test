import { describe, expect, it } from "vitest";
import {
  MOD_RESPONSE_TEMPLATES,
  scanArabicAssistSignals,
} from "@/lib/moderation/arabic-assist";
import { MENA_HUB_TEXT_TEMPLATE, MENA_HUB_VOICE_TEMPLATE } from "@/lib/hub-templates";

describe("scanArabicAssistSignals", () => {
  it("returns empty for clean text", () => {
    expect(scanArabicAssistSignals("نحتاج لاعبين رانكد")).toEqual([]);
  });

  it("flags arabizi and Arabic-script signals without throwing", () => {
    const hits = scanArabicAssistSignals("ksm يا خرا this is bad");
    expect(hits.some((h) => h.id.startsWith("arabizi"))).toBe(true);
  });

  it("flags stretched disguise", () => {
    expect(scanArabicAssistSignals("ااااااه").some((h) => h.id === "stretched")).toBe(true);
  });
});

describe("templates", () => {
  it("has bilingual mod templates and hub channels", () => {
    expect(MOD_RESPONSE_TEMPLATES.length).toBeGreaterThanOrEqual(3);
    expect(MENA_HUB_TEXT_TEMPLATE.some((c) => c.slug === "lfg")).toBe(true);
    expect(MENA_HUB_VOICE_TEMPLATE.some((c) => c.slug === "lobby")).toBe(true);
  });
});
