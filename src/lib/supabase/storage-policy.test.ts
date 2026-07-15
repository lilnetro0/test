import { describe, expect, it } from "vitest";
import {
  ATTACHMENT_REF_PREFIX,
  assertFileSize,
  assertUidFolder,
  fileExtension,
  parseAttachmentObjectPath,
  resolveAllowedMime,
  sanitizeStorageFileName,
  toAttachmentRef,
  IMAGE_MIME_TYPES,
} from "@/lib/supabase/storage-policy";

describe("storage-policy", () => {
  it("fileExtension and sanitizeStorageFileName", () => {
    expect(fileExtension("a/b/photo.PNG")).toBe("png");
    expect(fileExtension("noext")).toBe("");
    expect(sanitizeStorageFileName("evil/../x.js")).toBe("x.js");
    expect(sanitizeStorageFileName("  ok name.webp")).toMatch(/ok name\.webp/);
  });

  it("assertUidFolder blocks path traversal", () => {
    expect(assertUidFolder("user-1")).toBeNull();
    expect(assertUidFolder("../x")).toMatch(/Invalid/);
    expect(assertUidFolder("a/b")).toMatch(/Invalid/);
  });

  it("assertFileSize", () => {
    expect(assertFileSize(0, 100)).toMatch(/Empty/);
    expect(assertFileSize(101, 100)).toMatch(/too large/);
    expect(assertFileSize(50, 100)).toBeNull();
  });

  it("resolveAllowedMime allows images and blocks dangerous extensions", () => {
    const ok = resolveAllowedMime(
      { name: "a.png", type: "image/png" } as File,
      IMAGE_MIME_TYPES,
    );
    expect(ok).toEqual({ mime: "image/png" });

    const blocked = resolveAllowedMime(
      { name: "x.exe", type: "application/octet-stream" } as File,
      IMAGE_MIME_TYPES,
    );
    expect("error" in blocked).toBe(true);
  });

  it("parseAttachmentObjectPath + toAttachmentRef", () => {
    const path = "uid/file.png";
    expect(toAttachmentRef(path)).toBe(`${ATTACHMENT_REF_PREFIX}${path}`);
    expect(parseAttachmentObjectPath(`${ATTACHMENT_REF_PREFIX}${path}`)).toBe(path);
    expect(parseAttachmentObjectPath(path)).toBe(path);
    expect(
      parseAttachmentObjectPath(
        "https://x.supabase.co/storage/v1/object/public/attachments/uid/a.png",
      ),
    ).toBe("uid/a.png");
  });
});
