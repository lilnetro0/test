import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-provider";
import { getControlHub, type ControlHubDetail } from "@/lib/control/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/communities/$communityId/")({
  component: CommunityOverviewPage,
});

function CommunityOverviewPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const { communityId } = Route.useParams();
  const [hub, setHub] = useState<ControlHubDetail | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    void getControlHub({ data: { accessToken, hubId: communityId } }).then((r) => {
      if (r.ok) setHub(r.hub);
    });
  }, [accessToken, communityId]);

  if (!hub) return <p className="text-sm text-stone-500">{t("control.checking")}</p>;

  return (
    <div className="space-y-4">
      <dl className="grid gap-3 rounded-xl border border-border-subtle p-4 text-sm sm:grid-cols-2">
        <Item label={t("control.comm.field.slug")} value={hub.slug} />
        <Item label={t("control.comm.field.game")} value={hub.game_name ?? hub.game_id} />
        <Item label={t("control.comm.field.region")} value={hub.region || t("control.comm.regionGlobal")} />
        <Item label={t("control.comm.members")} value={String(hub.member_count)} />
        <Item label={t("control.comm.active")} value={hub.active_count} />
        <div className="sm:col-span-2">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">ID</dt>
          <dd className="mt-0.5 font-mono text-xs text-stone-400">{hub.id}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-2">
        <a href={`/c/${hub.slug}`} className="rounded-md bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent">
          {t("control.search.openHub")}
        </a>
        <Link
          to="/control/games/$gameId"
          params={{ gameId: hub.game_id }}
          className="rounded-md bg-white/5 px-3 py-1.5 text-xs font-semibold text-stone-300"
        >
          {t("control.comm.openGame")}
        </Link>
        <Link
          to="/control/communities/$communityId/settings"
          params={{ communityId }}
          className="rounded-md bg-white/5 px-3 py-1.5 text-xs font-semibold text-stone-300"
        >
          {t("control.comm.tab.settings")}
        </Link>
      </div>
      {hub.image_url && (
        <img
          src={hub.image_url}
          alt=""
          className="max-h-40 rounded-xl border border-border-subtle object-cover"
        />
      )}
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">{label}</dt>
      <dd className="mt-0.5 text-white">{value}</dd>
    </div>
  );
}
