/**
 * Platform admin authorization (Phase 3).
 * - Durable source of truth: public.platform_roles
 * - ADMIN_USER_IDS: server-only bootstrap / break-glass (never VITE_)
 * - Mutations still use service role; this module only decides who may call them
 */

import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export type AdminAuthFail = {
  ok: false;
  error: string;
  code: "AUTH" | "FORBIDDEN" | "CONFIG";
};

export type AdminAuthOk = { ok: true; userId: string };

export type AdminAuthResult = AdminAuthOk | AdminAuthFail;

export function parseAdminIds(): Set<string> {
  const raw = (process.env.ADMIN_USER_IDS as string | undefined)?.trim() ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

async function hasPlatformAdminRow(
  client: NonNullable<ReturnType<typeof getSupabaseServerClient>>,
  userId: string,
): Promise<boolean> {
  const { data, error } = await client
    .from("platform_roles")
    .select("user_id")
    .eq("user_id", userId)
    .eq("role", "platform_admin")
    .maybeSingle();

  if (error) {
    // Migration not applied yet — fall through to env allowlist.
    console.warn("[admin/authz] platform_roles read failed:", error.message);
    return false;
  }
  return Boolean(data);
}

async function bootstrapPlatformAdmin(userId: string): Promise<void> {
  const admin = getSupabaseAdminClient();
  if (!admin) return;

  const { error } = await admin.from("platform_roles").upsert(
    {
      user_id: userId,
      role: "platform_admin",
      granted_by: null,
    },
    { onConflict: "user_id" },
  );
  if (error) {
    console.warn("[admin/authz] bootstrap platform_roles failed:", error.message);
    return;
  }

  await writeAdminAudit({
    actorId: userId,
    action: "platform_role.bootstrap",
    targetType: "user",
    targetId: userId,
    meta: { source: "ADMIN_USER_IDS" },
  });
}

/**
 * Gate for all admin createServerFn handlers.
 * OK if user has platform_roles.platform_admin OR is listed in ADMIN_USER_IDS
 * (env list also upserts into platform_roles when service role is available).
 */
export async function requireAdmin(accessToken: string): Promise<AdminAuthResult> {
  const client = getSupabaseServerClient(accessToken);
  if (!client) {
    return { ok: false, error: "Supabase not configured", code: "CONFIG" };
  }

  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data.user) {
    return { ok: false, error: "Not authenticated", code: "AUTH" };
  }

  const userId = data.user.id;

  if (await hasPlatformAdminRow(client, userId)) {
    return { ok: true, userId };
  }

  const envAdmins = parseAdminIds();
  if (envAdmins.has(userId)) {
    await bootstrapPlatformAdmin(userId);
    return { ok: true, userId };
  }

  return { ok: false, error: "Not an admin", code: "FORBIDDEN" };
}

export type AuditInput = {
  actorId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  meta?: Record<string, Json | undefined>;
};

/** Append-only audit row. Never throws / never fails the caller. */
export async function writeAdminAudit(input: AuditInput): Promise<void> {
  try {
    const admin = getSupabaseAdminClient();
    if (!admin) return;

    const meta: Record<string, Json> = {};
    if (input.meta) {
      for (const [k, v] of Object.entries(input.meta)) {
        if (v !== undefined) meta[k] = v;
      }
    }

    const { error } = await admin.from("admin_audit_log").insert({
      actor_id: input.actorId,
      action: input.action,
      target_type: input.targetType ?? null,
      target_id: input.targetId ?? null,
      meta,
    });
    if (error) {
      console.warn("[admin/authz] audit insert failed:", error.message);
    }
  } catch (e) {
    console.warn("[admin/authz] audit insert error:", e);
  }
}
