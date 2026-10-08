import { decodeIdToken } from "arctic";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { googleClient, OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE } from "@/lib/auth/google";
import { createSession } from "@/lib/auth/session";
import { authConfig } from "@/lib/env";

type GoogleClaims = {
  iss?: string;
  aud?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
};

// Step 2 of sign-in: Google sends the browser back here. Only a verified
// Google account whose email is listed in OWNER_EMAILS gets a session.
export async function GET(request: NextRequest) {
  const config = authConfig();
  if (!config.ready) redirect("/login?error=setup");

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const jar = await cookies();
  const storedState = jar.get(OAUTH_STATE_COOKIE)?.value;
  const codeVerifier = jar.get(OAUTH_VERIFIER_COOKIE)?.value;
  jar.delete(OAUTH_STATE_COOKIE);
  jar.delete(OAUTH_VERIFIER_COOKIE);

  if (!code || !state || !storedState || !codeVerifier || state !== storedState) {
    redirect("/login?error=expired");
  }

  let claims: GoogleClaims;
  try {
    const tokens = await googleClient().validateAuthorizationCode(code, codeVerifier);
    // The ID token came straight from Google's token endpoint over TLS, so its
    // contents can be trusted; we still check who it was issued by and for.
    claims = decodeIdToken(tokens.idToken()) as GoogleClaims;
  } catch {
    redirect("/login?error=google");
  }

  const email = claims.email?.toLowerCase() ?? "";
  const trusted =
    (claims.iss === "https://accounts.google.com" || claims.iss === "accounts.google.com") &&
    claims.aud === config.clientId &&
    claims.email_verified === true &&
    config.owners.includes(email);

  if (!trusted) redirect("/login?error=denied");

  await createSession({ email, name: claims.name });
  redirect("/hub");
}
