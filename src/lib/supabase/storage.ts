import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSupabaseUrl } from "@/lib/supabase/env";

function publicUrl(bucket: string, path: string): string {
  const base = getSupabaseUrl()?.replace(/\/$/, "") ?? "";
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

export async function uploadAvatar(
  userId: string,
  file: File,
): Promise<{ url?: string; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { error: "Supabase not configured" };

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/avatar.${ext}`;
  const { error } = await client.storage.from("avatars").upload(path, file, {
    upsert: true,
    contentType: file.type || "image/jpeg",
  });
  if (error) return { error: error.message };
  return { url: `${publicUrl("avatars", path)}?t=${Date.now()}` };
}

export async function uploadAttachment(
  userId: string,
  file: File,
): Promise<{ url?: string; name?: string; mime?: string; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { error: "Supabase not configured" };

  const safe = file.name.replace(/[^\w.\-()+ ]+/g, "_").slice(0, 120);
  const path = `${userId}/${Date.now()}-${safe}`;
  const { error } = await client.storage.from("attachments").upload(path, file, {
    upsert: false,
    contentType: file.type || "application/octet-stream",
  });
  if (error) return { error: error.message };
  return {
    url: publicUrl("attachments", path),
    name: file.name,
    mime: file.type || "application/octet-stream",
  };
}
