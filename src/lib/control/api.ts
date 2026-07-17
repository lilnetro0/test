/**
 * Nexus Control — server API (P0–P6).
 * Auth: requireAdmin (platform_admin / ADMIN_USER_IDS).
 * Permissions: full PLATFORM_ADMIN_PERMISSIONS until fine-grained RBAC is enforced.
 */

import { createServerFn } from "@tanstack/react-start";
import { normalizeArabicForSearch } from "@/lib/arabic-normalize";
import { requireAdmin, writeAdminAudit } from "@/lib/admin/authz";
import { collectAppHealth, type AppHealthReport } from "@/lib/ops/health";
import { CONTROL_FLAG_CATALOG } from "@/lib/control/flags";
import { PLATFORM_ADMIN_PERMISSIONS, type ControlPermission } from "@/lib/control/permissions";
import {
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/supabase/env";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

function getLiveKitEnv(): { url: string; apiKey: string; apiSecret: string } | null {
  const url = (process.env.LIVEKIT_URL as string | undefined)?.trim();
  const apiKey = (process.env.LIVEKIT_API_KEY as string | undefined)?.trim();
  const apiSecret = (process.env.LIVEKIT_API_SECRET as string | undefined)?.trim();
  if (!url || !apiKey || !apiSecret) return null;
  return { url, apiKey, apiSecret };
}

function liveKitHttpHost(wsUrl: string): string {
  const u = new URL(wsUrl);
  if (u.protocol === "wss:") u.protocol = "https:";
  else if (u.protocol === "ws:") u.protocol = "http:";
  u.pathname = "";
  u.search = "";
  u.hash = "";
  return u.toString().replace(/\/$/, "");
}

function asProfile(
  v: { username: string; tag: string } | { username: string; tag: string }[] | null | undefined,
): { username: string; tag: string } | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

type Fail = { ok: false; error: string; code?: string };

export type ControlAccessOk = {
  ok: true;
  userId: string;
  permissions: ControlPermission[];
};

export const checkControlAccess = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string }) => data)
  .handler(async ({ data }): Promise<ControlAccessOk | Fail> => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) {
      return { ok: false, error: auth.error, code: auth.code };
    }
    return {
      ok: true,
      userId: auth.userId,
      permissions: [...PLATFORM_ADMIN_PERMISSIONS],
    };
  });

export type AuditLogRow = {
  id: string;
  actor_id: string;
  actor_username: string | null;
  actor_tag: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  meta: unknown;
  created_at: string;
};

export const listAuditLogs = createServerFn({ method: "POST" })
  .validator(
    (data: {
      accessToken: string;
      limit?: number;
      cursor?: string;
      action?: string;
      targetType?: string;
      targetId?: string;
      actorId?: string;
    }) => data,
  )
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; rows: AuditLogRow[]; nextCursor: string | null } | Fail> => {
      const auth = await requireAdmin(data.accessToken);
      if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };

      const admin = getSupabaseAdminClient();
      if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

      const limit = Math.min(Math.max(data.limit ?? 50, 1), 100);

      let q = admin
        .from("admin_audit_log")
        .select("id, actor_id, action, target_type, target_id, meta, created_at")
        .order("created_at", { ascending: false })
        .limit(limit + 1);

      if (data.cursor) {
        q = q.lt("created_at", data.cursor);
      }
      if (data.action?.trim()) {
        q = q.ilike("action", `%${data.action.trim()}%`);
      }
      if (data.targetType?.trim()) {
        q = q.eq("target_type", data.targetType.trim());
      }
      if (data.targetId?.trim()) {
        q = q.eq("target_id", data.targetId.trim());
      }
      if (data.actorId?.trim()) {
        q = q.eq("actor_id", data.actorId.trim());
      }

      const { data: rows, error } = await q;
      if (error) return { ok: false, error: error.message };

      const slice = (rows ?? []).slice(0, limit);
      const nextCursor =
        (rows ?? []).length > limit ? (slice[slice.length - 1]?.created_at ?? null) : null;

      const actorIds = [...new Set(slice.map((r) => r.actor_id))];
      const profiles =
        actorIds.length > 0
          ? await admin.from("profiles").select("id, username, tag").in("id", actorIds)
          : { data: [] as Array<{ id: string; username: string; tag: string }> };

      const byId = new Map((profiles.data ?? []).map((p) => [p.id, p]));

      return {
        ok: true,
        nextCursor,
        rows: slice.map((r) => {
          const p = byId.get(r.actor_id);
          return {
            id: r.id,
            actor_id: r.actor_id,
            actor_username: p?.username ?? null,
            actor_tag: p?.tag ?? null,
            action: r.action,
            target_type: r.target_type,
            target_id: r.target_id,
            meta: r.meta,
            created_at: r.created_at,
          };
        }),
      };
    },
  );

export const getAuditEvent = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; eventId: string }) => data)
  .handler(async ({ data }): Promise<{ ok: true; row: AuditLogRow } | Fail> => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };

    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

    const { data: row, error } = await admin
      .from("admin_audit_log")
      .select("id, actor_id, action, target_type, target_id, meta, created_at")
      .eq("id", data.eventId)
      .maybeSingle();

    if (error) return { ok: false, error: error.message };
    if (!row) return { ok: false, error: "Event not found", code: "NOT_FOUND" };

    const { data: profile } = await admin
      .from("profiles")
      .select("username, tag")
      .eq("id", row.actor_id)
      .maybeSingle();

    return {
      ok: true,
      row: {
        id: row.id,
        actor_id: row.actor_id,
        actor_username: profile?.username ?? null,
        actor_tag: profile?.tag ?? null,
        action: row.action,
        target_type: row.target_type,
        target_id: row.target_id,
        meta: row.meta,
        created_at: row.created_at,
      },
    };
  });

export type ControlSearchUser = {
  id: string;
  username: string;
  tag: string;
  banned_at: string | null;
};

export type ControlSearchHub = {
  id: string;
  slug: string;
  name: string;
  region: string | null;
  member_count: number;
};

export type ControlSearchGame = {
  id: string;
  name: string;
  short: string;
  category: string;
};

export type ControlSearchResult = {
  ok: true;
  q: string;
  users: ControlSearchUser[];
  hubs: ControlSearchHub[];
  games: ControlSearchGame[];
};

export const controlSearch = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; q: string; limit?: number }) => data)
  .handler(async ({ data }): Promise<ControlSearchResult | Fail> => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };

    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

    const qRaw = data.q.trim();
    if (qRaw.length < 1) {
      return { ok: true, q: qRaw, users: [], hubs: [], games: [] };
    }

    const limit = Math.min(Math.max(data.limit ?? 12, 1), 25);
    const norm = normalizeArabicForSearch(qRaw).replace(/[%_,]/g, " ").trim();
    const like = `%${norm}%`;
    const slugLike = `%${qRaw.toLowerCase().replace(/[%_,]/g, "").slice(0, 64)}%`;

    const users: ControlSearchUser[] = [];
    const tagMatch = qRaw.match(/^([A-Za-z0-9_\u0600-\u06FF]{2,32})#(\d{4})$/u);
    if (tagMatch) {
      const { data: exact } = await admin
        .from("profiles")
        .select("id, username, tag, banned_at")
        .eq("username_search_norm", normalizeArabicForSearch(tagMatch[1]))
        .eq("tag", tagMatch[2])
        .maybeSingle();
      if (exact) users.push(exact);
    } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(qRaw)) {
      const { data: byId } = await admin
        .from("profiles")
        .select("id, username, tag, banned_at")
        .eq("id", qRaw)
        .maybeSingle();
      if (byId) users.push(byId);
    } else if (norm.length > 0) {
      const { data: rows } = await admin
        .from("profiles")
        .select("id, username, tag, banned_at")
        .or(`username_search_norm.ilike.${like},display_name_search_norm.ilike.${like}`)
        .limit(limit);
      users.push(...(rows ?? []));
    }

    const [hubsRes, gamesRes] = await Promise.all([
      norm.length > 0 || slugLike.length > 2
        ? admin
            .from("hubs")
            .select("id, slug, name, region, member_count")
            .or(`name_search_norm.ilike.${like},slug.ilike.${slugLike}`)
            .limit(limit)
        : Promise.resolve({ data: [] as ControlSearchHub[] }),
      norm.length > 0 || slugLike.length > 2
        ? admin
            .from("games")
            .select("id, name, short, category")
            .or(`name_search_norm.ilike.${like},id.ilike.${slugLike},short.ilike.${slugLike}`)
            .limit(limit)
        : Promise.resolve({ data: [] as ControlSearchGame[] }),
    ]);

    return {
      ok: true,
      q: qRaw,
      users,
      hubs: hubsRes.data ?? [],
      games: gamesRes.data ?? [],
    };
  });

