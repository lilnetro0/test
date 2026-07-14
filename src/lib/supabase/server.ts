import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

/**
 * Server-only admin client (service role). Never import from route components.
 * Returns null when service role or URL is missing.
 */
export function getSupabaseAdminClient(): SupabaseClient<Database> | null {
  const url = getSupabaseUrl();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined)?.trim();
  if (!url || !serviceKey) return null;

  return createClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Server client that acts as the current user when a JWT is provided.
 * Falls back to anon key + user Authorization header for RLS-scoped reads.
 */
export function getSupabaseServerClient(accessToken?: string): SupabaseClient<Database> | null {
  const url = getSupabaseUrl();
  const anon = getSupabaseAnonKey();
  if (!url || !anon) return null;

  return createClient<Database>(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  });
}
