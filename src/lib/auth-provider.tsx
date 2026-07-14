import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  signInWithPassword,
  signOut as authSignOut,
  signUpWithPassword,
  resetPasswordForEmail,
  updatePassword,
  signInWithOAuth,
  type AuthResult,
  type OAuthProvider,
} from "@/lib/supabase/auth";
import {
  applyPrefsToLocal,
  ensureProfile,
  fetchUserPrefs,
  updateProfile as saveProfile,
  updateUserPrefs,
  type PrefsUpdate,
  type Profile,
  type ProfileUpdate,
  type Result,
  type UserPrefs,
} from "@/lib/supabase/profile";
import { useT, type Lang } from "@/lib/i18n";
import { toast } from "sonner";

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  prefs: UserPrefs | null;
  accessToken: string | null;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (input: {
    email: string;
    password: string;
    username: string;
    tag?: string;
  }) => Promise<AuthResult>;
  signInOAuth: (provider: OAuthProvider) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  changePassword: (password: string) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: ProfileUpdate) => Promise<Result<Profile>>;
  savePrefs: (patch: PrefsUpdate) => Promise<Result<UserPrefs>>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadOrCreateProfile(user: User): Promise<Profile | null> {
  const meta = user.user_metadata ?? {};
  const result = await ensureProfile(user.id, {
    email: user.email,
    username: typeof meta.username === "string" ? meta.username : null,
    tag: typeof meta.tag === "string" ? meta.tag : null,
    display_name: typeof meta.display_name === "string" ? meta.display_name : null,
  });
  return result.ok ? result.data : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const { setLang } = useT();
  const [loading, setLoading] = useState(configured);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [prefs, setPrefs] = useState<UserPrefs | null>(null);

  const refreshProfile = useCallback(async () => {
    const u = session?.user;
    if (!u) {
      setProfile(null);
      return;
    }
    setProfile(await loadOrCreateProfile(u));
  }, [session?.user]);

  const syncPrefs = useCallback(
    async (userId: string) => {
      const result = await fetchUserPrefs(userId);
      if (!result.ok || !result.data) return;
      setPrefs(result.data);
      applyPrefsToLocal(result.data);
      if (result.data.lang === "en" || result.data.lang === "ar") {
        setLang(result.data.lang as Lang);
      }
    },
    [setLang],
  );

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    const client = getSupabaseBrowserClient();
    if (!client) {
      setLoading(false);
      return;
    }

    let mounted = true;

    client.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [configured]);

  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      setPrefs(null);
      return;
    }
    const user = session.user;
    void (async () => {
      const p = await loadOrCreateProfile(user);
      if (p?.banned_at) {
        toast.error(p.ban_reason?.trim() || "This account has been suspended.");
        await authSignOut();
        setProfile(null);
        setPrefs(null);
        setSession(null);
        return;
      }
      setProfile(p);
      await syncPrefs(user.id);
    })();
  }, [session?.user?.id, syncPrefs]);

  const updateProfile = useCallback(
    async (patch: ProfileUpdate) => {
      const uid = session?.user?.id;
      if (!uid) return { ok: false as const, error: "Not authenticated" };
      const result = await saveProfile(uid, patch);
      if (result.ok) setProfile(result.data);
      return result;
    },
    [session?.user?.id],
  );

  const savePrefs = useCallback(
    async (patch: PrefsUpdate) => {
      const uid = session?.user?.id;
      if (!uid) return { ok: false as const, error: "Not authenticated" };
      const result = await updateUserPrefs(uid, patch);
      if (result.ok) {
        setPrefs(result.data);
        if (patch.lang) setLang(patch.lang);
      }
      return result;
    },
    [session?.user?.id, setLang],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      loading,
      session,
      user: session?.user ?? null,
      profile,
      prefs,
      accessToken: session?.access_token ?? null,
      signIn: signInWithPassword,
      signUp: signUpWithPassword,
      signInOAuth: signInWithOAuth,
      resetPassword: resetPasswordForEmail,
      changePassword: updatePassword,
      signOut: authSignOut,
      refreshProfile,
      updateProfile,
      savePrefs,
    }),
    [configured, loading, session, profile, prefs, refreshProfile, updateProfile, savePrefs],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
