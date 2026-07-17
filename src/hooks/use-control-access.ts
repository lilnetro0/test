import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-provider";
import { checkControlAccess } from "@/lib/control/api";
import type { ControlPermission } from "@/lib/control/permissions";

export type ControlAccessState =
  | { status: "loading" }
  | { status: "denied"; error?: string }
  | { status: "ok"; userId: string; permissions: ReadonlySet<ControlPermission> };

/** Gate + permission set for Nexus Control (P0 = full platform_admin grant). */
export function useControlAccess(): ControlAccessState {
  const { user, accessToken, loading } = useAuth();
  const [state, setState] = useState<ControlAccessState>({ status: "loading" });

  useEffect(() => {
    if (loading) return;
    if (!user || !accessToken) {
      setState({ status: "denied", error: "Not authenticated" });
      return;
    }
    let cancelled = false;
    setState({ status: "loading" });
    void checkControlAccess({ data: { accessToken } }).then((r) => {
      if (cancelled) return;
      if (!r.ok) {
        setState({ status: "denied", error: r.error });
        return;
      }
      setState({
        status: "ok",
        userId: r.userId,
        permissions: new Set(r.permissions),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [user, accessToken, loading]);

  return state;
}
