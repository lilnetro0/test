import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import {
  assertProductionClientEnv,
  assertProductionServerEnv,
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from "./env";

/**
 * Server-only admin client (service role). Never import from route components.
 * Dev/preview: returns null when service role or URL is missing.
 * Production: throws if service role / public keys are missing (fail closed).
 */
export function getSupabaseAdminClient(): SupabaseClient<Database> | null {
  assertProductionServerEnv();

  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceRoleKey();
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
 * Production: requires public Vite keys (not service role).
 */
export function getSupabaseServerClient(accessToken?: string): SupabaseClient<Database> | null {
  assertProductionClientEnv();

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
