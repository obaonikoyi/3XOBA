import "server-only";

// All configuration comes from environment variables (set in Vercel → Project
// → Settings → Environment Variables). Nothing secret is ever stored in git.

const isProd = process.env.NODE_ENV === "production";

function read(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

/** Public origin of the site, e.g. https://3xoba.com (no trailing slash). */
export function siteUrl(): string {
  const configured = read("SITE_URL");
  if (configured) return configured.replace(/\/+$/, "");
  // Vercel provides the production domain automatically.
  const vercel = read("VERCEL_PROJECT_PRODUCTION_URL");
  if (vercel) return `https://${vercel}`;
  return isProd ? "https://localhost" : "http://localhost:3000";
}

export function authConfig() {
  const clientId = read("GOOGLE_CLIENT_ID");
  const clientSecret = read("GOOGLE_CLIENT_SECRET");
  const secret = read("AUTH_SECRET");
  const owners = (read("OWNER_EMAILS") ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  const ready = Boolean(clientId && clientSecret && secret && secret.length >= 32 && owners.length > 0);
  return { ready, clientId, clientSecret, secret, owners };
}

export function githubConfig() {
  const token = read("GITHUB_TOKEN");
  const repo = read("GITHUB_REPO");
  const branch = read("GITHUB_BRANCH") ?? "main";
  if (!token || !repo || !/^[\w.-]+\/[\w.-]+$/.test(repo) || !/^[\w./-]+$/.test(branch)) return null;
  return { token, repo, branch };
}

export function youtubeApiKey(): string | undefined {
  return read("YOUTUBE_API_KEY");
}

export const isProduction = isProd;