/* ─── P1: Moderation / Users / Appeals / Enforcement ─── */

export type ControlReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

export type ControlReportRow = {
  id: string;
  reporter_id: string;
  target_user_id: string | null;
  message_id: string | null;
  dm_message_id: string | null;
  voice_channel_id: string | null;
  reason: string;
  details: string;
  status: string;
  resolution_note: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  reporter_username: string | null;
  reporter_tag: string | null;
  target_username: string | null;
  target_tag: string | null;
};

const REPORT_SELECT =
  "id, reporter_id, target_user_id, message_id, dm_message_id, voice_channel_id, reason, details, status, resolution_note, reviewed_at, reviewed_by, created_at, reporter:profiles!reporter_id(username, tag), target:profiles!target_user_id(username, tag)";

function mapReportRow(row: Record<string, unknown>): ControlReportRow {
  const reporter = asProfile(
    row.reporter as { username: string; tag: string } | { username: string; tag: string }[] | null,
  );
  const target = asProfile(
    row.target as { username: string; tag: string } | { username: string; tag: string }[] | null,
  );
  return {
    id: String(row.id),
    reporter_id: String(row.reporter_id),
    target_user_id: (row.target_user_id as string | null) ?? null,
    message_id: (row.message_id as string | null) ?? null,
    dm_message_id: (row.dm_message_id as string | null) ?? null,
    voice_channel_id: (row.voice_channel_id as string | null) ?? null,
    reason: String(row.reason ?? ""),
    details: String(row.details ?? ""),
    status: String(row.status ?? "open"),
    resolution_note: String(row.resolution_note ?? ""),
    reviewed_at: (row.reviewed_at as string | null) ?? null,
    reviewed_by: (row.reviewed_by as string | null) ?? null,
    created_at: String(row.created_at),
    reporter_username: reporter?.username ?? null,
    reporter_tag: reporter?.tag ?? null,
    target_username: target?.username ?? null,
    target_tag: target?.tag ?? null,
  };
}

export const listModerationQueue = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; status?: string; limit?: number }) => data)
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; reports: ControlReportRow[]; openCount: number } | Fail> => {
      const auth = await requireAdmin(data.accessToken);
      if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };
      const admin = getSupabaseAdminClient();
      if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

      const limit = Math.min(Math.max(data.limit ?? 50, 1), 100);
      let q = admin
        .from("reports")
        .select(REPORT_SELECT)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (data.status && data.status !== "all") q = q.eq("status", data.status);

      const [{ data: rows, error }, openRes] = await Promise.all([
        q,
        admin.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
      ]);
      if (error) return { ok: false, error: error.message };

      return {
        ok: true,
        openCount: openRes.count ?? 0,
        reports: (rows ?? []).map((r) => mapReportRow(r as unknown as Record<string, unknown>)),
      };
    },
  );

export const getModerationReport = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; reportId: string }) => data)
  .handler(async ({ data }): Promise<{ ok: true; report: ControlReportRow } | Fail> => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

    const { data: row, error } = await admin
      .from("reports")
      .select(REPORT_SELECT)
      .eq("id", data.reportId)
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!row) return { ok: false, error: "Report not found", code: "NOT_FOUND" };
    return { ok: true, report: mapReportRow(row as unknown as Record<string, unknown>) };
  });

export const setModerationReportStatus = createServerFn({ method: "POST" })
  .validator(
    (data: {
      accessToken: string;
      reportId: string;
      status: ControlReportStatus;
      resolutionNote?: string;
    }) => data,
  )
  .handler(async ({ data }): Promise<{ ok: true } | Fail> => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

    const patch: {
      status: ControlReportStatus;
      reviewed_at?: string;
      reviewed_by?: string;
      resolution_note?: string;
    } = { status: data.status };
    if (data.status !== "open") {
      patch.reviewed_at = new Date().toISOString();
      patch.reviewed_by = auth.userId;
    }
    if (typeof data.resolutionNote === "string") {
      patch.resolution_note = data.resolutionNote.slice(0, 500);
    }

    const { error } = await admin.from("reports").update(patch).eq("id", data.reportId);
    if (error) return { ok: false, error: error.message };
    await writeAdminAudit({
      actorId: auth.userId,
      action: "report.set_status",
      targetType: "report",
      targetId: data.reportId,
      meta: {
        status: data.status,
        note: data.resolutionNote?.slice(0, 120) ?? null,
      },
    });
    return { ok: true };
  });

export const controlBanUser = createServerFn({ method: "POST" })
  .validator(
    (data: {
      accessToken: string;
      targetUserId: string;
      ban: boolean;
      reason?: string;
      reportId?: string;
    }) => data,
  )
  .handler(async ({ data }): Promise<{ ok: true } | Fail> => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };
    if (data.targetUserId === auth.userId) {
      return { ok: false, error: "Cannot ban yourself", code: "FORBIDDEN" };
    }

    const { error } = await admin
      .from("profiles")
      .update(
        data.ban
          ? {
              banned_at: new Date().toISOString(),
              ban_reason: (data.reason ?? "Suspended by Control").slice(0, 500),
            }
          : { banned_at: null, ban_reason: null },
      )
      .eq("id", data.targetUserId);
    if (error) return { ok: false, error: error.message };

    await writeAdminAudit({
      actorId: auth.userId,
      action: data.ban ? "user.ban" : "user.unban",
      targetType: "user",
      targetId: data.targetUserId,
      meta: {
        reason: data.ban ? (data.reason ?? "Suspended by Control").slice(0, 500) : null,
        reportId: data.reportId ?? null,
      },
    });
    return { ok: true };
  });

export type ControlUserDetail = {
  id: string;
  username: string;
  tag: string;
  display_name: string | null;
  bio: string;
  status: string;
  status_text: string;
  avatar_url: string | null;
  banned_at: string | null;
  ban_reason: string | null;
  created_at: string;
  last_seen_at: string | null;
  is_platform_admin: boolean;
  open_reports_against: number;
  membership_count: number;
};

export const getControlUser = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; userId: string }) => data)
  .handler(async ({ data }): Promise<{ ok: true; user: ControlUserDetail } | Fail> => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

    const { data: profile, error } = await admin
      .from("profiles")
      .select(
        "id, username, tag, display_name, bio, status, status_text, avatar_url, banned_at, ban_reason, created_at, last_seen_at",
      )
      .eq("id", data.userId)
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!profile) return { ok: false, error: "User not found", code: "NOT_FOUND" };

    const [roleRes, reportsRes, membersRes] = await Promise.all([
      admin
        .from("platform_roles")
        .select("user_id")
        .eq("user_id", data.userId)
        .eq("role", "platform_admin")
        .maybeSingle(),
      admin
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("target_user_id", data.userId)
        .in("status", ["open", "reviewing"]),
      admin
        .from("hub_members")
        .select("hub_id", { count: "exact", head: true })
        .eq("user_id", data.userId),
    ]);

    return {
      ok: true,
      user: {
        ...profile,
        is_platform_admin: Boolean(roleRes.data),
        open_reports_against: reportsRes.count ?? 0,
        membership_count: membersRes.count ?? 0,
      },
    };
  });

export const listControlUserMemberships = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; userId: string }) => data)
  .handler(
    async ({
      data,
    }): Promise<
      | {
          ok: true;
          memberships: Array<{
            hub_id: string;
            role: string;
            joined_at: string;
            hub_name: string;
            hub_slug: string;
            region: string | null;
          }>;
        }
      | Fail
    > => {
      const auth = await requireAdmin(data.accessToken);
      if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };
      const admin = getSupabaseAdminClient();
      if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

      const { data: rows, error } = await admin
        .from("hub_members")
        .select("hub_id, role, joined_at, hubs(name, slug, region)")
        .eq("user_id", data.userId)
        .order("joined_at", { ascending: false })
        .limit(100);
      if (error) return { ok: false, error: error.message };

      return {
        ok: true,
        memberships: (rows ?? []).map((r) => {
          const hub = Array.isArray(r.hubs) ? r.hubs[0] : r.hubs;
          return {
            hub_id: r.hub_id,
            role: r.role,
            joined_at: r.joined_at,
            hub_name: hub?.name ?? "—",
            hub_slug: hub?.slug ?? "",
            region: hub?.region ?? null,
          };
        }),
      };
    },
  );

