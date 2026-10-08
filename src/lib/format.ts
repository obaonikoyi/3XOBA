/** Today's date as YYYY-MM-DD (UTC), for comparing with release/show dates. */
export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(iso: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}

export function compactNumber(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

/** Split text on blank lines into paragraphs. */
export function paragraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
