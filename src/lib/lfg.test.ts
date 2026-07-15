import { describe, expect, it } from "vitest";
import { isLfgChannel } from "@/lib/lfg";

describe("isLfgChannel", () => {
  it("matches slug lfg", () => {
    expect(isLfgChannel({ slug: "lfg", name: "general" })).toBe(true);
  });

  it("matches Latin / Arabic names", () => {
    expect(isLfgChannel({ name: "LFG-ranked" })).toBe(true);
    expect(isLfgChannel({ name: "بحث عن فريق" })).toBe(true);
    expect(isLfgChannel({ name: "البحث عن فريق — رانكد" })).toBe(true);
  });

  it("rejects unrelated channels", () => {
    expect(isLfgChannel({ slug: "general", name: "عام" })).toBe(false);
    expect(isLfgChannel({ name: "ranked-chat" })).toBe(false);
  });
});
