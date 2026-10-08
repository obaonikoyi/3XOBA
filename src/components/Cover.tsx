/** Cover art, or a generated tile with the title's initials when none is set. */
export function Cover({ src, title, className = "" }: { src: string; title: string; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={`cover ${className}`} src={src} alt={`${title} cover art`} loading="lazy" decoding="async" />;
  }
  const initials = title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
  return (
    <div className={`cover cover-placeholder ${className}`} role="img" aria-label={`${title} cover art`}>
      <span>{initials || "♪"}</span>
    </div>
  );
}
