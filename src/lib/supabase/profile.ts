import { getSupabaseBrowserClient } from "./client";
import { isSupabaseConfigured } from "./env";
import type { Database, Tables } from "./types";
import type { HubNotifMode } from "@/lib/prefs";
import {
  setHighContrast,
  setHubNotif,
  setHubOrder,
  setReduceMotion,
} from "@/lib/prefs";
import { normalizeRegionCode, persistRegion } from "@/lib/regions";

export type Profile = Tables<"profiles">;
export type UserPrefs = Tables<"user_prefs">;

export type ProfileUpdate = {
  username?: string;
  tag?: string;
  display_name?: string | null;
  bio?: string;
  status?: string;
  status_text?: string;
  avatar_url?: string | null;
};

export type PrefsUpdate = {
  lang?: "en" | "ar";
  /** ISO country or MENA; empty string clears */
  region?: string | null;
  reduce_motion?: boolean;
  high_contrast?: boolean;
  hub_order?: string[];
  /** Keys = hubs.slug (HubCard.id) */
  hub_notif_modes?: Record<string, HubNotifMode>;
  push_enabled?: boolean;
  notif_sound?: boolean;
  notif_mentions_only?: boolean;
  notif_match_dnd?: boolean;
};

export type Result<T> = { ok: true; data: T } | { ok: false; error: string; mock?: boolean };

function normalizeUsername(raw: string): string {
  return raw.replace(/[^A-Za-z0-9_]/g, "").slice(0, 32);
}

function normalizeTag(raw: string | undefined): string {
  const digits = (raw ?? "").replace(/\D/g, "").slice(0, 4);
  if (digits.length === 4) return digits;
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

/** True if username+tag is free (or belongs to excludeUserId). */
export async function isUsernameAvailable(
  username: string,
  tag: string,
  excludeUserId?: string,
): Promise<Result<boolean>> {
  if (!isSupabaseConfigured()) return { ok: true, data: true };
  const client = getSupabaseBrowserClient()!;
  const uname = normalizeUsername(username);
  const utag = normalizeTag(tag);

  let q = client.from("profiles").select("id").eq("username", uname).eq("tag", utag);
  if (excludeUserId) q = q.neq("id", excludeUserId);

  const { data, error } = await q.maybeSingle();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: !data };
}

/** Pick an unused 4-digit tag for a username. */
export async function allocateTag(username: string): Promise<Result<string>> {
  if (!isSupabaseConfigured()) {
    return { ok: true, data: String(Math.floor(Math.random() * 10000)).padStart(4, "0") };
  }
  for (let i = 0; i < 20; i++) {
    const tag = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    const avail = await isUsernameAvailable(username, tag);
    if (!avail.ok) return avail;
    if (avail.data) return { ok: true, data: tag };
  }
  return { ok: false, error: "Could not allocate a unique tag. Try another username." };
}

/**
 * Ensure a public.profiles row exists for this auth user.
 * Needed when the account was created before schema, or after a schema reset
 * that dropped profiles but kept auth.users.
 */
export async function ensureProfile(
  userId: string,
  meta?: {
    email?: string | null;
    username?: string | null;
    tag?: string | null;
    display_name?: string | null;
  },
): Promise<Result<Profile>> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured", mock: true };
  }
  const client = getSupabaseBrowserClient()!;

  const { data: existing } = await client.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (existing) return { ok: true, data: existing };

  const fromEmail = (meta?.email ?? "player").split("@")[0] ?? "player";
  let username = normalizeUsername(meta?.username || fromEmail);
  if (username.length < 2) username = "player";

  let tag = meta?.tag ? normalizeTag(meta.tag) : "";
  if (!tag) {
    const allocated = await allocateTag(username);
    if (!allocated.ok) return allocated;
    tag = allocated.data;
  } else {
    const avail = await isUsernameAvailable(username, tag);
    if (!avail.ok) return avail;
    if (!avail.data) {
      const allocated = await allocateTag(username);
      if (!allocated.ok) return allocated;
      tag = allocated.data;
    }
  }

  const displayName = (meta?.display_name ?? username).trim() || username;

  const { data, error } = await client
    .from("profiles")
    .upsert(
      {
        id: userId,
        username,
        tag,
        display_name: displayName,
        bio: "",
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error:
        error?.message ??
        "Profile missing. Run supabase/manual/01_backfill_profiles.sql (see docs/DATABASE-OPERATIONS.md).",
    };
  }

  await client.from("user_prefs").upsert({ user_id: userId }, { onConflict: "user_id" });
  return { ok: true, data };
}

