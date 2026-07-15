import { describe, expect, it } from "vitest";
import { mapRateLimitError, withMappedDbError } from "@/lib/rate-limit";

describe("mapRateLimitError", () => {
  it("returns null for unrelated messages", () => {
    expect(mapRateLimitError("permission denied")).toBeNull();
    expect(mapRateLimitError(null)).toBeNull();
  });

  it("maps channel / dm / edit / reaction / report / friend / voice", () => {
    expect(mapRateLimitError("rate_limited:channel")).toMatch(/sending/i);
    expect(mapRateLimitError("RATE_LIMITED:dm_send")).toMatch(/sending/i);
    expect(mapRateLimitError("rate_limited:edit_foo")).toMatch(/editing/i);
    expect(mapRateLimitError("rate_limited:reaction_add")).toMatch(/reacting/i);
    expect(mapRateLimitError("rate_limited:report_hour")).toMatch(/reports this hour/i);
    expect(mapRateLimitError("rate_limited:report_target")).toMatch(/already reported/i);
    expect(mapRateLimitError("rate_limited:friend_request")).toMatch(/friend/i);
    expect(mapRateLimitError("rate_limited:voice_mint")).toMatch(/voice/i);
    expect(mapRateLimitError("rate_limited:other")).toMatch(/Too many requests/i);
  });
});

describe("withMappedDbError", () => {
  it("prefers mapped rate limit copy", () => {
    expect(withMappedDbError("rate_limited:channel", "fallback")).toMatch(/sending/i);
  });
  it("falls back to message then fallback", () => {
    expect(withMappedDbError(" boom ", "fallback")).toBe("boom");
    expect(withMappedDbError("", "fallback")).toBe("fallback");
  });
});
