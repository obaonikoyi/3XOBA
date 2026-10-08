"use server";

import { requireOwner } from "@/lib/auth/session";
import { describeIssues, siteSchema } from "@/lib/content/schema";
import { ContentConflictError, saveContent, saveUpload, storageMode } from "@/lib/content/store";

// Server actions can be called directly by anyone who finds them, so every one
// re-checks the session and validates its input — never trust the browser.

export type SaveResult = { ok: true; version: string; message: string } | { ok: false; errors: string[] };

export async function saveSite(input: unknown, version: unknown): Promise<SaveResult> {
  await requireOwner();

  if (version !== null && (typeof version !== "string" || !/^[a-f0-9]{40}$/.test(version))) {
    return { ok: false, errors: ["Please reload the Studio and try again."] };
  }
  const parsed = siteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: describeIssues(parsed.error) };

  try {
    const next = await saveContent(parsed.data, version);
    return {
      ok: true,
      version: next,
      message: storageMode() === "github" ? "Saved. The live site updates in about a minute." : "Saved.",
    };
  } catch (error) {
    if (error instanceof ContentConflictError) {
      return {
        ok: false,
        errors: [
          "The site was changed somewhere else (another tab or device) since you opened the Studio. Copy anything you need, reload, and save again.",
        ],
      };
    }
    console.error("Studio save failed", error);
    return { ok: false, errors: [error instanceof Error && error.message.includes("README") ? error.message : "Saving failed. Please try again in a minute."] };
  }
}

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/** Identify the image by its first bytes, not by its name or claimed type. */
function sniffImage(bytes: Buffer): "jpg" | "png" | "webp" | null {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes.length > 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (bytes.length > 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

export type UploadResult = { ok: true; path: string } | { ok: false; error: string };

export async function uploadImage(formData: FormData): Promise<UploadResult> {
  await requireOwner();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose an image first." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: "That image is over 4 MB. Export it smaller (2000px wide is plenty)." };

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = sniffImage(bytes);
  if (!ext) return { ok: false, error: "Only JPG, PNG or WebP images can be uploaded." };

  try {
    return { ok: true, path: await saveUpload(bytes, ext) };
  } catch (error) {
    console.error("Studio upload failed", error);
    return { ok: false, error: error instanceof Error && error.message.includes("README") ? error.message : "Upload failed. Please try again." };
  }
}
