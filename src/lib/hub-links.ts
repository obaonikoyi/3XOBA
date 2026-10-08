import {
  siApplemusic,
  siAudiomack,
  siGithub,
  siInstagram,
  siMeta,
  siSoundcloud,
  siSpotify,
  siTiktok,
  siVercel,
  siYoutube,
  siYoutubestudio,
} from "simple-icons";

import type { HubGroup } from "@/lib/content/schema";
import type { IconData } from "@/lib/platforms";

export type Launcher = { label: string; hint: string; url: string; icon: IconData | null; brand?: string };

// Built-in shortcuts to every official dashboard. They open the real sites
// (where you're already signed in), so no passwords ever pass through here.
// Add your own extras in Studio → Hub shortcuts.
export const BUILT_IN_LAUNCHERS: Record<Exclude<HubGroup, "profiles">, Launcher[]> = {
  create: [
    { label: "Upload to YouTube", hint: "Video, Short or visualiser", url: "https://www.youtube.com/upload", icon: siYoutube },
    { label: "Post on TikTok", hint: "TikTok Studio upload", url: "https://www.tiktok.com/tiktokstudio/upload", icon: siTiktok },
    { label: "Post on Instagram", hint: "Reel, post or story", url: "https://www.instagram.com/", icon: siInstagram },
    { label: "New release", hint: "DistroKid upload", url: "https://distrokid.com/new/", icon: null, brand: "DistroKid" },
    { label: "Audiomack Creator", hint: "Upload & promote", url: "https://creators.audiomack.com/", icon: siAudiomack },
    { label: "Upload to SoundCloud", hint: "Tracks & snippets", url: "https://soundcloud.com/upload", icon: siSoundcloud },
  ],
  stats: [
    { label: "YouTube Studio", hint: "Views, subs, comments", url: "https://studio.youtube.com/", icon: siYoutubestudio },
    { label: "Spotify for Artists", hint: "Listeners, playlists, pitching", url: "https://artists.spotify.com/", icon: siSpotify },
    { label: "Apple Music for Artists", hint: "Plays & Shazams", url: "https://artists.apple.com/", icon: siApplemusic },
    { label: "Audiomack stats", hint: "Plays, fans, top cities", url: "https://creators.audiomack.com/", icon: siAudiomack },
    { label: "TikTok Studio", hint: "Video & follower analytics", url: "https://www.tiktok.com/tiktokstudio", icon: siTiktok },
    { label: "Meta Business Suite", hint: "Instagram & Facebook insights", url: "https://business.facebook.com/", icon: siMeta },
  ],
  money: [
    { label: "DistroKid bank", hint: "Streaming earnings", url: "https://distrokid.com/bank/", icon: null, brand: "DistroKid" },
    { label: "My music on DistroKid", hint: "Releases, HyperFollow links", url: "https://distrokid.com/mymusic/", icon: null, brand: "DistroKid" },
  ],
  tools: [
    { label: "Vercel", hint: "Website hosting & deploys", url: "https://vercel.com/dashboard", icon: siVercel },
  ],
};

export const GROUP_TITLES: Record<HubGroup, string> = {
  create: "Post something new",
  stats: "Check your numbers",
  money: "Money & releases",
  profiles: "Your public pages",
  tools: "Website & tools",
};

export function githubHistoryLauncher(repo: string, branch: string): Launcher {
  return {
    label: "Site history",
    hint: "Every Studio save, undo-able",
    url: `https://github.com/${repo}/commits/${encodeURIComponent(branch)}/content/site.json`,
    icon: siGithub,
  };
}