export async function updateProfile(userId: string, patch: ProfileUpdate): Promise<Result<Profile>> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured", mock: true };
  }
  const client = getSupabaseBrowserClient()!;

  const payload: ProfileUpdate = { ...patch };
  if (payload.username !== undefined) {
    payload.username = normalizeUsername(payload.username);
    if (payload.username.length < 2) {
      return { ok: false, error: "Username must be at least 2 characters" };
    }
  }
  if (payload.tag !== undefined) {
    payload.tag = normalizeTag(payload.tag);
  }

  if (payload.username !== undefined || payload.tag !== undefined) {
    const { data: current } = await client
      .from("profiles")
      .select("username, tag")
      .eq("id", userId)
      .maybeSingle();
    const uname = payload.username ?? current?.username ?? "";
    const utag = payload.tag ?? current?.tag ?? "0001";
    const avail = await isUsernameAvailable(uname, utag, userId);
    if (!avail.ok) return avail;
    if (!avail.data) return { ok: false, error: "That username#tag is already taken" };
  }

  const { data, error } = await client
    .from("profiles")
    .update(payload)
    .eq("id", userId)
    .select("*")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Update failed" };
  return { ok: true, data };
}

export async function fetchUserPrefs(userId: string): Promise<Result<UserPrefs | null>> {
  if (!isSupabaseConfigured()) return { ok: true, data: null };
  const client = getSupabaseBrowserClient()!;
  const { data, error } = await client.from("user_prefs").select("*").eq("user_id", userId).maybeSingle();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateUserPrefs(userId: string, patch: PrefsUpdate): Promise<Result<UserPrefs>> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured", mock: true };
  }
  const client = getSupabaseBrowserClient()!;

  const row: Database["public"]["Tables"]["user_prefs"]["Insert"] = { user_id: userId };
  if (patch.lang !== undefined) row.lang = patch.lang;
  if (patch.region !== undefined) {
    const n = normalizeRegionCode(patch.region ?? "");
    row.region = n || null;
  }
  if (patch.reduce_motion !== undefined) row.reduce_motion = patch.reduce_motion;
  if (patch.high_contrast !== undefined) row.high_contrast = patch.high_contrast;
  if (patch.hub_order !== undefined) row.hub_order = patch.hub_order as Database["public"]["Tables"]["user_prefs"]["Insert"]["hub_order"];
  if (patch.hub_notif_modes !== undefined) {
    row.hub_notif_modes =
      patch.hub_notif_modes as Database["public"]["Tables"]["user_prefs"]["Insert"]["hub_notif_modes"];
  }
  if (patch.push_enabled !== undefined) row.push_enabled = patch.push_enabled;
  if (patch.notif_sound !== undefined) row.notif_sound = patch.notif_sound;
  if (patch.notif_mentions_only !== undefined) row.notif_mentions_only = patch.notif_mentions_only;
  if (patch.notif_match_dnd !== undefined) row.notif_match_dnd = patch.notif_match_dnd;

  const { data, error } = await client
    .from("user_prefs")
    .upsert(row, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Prefs update failed" };
  applyPrefsToLocal(data);
  return { ok: true, data };
}

/** Mirror DB prefs into localStorage / CSS classes (keeps offline demo in sync). */
export function applyPrefsToLocal(prefs: UserPrefs) {
  setReduceMotion(prefs.reduce_motion);
  setHighContrast(prefs.high_contrast);

  const order = Array.isArray(prefs.hub_order) ? (prefs.hub_order as string[]) : [];
  if (order.length) setHubOrder(order);

  const modes = (prefs.hub_notif_modes ?? {}) as Record<string, HubNotifMode>;
  for (const [hubId, mode] of Object.entries(modes)) {
    if (mode === "all" || mode === "mentions" || mode === "mute") {
      setHubNotif(hubId, mode);
    }
  }

  try {
    if (prefs.lang === "en" || prefs.lang === "ar") {
      window.localStorage.setItem("nexus.lang", prefs.lang);
    }
    persistRegion(normalizeRegionCode(prefs.region));
  } catch {
    /* ignore */
  }
}

export { normalizeUsername, normalizeTag };
