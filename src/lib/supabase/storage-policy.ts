/** Shared storage allowlists — keep in sync with supabase Phase 8 migration. */

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2 MiB
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024; // 10 MiB
export const HUB_MEDIA_MAX_BYTES = 8 * 1024 * 1024; // 8 MiB — high-res cover / banner
/** Soft cap across all objects under a user's attachments folder. */
export const ATTACHMENT_USER_QUOTA_BYTES = 100 * 1024 * 1024; // 100 MiB

export const ATTACHMENT_REF_PREFIX = "storage://attachments/";
export const SIGNED_URL_TTL_SEC = 60 * 60; // 1 hour

export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const ATTACHMENT_MIME_TYPES = [
  ...IMAGE_MIME_TYPES,
  "video/mp4",
  "application/pdf",
  "text/plain",
] as const;

export type ImageMime = (typeof IMAGE_MIME_TYPES)[number];
export type AttachmentMime = (typeof ATTACHMENT_MIME_TYPES)[number];

export const AVATAR_ACCEPT = IMAGE_MIME_TYPES.join(",");
export const ATTACHMENT_ACCEPT = ATTACHMENT_MIME_TYPES.join(",");
export const HUB_MEDIA_ACCEPT = AVATAR_ACCEPT;

/** Extra client blocklist (bucket MIME is primary). */
const BLOCKED_EXTENSIONS = new Set([
  "exe",
  "dll",
  "bat",
  "cmd",
  "msi",
  "scr",
  "com",
  "js",
  "mjs",
  "cjs",
  "html",
  "htm",
  "svg",
  "xml",
  "apk",
  "dmg",
  "pkg",
  "sh",
  "ps1",
  "vbs",
  "jar",
  "wasm",
]);

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  pdf: "application/pdf",
  txt: "text/plain",
};

export function fileExtension(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? name;
  const parts = base.split(".");
  if (parts.length < 2) return "";
  return parts.pop()!.toLowerCase();
}

export function sanitizeStorageFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "file";
  return base.replace(/[^\w.\-()+ ]+/g, "_").replace(/^\.+/, "").slice(0, 120) || "file";
}

export function assertUidFolder(userId: string): string | null {
  if (!userId || userId.includes("/") || userId.includes("\\") || userId.includes("..")) {
    return "Invalid upload path";
  }
  return null;
}

export function resolveAllowedMime(
  file: File,
  allowed: readonly string[],
): { mime: string } | { error: string } {
  const ext = fileExtension(file.name);
  if (ext && BLOCKED_EXTENSIONS.has(ext)) {
    return { error: "That file type is not allowed" };
  }

  let mime = (file.type || "").toLowerCase().trim();
  if (!mime || mime === "application/octet-stream") {
    const fromExt = ext ? EXT_TO_MIME[ext] : undefined;
    if (!fromExt || !allowed.includes(fromExt)) {
      return { error: "Unsupported or unknown file type" };
    }
    mime = fromExt;
  }

  if (!allowed.includes(mime)) {
    return { error: "That file type is not allowed" };
  }

  // Extension/MIME mismatch for known dangerous disguises
  if (ext && BLOCKED_EXTENSIONS.has(ext)) {
    return { error: "That file type is not allowed" };
  }

  return { mime };
}

export function assertFileSize(size: number, maxBytes: number): string | null {
  if (size <= 0) return "Empty file";
  if (size > maxBytes) {
    const mb = Math.round((maxBytes / (1024 * 1024)) * 10) / 10;
    return `File is too large (max ${mb} MB)`;
  }
  return null;
}

/** Magic-byte / content sniff (not AV). Returns sniffed MIME or null if unknown. */
export async function sniffContentMime(file: File): Promise<string | null> {
  const buf = new Uint8Array(await file.slice(0, 64).arrayBuffer());
  if (buf.length < 4) return null;

  // JPEG
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  // PNG
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  // GIF
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return "image/gif";
  // WEBP (RIFF....WEBP)
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return "image/webp";
  }
  // PDF
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return "application/pdf";
  // MP4 / ISO BMFF — "ftyp" at offset 4
  if (buf.length >= 8 && buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) {
    return "video/mp4";
  }

  // text/plain: no NUL in sample + mostly printable / whitespace
  const sample = buf.slice(0, Math.min(buf.length, 64));
  if (sample.every((b) => b !== 0)) {
    let ok = 0;
    for (const b of sample) {
      if (b === 9 || b === 10 || b === 13 || (b >= 32 && b <= 126) || b >= 128) ok += 1;
    }
    if (ok / sample.length >= 0.85) return "text/plain";
  }

  return null;
}

/**
 * Declared MIME must match sniffed type when sniff succeeds.
 * text/plain may match empty declared as text.
 */
export async function assertMimeMatchesContent(
  file: File,
  declaredMime: string,
): Promise<string | null> {
  const sniffed = await sniffContentMime(file);
  if (!sniffed) {
    return "Could not verify file contents";
  }
  if (sniffed !== declaredMime) {
    return "File contents do not match the declared type";
  }
  return null;
}

/** Extract storage object path from ref or legacy public URL. */
export function parseAttachmentObjectPath(ref: string): string | null {
  const raw = ref.trim();
  if (!raw) return null;
  if (raw.startsWith(ATTACHMENT_REF_PREFIX)) {
    return raw.slice(ATTACHMENT_REF_PREFIX.length).replace(/^\/+/, "") || null;
  }
  const marker = "/storage/v1/object/public/attachments/";
  const idx = raw.indexOf(marker);
  if (idx >= 0) {
    const rest = raw.slice(idx + marker.length).split("?")[0] ?? "";
    return decodeURIComponent(rest) || null;
  }
  const signMarker = "/storage/v1/object/sign/attachments/";
  const sidx = raw.indexOf(signMarker);
  if (sidx >= 0) {
    const rest = raw.slice(sidx + signMarker.length).split("?")[0] ?? "";
    return decodeURIComponent(rest) || null;
  }
  // Bare path uid/…
  if (!raw.includes("://") && !raw.startsWith("/") && raw.includes("/")) {
    return raw;
  }
  return null;
}

export function toAttachmentRef(objectPath: string): string {
  return `${ATTACHMENT_REF_PREFIX}${objectPath.replace(/^\/+/, "")}`;
}
