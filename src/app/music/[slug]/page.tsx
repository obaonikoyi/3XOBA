import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Countdown } from "@/components/Countdown";
import { Cover } from "@/components/Cover";
import { EmbedPlayer } from "@/components/EmbedPlayer";
import { PlatformButtons } from "@/components/PlatformButtons";
import { InnerNav, SiteFooter } from "@/components/SiteFooter";
import { getPublishedContent } from "@/lib/content/store";
import { bestEmbed } from "@/lib/embeds";
import { siteUrl } from "@/lib/env";
import { formatDate, paragraphs, todayIso } from "@/lib/format";
import { findRelease, isUpcoming, RELEASE_LABEL, releasePath } from "@/lib/releases";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const site = getPublishedContent();
  const release = findRelease(site, (await params).slug);
  if (!release) return { title: "Not found" };
  const upcoming = isUpcoming(release, todayIso());
  const title = `${release.title} — ${site.artist.name}`;
  const description =
    release.description ||
    (upcoming
      ? `New ${RELEASE_LABEL[release.type].toLowerCase()} from ${site.artist.name}, out ${formatDate(release.releaseDate)}. Pre-save now.`
      : `Listen to “${release.title}” by ${site.artist.name} on your favourite platform.`);
  const image = release.cover || site.artist.heroImage || site.artist.photo;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: releasePath(release) },
    openGraph: { type: "music.song", title, description, url: releasePath(release), images: image ? [image] : undefined },
    twitter: { card: image ? "summary_large_image" : "summary", title, description },
  };
}

export default async function ReleasePage({ params }: Props) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const site = getPublishedContent();
  const release = findRelease(site, (await params).slug);
  if (!release) notFound();

  const upcoming = isUpcoming(release, todayIso());
  const embed = bestEmbed(release.links);
  const others = site.releases.filter((r) => r.id !== release.id).slice(0, 8);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": release.type === "single" ? "MusicRecording" : "MusicAlbum",
    name: release.title,
    url: `${siteUrl()}${releasePath(release)}`,
    byArtist: { "@type": "MusicGroup", name: site.artist.name, url: siteUrl() },
    datePublished: release.releaseDate || undefined,
    image: release.cover || undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <InnerNav site={site} />
      <main className="inner-page">
        <section className="section">
          <div className="wrap spotlight">
            <Cover src={release.cover} title={release.title} className="spotlight-cover" />
            <div>
              <div className="release-meta">
                <span className="pill pill-accent">{upcoming ? "Coming soon" : "Out now"}</span>
                <span className="pill">{RELEASE_LABEL[release.type]}</span>
                {release.releaseDate ? <span className="pill">{formatDate(release.releaseDate)}</span> : null}
              </div>
              <h1 className="h-display release-title">{release.title}</h1>
              <p className="release-artist">{site.artist.name}</p>
              {release.description ? <p className="release-desc">{release.description}</p> : null}

              {upcoming ? (
                <>
                  <Countdown date={release.releaseDate} />
                  {release.smartLink ? (
                    <p>
                      <a className="btn btn-primary" href={release.smartLink} target="_blank" rel="noopener noreferrer">
                        Pre-save now
                      </a>
                    </p>
                  ) : (
                    <p className="muted">Out {formatDate(release.releaseDate, { weekday: "long", day: "numeric", month: "long" })}. Check back on release day.</p>
                  )}
                </>
              ) : (
                <>
                  <PlatformButtons release={release} />
                  {embed ? <EmbedPlayer embed={embed} title={release.title} /> : null}
                  {!embed && release.smartLink ? (
                    <p>
                      <a className="btn btn-primary" href={release.smartLink} target="_blank" rel="noopener noreferrer">
                        Listen now
                      </a>
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </section>

        {release.lyrics ? (
          <section className="section" id="lyrics">
            <div className="wrap lyrics-wrap">
              <p className="eyebrow">Lyrics</p>
              <h2 className="h-section">{release.title}</h2>
              <div className="lyrics">
                {paragraphs(release.lyrics).map((verse, i) => (
                  <p key={i}>{verse}</p>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {others.length > 0 ? (
          <section className="section">
            <div className="wrap">
              <h2 className="h-section">More from {site.artist.name}</h2>
              <div className="disco">
                {others.map((r) => (
                  <Link key={r.id} href={releasePath(r)}>
                    <Cover src={r.cover} title={r.title} />
                    <h3>{r.title}</h3>
                    <p>
                      {RELEASE_LABEL[r.type]}
                      {r.releaseDate ? ` · ${r.releaseDate.slice(0, 4)}` : ""}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter site={site} />
    </>
  );
}
