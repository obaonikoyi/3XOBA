/** "Lagos Nights (Remix)" → "lagos-nights-remix". */
export function slugify(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents: "Ọ̀run" → "orun"
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

/** Tidy a page address as it's typed, still allowing a dash at the end mid-word. */
export function slugInput(raw: string) {
  const slug = slugify(raw);
  return slug && /[-\s]$/.test(raw) ? `${slug}-` : slug;
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The address a release lives at: its own slug, or one made from its title. */
export function releaseSlug(release: { slug: string; title: string; id: string }) {
  return release.slug || slugify(release.title) || release.id.toLowerCase();
}
