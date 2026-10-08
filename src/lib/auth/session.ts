import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { authConfig, isProduction } from "@/lib/env";

// The owner session is a short signed token in an HttpOnly cookie:
// - HttpOnly: page scripts can't read it, so it can't be stolen by injected JS.
// - Secure + __Host- prefix (in production): only sent over HTTPS, only to
//   this exact host, can't be set by a subdomain.
// - SameSite=Lax: other sites can't make your browser send it with a form post.
// - Signed with AUTH_SECRET: can't be forged. Changing AUTH_SECRET in Vercel
//   instantly signs out every device.

export const SESSION_COOKIE = isProduction ? "__Host-3xoba_session" : "3xoba_session";
const SESSION_DAYS = 7;
const ISSUER = "3xoba-site";
const AUDIENCE = "3xoba-owner";

export type Owner = { email: string; name?: string };

function key() {
  const { secret } = authConfig();
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must be set (at least 32 characters)");
  return new TextEncoder().encode(secret);
}

export async function createSession(owner: Owner) {
  const token = await new SignJWT({ email: owner.email, name: owner.name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(key());

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** The signed-in owner, or null. Re-checks the allow-list on every call. */
export const getOwner = cache(async (): Promise<Owner | null> => {
  const config = authConfig();
  if (!config.ready) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    const email = typeof payload.email === "string" ? payload.email.toLowerCase() : "";
    if (!config.owners.includes(email)) return null;
    return { email, name: typeof payload.name === "string" ? payload.name : undefined };
  } catch {
    return null;
  }
});

/**
 * Use at the top of every private page AND every server action. A page check
 * alone is not enough: actions can be called directly, so each one re-checks.
 */
export async function requireOwner(): Promise<Owner> {
  const owner = await getOwner();
  if (!owner) redirect("/login");
  return owner;
}
