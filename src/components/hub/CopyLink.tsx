"use client";

import { useState } from "react";

/** A share link with a one-tap Copy button. */
export function CopyLink({ label, hint, url }: { label: string; hint: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <li className="share-row">
      <span className="share-text">
        <strong>{label}</strong>
        <small>{hint}</small>
        <code>{url.replace(/^https?:\/\//, "")}</code>
      </span>
      <span className="item-tools">
        <a className="btn btn-small" href={url} target="_blank" rel="noopener noreferrer">
          Open
        </a>
        <button type="button" className="btn btn-small btn-primary" onClick={copy}>
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </span>
    </li>
  );
}
