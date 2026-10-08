import { headers } from "next/headers";

import { Countdown } from "@/components/Countdown";
import { Cover } from "@/components/Cover";
import { EmbedPlayer } from "@/components/EmbedPlayer";
import { PlatformIcon } from "@/components/Icon";
import { getPublishedContent } from "@/lib/content/store";
import { LISTEN_PLATFORMS, SOCIAL_PLATFORMS, type Release } from "@/lib/content/schema";
import { bestEmbed, embedFor, youtubeId, youtubeThumbnail } from "@/lib/embeds";
import { siteUrl } from "@/lib/env";
import { formatDate, paragraphs, todayIso } from "@/lib/format";
import { filledLinks } from "@/lib/platforms";
import { latestUploads } from "@/lib/youtube";

const RELEASE_LABEL: Record<Release["type"], string> = { single: "Single", ep: "EP", album: "Album", mixtape: "Mixtape" };
const ALL_PLATFORMS = [...LISTEN_PLATFORMS, ...SOCIAL_PLATFORMS] as const;

function releaseHref(release: Release) {
  return release.smartLink || LISTEN_PLATFORMS.map((key) => release.links[key]).find(Boolean) || "";
}

export default async function Home() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const site = getPublishedContent();
  const { artist, releases, shows, contact, newsletter } = site;
  const today = todayIso();

  const latest = releases[0];
  const upcoming = Boolean(latest?.releaseDate && latest.releaseDate > today);
  const latestLinks = latest ? filledLinks(latest.links, LISTEN_PLATFORMS) : [];
  const latestEmbed = latest ? bestEmbed(latest.links) : null;
  const socials = filledLinks(site.links, ALL_PLATFORMS);

  // Videos: newest YouTube uploads automatically, or the hand-picked list.
  let videos = site.videos.items
    .map((v) => ({ id: youtubeId(v.url), title: v.title }))
    .filter((v): v is { id: string; title: string } => Boolean(v.id));
  if (site.videos.autoFromYouTube && site.videos.youtubeChannelId) {
    const uploads = await latestUploads(site.videos.youtubeChannelId);
    if (uploads?.length) videos = uploads;
  }

  const upcomingShows = shows
    .filter((s) => !s.date || s.date >= today)
    .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));

  const hasAbout = Boolean(artist.bio || artist.photo);
  const hasContact = Boolean(contact.bookingEmail || contact.pressKitUrl || newsletter.url);
  const nav = [
    latest && ["#music", "Music"],
    videos.length > 0 && ["#videos", "Videos"],
    ["#shows", "Shows"],
    hasAbout && ["#about", "About"],
    hasContact && ["#contact", "Contact"],
  ].filter(Boolean) as [string, string][];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name: artist.name,
    url: siteUrl(),
    description: artist.tagline || undefined,
    image: artist.photo || artist.heroImage || undefined,
    sameAs: socials.map((s) => s.url),
  };

  const tickerItems = latest
    ? [`New ${RELEASE_LABEL[latest.type]}`, latest.title, upcoming ? `Out ${formatDate(latest.releaseDate, { day: "numeric", month: "long" })}` : "Out now", artist.name]
    : [];

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        // JSON-LD for search engines; "<" is escaped so content can't close the tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <header className="site-nav">
        <div className="wrap">
          <a className="wordmark" href="#top">
            {artist.name}
          </a>
          <nav aria-label="Sections">
            <ul>
              {nav.map(([href, label]) => (
                <li key={href}>
                  <a href={href}>{label}</a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="hero" aria-label={artist.name}>
          <div className={`hero-bg ${artist.heroImage ? "" : "hero-bg-generated"}`}>
            {artist.heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={artist.heroImage} alt="" fetchPriority="high" />
            ) : null}
          </div>
          <div className="wrap">
            {artist.location ? <p className="eyebrow">{artist.location}</p> : null}
            <h1 className="h-display hero-name">{artist.name}</h1>
            {artist.tagline ? <p className="hero-tagline">{artist.tagline}</p> : null}
            <div className="hero-actions">
              {latest && releaseHref(latest) ? (
                <a className="btn btn-primary" href={releaseHref(latest)} target="_blank" rel="noopener noreferrer">
                  {upcoming ? "Pre-save" : "Listen to"} “{latest.title}”
                </a>
              ) : null}
              {latest ? (
                <a className="btn" href="#music">
                  Latest music
                </a>
              ) : null}
            </div>
            {socials.length > 0 ? (
              <div className="hero-socials">
                {socials.map((s) => (
                  <a key={s.key} className="icon-link" href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.name} title={s.name}>
                    <PlatformIcon icon={s.icon} name={s.name} size={18} />
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        {latest ? (
          <div className="ticker" aria-hidden="true">
            <div className="ticker-track">
              {[0, 1, 2, 3].flatMap((n) => tickerItems.map((item, i) => <span key={`${n}-${i}`}>{item}</span>))}
            </div>
          </div>
        ) : null}

        <section id="music" className="section">
          <div className="wrap">
            {latest ? (
              <>
                <div className="spotlight">
                  <Cover src={latest.cover} title={latest.title} className="spotlight-cover" />
                  <div>
                    <div className="release-meta">
                      <span className="pill pill-accent">{upcoming ? "Coming soon" : "Out now"}</span>
                      <span className="pill">{RELEASE_LABEL[latest.type]}</span>
                      {latest.releaseDate ? <span className="pill">{formatDate(latest.releaseDate)}</span> : null}
                    </div>
                    <h2 className="h-display release-title">{latest.title}</h2>
                    {latest.description ? <p className="release-desc">{latest.description}</p> : null}
                    {upcoming ? <Countdown date={latest.releaseDate} /> : null}

                    {upcoming && latest.smartLink ? (
                      <p>
                        <a className="btn btn-primary" href={latest.smartLink} target="_blank" rel="noopener noreferrer">
                          Pre-save now
                        </a>
                      </p>
                    ) : null}

                    {!upcoming && latestLinks.length > 0 ? (
                      <>
                        <p className="eyebrow">Choose your platform</p>
                        <div className="platform-grid">
                          {latestLinks.map((l) => (
                            <a key={l.key} className="platform-btn" href={l.url} target="_blank" rel="noopener noreferrer">
                              <PlatformIcon icon={l.icon} name={l.name} size={22} />
                              {l.name}
                              <span className="go" aria-hidden="true">
                                ↗
                              </span>
                            </a>
                          ))}
                        </div>
                      </>
                    ) : null}

                    {!upcoming && latestEmbed ? <EmbedPlayer embed={latestEmbed} title={latest.title} /> : null}
                  </div>
                </div>

                {releases.length > 1 ? (
                  <>
                    <h2 className="h-section disco-title">Discography</h2>
                    <div className="disco">
                      {releases.slice(1).map((r) => {
                        const href = releaseHref(r);
                        const body = (
                          <>
                            <Cover src={r.cover} title={r.title} />
                            <h3>{r.title}</h3>
                            <p>
                              {RELEASE_LABEL[r.type]}
                              {r.releaseDate ? ` · ${r.releaseDate.slice(0, 4)}` : ""}
                            </p>
                          </>
                        );
                        return href ? (
                          <a key={r.id} href={href} target="_blank" rel="noopener noreferrer">
                            {body}
                          </a>
                        ) : (
                          <div key={r.id}>{body}</div>
                        );
                      })}
                    </div>
                  </>
                ) : null}
              </>
            ) : (
              <>
                <p className="eyebrow">Music</p>
                <h2 className="h-section">New music is on the way.</h2>
                {socials.length > 0 ? <p className="muted">Follow along on the platforms above so you don’t miss it.</p> : null}
              </>
            )}
          </div>
        </section>

        {videos.length > 0 ? (
          <section id="videos" className="section">
            <div className="wrap">
              <p className="eyebrow">Watch</p>
              <h2 className="h-section">Videos</h2>
              <div className="video-grid">
                {videos.map((v) => {
                  const embed = embedFor(`https://youtu.be/${v.id}`);
                  return embed ? (
                    <div key={v.id}>
                      <EmbedPlayer embed={embed} title={v.title} thumbnail={youtubeThumbnail(v.id)} />
                      {v.title ? <p className="video-title">{v.title}</p> : null}
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </section>
        ) : null}

        <section id="shows" className="section">
          <div className="wrap">
            <p className="eyebrow">Live</p>
            <h2 className="h-section">Shows</h2>
            {upcomingShows.length > 0 ? (
              <ul className="shows">
                {upcomingShows.map((s) => (
                  <li key={s.id}>
                    <div className="show-date">
                      {s.date ? formatDate(s.date, { day: "numeric", month: "short" }) : "TBA"}
                      {s.date ? <small>{s.date.slice(0, 4)}</small> : null}
                    </div>
                    <div>
                      <div className="show-city">{s.city}</div>
                      {s.venue ? <div className="muted">{s.venue}</div> : null}
                    </div>
                    {s.ticketUrl ? (
                      <a className="btn btn-small btn-primary" href={s.ticketUrl} target="_blank" rel="noopener noreferrer">
                        Tickets
                      </a>
                    ) : (
                      <span className="pill">Tickets soon</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty">
                No dates announced yet.
                {contact.bookingEmail ? (
                  <>
                    {" "}
                    Want {artist.name} at your event? <a href={`mailto:${contact.bookingEmail}`}>Get in touch</a>.
                  </>
                ) : null}
              </div>
            )}
          </div>
        </section>

        {hasAbout ? (
          <section id="about" className="section">
            <div className="wrap about">
              {artist.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="about-photo" src={artist.photo} alt={artist.name} loading="lazy" decoding="async" />
              ) : (
                <Cover src="" title={artist.name} />
              )}
              <div>
                <p className="eyebrow">About</p>
                <h2 className="h-section">{artist.name}</h2>
                <div className="bio">
                  {paragraphs(artist.bio).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {hasContact ? (
          <section id="contact" className="section">
            <div className="wrap">
              <p className="eyebrow">Contact</p>
              <h2 className="h-section">Bookings, press &amp; fans</h2>
              <div className="contact-card">
                {contact.bookingEmail ? (
                  <div className="card">
                    <h3>Bookings</h3>
                    <p>Shows, features and collaborations.</p>
                    <a className="btn btn-primary btn-small" href={`mailto:${contact.bookingEmail}`}>
                      {contact.bookingEmail}
                    </a>
                  </div>
                ) : null}
                {contact.pressKitUrl ? (
                  <div className="card">
                    <h3>Press kit</h3>
                    <p>Photos, bio and logos for media and promoters.</p>
                    <a className="btn btn-small" href={contact.pressKitUrl} target="_blank" rel="noopener noreferrer">
                      Open press kit
                    </a>
                  </div>
                ) : null}
                {newsletter.url ? (
                  <div className="card">
                    <h3>{newsletter.label}</h3>
                    <p>Be first to hear new releases and show dates.</p>
                    <a className="btn btn-small" href={newsletter.url} target="_blank" rel="noopener noreferrer">
                      Sign up
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <footer className="site-footer">
        <div className="wrap">
          <div className="hero-socials footer-socials">
            {socials.map((s) => (
              <a key={s.key} className="icon-link" href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.name} title={s.name}>
                <PlatformIcon icon={s.icon} name={s.name} size={16} />
              </a>
            ))}
          </div>
          <small>
            © {new Date().getFullYear()} {artist.name}
          </small>
        </div>
      </footer>
    </>
  );
}
