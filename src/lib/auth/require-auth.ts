/**
 * Authenticated user gate for self-service server fns (Phase 10).
 * Parallel to requireAdmin, without platform role checks.
 */

import { getSupabaseServerClient } from "@/lib/supabase/server";

export type AuthGateFail = {
  ok: false;
  error: string;
  code: "AUTH" | "CONFIG";
};

export type AuthGateOk = { ok: true; userId: string; email: string | null };

export type AuthGateResult = AuthGateOk | AuthGateFail;

export async function requireAuth(accessToken: string): Promise<AuthGateResult> {
  const client = getSupabaseServerClient(accessToken);
  if (!client) {
    return { ok: false, error: "Supabase not configured", code: "CONFIG" };
  }

  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data.user) {
    return { ok: false, error: "Not authenticated", code: "AUTH" };
  }

  return {
    ok: true,
    userId: data.user.id,
    email: data.user.email ?? null,
  };
}
