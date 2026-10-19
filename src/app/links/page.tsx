import type { Metadata } from "next";
import Link from "next/link";

import { Cover } from "@/components/Cover";
import { PlatformIcon } from "@/components/Icon";
import { getPublishedContent } from "@/lib/content/store";
import { LISTEN_PLATFORMS, SOCIAL_PLATFORMS } from "@/lib/content/schema";
import { formatDate, todayIso } from "@/lib/format";
import { filledLinks } from "@/lib/platforms";
import { isUpcoming, RELEASE_LABEL, releasePath } from "@/lib/releases";

export async function generateMetadata(): Promise<Metadata> {
  const { artist } = getPublishedContent();
  return {
    title: { absolute: `${artist.name} — Links` },
    description: `Every place to listen to and follow ${artist.name}.`,
    alternates: { canonical: "/links" },
  };
}

// The page for your TikTok / Instagram bio: one link, everything on it.
export default function LinksPage() {
  const site = getPublishedContent();
  const { artist, contact } = site;
  const today = todayIso();
  const latest = site.releases[0];
  const upcoming = latest ? isUpcoming(latest, today) : false;
  const listen = filledLinks(site.links, LISTEN_PLATFORMS);
  const socials = filledLinks(site.links, SOCIAL_PLATFORMS);
  const nextShow = site.shows.filter((s) => s.date && s.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
  const avatar = artist.photo || artist.heroImage;
  const featureLabel = latest
    ? `New ${RELEASE_LABEL[latest.type].toLowerCase()}${upcoming ? ` · out ${formatDate(latest.releaseDate, { day: "numeric", month: "short" })}` : ""}`
    : "";

  return (
    <main className="links-page">
      <div className="links-card">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="links-avatar" src={avatar} alt={artist.name} />
        ) : (
          <div className="links-avatar links-avatar-text" aria-hidden="true">
            {artist.name.slice(0, 2)}
          </div>
        )}
        <h1 className="h-display links-name">{artist.name}</h1>
        {artist.tagline ? <p className="links-tagline">{artist.tagline}</p> : null}

        {socials.length > 0 ? (
          <div className="hero-socials links-socials">
            {socials.map((s) => (
              <a key={s.key} className="icon-link" href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.name} title={s.name}>
                <PlatformIcon icon={s.icon} name={s.name} size={18} />
              </a>
            ))}
          </div>
        ) : null}

        <ul className="links-list">
          {latest ? (
            <li>
              {upcoming && latest.smartLink ? (
                <a className="links-feature" href={latest.smartLink} target="_blank" rel="noopener noreferrer">
                  <FeatureBody latestTitle={latest.title} cover={latest.cover} label={featureLabel} action={`Pre-save “${latest.title}”`} />
                </a>
              ) : (
                <Link className="links-feature" href={releasePath(latest)}>
                  <FeatureBody latestTitle={latest.title} cover={latest.cover} label={featureLabel} action={`${upcoming ? "Coming soon:" : "Listen to"} “${latest.title}”`} />
                </Link>
              )}
            </li>
          ) : null}
          {listen.map((l) => (
            <li key={l.key}>
              <a className="links-btn" href={l.url} target="_blank" rel="noopener noreferrer">
                <PlatformIcon icon={l.icon} name={l.name} size={22} />
                <span>{l.name}</span>
              </a>
            </li>
          ))}
          {nextShow ? (
            <li>
              <Link className="links-btn" href="/#shows">
                <span className="links-emoji" aria-hidden="true">
                  ◉
                </span>
                <span>
                  Live: {nextShow.city}, {formatDate(nextShow.date, { day: "numeric", month: "short" })}
                </span>
              </Link>
            </li>
          ) : null}
          {site.newsletter.url ? (
            <li>
              <a className="links-btn" href={site.newsletter.url} target="_blank" rel="noopener noreferrer">
                <span className="links-emoji" aria-hidden="true">
                  ✦
                </span>
                <span>{site.newsletter.label}</span>
              </a>
            </li>
          ) : null}
          {contact.bookingEmail ? (
            <li>
              <a className="links-btn" href={`mailto:${contact.bookingEmail}`}>
                <span className="links-emoji" aria-hidden="true">
                  ✉
                </span>
                <span>Bookings</span>
              </a>
            </li>
          ) : null}
          <li>
            <Link className="links-btn links-btn-quiet" href="/">
              <span>Official website</span>
            </Link>
          </li>
        </ul>
      </div>
    </main>
  );
}

function FeatureBody({ latestTitle, cover, label, action }: { latestTitle: string; cover: string; label: string; action: string }) {
  return (
    <>
      <Cover src={cover} title={latestTitle} className="links-feature-cover" />
      <span>
        <small>{label}</small>
        <strong>{action}</strong>
      </span>
    </>
  );
}