export const listControlUserReports = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; userId: string }) => data)
  .handler(async ({ data }): Promise<{ ok: true; reports: ControlReportRow[] } | Fail> => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

    const { data: rows, error } = await admin
      .from("reports")
      .select(REPORT_SELECT)
      .or(`target_user_id.eq.${data.userId},reporter_id.eq.${data.userId}`)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return { ok: false, error: error.message };
    return {
      ok: true,
      reports: (rows ?? []).map((r) => mapReportRow(r as unknown as Record<string, unknown>)),
    };
  });

export const listEnforcementEvents = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; targetUserId?: string; limit?: number }) => data)
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; rows: AuditLogRow[]; nextCursor: string | null } | Fail> => {
      const auth = await requireAdmin(data.accessToken);
      if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };
      const admin = getSupabaseAdminClient();
      if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

      const limit = Math.min(Math.max(data.limit ?? 50, 1), 100);
      const enforcementActions = [
        "user.ban",
        "user.unban",
        "report.set_status",
        "message.soft_delete",
        "appeal.uphold",
        "appeal.overturn",
        "user.note",
      ];

      let q = admin
        .from("admin_audit_log")
        .select("id, actor_id, action, target_type, target_id, meta, created_at")
        .in("action", enforcementActions)
        .order("created_at", { ascending: false })
        .limit(limit + 1);

      if (data.targetUserId?.trim()) {
        q = q.eq("target_id", data.targetUserId.trim());
      }

      const { data: rows, error } = await q;
      if (error) return { ok: false, error: error.message };

      const slice = (rows ?? []).slice(0, limit);
      const nextCursor =
        (rows ?? []).length > limit ? (slice[slice.length - 1]?.created_at ?? null) : null;
      const actorIds = [...new Set(slice.map((r) => r.actor_id))];
      const profiles =
        actorIds.length > 0
          ? await admin.from("profiles").select("id, username, tag").in("id", actorIds)
          : { data: [] as Array<{ id: string; username: string; tag: string }> };
      const byId = new Map((profiles.data ?? []).map((p) => [p.id, p]));

      return {
        ok: true,
        nextCursor,
        rows: slice.map((r) => {
          const p = byId.get(r.actor_id);
          return {
            id: r.id,
            actor_id: r.actor_id,
            actor_username: p?.username ?? null,
            actor_tag: p?.tag ?? null,
            action: r.action,
            target_type: r.target_type,
            target_id: r.target_id,
            meta: r.meta,
            created_at: r.created_at,
          };
        }),
      };
    },
  );

export const addControlUserNote = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; userId: string; note: string }) => data)
  .handler(async ({ data }): Promise<{ ok: true } | Fail> => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };
    const note = data.note.trim().slice(0, 1000);
    if (!note) return { ok: false, error: "Note required" };

    await writeAdminAudit({
      actorId: auth.userId,
      action: "user.note",
      targetType: "user",
      targetId: data.userId,
      meta: { note },
    });
    return { ok: true };
  });

export type ControlAppealRow = {
  user_id: string;
  username: string;
  tag: string;
  banned_at: string;
  ban_reason: string | null;
};

/** Basic appeals queue = currently banned accounts pending review (no appeals table yet). */
export const listBasicAppeals = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string }) => data)
  .handler(async ({ data }): Promise<{ ok: true; appeals: ControlAppealRow[] } | Fail> => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

    const { data: rows, error } = await admin
      .from("profiles")
      .select("id, username, tag, banned_at, ban_reason")
      .not("banned_at", "is", null)
      .order("banned_at", { ascending: false })
      .limit(100);
    if (error) return { ok: false, error: error.message };

    return {
      ok: true,
      appeals: (rows ?? []).map((r) => ({
        user_id: r.id,
        username: r.username,
        tag: r.tag,
        banned_at: r.banned_at!,
        ban_reason: r.ban_reason,
      })),
    };
  });

export const decideBasicAppeal = createServerFn({ method: "POST" })
  .validator(
    (data: {
      accessToken: string;
      userId: string;
      decision: "uphold" | "overturn";
      note?: string;
    }) => data,
  )
  .handler(async ({ data }): Promise<{ ok: true } | Fail> => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

    if (data.decision === "overturn") {
      const { error } = await admin
        .from("profiles")
        .update({ banned_at: null, ban_reason: null })
        .eq("id", data.userId);
      if (error) return { ok: false, error: error.message };
      await writeAdminAudit({
        actorId: auth.userId,
        action: "appeal.overturn",
        targetType: "user",
        targetId: data.userId,
        meta: { note: data.note?.slice(0, 500) ?? null },
      });
      await writeAdminAudit({
        actorId: auth.userId,
        action: "user.unban",
        targetType: "user",
        targetId: data.userId,
        meta: { via: "appeal.overturn", note: data.note?.slice(0, 200) ?? null },
      });
    } else {
      await writeAdminAudit({
        actorId: auth.userId,
        action: "appeal.uphold",
        targetType: "user",
        targetId: data.userId,
        meta: { note: data.note?.slice(0, 500) ?? null },
      });
    }
    return { ok: true };
  });

export const listBannedUsers = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string }) => data)
  .handler(
    async ({
      data,
    }): Promise<
      | {
          ok: true;
          users: Array<{
            id: string;
            username: string;
            tag: string;
            banned_at: string | null;
            ban_reason: string | null;
          }>;
        }
      | Fail
    > => {
      const auth = await requireAdmin(data.accessToken);
      if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };
      const admin = getSupabaseAdminClient();
      if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

      const { data: rows, error } = await admin
        .from("profiles")
        .select("id, username, tag, banned_at, ban_reason")
        .not("banned_at", "is", null)
        .order("banned_at", { ascending: false })
        .limit(100);
      if (error) return { ok: false, error: error.message };
      return { ok: true, users: rows ?? [] };
    },
  );

/* ─── P2: Catalog helpers ─── */

export type ControlHubDetail = {
  id: string;
  game_id: string;
  slug: string;
  name: string;
  member_count: number;
  active_count: string;
  image_url: string | null;
  region: string | null;
  game_name: string | null;
  game_short: string | null;
};

export const getControlHub = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; hubId: string }) => data)
  .handler(async ({ data }): Promise<{ ok: true; hub: ControlHubDetail } | Fail> => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

    const { data: row, error } = await admin
      .from("hubs")
      .select(
        "id, game_id, slug, name, member_count, active_count, image_url, region, game:games(id, name, short)",
      )
      .eq("id", data.hubId)
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!row) return { ok: false, error: "Community not found", code: "NOT_FOUND" };
    const game = Array.isArray(row.game) ? row.game[0] : row.game;
    return {
      ok: true,
      hub: {
        id: row.id,
        game_id: row.game_id,
        slug: row.slug,
        name: row.name,
        member_count: row.member_count,
        active_count: row.active_count,
        image_url: row.image_url,
        region: row.region,
        game_name: game?.name ?? null,
        game_short: game?.short ?? null,
      },
    };
  });

export type ControlHubMember = {
  user_id: string;
  role: string;
  joined_at: string;
  username: string;
  tag: string;
};

export const listControlHubMembers = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; hubId: string }) => data)
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; members: ControlHubMember[] } | Fail> => {
      const auth = await requireAdmin(data.accessToken);
      if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };
      const admin = getSupabaseAdminClient();
      if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

      const { data: rows, error } = await admin
        .from("hub_members")
        .select("user_id, role, joined_at, profiles(username, tag)")
        .eq("hub_id", data.hubId)
        .order("joined_at", { ascending: true })
        .limit(200);
      if (error) return { ok: false, error: error.message };

      return {
        ok: true,
        members: (rows ?? []).map((r) => {
          const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
          return {
            user_id: r.user_id,
            role: r.role,
            joined_at: r.joined_at,
            username: p?.username ?? "—",
            tag: p?.tag ?? "0000",
          };
        }),
      };
    },
  );

export type ControlGameDetail = {
  id: string;
  name: string;
  short: string;
  category: string;
  tint: string;
  text_tint: string;
  image_url: string | null;
  banner_url: string | null;
  background_url: string | null;
  icon_url: string | null;
  community_count: number;
};

