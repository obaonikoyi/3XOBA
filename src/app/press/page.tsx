import type { Metadata } from "next";
import Link from "next/link";

import { Cover } from "@/components/Cover";
import { PlatformIcon } from "@/components/Icon";
import { InnerNav, SiteFooter } from "@/components/SiteFooter";
import { getPublishedContent } from "@/lib/content/store";
import { LISTEN_PLATFORMS, SOCIAL_PLATFORMS } from "@/lib/content/schema";
import { formatDate, paragraphs, todayIso } from "@/lib/format";
import { filledLinks } from "@/lib/platforms";
import { isUpcoming, RELEASE_LABEL, releasePath } from "@/lib/releases";

export async function generateMetadata(): Promise<Metadata> {
  const { artist, press } = getPublishedContent();
  return {
    title: { absolute: `${artist.name} — Press kit` },
    description: press.shortBio || `Bio, photos and booking contact for ${artist.name}.`,
    alternates: { canonical: "/press" },
  };
}

// An electronic press kit (EPK) for promoters, bookers and media.
// Prints cleanly as a one-sheet.
export default function PressPage() {
  const site = getPublishedContent();
  const { artist, press, contact } = site;
  const today = todayIso();
  const latest = site.releases[0];
  const shortBio = press.shortBio || paragraphs(artist.bio)[0] || "";
  const fullBio = paragraphs(artist.bio);
  const links = filledLinks(site.links, [...LISTEN_PLATFORMS, ...SOCIAL_PLATFORMS]);
  const upcomingShows = site.shows.filter((s) => s.date && s.date >= today).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <InnerNav site={site} back={{ href: "/", label: "Main site" }} />
      <main className="inner-page press">
        <section className="section">
          <div className="wrap press-head">
            <div>
              <p className="eyebrow">Press kit{artist.location ? ` · ${artist.location}` : ""}</p>
              <h1 className="h-display press-name">{artist.name}</h1>
              {shortBio ? <p className="press-lead">{shortBio}</p> : null}
              <div className="hero-actions press-actions">
                {contact.bookingEmail ? (
                  <a className="btn btn-primary" href={`mailto:${contact.bookingEmail}?subject=${encodeURIComponent(`Booking enquiry: ${artist.name}`)}`}>
                    Book {artist.name}
                  </a>
                ) : null}
                <a className="btn print-hide" href="#photos">
                  Press photos
                </a>
              </div>
            </div>
            {artist.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="press-portrait" src={artist.photo} alt={artist.name} />
            ) : null}
          </div>
        </section>

        {press.highlights.length > 0 ? (
          <section className="section">
            <div className="wrap">
              <p className="eyebrow">Highlights</p>
              <ul className="press-highlights">
                {press.highlights.map((h) => (
                  <li key={h.id}>{h.text}</li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {fullBio.length > 0 ? (
          <section className="section">
            <div className="wrap press-cols">
              <div>
                <p className="eyebrow">Biography</p>
                <h2 className="h-section">About {artist.name}</h2>
              </div>
              <div className="bio">
                {fullBio.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {latest ? (
          <section className="section">
            <div className="wrap press-release">
              <Cover src={latest.cover} title={latest.title} />
              <div>
                <p className="eyebrow">{isUpcoming(latest, today) ? "Upcoming release" : "Latest release"}</p>
                <h2 className="h-section">{latest.title}</h2>
                <p className="muted">
                  {RELEASE_LABEL[latest.type]}
                  {latest.releaseDate ? ` · ${formatDate(latest.releaseDate)}` : ""}
                </p>
                {latest.description ? <p>{latest.description}</p> : null}
                <Link className="btn btn-small" href={releasePath(latest)}>
                  Listen →
                </Link>
              </div>
            </div>
          </section>
        ) : null}

        <section className="section" id="photos">
          <div className="wrap">
            <p className="eyebrow">Press photos</p>
            <h2 className="h-section">Photos</h2>
            {press.photos.length > 0 ? (
              <div className="press-photos">
                {press.photos.map((photo, i) => (
                  <figure key={photo.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.image} alt={photo.caption || `${artist.name} press photo ${i + 1}`} loading="lazy" decoding="async" />
                    <figcaption>
                      <span>{photo.caption}</span>
                      <a className="print-hide" href={photo.image} download>
                        Download
                      </a>
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <p className="empty">Press photos available on request{contact.bookingEmail ? ` — ${contact.bookingEmail}` : ""}.</p>
            )}
          </div>
        </section>

        {upcomingShows.length > 0 ? (
          <section className="section">
            <div className="wrap">
              <p className="eyebrow">Live</p>
              <h2 className="h-section">Upcoming shows</h2>
              <ul className="shows">
                {upcomingShows.map((s) => (
                  <li key={s.id}>
                    <div className="show-date">{formatDate(s.date, { day: "numeric", month: "short", year: "numeric" })}</div>
                    <div>
                      <div className="show-city">{s.city}</div>
                      {s.venue ? <div className="muted">{s.venue}</div> : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        <section className="section">
          <div className="wrap press-cols">
            <div>
              <p className="eyebrow">Contact</p>
              <h2 className="h-section">Bookings &amp; press</h2>
            </div>
            <div>
              {contact.bookingEmail ? (
                <p className="press-contact">
                  <a href={`mailto:${contact.bookingEmail}`}>{contact.bookingEmail}</a>
                </p>
              ) : null}
              {links.length > 0 ? (
                <ul className="press-links">
                  {links.map((l) => (
                    <li key={l.key}>
                      <a href={l.url} target="_blank" rel="noopener noreferrer">
                        <PlatformIcon icon={l.icon} name={l.name} size={16} /> {l.name}
                        <span className="print-only"> — {l.url}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter site={site} />
    </>
  );
}
