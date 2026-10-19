import { LISTEN_PLATFORMS, type Release, type SiteContent } from "@/lib/content/schema";
import { releaseSlug } from "@/lib/slug";

export const RELEASE_LABEL: Record<Release["type"], string> = { single: "Single", ep: "EP", album: "Album", mixtape: "Mixtape" };

/** Out after today (UTC)? Release-day pages flip to "Out now" by themselves. */
export function isUpcoming(release: Release, today: string) {
  return Boolean(release.releaseDate && release.releaseDate > today);
}

/** This release's page on the site. */
export function releasePath(release: Release) {
  return `/music/${releaseSlug(release)}`;
}

export function findRelease(content: SiteContent, slug: string) {
  return content.releases.find((r) => releaseSlug(r) === slug) ?? null;
}

/** Somewhere to send a listener directly: the pre-save link, else the first platform. */
export function externalListenLink(release: Release) {
  return release.smartLink || LISTEN_PLATFORMS.map((key) => release.links[key]).find(Boolean) || "";
}