export const getControlGame = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; gameId: string }) => data)
  .handler(async ({ data }): Promise<{ ok: true; game: ControlGameDetail } | Fail> => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

    const { data: row, error } = await admin
      .from("games")
      .select("*")
      .eq("id", data.gameId)
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!row) return { ok: false, error: "Game not found", code: "NOT_FOUND" };

    const hubsRes = await admin
      .from("hubs")
      .select("id", { count: "exact", head: true })
      .eq("game_id", data.gameId);

    return {
      ok: true,
      game: {
        ...row,
        community_count: hubsRes.count ?? 0,
      },
    };
  });

/* ─── P3 Realtime: Voice Ops / Live / LiveKit ───────────────────────────── */

export type ControlVoiceRoomRow = {
  id: string;
  hub_id: string;
  slug: string;
  name: string;
  position: number;
  livekit_room_name: string | null;
  capacity: number | null;
  created_at: string;
  hub_name: string | null;
  hub_slug: string | null;
  hub_region: string | null;
};

export type ControlVoiceOverview = {
  roomCount: number;
  hubsWithVoice: number;
  uncappedRooms: number;
  livekitConfigured: boolean;
  livekitReachable: boolean | null;
  livekitHost: string | null;
};

export const getControlVoiceOverview = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string }) => data)
  .handler(async ({ data }): Promise<{ ok: true; overview: ControlVoiceOverview } | Fail> => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

    const [roomsRes, hubsRes, uncappedRes, health] = await Promise.all([
      admin.from("voice_channels").select("id", { count: "exact", head: true }),
      admin.from("voice_channels").select("hub_id"),
      admin.from("voice_channels").select("id", { count: "exact", head: true }).is("capacity", null),
      collectAppHealth(),
    ]);

    if (roomsRes.error) return { ok: false, error: roomsRes.error.message };
    if (hubsRes.error) return { ok: false, error: hubsRes.error.message };
    if (uncappedRes.error) return { ok: false, error: uncappedRes.error.message };

    const hubsWithVoice = new Set((hubsRes.data ?? []).map((r) => r.hub_id)).size;

    return {
      ok: true,
      overview: {
        roomCount: roomsRes.count ?? 0,
        hubsWithVoice,
        uncappedRooms: uncappedRes.count ?? 0,
        livekitConfigured: health.livekit.configured,
        livekitReachable: health.livekit.reachable,
        livekitHost: health.livekit.urlHost,
      },
    };
  });

