import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-provider";
import { listControlUserMemberships } from "@/lib/control/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/users/$userId/memberships")({
  component: UserMembershipsPage,
});

function UserMembershipsPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const { userId } = Route.useParams();
  const [rows, setRows] = useState<
    Array<{
      hub_id: string;
      role: string;
      joined_at: string;
      hub_name: string;
      hub_slug: string;
      region: string | null;
    }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    void listControlUserMemberships({ data: { accessToken, userId } }).then((r) => {
      if (cancelled) return;
      setLoading(false);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setRows(r.memberships);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, userId]);

  if (loading) return <p className="text-sm text-stone-500">{t("control.checking")}</p>;
  if (error) return <p className="text-sm text-red-300">{error}</p>;
  if (rows.length === 0) {
    return <p className="text-sm text-stone-500">{t("control.user.noMemberships")}</p>;
  }

  return (
    <ul className="overflow-hidden rounded-xl border border-border-subtle">
      {rows.map((m) => (
        <li
          key={m.hub_id}
          className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle/60 px-3 py-2.5 last:border-0"
        >
          <div>
            <p className="font-semibold text-white">{m.hub_name}</p>
            <p className="text-xs text-stone-500">
              {m.hub_slug}
              {m.region ? ` · ${m.region}` : ""} · {m.role}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-500">{new Date(m.joined_at).toLocaleDateString()}</span>
            {m.hub_slug && (
              <a href={`/c/${m.hub_slug}`} className="font-semibold text-accent">
                {t("control.search.openHub")}
              </a>
            )}
            <Link
              to="/control/phase/$code"
              params={{ code: "p2" }}
              className="font-semibold text-stone-400 hover:text-accent"
            >
              {t("control.search.opsSoon")}
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
