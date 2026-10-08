import {
  siApplemusic,
  siAudiomack,
  siDeezer,
  siFacebook,
  siInstagram,
  siSnapchat,
  siSoundcloud,
  siSpotify,
  siThreads,
  siTidal,
  siTiktok,
  siX,
  siYoutube,
  siYoutubemusic,
} from "simple-icons";

import type { Platform } from "@/lib/content/schema";

export type IconData = { path: string; hex: string; title: string };

export type PlatformInfo = {
  name: string;
  icon: IconData | null;
  /** What the Studio shows as an example link. */
  example: string;
};

export const PLATFORMS: Record<Platform, PlatformInfo> = {
  spotify: { name: "Spotify", icon: siSpotify, example: "https://open.spotify.com/artist/…" },
  appleMusic: { name: "Apple Music", icon: siApplemusic, example: "https://music.apple.com/…/artist/…" },
  youtube: { name: "YouTube", icon: siYoutube, example: "https://www.youtube.com/@…" },
  youtubeMusic: { name: "YouTube Music", icon: siYoutubemusic, example: "https://music.youtube.com/channel/…" },
  audiomack: { name: "Audiomack", icon: siAudiomack, example: "https://audiomack.com/…" },
  boomplay: { name: "Boomplay", icon: null, example: "https://www.boomplay.com/artists/…" },
  soundcloud: { name: "SoundCloud", icon: siSoundcloud, example: "https://soundcloud.com/…" },
  deezer: { name: "Deezer", icon: siDeezer, example: "https://www.deezer.com/artist/…" },
  tidal: { name: "TIDAL", icon: siTidal, example: "https://tidal.com/artist/…" },
  amazonMusic: { name: "Amazon Music", icon: null, example: "https://music.amazon.com/artists/…" },
  tiktok: { name: "TikTok", icon: siTiktok, example: "https://www.tiktok.com/@…" },
  instagram: { name: "Instagram", icon: siInstagram, example: "https://www.instagram.com/…" },
  x: { name: "X", icon: siX, example: "https://x.com/…" },
  facebook: { name: "Facebook", icon: siFacebook, example: "https://www.facebook.com/…" },
  snapchat: { name: "Snapchat", icon: siSnapchat, example: "https://www.snapchat.com/add/…" },
  threads: { name: "Threads", icon: siThreads, example: "https://www.threads.com/@…" },
};

/** Links that actually have a value, in a sensible display order. */
export function filledLinks<K extends Platform>(links: Partial<Record<K, string>>, order: readonly K[]) {
  return order.filter((key) => links[key]).map((key) => ({ key, url: links[key] as string, ...PLATFORMS[key] }));
}