export const listControlVoiceRooms = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; q?: string; limit?: number }) => data)
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; rooms: ControlVoiceRoomRow[] } | Fail> => {
      const auth = await requireAdmin(data.accessToken);
      if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };
      const admin = getSupabaseAdminClient();
      if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

      const limit = Math.min(Math.max(data.limit ?? 100, 1), 200);
      const q = data.q?.trim() ?? "";

      let query = admin
        .from("voice_channels")
        .select("id, hub_id, slug, name, position, livekit_room_name, capacity, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (q) {
        query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%,livekit_room_name.ilike.%${q}%`);
      }

      const { data: rows, error } = await query;
      if (error) return { ok: false, error: error.message };

      const hubIds = [...new Set((rows ?? []).map((r) => r.hub_id))];
      const hubMap = new Map<string, { name: string; slug: string; region: string | null }>();
      if (hubIds.length > 0) {
        const hubsRes = await admin.from("hubs").select("id, name, slug, region").in("id", hubIds);
        if (hubsRes.error) return { ok: false, error: hubsRes.error.message };
        for (const h of hubsRes.data ?? []) {
          hubMap.set(h.id, { name: h.name, slug: h.slug, region: h.region });
        }
      }

      const rooms: ControlVoiceRoomRow[] = (rows ?? []).map((r) => {
        const hub = hubMap.get(r.hub_id);
        return {
          id: r.id,
          hub_id: r.hub_id,
          slug: r.slug,
          name: r.name,
          position: r.position,
          livekit_room_name: r.livekit_room_name,
          capacity: r.capacity,
          created_at: r.created_at,
          hub_name: hub?.name ?? null,
          hub_slug: hub?.slug ?? null,
          hub_region: hub?.region ?? null,
        };
      });

      return { ok: true, rooms };
    },
  );

export type ControlVoiceRoomDetail = ControlVoiceRoomRow & {
  live: {
    configured: boolean;
    count: number;
    members: Array<{ userId: string; name: string; muted?: boolean }>;
  };
};

export const getControlVoiceRoom = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; roomId: string }) => data)
  .handler(async ({ data }): Promise<{ ok: true; room: ControlVoiceRoomDetail } | Fail> => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

    const { data: row, error } = await admin
      .from("voice_channels")
      .select("id, hub_id, slug, name, position, livekit_room_name, capacity, created_at")
      .eq("id", data.roomId)
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!row) return { ok: false, error: "Voice room not found", code: "NOT_FOUND" };

    const hubsRes = await admin
      .from("hubs")
      .select("name, slug, region")
      .eq("id", row.hub_id)
      .maybeSingle();
    const hub = hubsRes.data;

    const roomName = row.livekit_room_name?.trim() || `nexus-${row.id}`;
    const lk = getLiveKitEnv();

    let live: ControlVoiceRoomDetail["live"] = {
      configured: Boolean(lk),
      count: 0,
      members: [],
    };

    if (lk) {
      try {
        const { RoomServiceClient } = await import("livekit-server-sdk");
        const svc = new RoomServiceClient(liveKitHttpHost(lk.url), lk.apiKey, lk.apiSecret);
        const participants = await svc.listParticipants(roomName);
        live = {
          configured: true,
          count: participants.length,
          members: participants.map((p) => ({
            userId: p.identity,
            name: p.name?.trim() || p.identity,
            muted: Boolean(p.tracks?.some((t) => t.muted)),
          })),
        };
      } catch {
        live = { configured: true, count: 0, members: [] };
      }
    }

    return {
      ok: true,
      room: {
        id: row.id,
        hub_id: row.hub_id,
        slug: row.slug,
        name: row.name,
        position: row.position,
        livekit_room_name: row.livekit_room_name,
        capacity: row.capacity,
        created_at: row.created_at,
        hub_name: hub?.name ?? null,
        hub_slug: hub?.slug ?? null,
        hub_region: hub?.region ?? null,
        live,
      },
    };
  });

export const updateControlVoiceRoomCapacity = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; roomId: string; capacity: number | null }) => data)
  .handler(async ({ data }): Promise<{ ok: true } | Fail> => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

    const capacity =
      data.capacity === null || Number.isNaN(data.capacity)
        ? null
        : Math.min(Math.max(Math.floor(data.capacity), 1), 100);

    const { error } = await admin
      .from("voice_channels")
      .update({ capacity })
      .eq("id", data.roomId);
    if (error) return { ok: false, error: error.message };

    await writeAdminAudit({
      actorId: auth.userId,
      action: "voice_channel.update",
      targetType: "voice_channel",
      targetId: data.roomId,
      meta: { capacity },
    });
    return { ok: true };
  });

export const kickControlVoiceParticipant = createServerFn({ method: "POST" })
  .validator(
    (data: { accessToken: string; roomId: string; identity: string; roomName?: string }) => data,
  )
  .handler(async ({ data }): Promise<{ ok: true } | Fail> => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };

    const identity = data.identity.trim();
    if (!identity) return { ok: false, error: "Missing participant", code: "VALIDATION" };

    const lk = getLiveKitEnv();
    if (!lk) return { ok: false, error: "LiveKit not configured", code: "NOT_CONFIGURED" };

    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

    const { data: row } = await admin
      .from("voice_channels")
      .select("id, livekit_room_name")
      .eq("id", data.roomId)
      .maybeSingle();
    if (!row) return { ok: false, error: "Voice room not found", code: "NOT_FOUND" };

    const roomName =
      data.roomName?.trim() || row.livekit_room_name?.trim() || `nexus-${row.id}`;

    try {
      const { RoomServiceClient } = await import("livekit-server-sdk");
      const svc = new RoomServiceClient(liveKitHttpHost(lk.url), lk.apiKey, lk.apiSecret);
      await svc.removeParticipant(roomName, identity);
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        code: "LIVEKIT",
      };
    }

    await writeAdminAudit({
      actorId: auth.userId,
      action: "voice.kick",
      targetType: "voice_channel",
      targetId: data.roomId,
      meta: { identity, roomName },
    });
    return { ok: true };
  });

export type ControlLiveSession = {
  roomName: string;
  numParticipants: number;
  channelId: string | null;
  channelName: string | null;
  hubId: string | null;
  hubName: string | null;
  hubSlug: string | null;
  capacity: number | null;
};

export const listControlLiveSessions = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string }) => data)
  .handler(
    async ({
      data,
    }): Promise<
      | { ok: true; configured: boolean; sessions: ControlLiveSession[]; error?: string }
      | Fail
    > => {
      const auth = await requireAdmin(data.accessToken);
      if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };

      const lk = getLiveKitEnv();
      if (!lk) {
        return { ok: true, configured: false, sessions: [] };
      }

      const admin = getSupabaseAdminClient();
      if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

      const { data: channels, error: chErr } = await admin
        .from("voice_channels")
        .select("id, name, capacity, livekit_room_name, hub_id");
      if (chErr) return { ok: false, error: chErr.message };

      const hubIds = [...new Set((channels ?? []).map((c) => c.hub_id))];
      const hubMap = new Map<string, { name: string; slug: string }>();
      if (hubIds.length > 0) {
        const hubsRes = await admin.from("hubs").select("id, name, slug").in("id", hubIds);
        if (hubsRes.error) return { ok: false, error: hubsRes.error.message };
        for (const h of hubsRes.data ?? []) {
          hubMap.set(h.id, { name: h.name, slug: h.slug });
        }
      }

      const byRoom = new Map<
        string,
        {
          channelId: string;
          channelName: string;
          capacity: number | null;
          hubId: string | null;
          hubName: string | null;
          hubSlug: string | null;
        }
      >();
      for (const c of channels ?? []) {
        const hub = hubMap.get(c.hub_id);
        const roomName = c.livekit_room_name?.trim() || `nexus-${c.id}`;
        byRoom.set(roomName, {
          channelId: c.id,
          channelName: c.name,
          capacity: typeof c.capacity === "number" ? c.capacity : null,
          hubId: c.hub_id,
          hubName: hub?.name ?? null,
          hubSlug: hub?.slug ?? null,
        });
      }

      try {
        const { RoomServiceClient } = await import("livekit-server-sdk");
        const svc = new RoomServiceClient(liveKitHttpHost(lk.url), lk.apiKey, lk.apiSecret);
        const rooms = await svc.listRooms();
        const sessions: ControlLiveSession[] = rooms
          .filter((r) => (r.numParticipants ?? 0) > 0)
          .map((r) => {
            const match = byRoom.get(r.name);
            return {
              roomName: r.name,
              numParticipants: r.numParticipants ?? 0,
              channelId: match?.channelId ?? null,
              channelName: match?.channelName ?? null,
              hubId: match?.hubId ?? null,
              hubName: match?.hubName ?? null,
              hubSlug: match?.hubSlug ?? null,
              capacity: match?.capacity ?? null,
            };
          })
          .sort((a, b) => b.numParticipants - a.numParticipants);

        return { ok: true, configured: true, sessions };
      } catch (err) {
        return {
          ok: true,
          configured: true,
          sessions: [],
          error: err instanceof Error ? err.message : String(err),
        };
      }
    },
  );

export const getControlLiveKitHealth = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string }) => data)
  .handler(async ({ data }): Promise<{ ok: true; health: AppHealthReport } | Fail> => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };
    const health = await collectAppHealth();
    return { ok: true, health };
  });

/* ─── P4 Insights: Dashboard KPIs / Analytics / Community Health ─────────── */

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

export type ControlDashboardKpis = {
  dauApprox: number;
  usersTotal: number;
  usersNew7d: number;
  hubsTotal: number;
  hubsNew7d: number;
  gamesTotal: number;
  messages7d: number;
  openReports: number;
  reviewingReports: number;
  bannedUsers: number;
  voiceRooms: number;
  attention: Array<{
    id: "open_reports" | "reviewing_reports" | "banned_users" | "livekit";
    severity: "high" | "medium" | "low";
    count?: number;
    href: string;
  }>;
  livekitConfigured: boolean;
  livekitReachable: boolean | null;
  generatedAt: string;
};

export const getControlDashboardKpis = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string }) => data)
  .handler(async ({ data }): Promise<{ ok: true; kpis: ControlDashboardKpis } | Fail> => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

    const since1d = daysAgoIso(1);
    const since7d = daysAgoIso(7);

    const [
      dauRes,
      usersTotalRes,
      usersNew7dRes,
      hubsTotalRes,
      hubsNew7dRes,
      gamesTotalRes,
      messages7dRes,
      openReportsRes,
      reviewingReportsRes,
      bannedUsersRes,
      voiceRoomsRes,
      health,
    ] = await Promise.all([
      admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("last_seen_at", since1d)
        .is("banned_at", null),
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since7d),
      admin.from("hubs").select("id", { count: "exact", head: true }),
      admin.from("hubs").select("id", { count: "exact", head: true }).gte("created_at", since7d),
      admin.from("games").select("id", { count: "exact", head: true }),
      admin
        .from("messages")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since7d)
        .is("deleted_at", null),
      admin.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
      admin.from("reports").select("id", { count: "exact", head: true }).eq("status", "reviewing"),
      admin.from("profiles").select("id", { count: "exact", head: true }).not("banned_at", "is", null),
      admin.from("voice_channels").select("id", { count: "exact", head: true }),
      collectAppHealth(),
    ]);

    const err =
      dauRes.error?.message ||
      usersTotalRes.error?.message ||
      usersNew7dRes.error?.message ||
      hubsTotalRes.error?.message ||
      hubsNew7dRes.error?.message ||
      gamesTotalRes.error?.message ||
      messages7dRes.error?.message ||
      openReportsRes.error?.message ||
      reviewingReportsRes.error?.message ||
      bannedUsersRes.error?.message ||
      voiceRoomsRes.error?.message;
    if (err) return { ok: false, error: err };

    const openReports = openReportsRes.count ?? 0;
    const reviewingReports = reviewingReportsRes.count ?? 0;
    const bannedUsers = bannedUsersRes.count ?? 0;

    const attention: ControlDashboardKpis["attention"] = [];
    if (openReports > 0) {
      attention.push({
        id: "open_reports",
        severity: openReports >= 10 ? "high" : "medium",
        count: openReports,
        href: "/control/moderation?status=open",
      });
    }
    if (reviewingReports > 0) {
      attention.push({
        id: "reviewing_reports",
        severity: "low",
        count: reviewingReports,
        href: "/control/moderation?status=reviewing",
      });
    }
    if (bannedUsers > 0) {
      attention.push({
        id: "banned_users",
        severity: "low",
        count: bannedUsers,
        href: "/control/appeals",
      });
    }
    if (health.livekit.configured && health.livekit.reachable === false) {
      attention.push({ id: "livekit", severity: "high", href: "/control/livekit" });
    }

    return {
      ok: true,
      kpis: {
        dauApprox: dauRes.count ?? 0,
        usersTotal: usersTotalRes.count ?? 0,
        usersNew7d: usersNew7dRes.count ?? 0,
        hubsTotal: hubsTotalRes.count ?? 0,
        hubsNew7d: hubsNew7dRes.count ?? 0,
        gamesTotal: gamesTotalRes.count ?? 0,
        messages7d: messages7dRes.count ?? 0,
        openReports,
        reviewingReports,
        bannedUsers,
        voiceRooms: voiceRoomsRes.count ?? 0,
        attention,
        livekitConfigured: health.livekit.configured,
        livekitReachable: health.livekit.reachable,
        generatedAt: new Date().toISOString(),
      },
    };
  });

export type ControlAnalyticsRange = 7 | 30;

export type ControlAnalyticsOverview = {
  rangeDays: ControlAnalyticsRange;
  newUsers: number;
  activeApprox: number;
  newHubs: number;
  newMessages: number;
  newReports: number;
  resolvedReports: number;
  bansInRange: number;
  voiceRooms: number;
  hubsTotal: number;
  usersTotal: number;
  regionMix: Array<{ region: string; hubs: number }>;
  generatedAt: string;
};

export const getControlAnalyticsOverview = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; rangeDays?: number }) => data)
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; overview: ControlAnalyticsOverview } | Fail> => {
      const auth = await requireAdmin(data.accessToken);
      if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };
      const admin = getSupabaseAdminClient();
      if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

      const rangeDays: ControlAnalyticsRange = data.rangeDays === 30 ? 30 : 7;
      const since = daysAgoIso(rangeDays);

      const [
        newUsersRes,
        activeRes,
        newHubsRes,
        newMessagesRes,
        newReportsRes,
        resolvedRes,
        bansRes,
        voiceRoomsRes,
        hubsTotalRes,
        usersTotalRes,
        hubsRes,
      ] = await Promise.all([
        admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since),
        admin
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .gte("last_seen_at", since)
          .is("banned_at", null),
        admin.from("hubs").select("id", { count: "exact", head: true }).gte("created_at", since),
        admin
          .from("messages")
          .select("id", { count: "exact", head: true })
          .gte("created_at", since)
          .is("deleted_at", null),
        admin.from("reports").select("id", { count: "exact", head: true }).gte("created_at", since),
        admin
          .from("reports")
          .select("id", { count: "exact", head: true })
          .eq("status", "resolved")
          .gte("reviewed_at", since),
        admin
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .not("banned_at", "is", null)
          .gte("banned_at", since),
        admin.from("voice_channels").select("id", { count: "exact", head: true }),
        admin.from("hubs").select("id", { count: "exact", head: true }),
        admin.from("profiles").select("id", { count: "exact", head: true }),
        admin.from("hubs").select("region").limit(500),
      ]);

      const err =
        newUsersRes.error?.message ||
        activeRes.error?.message ||
        newHubsRes.error?.message ||
        newMessagesRes.error?.message ||
        newReportsRes.error?.message ||
        resolvedRes.error?.message ||
        bansRes.error?.message ||
        voiceRoomsRes.error?.message ||
        hubsTotalRes.error?.message ||
        usersTotalRes.error?.message ||
        hubsRes.error?.message;
      if (err) return { ok: false, error: err };

      const regionCounts = new Map<string, number>();
      for (const h of hubsRes.data ?? []) {
        const key = (h.region || "global").toUpperCase();
        regionCounts.set(key, (regionCounts.get(key) ?? 0) + 1);
      }
      const regionMix = [...regionCounts.entries()]
        .map(([region, hubs]) => ({ region, hubs }))
        .sort((a, b) => b.hubs - a.hubs)
        .slice(0, 12);

      return {
        ok: true,
        overview: {
          rangeDays,
          newUsers: newUsersRes.count ?? 0,
          activeApprox: activeRes.count ?? 0,
          newHubs: newHubsRes.count ?? 0,
          newMessages: newMessagesRes.count ?? 0,
          newReports: newReportsRes.count ?? 0,
          resolvedReports: resolvedRes.count ?? 0,
          bansInRange: bansRes.count ?? 0,
          voiceRooms: voiceRoomsRes.count ?? 0,
          hubsTotal: hubsTotalRes.count ?? 0,
          usersTotal: usersTotalRes.count ?? 0,
          regionMix,
          generatedAt: new Date().toISOString(),
        },
      };
    },
  );

export type ControlCommunityHealthRow = {
  id: string;
  name: string;
  slug: string;
  region: string | null;
  game_id: string;
  member_count: number;
  voice_rooms: number;
  score: number;
  flags: Array<"low_members" | "no_voice" | "tiny">;
};

export const listControlCommunityHealth = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; limit?: number }) => data)
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; rows: ControlCommunityHealthRow[] } | Fail> => {
      const auth = await requireAdmin(data.accessToken);
      if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };
      const admin = getSupabaseAdminClient();
      if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

      const limit = Math.min(Math.max(data.limit ?? 50, 1), 100);
      const { data: hubs, error } = await admin
        .from("hubs")
        .select("id, name, slug, region, game_id, member_count")
        .order("member_count", { ascending: true })
        .limit(limit);
      if (error) return { ok: false, error: error.message };

      const hubIds = (hubs ?? []).map((h) => h.id);
      const voiceByHub = new Map<string, number>();
      if (hubIds.length > 0) {
        const voiceRes = await admin.from("voice_channels").select("hub_id").in("hub_id", hubIds);
        if (voiceRes.error) return { ok: false, error: voiceRes.error.message };
        for (const v of voiceRes.data ?? []) {
          voiceByHub.set(v.hub_id, (voiceByHub.get(v.hub_id) ?? 0) + 1);
        }
      }

      const rows: ControlCommunityHealthRow[] = (hubs ?? []).map((h) => {
        const voice_rooms = voiceByHub.get(h.id) ?? 0;
        const flags: ControlCommunityHealthRow["flags"] = [];
        let score = 100;
        if (h.member_count <= 1) {
          flags.push("tiny");
          score -= 40;
        } else if (h.member_count < 5) {
          flags.push("low_members");
          score -= 25;
        }
        if (voice_rooms === 0) {
          flags.push("no_voice");
          score -= 20;
        }
        score = Math.max(0, Math.min(100, score));
        return {
          id: h.id,
          name: h.name,
          slug: h.slug,
          region: h.region,
          game_id: h.game_id,
          member_count: h.member_count,
          voice_rooms,
          score,
          flags,
        };
      });

      rows.sort((a, b) => a.score - b.score || a.member_count - b.member_count);
      return { ok: true, rows };
    },
  );

/* ─── P5 Platform: System / Flags / Keys / Jobs inventory ───────────────── */

export type ControlSystemDependency = {
  id: "supabase" | "livekit" | "service_role" | "ops_webhook" | "pagerduty" | "storage";
  status: "ok" | "warn" | "down" | "off";
  detail: string | null;
  href?: string;
};

export type ControlSystemBoard = {
  env: "production" | "development";
  generatedAt: string;
  healthOk: boolean;
  dependencies: ControlSystemDependency[];
  openReports: number;
  voiceRooms: number;
};

export const getControlSystemBoard = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string }) => data)
  .handler(async ({ data }): Promise<{ ok: true; board: ControlSystemBoard } | Fail> => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };

    const health = await collectAppHealth();
    const admin = getSupabaseAdminClient();

    let openReports = 0;
    let voiceRooms = 0;
    let storageOk: boolean | null = null;
    if (admin) {
      const [rep, voice, buckets] = await Promise.all([
        admin.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
        admin.from("voice_channels").select("id", { count: "exact", head: true }),
        admin.storage.listBuckets(),
      ]);
      openReports = rep.count ?? 0;
      voiceRooms = voice.count ?? 0;
      if (!buckets.error) {
        storageOk = (buckets.data ?? []).some((b) => b.name === "hub-media" || b.id === "hub-media");
      } else {
        storageOk = false;
      }
    }

    const deps: ControlSystemDependency[] = [
      {
        id: "supabase",
        status: health.supabase.ok ? "ok" : health.supabase.configured ? "down" : "off",
        detail: health.supabase.message ?? (health.supabase.ok ? `games=${health.supabase.games ?? 0}` : null),
      },
      {
        id: "service_role",
        status: getSupabaseServiceRoleKey() ? "ok" : "off",
        detail: getSupabaseServiceRoleKey() ? "configured" : null,
      },
      {
        id: "livekit",
        status: !health.livekit.configured
          ? "off"
          : health.livekit.reachable === false
            ? "down"
            : health.livekit.reachable
              ? "ok"
              : "warn",
        detail: health.livekit.urlHost,
        href: "/control/livekit",
      },
      {
        id: "storage",
        status: storageOk === true ? "ok" : storageOk === false ? "down" : "warn",
        detail: storageOk === true ? "hub-media" : storageOk === false ? "hub-media missing" : null,
      },
      {
        id: "ops_webhook",
        status: (process.env.OPS_ALERT_WEBHOOK_URL as string | undefined)?.trim() ? "ok" : "off",
        detail: null,
      },
      {
        id: "pagerduty",
        status: (process.env.OPS_PAGERDUTY_ROUTING_KEY as string | undefined)?.trim()
          ? "ok"
          : "off",
        detail: null,
      },
    ];

    return {
      ok: true,
      board: {
        env: health.env,
        generatedAt: new Date().toISOString(),
        healthOk: health.ok,
        dependencies: deps,
        openReports,
        voiceRooms,
      },
    };
  });

export type ControlFeatureFlagRow = {
  key: string;
  enabled: boolean;
  description: string;
  updated_at: string | null;
  updated_by: string | null;
  fromDb: boolean;
};

export const listControlFeatureFlags = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string }) => data)
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; flags: ControlFeatureFlagRow[]; migrated: boolean } | Fail> => {
      const auth = await requireAdmin(data.accessToken);
      if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };
      const admin = getSupabaseAdminClient();
      if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

      const { data: rows, error } = await admin.from("control_feature_flags").select("*");
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("control_feature_flags") || msg.includes("does not exist")) {
          return {
            ok: true,
            migrated: false,
            flags: CONTROL_FLAG_CATALOG.map((f) => ({
              key: f.key,
              enabled: f.defaultEnabled,
              description: f.descKey,
              updated_at: null,
              updated_by: null,
              fromDb: false,
            })),
          };
        }
        return { ok: false, error: error.message };
      }

      const byKey = new Map((rows ?? []).map((r) => [r.key, r]));
      const flags: ControlFeatureFlagRow[] = CONTROL_FLAG_CATALOG.map((f) => {
        const row = byKey.get(f.key);
        return {
          key: f.key,
          enabled: row?.enabled ?? f.defaultEnabled,
          description: row?.description || f.descKey,
          updated_at: row?.updated_at ?? null,
          updated_by: row?.updated_by ?? null,
          fromDb: Boolean(row),
        };
      });

      for (const row of rows ?? []) {
        if (!CONTROL_FLAG_CATALOG.some((f) => f.key === row.key)) {
          flags.push({
            key: row.key,
            enabled: row.enabled,
            description: row.description,
            updated_at: row.updated_at,
            updated_by: row.updated_by,
            fromDb: true,
          });
        }
      }

      return { ok: true, migrated: true, flags };
    },
  );

export const setControlFeatureFlag = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; key: string; enabled: boolean }) => data)
  .handler(async ({ data }): Promise<{ ok: true } | Fail> => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

    const key = data.key.trim();
    if (!key) return { ok: false, error: "Flag key required", code: "VALIDATION" };

    const catalog = CONTROL_FLAG_CATALOG.find((f) => f.key === key);
    const { error } = await admin.from("control_feature_flags").upsert(
      {
        key,
        enabled: data.enabled,
        description: catalog?.descKey ?? key,
        updated_at: new Date().toISOString(),
        updated_by: auth.userId,
      },
      { onConflict: "key" },
    );
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("control_feature_flags") || msg.includes("does not exist")) {
        return {
          ok: false,
          error: "Apply migration 20260717180000_control_feature_flags.sql first",
          code: "NOT_MIGRATED",
        };
      }
      return { ok: false, error: error.message };
    }

    await writeAdminAudit({
      actorId: auth.userId,
      action: "flag.set",
      targetType: "feature_flag",
      targetId: key,
      meta: { enabled: data.enabled },
    });
    return { ok: true };
  });

export type ControlIntegrationStatus = {
  id: string;
  configured: boolean;
  host: string | null;
};

export const listControlIntegrations = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string }) => data)
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; integrations: ControlIntegrationStatus[]; adminEnvCount: number } | Fail> => {
      const auth = await requireAdmin(data.accessToken);
      if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };

      const supabaseUrl = getSupabaseUrl();
      let supabaseHost: string | null = null;
      if (supabaseUrl) {
        try {
          supabaseHost = new URL(supabaseUrl).host;
        } catch {
          supabaseHost = "set";
        }
      }

      const lkUrl = (process.env.LIVEKIT_URL as string | undefined)?.trim();
      let lkHost: string | null = null;
      if (lkUrl) {
        try {
          lkHost = new URL(lkUrl).host;
        } catch {
          lkHost = "set";
        }
      }

      const adminRaw = (process.env.ADMIN_USER_IDS as string | undefined)?.trim() ?? "";
      const adminEnvCount = adminRaw
        ? adminRaw.split(",").map((s) => s.trim()).filter(Boolean).length
        : 0;

      const integrations: ControlIntegrationStatus[] = [
        {
          id: "supabase_public",
          configured: isSupabaseConfigured(),
          host: supabaseHost,
        },
        {
          id: "supabase_service_role",
          configured: Boolean(getSupabaseServiceRoleKey()),
          host: null,
        },
        {
          id: "livekit",
          configured: Boolean(
            lkUrl &&
              (process.env.LIVEKIT_API_KEY as string | undefined)?.trim() &&
              (process.env.LIVEKIT_API_SECRET as string | undefined)?.trim(),
          ),
          host: lkHost,
        },
        {
          id: "ops_webhook",
          configured: Boolean((process.env.OPS_ALERT_WEBHOOK_URL as string | undefined)?.trim()),
          host: null,
        },
        {
          id: "pagerduty",
          configured: Boolean(
            (process.env.OPS_PAGERDUTY_ROUTING_KEY as string | undefined)?.trim(),
          ),
          host: null,
        },
      ];

      return { ok: true, integrations, adminEnvCount };
    },
  );

/* ─── P6 Governance: Inbox / Security / Announcements / Discovery ───────── */

function isMissingRelation(error: { message?: string } | null | undefined): boolean {
  const msg = (error?.message ?? "").toLowerCase();
  return msg.includes("does not exist") || msg.includes("schema cache");
}

export type ControlInboxItem = {
  id: string;
  kind: "report_open" | "report_reviewing" | "appeal" | "livekit" | "flag_maintenance";
  title: string;
  href: string;
  severity: "high" | "medium" | "low";
  count?: number;
};

export const listControlInbox = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string }) => data)
  .handler(async ({ data }): Promise<{ ok: true; items: ControlInboxItem[] } | Fail> => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

    const [openRes, reviewingRes, bannedRes, health, flagsRes] = await Promise.all([
      admin.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
      admin.from("reports").select("id", { count: "exact", head: true }).eq("status", "reviewing"),
      admin.from("profiles").select("id", { count: "exact", head: true }).not("banned_at", "is", null),
      collectAppHealth(),
      admin.from("control_feature_flags").select("key, enabled").eq("key", "maintenance.banner"),
    ]);

    const items: ControlInboxItem[] = [];
    const open = openRes.count ?? 0;
    const reviewing = reviewingRes.count ?? 0;
    const banned = bannedRes.count ?? 0;

    if (open > 0) {
      items.push({
        id: "reports-open",
        kind: "report_open",
        title: "open_reports",
        href: "/control/moderation?status=open",
        severity: open >= 10 ? "high" : "medium",
        count: open,
      });
    }
    if (reviewing > 0) {
      items.push({
        id: "reports-reviewing",
        kind: "report_reviewing",
        title: "reviewing_reports",
        href: "/control/moderation?status=reviewing",
        severity: "low",
        count: reviewing,
      });
    }
    if (banned > 0) {
      items.push({
        id: "appeals",
        kind: "appeal",
        title: "banned_appeals",
        href: "/control/appeals",
        severity: "low",
        count: banned,
      });
    }
    if (health.livekit.configured && health.livekit.reachable === false) {
      items.push({
        id: "livekit",
        kind: "livekit",
        title: "livekit_down",
        href: "/control/livekit",
        severity: "high",
      });
    }
    if (!flagsRes.error) {
      const maint = (flagsRes.data ?? []).find((f) => f.key === "maintenance.banner" && f.enabled);
      if (maint) {
        items.push({
          id: "maintenance",
          kind: "flag_maintenance",
          title: "maintenance_on",
          href: "/control/flags",
          severity: "medium",
        });
      }
    }

    return { ok: true, items };
  });

export type ControlSecurityPosture = {
  adminCount: number;
  adminEnvBootstrap: number;
  recentSensitive: Array<{
    id: string;
    action: string;
    actor_id: string;
    created_at: string;
  }>;
  openReports: number;
  bannedUsers: number;
  livekitOk: boolean | null;
  maintenanceOn: boolean;
  generatedAt: string;
};

export const getControlSecurityPosture = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string }) => data)
  .handler(async ({ data }): Promise<{ ok: true; posture: ControlSecurityPosture } | Fail> => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

    const sensitiveActions = [
      "user.ban",
      "user.unban",
      "platform_role.grant",
      "platform_role.revoke",
      "flag.set",
      "voice.kick",
    ];

    const adminRaw = (process.env.ADMIN_USER_IDS as string | undefined)?.trim() ?? "";
    const adminEnvBootstrap = adminRaw
      ? adminRaw.split(",").map((s) => s.trim()).filter(Boolean).length
      : 0;

    const [adminsRes, auditRes, openRes, bannedRes, health, flagsRes] = await Promise.all([
      admin
        .from("platform_roles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "platform_admin"),
      admin
        .from("admin_audit_log")
        .select("id, action, actor_id, created_at")
        .in("action", sensitiveActions)
        .order("created_at", { ascending: false })
        .limit(20),
      admin.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
      admin.from("profiles").select("id", { count: "exact", head: true }).not("banned_at", "is", null),
      collectAppHealth(),
      admin.from("control_feature_flags").select("key, enabled").eq("key", "maintenance.banner"),
    ]);

    if (adminsRes.error) return { ok: false, error: adminsRes.error.message };
    if (auditRes.error) return { ok: false, error: auditRes.error.message };

    const maintenanceOn = !flagsRes.error
      ? Boolean((flagsRes.data ?? []).some((f) => f.enabled))
      : false;

    return {
      ok: true,
      posture: {
        adminCount: adminsRes.count ?? 0,
        adminEnvBootstrap,
        recentSensitive: (auditRes.data ?? []).map((r) => ({
          id: r.id,
          action: r.action,
          actor_id: r.actor_id,
          created_at: r.created_at,
        })),
        openReports: openRes.count ?? 0,
        bannedUsers: bannedRes.count ?? 0,
        livekitOk: health.livekit.configured ? health.livekit.reachable : null,
        maintenanceOn,
        generatedAt: new Date().toISOString(),
      },
    };
  });

export type ControlAnnouncementRow = {
  id: string;
  title: string;
  body: string;
  locale: string;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export const listControlAnnouncements = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string }) => data)
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; rows: ControlAnnouncementRow[]; migrated: boolean } | Fail> => {
      const auth = await requireAdmin(data.accessToken);
      if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };
      const admin = getSupabaseAdminClient();
      if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

      const { data: rows, error } = await admin
        .from("control_announcements")
        .select("id, title, body, locale, status, published_at, created_at, updated_at")
        .order("updated_at", { ascending: false })
        .limit(100);
      if (error) {
        if (isMissingRelation(error)) return { ok: true, rows: [], migrated: false };
        return { ok: false, error: error.message };
      }
      return { ok: true, rows: rows ?? [], migrated: true };
    },
  );

export const upsertControlAnnouncement = createServerFn({ method: "POST" })
  .validator(
    (data: {
      accessToken: string;
      id?: string;
      title: string;
      body: string;
      locale: "ar" | "en" | "both";
      status: "draft" | "scheduled" | "published" | "archived";
    }) => data,
  )
  .handler(async ({ data }): Promise<{ ok: true; id: string } | Fail> => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

    const title = data.title.trim();
    const body = data.body.trim();
    if (!title || !body) return { ok: false, error: "Title and body required", code: "VALIDATION" };

    const published_at = data.status === "published" ? new Date().toISOString() : null;
    const payload = {
      title,
      body,
      locale: data.locale,
      status: data.status,
      published_at,
      updated_at: new Date().toISOString(),
      created_by: auth.userId,
    };

    if (data.id) {
      const { error } = await admin.from("control_announcements").update(payload).eq("id", data.id);
      if (error) {
        if (isMissingRelation(error)) {
          return {
            ok: false,
            error: "Apply migration 20260717190000_control_governance.sql first",
            code: "NOT_MIGRATED",
          };
        }
        return { ok: false, error: error.message };
      }
      await writeAdminAudit({
        actorId: auth.userId,
        action: "announcement.update",
        targetType: "announcement",
        targetId: data.id,
        meta: { status: data.status },
      });
      return { ok: true, id: data.id };
    }

    const { data: row, error } = await admin
      .from("control_announcements")
      .insert(payload)
      .select("id")
      .single();
    if (error) {
      if (isMissingRelation(error)) {
        return {
          ok: false,
          error: "Apply migration 20260717190000_control_governance.sql first",
          code: "NOT_MIGRATED",
        };
      }
      return { ok: false, error: error.message };
    }
    await writeAdminAudit({
      actorId: auth.userId,
      action: "announcement.create",
      targetType: "announcement",
      targetId: row.id,
      meta: { status: data.status },
    });
    return { ok: true, id: row.id };
  });

export type ControlDiscoveryPlacement = {
  id: string;
  kind: "hub" | "game";
  target_id: string;
  region: string | null;
  position: number;
  active: boolean;
  note: string;
  target_name: string | null;
};

export const listControlDiscoveryPlacements = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string }) => data)
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; rows: ControlDiscoveryPlacement[]; migrated: boolean } | Fail> => {
      const auth = await requireAdmin(data.accessToken);
      if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };
      const admin = getSupabaseAdminClient();
      if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

      const { data: rows, error } = await admin
        .from("control_discovery_placements")
        .select("*")
        .order("position", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) {
        if (isMissingRelation(error)) return { ok: true, rows: [], migrated: false };
        return { ok: false, error: error.message };
      }

      const hubIds = (rows ?? []).filter((r) => r.kind === "hub").map((r) => r.target_id);
      const gameIds = (rows ?? []).filter((r) => r.kind === "game").map((r) => r.target_id);
      const nameById = new Map<string, string>();
      if (hubIds.length) {
        const hubs = await admin.from("hubs").select("id, name").in("id", hubIds);
        for (const h of hubs.data ?? []) nameById.set(h.id, h.name);
      }
      if (gameIds.length) {
        const games = await admin.from("games").select("id, name").in("id", gameIds);
        for (const g of games.data ?? []) nameById.set(g.id, g.name);
      }

      return {
        ok: true,
        migrated: true,
        rows: (rows ?? []).map((r) => ({
          id: r.id,
          kind: r.kind as "hub" | "game",
          target_id: r.target_id,
          region: r.region,
          position: r.position,
          active: r.active,
          note: r.note,
          target_name: nameById.get(r.target_id) ?? null,
        })),
      };
    },
  );

export const upsertControlDiscoveryPlacement = createServerFn({ method: "POST" })
  .validator(
    (data: {
      accessToken: string;
      id?: string;
      kind: "hub" | "game";
      targetId: string;
      region?: string;
      position?: number;
      active?: boolean;
      note?: string;
    }) => data,
  )
  .handler(async ({ data }): Promise<{ ok: true; id: string } | Fail> => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

    const targetId = data.targetId.trim();
    if (!targetId) return { ok: false, error: "Target required", code: "VALIDATION" };

    const payload = {
      kind: data.kind,
      target_id: targetId,
      region: data.region?.trim() || null,
      position: data.position ?? 0,
      active: data.active ?? true,
      note: data.note?.trim() ?? "",
      updated_at: new Date().toISOString(),
      created_by: auth.userId,
    };

    if (data.id) {
      const { error } = await admin
        .from("control_discovery_placements")
        .update(payload)
        .eq("id", data.id);
      if (error) {
        if (isMissingRelation(error)) {
          return {
            ok: false,
            error: "Apply migration 20260717190000_control_governance.sql first",
            code: "NOT_MIGRATED",
          };
        }
        return { ok: false, error: error.message };
      }
      await writeAdminAudit({
        actorId: auth.userId,
        action: "discovery.update",
        targetType: "discovery_placement",
        targetId: data.id,
        meta: { kind: data.kind, targetId },
      });
      return { ok: true, id: data.id };
    }

    const { data: row, error } = await admin
      .from("control_discovery_placements")
      .insert(payload)
      .select("id")
      .single();
    if (error) {
      if (isMissingRelation(error)) {
        return {
          ok: false,
          error: "Apply migration 20260717190000_control_governance.sql first",
          code: "NOT_MIGRATED",
        };
      }
      return { ok: false, error: error.message };
    }
    await writeAdminAudit({
      actorId: auth.userId,
      action: "discovery.create",
      targetType: "discovery_placement",
      targetId: row.id,
      meta: { kind: data.kind, targetId },
    });
    return { ok: true, id: row.id };
  });

export const deleteControlDiscoveryPlacement = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; id: string }) => data)
  .handler(async ({ data }): Promise<{ ok: true } | Fail> => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false, error: auth.error, code: auth.code };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false, error: "Service role not configured", code: "CONFIG" };

    const { error } = await admin.from("control_discovery_placements").delete().eq("id", data.id);
    if (error) return { ok: false, error: error.message };
    await writeAdminAudit({
      actorId: auth.userId,
      action: "discovery.delete",
      targetType: "discovery_placement",
      targetId: data.id,
    });
    return { ok: true };
  });
