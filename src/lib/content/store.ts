import "server-only";

import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

import bundled from "../../../content/site.json";
import { githubConfig, isProduction } from "@/lib/env";
import { siteSchema, type SiteContent } from "./schema";

// Where content lives:
// - The public site reads content/site.json as it was when the site was built.
// - The Studio saves by committing content/site.json (and uploaded images) to
//   GitHub. Vercel sees the commit and redeploys within about a minute. Every
//   save is a commit, so every version can be viewed and restored.
// - In local development (no GitHub token) the Studio writes the file directly.

const CONTENT_PATH = "content/site.json";
const UPLOAD_DIR = "public/uploads";

export type Storage = "github" | "local" | "none";

export class ContentConflictError extends Error {}

let published: SiteContent | null = null;

/** Content as of the current deploy. Used by the public page. */
export function getPublishedContent(): SiteContent {
  if (!published) published = siteSchema.parse(bundled);
  return published;
}

export function storageMode(): Storage {
  if (githubConfig()) return "github";
  return isProduction ? "none" : "local";
}

/** Latest saved content (may be newer than the deploy). Used by the Studio. */
export async function getEditableContent(): Promise<{ content: SiteContent; version: string | null; storage: Storage }> {
  const storage = storageMode();
  if (storage === "github") {
    const file = await githubGetFile(CONTENT_PATH);
    const raw = file ? JSON.parse(Buffer.from(file.content, "base64").toString("utf8")) : bundled;
    return { content: siteSchema.parse(raw), version: file?.sha ?? null, storage };
  }
  if (storage === "local") {
    const text = await readFile(localPath(CONTENT_PATH), "utf8");
    return { content: siteSchema.parse(JSON.parse(text)), version: sha1(text), storage };
  }
  return { content: getPublishedContent(), version: null, storage };
}

/**
 * Save new content. `version` is what the editor loaded; if the file changed
 * since (another tab or device saved first), refuse instead of overwriting.
 */
export async function saveContent(content: SiteContent, version: string | null): Promise<string> {
  const text = `${JSON.stringify(content, null, 2)}\n`;
  const storage = storageMode();

  if (storage === "github") {
    const current = await githubGetFile(CONTENT_PATH);
    if ((current?.sha ?? null) !== version) throw new ContentConflictError();
    return githubPutFile(CONTENT_PATH, Buffer.from(text, "utf8"), "Update site from Studio", current?.sha);
  }

  if (storage === "local") {
    const current = await readFile(localPath(CONTENT_PATH), "utf8");
    if (sha1(current) !== version) throw new ContentConflictError();
    await writeFile(localPath(CONTENT_PATH), text, "utf8");
    return sha1(text);
  }

  throw new Error("Saving isn't connected yet. Add the GitHub settings described in the README.");
}

/** Store an already-validated image and return its public path. */
export async function saveUpload(bytes: Buffer, ext: "jpg" | "png" | "webp"): Promise<string> {
  const name = `${createHash("sha256").update(bytes).digest("hex").slice(0, 32)}.${ext}`;
  const repoPath = `${UPLOAD_DIR}/${name}`;
  const storage = storageMode();

  if (storage === "github") {
    try {
      await githubPutFile(repoPath, bytes, `Upload image ${name} from Studio`);
    } catch (error) {
      // The name is a hash of the bytes, so "already exists" means "same image".
      if (!(error instanceof ContentConflictError)) throw error;
    }
  } else if (storage === "local") {
    await mkdir(localPath(UPLOAD_DIR), { recursive: true });
    await writeFile(localPath(repoPath), bytes);
  } else {
    throw new Error("Uploads aren't connected yet. Add the GitHub settings described in the README.");
  }
  return `/uploads/${name}`;
}

// ---------------------------------------------------------------------------

function sha1(text: string) {
  return createHash("sha1").update(text).digest("hex");
}

// Local mode only runs in development, so keep these paths out of the
// production bundle's file tracing.
function localPath(relative: string) {
  return path.join(/*turbopackIgnore: true*/ process.cwd(), relative);
}

async function github(pathname: string, init?: RequestInit) {
  const config = githubConfig();
  if (!config) throw new Error("GitHub storage is not configured");
  return fetch(`https://api.github.com/repos/${config.repo}/${pathname}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  });
}

async function githubGetFile(repoPath: string): Promise<{ sha: string; content: string } | null> {
  const { branch } = githubConfig()!;
  const res = await github(`contents/${repoPath}?ref=${encodeURIComponent(branch)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub read failed (${res.status})`);
  const body = (await res.json()) as { sha: string; content: string };
  return { sha: body.sha, content: body.content };
}

async function githubPutFile(repoPath: string, bytes: Buffer, message: string, sha?: string): Promise<string> {
  const { branch } = githubConfig()!;
  const res = await github(`contents/${repoPath}`, {
    method: "PUT",
    body: JSON.stringify({ message, content: bytes.toString("base64"), branch, ...(sha ? { sha } : {}) }),
  });
  if (res.status === 409 || res.status === 422) throw new ContentConflictError();
  if (!res.ok) throw new Error(`GitHub save failed (${res.status})`);
  const body = (await res.json()) as { content: { sha: string } };
  return body.content.sha;
}
