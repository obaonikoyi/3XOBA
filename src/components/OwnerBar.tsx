import Link from "next/link";

import { signOut } from "@/app/actions/auth";
import type { Owner } from "@/lib/auth/session";

export function OwnerBar({ owner, current, name }: { owner: Owner; current: "hub" | "studio"; name: string }) {
  return (
    <header className="owner-bar">
      <div className="wrap">
        <Link className="wordmark" href="/hub">
          {name}
        </Link>
        <nav aria-label="Owner">
          <Link href="/hub" aria-current={current === "hub" ? "page" : undefined}>
            Hub
          </Link>
          <Link href="/studio" aria-current={current === "studio" ? "page" : undefined}>
            Studio
          </Link>
          <a href="/" target="_blank" rel="noopener">
            Site ↗
          </a>
        </nav>
        <span className="spacer" />
        <small className="muted owner-email">{owner.email}</small>
        <form action={signOut}>
          <button className="btn btn-small" type="submit">
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
