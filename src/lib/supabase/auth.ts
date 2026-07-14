import type { Session, User } from "@supabase/supabase-js";
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
  const redirectTo =
    typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
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

export async function signOut(): Promise<AuthResult> {
  const client = getSupabaseBrowserClient();
  if (!client) return { ok: false, error: "Supabase is not configured", mock: true };
  const { error } = await client.auth.signOut();
  if (error) return { ok: false, error: error.message };
  return { ok: true, session: null, user: null };
}

export type OAuthProvider = "google" | "discord";

export async function signInWithOAuth(provider: OAuthProvider): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured", mock: true };
  }
  const client = getSupabaseBrowserClient()!;
  const redirectTo =
    typeof window !== "undefined" ? `${window.location.origin}/` : undefined;
  const { error } = await client.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, session: null, user: null };
}
