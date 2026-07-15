import { createFileRoute } from "@tanstack/react-router";
import { collectAppHealth } from "@/lib/ops/health";
import { logEvent } from "@/lib/ops/log";

/**
 * Public readiness probe for uptime monitors / post-deploy checks.
 * GET /api/health → 200 when Supabase probe ok, else 503.
 */
export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const report = await collectAppHealth();
          if (!report.ok) {
            logEvent("warn", "health.check_failed", {
              supabase: report.supabase.ok,
              livekit: report.livekit.configured,
              message: report.supabase.message ?? null,
            });
          }
          return Response.json(report, { status: report.ok ? 200 : 503 });
        } catch (err) {
          logEvent("error", "health.check_exception", {
            message: err instanceof Error ? err.message : String(err),
          });
          return Response.json(
            {
              ok: false,
              env: process.env.NODE_ENV === "production" ? "production" : "development",
              ts: new Date().toISOString(),
              error: "Health check failed",
            },
            { status: 503 },
          );
        }
      },
    },
  },
});
