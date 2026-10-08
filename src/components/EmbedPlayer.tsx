"use client";

import { useState } from "react";

import type { Embed } from "@/lib/embeds";

const LABELS: Record<Embed["provider"], string> = {
  spotify: "Spotify",
  appleMusic: "Apple Music",
  youtube: "YouTube",
  soundcloud: "SoundCloud",
};

// Players from other sites are only loaded when a visitor presses play. Until
// then the page makes no requests to Spotify/YouTube/etc., which keeps it fast
// and means those companies can't track visitors who never press play.
export function EmbedPlayer({ embed, title, thumbnail }: { embed: Embed; title: string; thumbnail?: string }) {
  const [loaded, setLoaded] = useState(false);
  const label = LABELS[embed.provider];
  const sizeClass = embed.video ? "player player-video" : `player player-audio player-h${embed.height ?? 152}`;

  if (loaded) {
    const src = embed.video ? `${embed.src}${embed.src.includes("?") ? "&" : "?"}autoplay=1` : embed.src;
    return (
      <div className={sizeClass}>
        <iframe
          src={src}
          title={`${title} on ${label}`}
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          // Matches Apple's official embed code; the others work within it. The
          // player can't redirect this page unless the visitor clicks inside it.
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
        />
      </div>
    );
  }

  return (
    <button type="button" className={`${sizeClass} player-facade`} onClick={() => setLoaded(true)}>
      {thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbnail} alt="" loading="lazy" decoding="async" />
      ) : null}
      <span className="player-play" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
          <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11.2-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14Z" />
        </svg>
      </span>
      <span className="player-label">
        Play {title ? <strong>{title}</strong> : null} <span className="muted">on {label}</span>
      </span>
    </button>
  );
}
