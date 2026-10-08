import "server-only";

import { youtubeApiKey } from "@/lib/env";

// Public channel numbers and newest uploads via the YouTube Data API with a
// plain API key (no sign-in needed; each call costs 1 unit of the free 10,000
// a day). Results are cached for an hour. Any failure returns null so a YouTube
// hiccup can never break the site.

const API = "https://www.googleapis.com/youtube/v3";

async function get<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const key = youtubeApiKey();
  if (!key) return null;
  const query = new URLSearchParams({ ...params, key });
  try {
    const res = await fetch(`${API}/${path}?${query}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export type ChannelStats = { title: string; subscribers: number | null; views: number; videos: number };

export async function channelStats(channelId: string): Promise<ChannelStats | null> {
  if (!channelId) return null;
  const data = await get<{
    items?: {
      snippet: { title: string };
      statistics: { subscriberCount?: string; hiddenSubscriberCount: boolean; viewCount: string; videoCount: string };
    }[];
  }>("channels", { part: "snippet,statistics", id: channelId });
  const item = data?.items?.[0];
  if (!item) return null;
  return {
    title: item.snippet.title,
    subscribers: item.statistics.hiddenSubscriberCount ? null : Number(item.statistics.subscriberCount ?? 0),
    views: Number(item.statistics.viewCount),
    videos: Number(item.statistics.videoCount),
  };
}

export type Upload = { id: string; title: string; publishedAt: string };

export async function latestUploads(channelId: string, max = 6): Promise<Upload[] | null> {
  if (!channelId) return null;
  // Every channel's uploads playlist is its ID with "UC" swapped for "UU".
  const data = await get<{
    items?: { snippet: { title: string; publishedAt: string; resourceId: { videoId: string } } }[];
  }>("playlistItems", { part: "snippet", playlistId: `UU${channelId.slice(2)}`, maxResults: String(max) });
  if (!data?.items) return null;
  return data.items
    .filter((item) => /^[A-Za-z0-9_-]{11}$/.test(item.snippet.resourceId.videoId))
    .map((item) => ({
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      publishedAt: item.snippet.publishedAt,
    }));
}

export function isYouTubeConfigured() {
  return Boolean(youtubeApiKey());
}
