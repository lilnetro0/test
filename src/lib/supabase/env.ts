/** Public env helpers. Safe to import from client or server. */

export function getSupabaseUrl(): string | undefined {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  return url?.trim() || undefined;
}

export function getSupabaseAnonKey(): string | undefined {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  return key?.trim() || undefined;
}

/** True when URL + anon key are present (auth can talk to Supabase). */
export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

/**
 * Live when Supabase is configured.
 * Force mock with VITE_USE_MOCK=1 / true, or when keys are missing.
 */
export function shouldUseMockData(): boolean {
  if (!isSupabaseConfigured()) return true;
  const flag = (import.meta.env.VITE_USE_MOCK as string | undefined)?.trim().toLowerCase();
  if (flag === "1" || flag === "true") return true;
  return false;
}
