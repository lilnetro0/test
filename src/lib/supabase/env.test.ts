import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("assertProductionClientEnv / shouldUseMockData", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("dev with missing keys prefers mock", async () => {
    vi.stubEnv("PROD", false);
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");
    const { shouldUseMockData } = await import("@/lib/supabase/env");
    expect(shouldUseMockData()).toBe(true);
  });

  it("prod forbids VITE_USE_MOCK", async () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_USE_MOCK", "1");
    vi.stubEnv("VITE_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon");
    const { assertProductionClientEnv } = await import("@/lib/supabase/env");
    expect(() => assertProductionClientEnv()).toThrow(/VITE_USE_MOCK/);
  });

  it("prod requires supabase keys", async () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_USE_MOCK", "");
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");
    const { assertProductionClientEnv } = await import("@/lib/supabase/env");
    expect(() => assertProductionClientEnv()).toThrow(/VITE_SUPABASE/);
  });
});
