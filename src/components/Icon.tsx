import type { IconData } from "@/lib/platforms";

/** A platform logo, or a lettered badge when no logo is available. */
export function PlatformIcon({ icon, name, size = 20 }: { icon: IconData | null; name: string; size?: number }) {
  if (!icon) {
    return (
      <span className="icon-fallback" aria-hidden="true" data-size={size}>
        {name.charAt(0)}
      </span>
    );
  }
  return (
    <svg role="img" aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d={icon.path} />
    </svg>
  );
}
