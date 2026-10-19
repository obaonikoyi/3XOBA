import type { MetadataRoute } from "next";

import { getPublishedContent } from "@/lib/content/store";
import { siteUrl } from "@/lib/env";
import { releasePath } from "@/lib/releases";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const { releases } = getPublishedContent();
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/links`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/press`, changeFrequency: "monthly", priority: 0.6 },
    ...releases.map((r) => ({ url: `${base}${releasePath(r)}`, changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
