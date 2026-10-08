import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <div>
        <p className="eyebrow">404</p>
        <h1 className="h-section">This page doesn’t exist.</h1>
        <Link className="btn btn-primary" href="/">
          Back to the music
        </Link>
      </div>
    </main>
  );
}
