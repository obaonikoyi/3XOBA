import Link from "next/link";

import { PlatformIcon } from "@/components/Icon";
import { LISTEN_PLATFORMS, SOCIAL_PLATFORMS, type SiteContent } from "@/lib/content/schema";
import { filledLinks } from "@/lib/platforms";

export function SiteFooter({ site }: { site: SiteContent }) {
  const socials = filledLinks(site.links, [...LISTEN_PLATFORMS, ...SOCIAL_PLATFORMS]);
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="hero-socials footer-socials">
          {socials.map((s) => (
            <a key={s.key} className="icon-link" href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.name} title={s.name}>
              <PlatformIcon icon={s.icon} name={s.name} size={16} />
            </a>
          ))}
        </div>
        <nav className="footer-links" aria-label="More">
          <Link href="/">Home</Link>
          <Link href="/links">All links</Link>
          <Link href="/press">Press kit</Link>
        </nav>
        <small>
          © {new Date().getFullYear()} {site.artist.name}
        </small>
      </div>
    </footer>
  );
}

/** Slim top bar for inner pages. */
export function InnerNav({ site, back = { href: "/#music", label: "All music" } }: { site: SiteContent; back?: { href: string; label: string } }) {
  return (
    <header className="site-nav site-nav-solid">
      <div className="wrap">
        <Link className="wordmark" href="/">
          {site.artist.name}
        </Link>
        <Link className="back-link" href={back.href}>
          ← {back.label}
        </Link>
      </div>
    </header>
  );
}
