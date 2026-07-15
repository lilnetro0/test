import { describe, expect, it } from "vitest";
import {
  detectMenaRegionHint,
  hubMatchesRegionFilter,
  normalizeRegionCode,
} from "@/lib/regions";

describe("normalizeRegionCode", () => {
  it("accepts MENA countries and pan code", () => {
    expect(normalizeRegionCode("sa")).toBe("SA");
    expect(normalizeRegionCode("MENA")).toBe("MENA");
    expect(normalizeRegionCode("xx")).toBe("");
  });
});

describe("hubMatchesRegionFilter", () => {
  it("keeps global hubs visible under any filter", () => {
    expect(hubMatchesRegionFilter(null, "SA")).toBe(true);
    expect(hubMatchesRegionFilter("", "MENA")).toBe(true);
  });

  it("matches country and MENA soft rules", () => {
    expect(hubMatchesRegionFilter("SA", "SA")).toBe(true);
    expect(hubMatchesRegionFilter("MENA", "SA")).toBe(true);
    expect(hubMatchesRegionFilter("AE", "SA")).toBe(false);
    expect(hubMatchesRegionFilter("AE", "MENA")).toBe(true);
    expect(hubMatchesRegionFilter("SA", "MENA")).toBe(true);
  });
});

describe("detectMenaRegionHint", () => {
  it("runs without throwing in jsdom", () => {
    expect(typeof detectMenaRegionHint()).toBe("boolean");
  });
});
