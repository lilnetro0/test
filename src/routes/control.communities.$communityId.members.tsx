import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";
import { adminKickFromHub, adminSetHubRole } from "@/lib/admin/api";
import { listControlHubMembers, type ControlHubMember } from "@/lib/control/api";
import type { HubRole } from "@/lib/supabase/types";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/communities/$communityId/members")({
  component: CommunityMembersPage,
});

function CommunityMembersPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const { communityId } = Route.useParams();
  const [members, setMembers] = useState<ControlHubMember[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    const r = await listControlHubMembers({ data: { accessToken, hubId: communityId } });
    setLoading(false);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    setMembers(r.members);
  }, [accessToken, communityId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setRole = async (userId: string, role: HubRole) => {
    if (!accessToken) return;
    const r = await adminSetHubRole({ data: { accessToken, hubId: communityId, userId, role } });
    if (!r.ok) toast.error(r.error);
    else {
      toast.success(t("control.comm.roleUpdated"));
      void refresh();
    }
  };

  const kick = async (userId: string) => {
    if (!accessToken) return;
    if (!window.confirm(t("control.comm.kickConfirm"))) return;
    const r = await adminKickFromHub({ data: { accessToken, hubId: communityId, userId } });
    if (!r.ok) toast.error(r.error);
    else {
      toast.success(t("control.comm.kicked"));
      void refresh();
    }
  };

  if (loading) return <p className="text-sm text-stone-500">{t("control.checking")}</p>;

  return (
    <ul className="overflow-hidden rounded-xl border border-border-subtle">
      {members.length === 0 ? (
        <li className="px-3 py-6 text-center text-sm text-stone-500">{t("control.comm.noMembers")}</li>
      ) : (
        members.map((m) => (
          <li
            key={m.user_id}
            className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle/60 px-3 py-2.5 last:border-0"
          >
            <div>
              <Link
                to="/control/users/$userId"
                params={{ userId: m.user_id }}
                className="font-semibold text-white hover:text-accent"
              >
                {m.username}
                <span className="text-stone-500">#{m.tag}</span>
              </Link>
              <p className="text-xs text-stone-500">{new Date(m.joined_at).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={m.role}
                onChange={(e) => void setRole(m.user_id, e.target.value as HubRole)}
                className="rounded-md border border-border-subtle bg-white/5 px-2 py-1 text-xs text-white"
              >
                <option value="member">member</option>
                <option value="mod">mod</option>
                <option value="admin">admin</option>
              </select>
              <button
                type="button"
                onClick={() => void kick(m.user_id)}
                className="text-[10px] font-bold uppercase text-red-300"
              >
                {t("control.comm.kick")}
              </button>
            </div>
          </li>
        ))
      )}
    </ul>
  );
}
