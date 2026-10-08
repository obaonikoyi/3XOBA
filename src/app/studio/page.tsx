import type { Metadata } from "next";

import { OwnerBar } from "@/components/OwnerBar";
import { StudioEditor } from "@/components/studio/StudioEditor";
import { requireOwner } from "@/lib/auth/session";
import { getEditableContent } from "@/lib/content/store";

export const metadata: Metadata = { title: "Studio", robots: { index: false, follow: false } };

export default async function StudioPage() {
  const owner = await requireOwner();
  const { content, version, storage } = await getEditableContent();

  return (
    <>
      <OwnerBar owner={owner} current="studio" name={content.artist.name} />
      <main className="wrap owner-main">
        <h1 className="owner-title">Studio</h1>
        <p className="muted">Change anything on your public page, then press Save.</p>
        <StudioEditor initial={content} version={version} storage={storage} />
      </main>
    </>
  );
}
