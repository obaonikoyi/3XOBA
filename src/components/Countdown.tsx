"use client";

import { useEffect, useState } from "react";

const UNITS = [
  ["Days", 86_400_000],
  ["Hours", 3_600_000],
  ["Mins", 60_000],
  ["Secs", 1_000],
] as const;

/** Counts down to midnight (visitor's local time) on the release date. */
export function Countdown({ date }: { date: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  const target = new Date(`${date}T00:00:00`).getTime();
  const remaining = now === null ? null : Math.max(0, target - now);
  const values = UNITS.map(([, ms], i) => {
    if (remaining === null) return "–";
    const larger = i === 0 ? Infinity : UNITS[i - 1][1];
    return String(Math.floor((remaining % larger) / ms)).padStart(2, "0");
  });

  return (
    <div className="countdown" role="timer" aria-label="Time until release">
      {UNITS.map(([label], i) => (
        <div key={label}>
          <strong>{values[i]}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
