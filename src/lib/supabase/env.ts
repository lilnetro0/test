/** Public env helpers. Safe to import from client or server. */

function isProdBuild(): boolean {
  return import.meta.env.PROD === true;
}

function mockFlagEnabled(): boolean {
  const flag = (import.meta.env.VITE_USE_MOCK as string | undefined)?.trim().toLowerCase();
  return flag === "1" || flag === "true";
}

export function getSupabaseUrl(): string | undefined {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  return url?.trim() || undefined;
}

export function getSupabaseAnonKey(): string | undefined {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  return key?.trim() || undefined;
}

export function getSupabaseServiceRoleKey(): string | undefined {
  if (typeof process === "undefined") return undefined;
  return (process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined)?.trim() || undefined;
}

/** True when URL + anon key are present (auth can talk to Supabase). */
export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

/**
 * Fail closed in production builds: require live Supabase keys and forbid mock flag.
 * Call once at app bootstrap; safe to call repeatedly.
 */
export function assertProductionClientEnv(): void {
  if (!isProdBuild()) return;

  if (mockFlagEnabled()) {
    throw new Error(
      "VITE_USE_MOCK is set but production builds must use live Supabase data. Remove VITE_USE_MOCK from the production environment.",
    );
  }

  if (!isSupabaseConfigured()) {
    throw new Error(
      "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in a production build. Mock/demo mode is disabled in production.",
    );
  }
}

/**
 * Server-only fail-closed checks for production.
 * Requires public Supabase keys plus SUPABASE_SERVICE_ROLE_KEY (never VITE_).
 */
export function assertProductionServerEnv(): void {
  if (!isProdBuild()) return;
  assertProductionClientEnv();

  if (!getSupabaseServiceRoleKey()) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY in a production build. Set it as a server-only secret (never VITE_).",
    );
  }
}

/**
 * Live when Supabase is configured.
 * Dev/preview: force mock with VITE_USE_MOCK=1 / true, or when keys are missing.
 * Production: never mocks — assertProductionClientEnv / shouldUseMockData enforce live only.
 */
export function shouldUseMockData(): boolean {
  if (isProdBuild()) {
    assertProductionClientEnv();
    return false;
  }
  if (!isSupabaseConfigured()) return true;
  return mockFlagEnabled();
}
