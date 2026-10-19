import { PlatformIcon } from "@/components/Icon";
import { LISTEN_PLATFORMS, type Release } from "@/lib/content/schema";
import { filledLinks } from "@/lib/platforms";

/** "Choose your platform" buttons for a release. Renders nothing if no links. */
export function PlatformButtons({ release, heading = "Choose your platform" }: { release: Release; heading?: string }) {
  const links = filledLinks(release.links, LISTEN_PLATFORMS);
  if (links.length === 0) return null;
  return (
    <>
      {heading ? <p className="eyebrow">{heading}</p> : null}
      <div className="platform-grid">
        {links.map((l) => (
          <a key={l.key} className="platform-btn" href={l.url} target="_blank" rel="noopener noreferrer">
            <PlatformIcon icon={l.icon} name={l.name} size={22} />
            {l.name}
            <span className="go" aria-hidden="true">
              ↗
            </span>
          </a>
        ))}
      </div>
    </>
  );
}
