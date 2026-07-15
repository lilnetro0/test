import { createFileRoute } from "@tanstack/react-router";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push/send";
import { logEvent } from "@/lib/ops/log";

/**
 * Ops webhook for Database Webhook / cron → push fanout.
 * Header: x-nexus-push-secret: PUSH_DISPATCH_SECRET
 * Body: { notification_id: uuid } | { user_id, title, body?, href? }
 */
export const Route = createFileRoute("/api/push-dispatch")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = (process.env.PUSH_DISPATCH_SECRET as string | undefined)?.trim();
        if (!expected) {
          logEvent("warn", "push_dispatch.not_configured");
          return Response.json({ ok: false, error: "PUSH_DISPATCH_SECRET not configured" }, { status: 503 });
        }
        const provided = request.headers.get("x-nexus-push-secret")?.trim();
        if (!provided || provided !== expected) {
          logEvent("warn", "push_dispatch.forbidden");
          return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
        }

        let body: Record<string, unknown>;
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
        }

        const notificationId =
          typeof body.notification_id === "string"
            ? body.notification_id
            : typeof body.record === "object" &&
                body.record &&
                typeof (body.record as { id?: string }).id === "string"
              ? (body.record as { id: string }).id
              : null;

        if (notificationId) {
          const admin = getSupabaseAdminClient();
          if (!admin) {
            return Response.json({ ok: false, error: "Admin client unavailable" }, { status: 503 });
          }
          const { data: row, error } = await admin
            .from("notifications")
            .select("id, user_id, title, body, href, kind")
            .eq("id", notificationId)
            .maybeSingle();
          if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
          if (!row) return Response.json({ ok: false, error: "Not found" }, { status: 404 });

          const result = await sendPushToUser(row.user_id, {
            title: row.title,
            body: row.body,
            href: row.href,
            tag: row.id,
            kind: row.kind,
          });
          return Response.json({ ok: true, ...result });
        }

        const userId = typeof body.user_id === "string" ? body.user_id : null;
        const title = typeof body.title === "string" ? body.title : null;
        if (!userId || !title) {
          return Response.json(
            { ok: false, error: "Provide notification_id or user_id+title" },
            { status: 400 },
          );
        }

        const result = await sendPushToUser(userId, {
          title,
          body: typeof body.body === "string" ? body.body : "",
          href: typeof body.href === "string" ? body.href : "/notifications",
        });
        return Response.json({ ok: true, ...result });
      },
    },
  },
});
