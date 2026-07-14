import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-provider";
import { checkIsAdmin } from "@/lib/admin/api";

/** Cached platform-admin check for ADMIN_USER_IDS allowlist. */
export function useIsAdmin(): boolean {
  const { user, accessToken, loading } = useAuth();
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || !accessToken) {
      setAdmin(false);
      return;
    }
    let cancelled = false;
    void checkIsAdmin({ data: { accessToken } }).then((r) => {
      if (!cancelled) setAdmin(Boolean(r.admin));
    });
    return () => {
      cancelled = true;
    };
  }, [user, accessToken, loading]);

  return admin;
}
