"use client";

import { useSyncExternalStore } from "react";

const STEPS = [
  { title: "Master + cover art ready", tip: "Cover: 3000×3000 JPG, no URLs or social handles on it." },
  { title: "Upload to DistroKid 3–4 weeks early", tip: "Gives stores time to process and unlocks pitching." },
  { title: "Pitch to Spotify editors", tip: "Spotify for Artists → Music → Upcoming. At least 7 days before release." },
  { title: "Share the pre-save link", tip: "Your HyperFollow link. Add it to the release in Studio for a countdown." },
  { title: "Add the release in Studio", tip: "It becomes the big 'latest release' with a live countdown." },
  { title: "Prepare 3–5 short clips", tip: "15–30s hooks for TikTok, Reels and Shorts." },
  { title: "Schedule the YouTube premiere", tip: "Visualiser or lyric video, set to go live on release day." },
  { title: "Release day: post everywhere", tip: "Update bios, pin the post, thank early listeners." },
  { title: "One week later: check the numbers", tip: "Top cities and playlists — plan the next move from there." },
];

const KEY = "3xoba.release-checklist";
const listeners = new Set<() => void>();

function read(): boolean[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? STEPS.map((_, i) => parsed[i] === true) : STEPS.map(() => false);
  } catch {
    return STEPS.map(() => false);
  }
}

let snapshot: boolean[] | null = null;
function getSnapshot() {
  snapshot ??= read();
  return snapshot;
}
const serverSnapshot = STEPS.map(() => false);

function write(next: boolean[]) {
  snapshot = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private browsing: progress just won't be remembered.
  }
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

/** Ticks are remembered on this device only. */
export function ReleaseChecklist() {
  const done = useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);
  const count = done.filter(Boolean).length;

  return (
    <div>
      <div className="item-head">
        <strong>
          {count} of {STEPS.length} done
        </strong>
        <button type="button" className="btn btn-small" onClick={() => write(STEPS.map(() => false))} disabled={count === 0}>
          Start a new release
        </button>
      </div>
      <div className="progress" aria-hidden="true">
        <div style={{ width: `${(count / STEPS.length) * 100}%` }} />
      </div>
      <ul className="checklist">
        {STEPS.map((step, i) => (
          <li key={step.title}>
            <label>
              <input
                type="checkbox"
                checked={done[i]}
                onChange={(e) => write(done.map((value, j) => (j === i ? e.target.checked : value)))}
              />
              <span>
                <span className={done[i] ? "done" : undefined}>{step.title}</span>
                <small>{step.tip}</small>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
