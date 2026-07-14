import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-provider";

/**
 * Soft auth gate: when Supabase is configured, redirects unauthenticated users
 * to /login. When env is missing (demo/mock mode), children always render.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { configured, loading, session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!configured || loading) return;
    if (!session) {
      void navigate({ to: "/login" });
    }
  }, [configured, loading, session, navigate]);

  if (!configured) return <>{children}</>;
  if (loading) {
    return (
      <div className="grid h-screen place-items-center bg-background text-stone-400">
        <p className="text-xs font-semibold uppercase tracking-widest">Connecting…</p>
      </div>
    );
  }
  if (!session) return null;
  return <>{children}</>;
}
