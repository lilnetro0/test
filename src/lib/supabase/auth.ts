import type { Session, User } from "@supabase/supabase-js";
import { authRedirectTo, isNativeApp } from "@/lib/capacitor";
import { getSupabaseBrowserClient } from "./client";
import { isSupabaseConfigured } from "./env";
import { allocateTag, isUsernameAvailable, normalizeTag, normalizeUsername } from "./profile";

export type AuthResult =
  | { ok: true; session: Session | null; user: User | null }
  | { ok: false; error: string; mock?: boolean };

export async function getSession(): Promise<Session | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session;
}

export async function getUser(): Promise<User | null> {
  const session = await getSession();
  return session?.user ?? null;
}

export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

export async function signInWithPassword(email: string, password: string): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured", mock: true };
  }
  const client = getSupabaseBrowserClient()!;
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true, session: data.session, user: data.user };
}

export async function signUpWithPassword(input: {
  email: string;
  password: string;
  username: string;
  tag?: string;
}): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured", mock: true };
  }

  const username = normalizeUsername(input.username);
  if (username.length < 2) {
    return { ok: false, error: "Username must be at least 2 characters (letters, numbers, _)" };
  }

  let tag = input.tag?.trim() ? normalizeTag(input.tag) : "";
  if (!tag) {
    const allocated = await allocateTag(username);
    if (!allocated.ok) return { ok: false, error: allocated.error };
    tag = allocated.data;
  } else {
    const avail = await isUsernameAvailable(username, tag);
    if (!avail.ok) return { ok: false, error: avail.error };
    if (!avail.data) {
      return { ok: false, error: `Username ${username}#${tag} is already taken` };
    }
  }

  const client = getSupabaseBrowserClient()!;
  const { data, error } = await client.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        username,
        tag,
        display_name: username,
      },
    },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, session: data.session, user: data.user };
}

export async function resetPasswordForEmail(email: string): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured", mock: true };
  }
  const client = getSupabaseBrowserClient()!;
  const redirectTo = isNativeApp()
    ? authRedirectTo()
    : typeof window !== "undefined"
      ? `${window.location.origin}/reset-password`
      : undefined;
  const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) return { ok: false, error: error.message };
  return { ok: true, session: null, user: null };
}

export async function updatePassword(password: string): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured", mock: true };
  }
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters" };
  }
  const client = getSupabaseBrowserClient()!;
  const { data, error } = await client.auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };
  return { ok: true, session: null, user: data.user };
}

export async function signOut(scope: "local" | "global" | "others" = "global"): Promise<AuthResult> {
  const client = getSupabaseBrowserClient();
  if (!client) return { ok: false, error: "Supabase is not configured", mock: true };
  const { error } = await client.auth.signOut({ scope });
  if (error) return { ok: false, error: error.message };
  return { ok: true, session: null, user: null };
}

/** Revoke refresh sessions on other devices; keep the current session. */
export async function signOutOtherSessions(): Promise<AuthResult> {
  return signOut("others");
}

export type LinkedIdentity = {
  identityId: string;
  provider: string;
  email?: string;
};

export async function listLinkedIdentities(): Promise<{
  identities: LinkedIdentity[];
  error?: string;
}> {
  const client = getSupabaseBrowserClient();
  if (!client) return { identities: [], error: "Supabase is not configured" };

  const { data, error } = await client.auth.getUserIdentities();
  if (error) return { identities: [], error: error.message };

  const identities = (data?.identities ?? []).map((id) => ({
    identityId: id.identity_id,
    provider: id.provider,
    email:
      typeof id.identity_data?.email === "string" ? id.identity_data.email : undefined,
  }));
  return { identities };
}

export async function unlinkOAuthIdentity(identityId: string): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured", mock: true };
  }
  const client = getSupabaseBrowserClient()!;
  const { data, error: listError } = await client.auth.getUserIdentities();
  if (listError) return { ok: false, error: listError.message };

  const identity = (data?.identities ?? []).find((i) => i.identity_id === identityId);
  if (!identity) return { ok: false, error: "Identity not found" };

  if ((data?.identities ?? []).length < 2) {
    return { ok: false, error: "Keep at least one sign-in method linked" };
  }

  const { error } = await client.auth.unlinkIdentity(identity);
  if (error) return { ok: false, error: error.message };
  return { ok: true, session: null, user: null };
}

export type OAuthProvider = "google" | "discord";

export async function signInWithOAuth(provider: OAuthProvider): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured", mock: true };
  }
  const client = getSupabaseBrowserClient()!;
  const redirectTo = authRedirectTo("/");
  const native = isNativeApp();

  const { data, error } = await client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: native,
    },
  });
  if (error) return { ok: false, error: error.message };

  if (native && data.url) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url: data.url, presentationStyle: "popover" });
  }

  return { ok: true, session: null, user: null };
}

/** Finish OAuth / email link when returning via deep link. */
export async function completeAuthFromUrl(url: string): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured", mock: true };
  }
  const client = getSupabaseBrowserClient()!;

  try {
    let code: string | null = null;
    try {
      code = new URL(url).searchParams.get("code");
    } catch {
      const q = url.includes("?") ? url.slice(url.indexOf("?") + 1).split("#")[0] : "";
      code = new URLSearchParams(q).get("code");
    }

    if (code) {
      const { data, error } = await client.auth.exchangeCodeForSession(code);
      if (error) return { ok: false, error: error.message };
      return { ok: true, session: data.session, user: data.user };
    }

    const hash = url.includes("#") ? url.slice(url.indexOf("#") + 1) : "";
    if (hash) {
      const params = new URLSearchParams(hash);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      if (access_token && refresh_token) {
        const { data, error } = await client.auth.setSession({ access_token, refresh_token });
        if (error) return { ok: false, error: error.message };
        return { ok: true, session: data.session, user: data.user };
      }
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not complete sign-in",
    };
  }

  return { ok: false, error: "No auth credentials in callback URL" };
}
