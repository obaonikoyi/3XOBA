import { generateCodeVerifier, generateState } from "arctic";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { googleClient, OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE } from "@/lib/auth/google";
import { authConfig, isProduction } from "@/lib/env";

// Step 1 of sign-in: send the browser to Google with a one-time state value
// (stops forged callbacks) and a PKCE verifier (stops stolen codes being used).
export async function GET() {
  if (!authConfig().ready) redirect("/login?error=setup");

  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = googleClient().createAuthorizationURL(state, codeVerifier, ["openid", "email", "profile"]);
  url.searchParams.set("prompt", "select_account");

  const jar = await cookies();
  const options = { httpOnly: true, secure: isProduction, sameSite: "lax" as const, path: "/", maxAge: 600 };
  jar.set(OAUTH_STATE_COOKIE, state, options);
  jar.set(OAUTH_VERIFIER_COOKIE, codeVerifier, options);

  redirect(url.toString());
}
