import { afterEach, describe, expect, it } from "vitest";
import { parseAdminIds } from "@/lib/admin/authz";

describe("parseAdminIds", () => {
  afterEach(() => {
    delete process.env.ADMIN_USER_IDS;
  });

  it("parses CSV and trims", () => {
    process.env.ADMIN_USER_IDS = " a ,b,  ,c ";
    expect([...parseAdminIds()].sort()).toEqual(["a", "b", "c"]);
  });

  it("returns empty set when unset", () => {
    delete process.env.ADMIN_USER_IDS;
    expect(parseAdminIds().size).toBe(0);
  });
});
