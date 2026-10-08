import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";

import { getPublishedContent } from "@/lib/content/store";
import { siteUrl } from "@/lib/env";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { artist, releases } = getPublishedContent();
  const title = `${artist.name} — Official Site`;
  const description = artist.tagline || `New music, videos and shows from ${artist.name}.`;
  const image = artist.heroImage || artist.photo || releases[0]?.cover;
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: title, template: `%s · ${artist.name}` },
    description,
    openGraph: { type: "website", title, description, siteName: artist.name, images: image ? [image] : undefined },
    twitter: { card: image ? "summary_large_image" : "summary", title, description },
  };
}

export const viewport: Viewport = { themeColor: "#0b0a09", colorScheme: "dark" };

/** Dark text on light accents, light text on dark ones. */
function inkFor(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return luminance > 0.35 ? "#140f05" : "#ffffff";
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  // The accent is validated as a strict #rrggbb colour by the content schema.
  const { accent } = getPublishedContent().theme;
  return (
    <html lang="en">
      <head>
        <style nonce={nonce}>{`:root{--accent:${accent};--accent-ink:${inkFor(accent)}}`}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
