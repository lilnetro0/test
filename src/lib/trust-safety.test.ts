import { describe, expect, it } from "vitest";
import { isReportReason, REPORT_REASONS } from "@/lib/trust-safety";

describe("isReportReason", () => {
  it("accepts allowlist only", () => {
    for (const r of REPORT_REASONS) expect(isReportReason(r)).toBe(true);
    expect(isReportReason("hate")).toBe(false);
    expect(isReportReason("")).toBe(false);
  });
});
