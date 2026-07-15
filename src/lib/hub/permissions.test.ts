import { describe, expect, it } from "vitest";
import { canDeleteMessage, canKickTarget, hubCaps } from "@/lib/hub/permissions";

describe("hubCaps", () => {
  it("platform admin gets all caps", () => {
    expect(hubCaps("member", true)).toEqual({
      canPin: true,
      canDeleteAny: true,
      canKick: true,
      canSetRole: true,
    });
  });
  it("member is limited; mod can moderate; only hub admin sets roles", () => {
    expect(hubCaps("member", false).canPin).toBe(false);
    expect(hubCaps("mod", false).canKick).toBe(true);
    expect(hubCaps("mod", false).canSetRole).toBe(false);
    expect(hubCaps("admin", false).canSetRole).toBe(true);
  });
});

describe("canKickTarget", () => {
  it("enforces hierarchy", () => {
    expect(canKickTarget("member", "member", false)).toBe(false);
    expect(canKickTarget("mod", "member", false)).toBe(true);
    expect(canKickTarget("mod", "admin", false)).toBe(false);
    expect(canKickTarget("admin", "admin", false)).toBe(true);
    expect(canKickTarget("member", "admin", true)).toBe(true);
  });
});

describe("canDeleteMessage", () => {
  it("allows author or mod delete-any", () => {
    const member = hubCaps("member", false);
    expect(canDeleteMessage(member, "a", "a")).toBe(true);
    expect(canDeleteMessage(member, "a", "b")).toBe(false);
    expect(canDeleteMessage(hubCaps("mod", false), "a", "b")).toBe(true);
  });
});
