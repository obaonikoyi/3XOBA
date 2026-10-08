// Turns a normal share link (what you copy from the app) into the address of
// that platform's official embedded player. Only these exact hosts and shapes
// are accepted; anything else returns null and simply isn't embedded (the
// platform still gets a "Listen on …" button). Audiomack and Boomplay are
// link-only for now: neither publishes a stable embed URL format.

export type Embed = {
  provider: "spotify" | "appleMusic" | "youtube" | "soundcloud";
  src: string;
  /** Pixel height for audio players; video players use a 16:9 box instead. */
  height?: number;
  video?: boolean;
};

function parse(url: string): URL | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed : null;
  } catch {
    return null;
  }
}

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

export function youtubeId(url: string): string | null {
  const u = parse(url);
  if (!u) return null;
  const host = u.hostname.replace(/^(www|m|music)\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = u.pathname.slice(1);
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const [, first, second] = u.pathname.split("/");
    id = first === "watch" ? u.searchParams.get("v") : ["shorts", "embed", "live"].includes(first) ? second : null;
  }
  return id && YOUTUBE_ID.test(id) ? id : null;
}

export function youtubeThumbnail(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function embedFor(url: string): Embed | null {
  const u = parse(url);
  if (!u) return null;
  const host = u.hostname.toLowerCase();
  const parts = u.pathname.split("/").filter(Boolean);

  if (host === "open.spotify.com") {
    if (parts[0]?.startsWith("intl-")) parts.shift();
    const [type, id] = parts;
    if (["track", "album", "playlist", "artist", "episode"].includes(type) && /^[A-Za-z0-9]{22}$/.test(id ?? "")) {
      return { provider: "spotify", src: `https://open.spotify.com/embed/${type}/${id}`, height: type === "track" ? 152 : 352 };
    }
    return null;
  }

  if (host === "music.apple.com") {
    // /{country}/{album|song|playlist}/{slug}/{id}
    const [country, type] = parts;
    const id = parts[parts.length - 1];
    if (/^[a-z]{2}$/.test(country ?? "") && ["album", "song", "playlist"].includes(type) && /^[\w.-]+$/.test(id ?? "")) {
      const path = parts.map(encodeURIComponent).join("/");
      const song = u.searchParams.get("i");
      const query = song && /^\d+$/.test(song) ? `?i=${song}` : "";
      return {
        provider: "appleMusic",
        src: `https://embed.music.apple.com/${path}${query}`,
        height: type === "song" || query ? 175 : 450,
      };
    }
    return null;
  }

  if (host === "soundcloud.com" || host === "m.soundcloud.com") {
    if (parts.length >= 2 && parts.every((p) => /^[A-Za-z0-9_-]+$/.test(p))) {
      const track = `https://soundcloud.com/${parts.join("/")}`;
      return {
        provider: "soundcloud",
        src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(track)}&visual=false&show_comments=false`,
        height: 166,
      };
    }
    return null;
  }

  const ytId = youtubeId(url);
  if (ytId) {
    return { provider: "youtube", src: `https://www.youtube-nocookie.com/embed/${ytId}?rel=0`, video: true };
  }

  return null;
}

/** The best player to show for a release, in order of preference. */
export function bestEmbed(links: Record<string, string>): Embed | null {
  for (const key of ["spotify", "appleMusic", "soundcloud", "youtube", "youtubeMusic"]) {
    const embed = links[key] ? embedFor(links[key]) : null;
    if (embed) return embed;
  }
  return null;
}
