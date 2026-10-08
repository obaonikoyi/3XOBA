import "server-only";

import { Google } from "arctic";

import { authConfig, siteUrl } from "@/lib/env";

export const OAUTH_STATE_COOKIE = "3xoba_oauth_state";
export const OAUTH_VERIFIER_COOKIE = "3xoba_oauth_verifier";

export function googleRedirectUri() {
  // Built from SITE_URL, never from the request's Host header.
  return `${siteUrl()}/api/auth/google/callback`;
}

export function googleClient() {
  const { clientId, clientSecret } = authConfig();
  if (!clientId || !clientSecret) throw new Error("Google sign-in is not configured");
  return new Google(clientId, clientSecret, googleRedirectUri());
}
