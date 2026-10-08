import type { Metadata } from "next";

import { ReleaseChecklist } from "@/components/hub/ReleaseChecklist";
import { PlatformIcon } from "@/components/Icon";
import { OwnerBar } from "@/components/OwnerBar";
import { requireOwner } from "@/lib/auth/session";
import { HUB_GROUPS, LISTEN_PLATFORMS, SOCIAL_PLATFORMS, type HubGroup } from "@/lib/content/schema";
import { getEditableContent } from "@/lib/content/store";
import { githubConfig } from "@/lib/env";
import { compactNumber, formatDate, todayIso } from "@/lib/format";
import { BUILT_IN_LAUNCHERS, GROUP_TITLES, githubHistoryLauncher, type Launcher } from "@/lib/hub-links";
import { filledLinks } from "@/lib/platforms";
import { channelStats, isYouTubeConfigured } from "@/lib/youtube";

export const metadata: Metadata = { title: "Hub", robots: { index: false, follow: false } };

function greeting() {
  const hour = new Date().getUTCHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

export default async function HubPage() {
  const owner = await requireOwner();
  const { content } = await getEditableContent();
  const github = githubConfig();
  const youtube = isYouTubeConfigured() ? await channelStats(content.videos.youtubeChannelId) : null;

  const profiles: Launcher[] = filledLinks(content.links, [...LISTEN_PLATFORMS, ...SOCIAL_PLATFORMS]).map((l) => ({
    label: l.name,
    hint: "Your public page",
    url: l.url,
    icon: l.icon,
  }));

  const groups: Record<HubGroup, Launcher[]> = {
    create: [...BUILT_IN_LAUNCHERS.create],
    stats: [...BUILT_IN_LAUNCHERS.stats],
    money: [...BUILT_IN_LAUNCHERS.money],
    profiles,
    tools: [...(github ? [githubHistoryLauncher(github.repo, github.branch)] : []), ...BUILT_IN_LAUNCHERS.tools],
  };
  for (const link of content.hub.links) {
    groups[link.group].push({ label: link.label, hint: "Your shortcut", url: link.url, icon: null });
  }

  const latest = content.releases[0];
  const nextShow = content.shows
    .filter((s) => s.date && s.date >= todayIso())
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  return (
    <>
      <OwnerBar owner={owner} current="hub" name={content.artist.name} />
      <main className="wrap owner-main">
        <h1 className="owner-title">
          {greeting()}, {owner.name?.split(" ")[0] ?? content.artist.name}
        </h1>
        <p className="muted">Everything you run, one tap away. Only you can see this page.</p>

        <div className="stat-row">
          {youtube ? (
            <>
              <div className="stat">
                <span>YouTube subscribers</span>
                <strong>{youtube.subscribers === null ? "Hidden" : compactNumber(youtube.subscribers)}</strong>
              </div>
              <div className="stat">
                <span>YouTube views</span>
                <strong>{compactNumber(youtube.views)}</strong>
              </div>
              <div className="stat">
                <span>Videos</span>
                <strong>{compactNumber(youtube.videos)}</strong>
              </div>
            </>
          ) : null}
          <div className="stat">
            <span>Latest release</span>
            <strong className="stat-text">{latest ? latest.title : "—"}</strong>
          </div>
          <div className="stat">
            <span>Next show</span>
            <strong className="stat-text">{nextShow ? `${nextShow.city}, ${formatDate(nextShow.date, { day: "numeric", month: "short" })}` : "—"}</strong>
          </div>
        </div>
        {!youtube ? (
          <p className="notice hub-notice">
            <strong>Live YouTube numbers:</strong>{" "}
            {isYouTubeConfigured()
              ? "add your YouTube channel ID in Studio → Videos."
              : "add a YOUTUBE_API_KEY in Vercel and your channel ID in Studio → Videos."}{" "}
            Spotify, Apple Music and Audiomack don’t share artist numbers with outside apps, so their shortcuts below open your
            dashboards directly.
          </p>
        ) : null}

        <div className="hub-grid">
          {HUB_GROUPS.map((group) =>
            groups[group].length > 0 ? (
              <section key={group} className="hub-group" aria-labelledby={`hub-${group}`}>
                <h2 id={`hub-${group}`}>{GROUP_TITLES[group]}</h2>
                <div className="launchers">
                  {groups[group].map((launcher) => (
                    <a key={`${launcher.label}-${launcher.url}`} className="launcher" href={launcher.url} target="_blank" rel="noopener noreferrer">
                      <span className="launcher-icon">
                        <PlatformIcon icon={launcher.icon} name={launcher.brand ?? launcher.label} size={22} />
                      </span>
                      <span>
                        <strong>{launcher.label}</strong>
                        <small>{launcher.hint}</small>
                      </span>
                    </a>
                  ))}
                </div>
              </section>
            ) : null,
          )}

          <section className="hub-group" aria-labelledby="hub-checklist">
            <h2 id="hub-checklist">Release checklist</h2>
            <ReleaseChecklist />
          </section>
        </div>
      </main>
    </>
  );
}
