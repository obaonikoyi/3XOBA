import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getOwner } from "@/lib/auth/session";
import { authConfig } from "@/lib/env";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

// Fixed messages only: the ?error value is never echoed back onto the page.
const ERRORS: Record<string, string> = {
  denied: "That Google account isn't allowed in here.",
  expired: "The sign-in took too long or was interrupted. Please try again.",
  google: "Google couldn't complete the sign-in. Please try again.",
  setup: "Sign-in isn't set up yet. Follow the setup steps in the README.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getOwner()) redirect("/hub");
  const { error } = await searchParams;
  const ready = authConfig().ready;
  const message = error ? (ERRORS[error] ?? ERRORS.google) : !ready ? ERRORS.setup : null;

  return (
    <main className="login">
      <div className="login-card">
        <span className="wordmark">3XOBA</span>
        <p>Private area. Sign in with your Google account.</p>
        {message ? (
          <p className="status-err" role="alert">
            {message}
          </p>
        ) : null}
        {ready ? (
          <a className="btn google-btn" href="/api/auth/google">
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
              <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
            </svg>
            Continue with Google
          </a>
        ) : null}
      </div>
    </main>
  );
}
