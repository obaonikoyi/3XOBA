import { z } from "zod";

import { SLUG_PATTERN, releaseSlug } from "@/lib/slug";

// Everything the public site shows lives in content/site.json and is checked
// against this schema on every read and every save. Anything that doesn't fit
// (a link that isn't https, a script tag pasted into a name, a 10MB bio) is
// rejected before it can reach the page.

const text = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters`);

const httpsUrl = z
  .string()
  .trim()
  .max(500, "That link is too long")
  .pipe(z.url({ protocol: /^https$/, error: "Paste a full link that starts with https://" }));

const optionalUrl = z.union([z.literal(""), httpsUrl]).default("");

// Images are either uploaded through the Studio (stored under /uploads with a
// content-hash name) or a full https link to an image hosted elsewhere.
const imageRef = z
  .union([z.literal(""), z.string().regex(/^\/uploads\/[a-f0-9]{16,64}\.(jpg|png|webp)$/), httpsUrl])
  .default("");

const itemId = z.string().regex(/^[A-Za-z0-9-]{1,64}$/);
const isoDate = z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date picker")]).default("");
const optionalEmail = z.union([z.literal(""), z.email("That doesn't look like an email address").max(200)]).default("");

export const LISTEN_PLATFORMS = [
  "spotify",
  "appleMusic",
  "youtube",
  "youtubeMusic",
  "audiomack",
  "boomplay",
  "soundcloud",
  "deezer",
  "tidal",
  "amazonMusic",
] as const;

export const SOCIAL_PLATFORMS = ["tiktok", "instagram", "x", "facebook", "snapchat", "threads"] as const;

export type ListenPlatform = (typeof LISTEN_PLATFORMS)[number];
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];
export type Platform = ListenPlatform | SocialPlatform;

const listenLinks = z.object({
  spotify: optionalUrl,
  appleMusic: optionalUrl,
  youtube: optionalUrl,
  youtubeMusic: optionalUrl,
  audiomack: optionalUrl,
  boomplay: optionalUrl,
  soundcloud: optionalUrl,
  deezer: optionalUrl,
  tidal: optionalUrl,
  amazonMusic: optionalUrl,
});

const artistLinks = listenLinks.extend({
  tiktok: optionalUrl,
  instagram: optionalUrl,
  x: optionalUrl,
  facebook: optionalUrl,
  snapchat: optionalUrl,
  threads: optionalUrl,
});

export const RELEASE_TYPES = ["single", "ep", "album", "mixtape"] as const;

const release = z.object({
  id: itemId,
  title: text(120).min(1, "Every release needs a title"),
  type: z.enum(RELEASE_TYPES).default("single"),
  releaseDate: isoDate,
  cover: imageRef,
  description: text(600).default(""),
  // A DistroKid HyperFollow (or other smart/pre-save) link.
  smartLink: optionalUrl,
  links: listenLinks,
  // The release's own page: /music/<slug>. Blank = made from the title.
  slug: z
    .string()
    .transform((value) => value.replace(/^-+|-+$/g, ""))
    .pipe(z.union([z.literal(""), z.string().max(60).regex(SLUG_PATTERN, "Use lowercase letters, numbers and dashes only")]))
    .default(""),
  lyrics: text(12000).default(""),
});

const releaseList = z
  .array(release)
  .max(60)
  .default([])
  .superRefine((releases, ctx) => {
    const seen = new Map<string, number>();
    releases.forEach((r, i) => {
      const slug = releaseSlug(r);
      if (seen.has(slug)) {
        ctx.addIssue({
          code: "custom",
          path: [i, "slug"],
          message: `Two releases would share the page /music/${slug}. Give one a different page address.`,
        });
      }
      seen.set(slug, i);
    });
  });

const video = z.object({
  id: itemId,
  title: text(120).default(""),
  url: httpsUrl,
});

const show = z.object({
  id: itemId,
  date: isoDate,
  city: text(80).min(1, "Every show needs a city"),
  venue: text(120).default(""),
  ticketUrl: optionalUrl,
});

const pressHighlight = z.object({
  id: itemId,
  text: text(160).min(1, "Highlights can't be empty"),
});

const pressPhoto = z.object({
  id: itemId,
  image: imageRef.refine(Boolean, "Add an image or remove this photo"),
  caption: text(120).default(""),
});

export const HUB_GROUPS = ["create", "stats", "money", "profiles", "tools"] as const;

const hubLink = z.object({
  id: itemId,
  label: text(60).min(1, "Give the shortcut a name"),
  url: httpsUrl,
  group: z.enum(HUB_GROUPS).default("tools"),
});

export const siteSchema = z.object({
  artist: z.object({
    name: text(60).min(1, "The artist name can't be empty"),
    tagline: text(160).default(""),
    bio: text(4000).default(""),
    location: text(80).default(""),
    heroImage: imageRef,
    photo: imageRef,
  }),
  theme: z.object({
    accent: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, "Pick a colour")
      .default("#e8b04b"),
  }),
  links: artistLinks,
  // The first release in the list is shown as the big "latest release".
  releases: releaseList,
  videos: z.object({
    // When on (and a YouTube API key is set up), the site shows your newest
    // uploads automatically instead of the list below.
    autoFromYouTube: z.boolean().default(false),
    youtubeChannelId: z
      .union([z.literal(""), z.string().regex(/^UC[A-Za-z0-9_-]{22}$/, "Channel IDs start with UC and are 24 characters")])
      .default(""),
    items: z.array(video).max(30).default([]),
  }),
  shows: z.array(show).max(60).default([]),
  contact: z.object({
    bookingEmail: optionalEmail,
    pressKitUrl: optionalUrl,
  }),
  newsletter: z.object({
    url: optionalUrl,
    label: text(60).default("Get new music first"),
  }),
  hub: z.object({
    links: z.array(hubLink).max(40).default([]),
  }),
  // The /press page for promoters, bookers and media.
  press: z
    .object({
      shortBio: text(700).default(""),
      highlights: z.array(pressHighlight).max(10).default([]),
      photos: z.array(pressPhoto).max(12).default([]),
    })
    .prefault({}),
});

export type SiteContent = z.infer<typeof siteSchema>;
export type Release = SiteContent["releases"][number];
export type Video = SiteContent["videos"]["items"][number];
export type Show = SiteContent["shows"][number];
export type HubLink = SiteContent["hub"]["links"][number];
export type HubGroup = (typeof HUB_GROUPS)[number];
export type PressHighlight = SiteContent["press"]["highlights"][number];
export type PressPhoto = SiteContent["press"]["photos"][number];

/** Turn schema errors into short, human sentences for the Studio. */
export function describeIssues(error: z.ZodError): string[] {
  return error.issues.slice(0, 12).map((issue) => {
    const where = issue.path
      .map((part) => (typeof part === "number" ? `#${part + 1}` : String(part)))
      .join(" › ");
    return where ? `${where}: ${issue.message}` : issue.message;
  });
}
