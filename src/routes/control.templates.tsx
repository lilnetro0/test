import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layers } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";
import { adminApplyMenaChannelTemplate, adminListHubs } from "@/lib/admin/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/templates")({
  component: TemplatesPage,
});

/** P2 templates — MENA Arabic channel seed (idempotent by slug). */
function TemplatesPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const [hubs, setHubs] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [hubId, setHubId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    void adminListHubs({ data: { accessToken } }).then((r) => {
      if (!r.ok) return;
      const list = (r.hubs as Array<{ id: string; name: string; slug: string }>).map((h) => ({
        id: h.id,
        name: h.name,
        slug: h.slug,
      }));
      setHubs(list);
      if (list[0]) setHubId(list[0].id);
    });
  }, [accessToken]);

  const apply = async () => {
    if (!accessToken || !hubId) return;
    setBusy(true);
    const r = await adminApplyMenaChannelTemplate({ data: { accessToken, hubId } });
    setBusy(false);
    if (!r.ok) toast.error(r.error);
    else toast.success(t("control.templates.applied", { n: String(r.created), s: String(r.skipped) }));
  };

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 p-4 md:p-8">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-accent">
          <Layers className="size-5" />
          <p className="text-[10px] font-semibold uppercase tracking-widest">
            {t("control.nav.group.work")}
          </p>
        </div>
        <h1 className="font-display text-2xl font-bold text-white">{t("control.templates.title")}</h1>
        <p className="text-sm text-stone-400">{t("control.templates.subtitle")}</p>
      </header>

      <div className="space-y-3 rounded-xl border border-border-subtle p-4">
        <label className="block space-y-1 text-xs text-stone-400">
          {t("control.templates.pickHub")}
          <select
            value={hubId}
            onChange={(e) => setHubId(e.target.value)}
            className="w-full rounded-lg border border-border-subtle bg-white/5 px-3 py-2 text-sm text-white"
          >
            {hubs.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.slug})
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={busy || !hubId}
          onClick={() => void apply()}
          className="rounded-lg bg-accent/20 px-4 py-2 text-xs font-semibold text-accent disabled:opacity-50"
        >
          {t("control.templates.applyMena")}
        </button>
        {hubId && (
          <Link
            to="/control/communities/$communityId/channels"
            params={{ communityId: hubId }}
            className="block text-xs font-semibold text-accent"
          >
            {t("control.templates.openChannels")}
          </Link>
        )}
      </div>
    </div>
  );
}
