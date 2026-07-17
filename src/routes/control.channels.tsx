import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Hash } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";
import { adminListHubs } from "@/lib/admin/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/channels")({
  component: ChannelsPickerPage,
});

/** Top-level Channels entry — pick a community, then edit under its entity page. */
function ChannelsPickerPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const [hubs, setHubs] = useState<Array<{ id: string; name: string; slug: string }>>([]);

  useEffect(() => {
    if (!accessToken) return;
    void adminListHubs({ data: { accessToken } }).then((r) => {
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setHubs(
        (r.hubs as Array<{ id: string; name: string; slug: string }>).map((h) => ({
          id: h.id,
          name: h.name,
          slug: h.slug,
        })),
      );
    });
  }, [accessToken]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-4 md:p-8">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-accent">
          <Hash className="size-5" />
          <p className="text-[10px] font-semibold uppercase tracking-widest">
            {t("control.nav.group.work")}
          </p>
        </div>
        <h1 className="font-display text-2xl font-bold text-white">{t("control.channels.title")}</h1>
        <p className="text-sm text-stone-400">{t("control.channels.subtitle")}</p>
      </header>
      <ul className="overflow-hidden rounded-xl border border-border-subtle">
        {hubs.map((h) => (
          <li key={h.id} className="border-b border-border-subtle/60 last:border-0">
            <Link
              to="/control/communities/$communityId/channels"
              params={{ communityId: h.id }}
              className="block px-3 py-2.5 hover:bg-white/[0.03]"
            >
              <span className="font-semibold text-white">{h.name}</span>
              <span className="ms-2 text-xs text-stone-500">{h.slug}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
