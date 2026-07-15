import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSupabaseUrl } from "@/lib/supabase/env";
import {
  assertFileSize,
  assertMimeMatchesContent,
  assertUidFolder,
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_MIME_TYPES,
  ATTACHMENT_USER_QUOTA_BYTES,
  AVATAR_MAX_BYTES,
  IMAGE_MIME_TYPES,
  parseAttachmentObjectPath,
  resolveAllowedMime,
  sanitizeStorageFileName,
  SIGNED_URL_TTL_SEC,
  toAttachmentRef,
} from "@/lib/supabase/storage-policy";

export {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_MIME_TYPES,
  ATTACHMENT_USER_QUOTA_BYTES,
  AVATAR_ACCEPT,
  AVATAR_MAX_BYTES,
  HUB_MEDIA_ACCEPT,
  HUB_MEDIA_MAX_BYTES,
  IMAGE_MIME_TYPES,
  parseAttachmentObjectPath,
  toAttachmentRef,
} from "@/lib/supabase/storage-policy";

function publicUrl(bucket: string, path: string): string {
  const base = getSupabaseUrl()?.replace(/\/$/, "") ?? "";
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function uploadAvatar(
  userId: string,
  file: File,
): Promise<{ url?: string; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { error: "Supabase not configured" };

  const pathErr = assertUidFolder(userId);
  if (pathErr) return { error: pathErr };

  const sizeErr = assertFileSize(file.size, AVATAR_MAX_BYTES);
  if (sizeErr) return { error: sizeErr };

  const mimeResult = resolveAllowedMime(file, IMAGE_MIME_TYPES);
  if ("error" in mimeResult) return { error: mimeResult.error };

  const sniffErr = await assertMimeMatchesContent(file, mimeResult.mime);
  if (sniffErr) return { error: sniffErr };

  const ext = MIME_TO_EXT[mimeResult.mime] ?? "jpg";
  const path = `${userId}/avatar.${ext}`;
  const { error } = await client.storage.from("avatars").upload(path, file, {
    upsert: true,
    contentType: mimeResult.mime,
  });
  if (error) return { error: error.message };
  return { url: `${publicUrl("avatars", path)}?t=${Date.now()}` };
}

export async function getAttachmentBytesUsed(): Promise<{ bytes: number; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { bytes: 0, error: "Supabase not configured" };
  const { data, error } = await client.rpc("attachment_bytes_used");
  if (error) return { bytes: 0, error: error.message };
  return { bytes: Number(data) || 0 };
}

export async function uploadAttachment(
  userId: string,
  file: File,
): Promise<{ url?: string; name?: string; mime?: string; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { error: "Supabase not configured" };

  const pathErr = assertUidFolder(userId);
  if (pathErr) return { error: pathErr };

  const sizeErr = assertFileSize(file.size, ATTACHMENT_MAX_BYTES);
  if (sizeErr) return { error: sizeErr };

  const mimeResult = resolveAllowedMime(file, ATTACHMENT_MIME_TYPES);
  if ("error" in mimeResult) return { error: mimeResult.error };

  const sniffErr = await assertMimeMatchesContent(file, mimeResult.mime);
  if (sniffErr) return { error: sniffErr };

  const used = await getAttachmentBytesUsed();
  if (used.error) return { error: used.error };
  if (used.bytes + file.size > ATTACHMENT_USER_QUOTA_BYTES) {
    return { error: "Attachment storage quota exceeded (100 MB per user)" };
  }

  const safe = sanitizeStorageFileName(file.name);
  const path = `${userId}/${Date.now()}-${safe}`;
  const { error } = await client.storage.from("attachments").upload(path, file, {
    upsert: false,
    contentType: mimeResult.mime,
  });
  if (error) return { error: error.message };

  return {
    url: toAttachmentRef(path),
    name: safe,
    mime: mimeResult.mime,
  };
}

/**
 * Resolve a stored attachment ref / legacy public URL to a fetchable HTTPS URL.
 * Prefer signed URLs for private `attachments` objects.
 */
export async function resolveAttachmentUrl(
  ref: string | undefined | null,
): Promise<string | undefined> {
  if (!ref) return undefined;
  const path = parseAttachmentObjectPath(ref);
  if (!path) {
    // External or unrecognized — return as-is
    return ref.startsWith("http") ? ref : undefined;
  }

  const client = getSupabaseBrowserClient();
  if (!client) return undefined;

  const { data, error } = await client.storage
    .from("attachments")
    .createSignedUrl(path, SIGNED_URL_TTL_SEC);
  if (error || !data?.signedUrl) return undefined;
  return data.signedUrl;
}
