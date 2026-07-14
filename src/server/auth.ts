import { createServerFn } from "@tanstack/react-start";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileDto } from "@/lib/supabase/dto";

export const getSessionProfile = createServerFn({ method: "GET" })
  .validator((data: { accessToken?: string }) => data)
  .handler(async ({ data }): Promise<{ profile: ProfileDto | null; error?: string }> => {
    if (!data.accessToken) return { profile: null };

    const client = getSupabaseServerClient(data.accessToken);
    if (!client) return { profile: null, error: "Supabase not configured" };

    const { data: userData, error: userError } = await client.auth.getUser(data.accessToken);
    if (userError || !userData.user) return { profile: null, error: userError?.message };

    const { data: row, error } = await client
      .from("profiles")
      .select("*")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (error) return { profile: null, error: error.message };
    if (!row) return { profile: null };

    return {
      profile: {
        id: row.id,
        username: row.username,
        tag: row.tag,
        displayName: row.display_name ?? row.username,
        bio: row.bio,
        status: row.status,
        statusText: row.status_text,
        avatarUrl: row.avatar_url,
      },
    };
  });

/** Admin health check — confirms service role is available (never expose key). */
export const getBackendHealth = createServerFn({ method: "GET" }).handler(async () => {
  const admin = getSupabaseAdminClient();
  const configured = Boolean(admin);
  if (!admin) {
    return { ok: false as const, configured, message: "Service role not configured" };
  }
  const { count, error } = await admin.from("games").select("*", { count: "exact", head: true });
  if (error) return { ok: false as const, configured, message: error.message };
  return { ok: true as const, configured, games: count ?? 0 };
});
