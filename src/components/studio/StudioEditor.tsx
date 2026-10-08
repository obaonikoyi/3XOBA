"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";

import { saveSite, uploadImage } from "@/app/studio/actions";
import { PlatformIcon } from "@/components/Icon";
import {
  HUB_GROUPS,
  LISTEN_PLATFORMS,
  RELEASE_TYPES,
  SOCIAL_PLATFORMS,
  type HubLink,
  type Release,
  type Show,
  type SiteContent,
  type Video,
} from "@/lib/content/schema";
import type { Storage } from "@/lib/content/store";
import { GROUP_TITLES } from "@/lib/hub-links";
import { PLATFORMS } from "@/lib/platforms";

const TABS = ["Profile", "Links", "Releases", "Videos", "Shows", "Contact", "Look", "Hub shortcuts"] as const;
type Tab = (typeof TABS)[number];

const newId = () => crypto.randomUUID();
const emptyListenLinks = () => Object.fromEntries(LISTEN_PLATFORMS.map((k) => [k, ""])) as Release["links"];

type Props = { initial: SiteContent; version: string | null; storage: Storage };

export function StudioEditor({ initial, version: initialVersion, storage }: Props) {
  const [content, setContent] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [version, setVersion] = useState(initialVersion);
  const [tab, setTab] = useState<Tab>("Profile");
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, startSaving] = useTransition();
  const [previews, setPreviews] = useState<Record<string, string>>({});

  const dirty = JSON.stringify(content) !== JSON.stringify(saved);
  const canSave = storage !== "none";

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function patch<K extends keyof SiteContent>(key: K, value: Partial<SiteContent[K]>) {
    setContent((c) => ({ ...c, [key]: Array.isArray(value) ? value : { ...c[key], ...value } }));
    setStatus(null);
  }

  function save() {
    startSaving(async () => {
      setErrors([]);
      setStatus(null);
      const result = await saveSite(content, version);
      if (result.ok) {
        setVersion(result.version);
        setSaved(content);
        setStatus({ ok: true, message: result.message });
      } else {
        setErrors(result.errors);
        setStatus({ ok: false, message: "Not saved — see below." });
      }
    });
  }

  const ctx: ImageCtx = {
    previews,
    addPreview: (path, url) => setPreviews((p) => ({ ...p, [path]: url })),
    enabled: canSave,
  };

  return (
    <>
      <div className="studio-bar">
        <div className="studio-tabs" role="tablist" aria-label="Sections">
          {TABS.map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
        <div className="item-tools">
          {status ? <span className={status.ok ? "status-ok" : "status-err"}>{status.message}</span> : null}
          {dirty && !status ? <span className="muted">Unsaved changes</span> : null}
          <button type="button" className="btn btn-small" disabled={!dirty || saving} onClick={() => setContent(saved)}>
            Undo changes
          </button>
          <button type="button" className="btn btn-primary btn-small" disabled={!dirty || saving || !canSave} onClick={save}>
            {saving ? "Saving…" : "Save & publish"}
          </button>
        </div>
      </div>

      {storage === "none" ? (
        <p className="notice">
          <strong>Saving isn’t connected yet.</strong> Add GITHUB_TOKEN and GITHUB_REPO in Vercel (see the README), then reload.
        </p>
      ) : null}
      {storage === "local" ? (
        <p className="notice">
          <strong>Local mode:</strong> saves go straight to <code>content/site.json</code> on this computer.
        </p>
      ) : null}

      {errors.length > 0 ? (
        <div className="errors" role="alert">
          <strong>Please fix these, then save again:</strong>
          <ul>
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div role="tabpanel" aria-label={tab}>
        {tab === "Profile" ? (
          <Section title="Who you are">
            <div className="fields">
              <Field label="Artist name" value={content.artist.name} onChange={(name) => patch("artist", { name })} />
              <Field label="Location" value={content.artist.location} placeholder="e.g. Lagos · London" onChange={(location) => patch("artist", { location })} />
              <Field
                label="Tagline"
                wide
                value={content.artist.tagline}
                placeholder="One line that sums you up — shown under your name"
                onChange={(tagline) => patch("artist", { tagline })}
              />
              <Field
                label="Bio"
                wide
                multiline
                hint="Leave an empty line between paragraphs."
                value={content.artist.bio}
                onChange={(bio) => patch("artist", { bio })}
              />
              <ImageField label="Big background photo (top of page)" ctx={ctx} value={content.artist.heroImage} onChange={(heroImage) => patch("artist", { heroImage })} />
              <ImageField label="Portrait (About section)" ctx={ctx} value={content.artist.photo} onChange={(photo) => patch("artist", { photo })} />
            </div>
          </Section>
        ) : null}

        {tab === "Links" ? (
          <>
            <Section title="Where people can listen" hint="Paste your artist/profile page link from each app. Leave blank to hide.">
              <div className="fields">
                {LISTEN_PLATFORMS.map((key) => (
                  <PlatformField key={key} platform={key} value={content.links[key]} onChange={(v) => patch("links", { [key]: v })} />
                ))}
              </div>
            </Section>
            <Section title="Socials">
              <div className="fields">
                {SOCIAL_PLATFORMS.map((key) => (
                  <PlatformField key={key} platform={key} value={content.links[key]} onChange={(v) => patch("links", { [key]: v })} />
                ))}
              </div>
            </Section>
          </>
        ) : null}

        {tab === "Releases" ? (
          <ListEditor<Release>
            items={content.releases}
            onChange={(releases) => patch("releases", releases)}
            noun="release"
            addLabel="Add a new release"
            addToTop
            create={() => ({ id: newId(), title: "", type: "single", releaseDate: "", cover: "", description: "", smartLink: "", links: emptyListenLinks() })}
            heading={(r, i) => (i === 0 ? `${r.title || "Untitled"} — shown as your latest release` : r.title || "Untitled")}
            intro="Newest first. The top release is the big one on your page. If its date is in the future, the page shows a live countdown and a pre-save button."
            render={(r, set) => (
              <div className="fields">
                <Field label="Title" value={r.title} onChange={(title) => set({ title })} />
                <label className="field">
                  <span>Type</span>
                  <select value={r.type} onChange={(e) => set({ type: e.target.value as Release["type"] })}>
                    {RELEASE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t === "ep" ? "EP" : t[0].toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </label>
                <Field label="Release date" type="date" value={r.releaseDate} onChange={(releaseDate) => set({ releaseDate })} />
                <Field
                  label="Pre-save / smart link"
                  type="url"
                  hint="Your DistroKid HyperFollow link works great here."
                  value={r.smartLink}
                  placeholder="https://distrokid.com/hyperfollow/…"
                  onChange={(smartLink) => set({ smartLink })}
                />
                <ImageField label="Cover art" ctx={ctx} value={r.cover} onChange={(cover) => set({ cover })} />
                <Field label="Short description" wide multiline value={r.description} onChange={(description) => set({ description })} />
                {LISTEN_PLATFORMS.map((key) => (
                  <PlatformField key={key} platform={key} value={r.links[key]} onChange={(v) => set({ links: { ...r.links, [key]: v } })} />
                ))}
              </div>
            )}
          />
        ) : null}

        {tab === "Videos" ? (
          <>
            <Section title="Automatic videos">
              <div className="fields">
                <label className="check field-wide">
                  <input
                    type="checkbox"
                    checked={content.videos.autoFromYouTube}
                    onChange={(e) => patch("videos", { autoFromYouTube: e.target.checked })}
                  />
                  Show my newest YouTube uploads automatically
                </label>
                <Field
                  label="YouTube channel ID"
                  value={content.videos.youtubeChannelId}
                  placeholder="UC…"
                  hint="YouTube Studio → Settings → Channel → Advanced settings. Also powers the live numbers in your Hub."
                  onChange={(youtubeChannelId) => patch("videos", { youtubeChannelId })}
                />
              </div>
            </Section>
            <ListEditor<Video>
              items={content.videos.items}
              onChange={(items) => patch("videos", { items })}
              noun="video"
              addLabel="Add a video"
              create={() => ({ id: newId(), title: "", url: "" })}
              heading={(v) => v.title || "Video"}
              intro="Hand-picked videos (used when automatic is off). Paste any YouTube link."
              render={(v, set) => (
                <div className="fields">
                  <Field label="Title" value={v.title} onChange={(title) => set({ title })} />
                  <Field label="YouTube link" type="url" value={v.url} placeholder="https://youtu.be/…" onChange={(url) => set({ url })} />
                </div>
              )}
            />
          </>
        ) : null}

        {tab === "Shows" ? (
          <ListEditor<Show>
            items={content.shows}
            onChange={(shows) => patch("shows", shows)}
            noun="show"
            addLabel="Add a show"
            create={() => ({ id: newId(), date: "", city: "", venue: "", ticketUrl: "" })}
            heading={(s) => [s.city, s.date].filter(Boolean).join(" · ") || "Show"}
            intro="Past dates hide themselves automatically."
            render={(s, set) => (
              <div className="fields">
                <Field label="Date" type="date" value={s.date} onChange={(date) => set({ date })} />
                <Field label="City" value={s.city} onChange={(city) => set({ city })} />
                <Field label="Venue / event" value={s.venue} onChange={(venue) => set({ venue })} />
                <Field label="Tickets link" type="url" value={s.ticketUrl} onChange={(ticketUrl) => set({ ticketUrl })} />
              </div>
            )}
          />
        ) : null}

        {tab === "Contact" ? (
          <Section title="Bookings, press & fans">
            <div className="fields">
              <Field label="Booking email" type="email" value={content.contact.bookingEmail} onChange={(bookingEmail) => patch("contact", { bookingEmail })} />
              <Field
                label="Press kit link"
                type="url"
                hint="A Google Drive/Dropbox folder with photos, bio and logos."
                value={content.contact.pressKitUrl}
                onChange={(pressKitUrl) => patch("contact", { pressKitUrl })}
              />
              <Field
                label="Fan sign-up link"
                type="url"
                hint="Optional: a Laylo, Mailchimp or similar sign-up page."
                value={content.newsletter.url}
                onChange={(url) => patch("newsletter", { url })}
              />
              <Field label="Sign-up button title" value={content.newsletter.label} onChange={(label) => patch("newsletter", { label })} />
            </div>
          </Section>
        ) : null}

        {tab === "Look" ? (
          <Section title="Colour" hint="Used for buttons, highlights and the scrolling banner.">
            <div className="fields">
              <label className="field">
                <span>Accent colour</span>
                <span className="image-field">
                  <input type="color" value={content.theme.accent} onChange={(e) => patch("theme", { accent: e.target.value })} />
                  <input
                    type="text"
                    value={content.theme.accent}
                    onChange={(e) => patch("theme", { accent: e.target.value })}
                    aria-label="Accent colour hex code"
                  />
                </span>
              </label>
            </div>
          </Section>
        ) : null}

        {tab === "Hub shortcuts" ? (
          <ListEditor<HubLink>
            items={content.hub.links}
            onChange={(links) => patch("hub", { links })}
            noun="shortcut"
            addLabel="Add a shortcut"
            create={() => ({ id: newId(), label: "", url: "", group: "tools" })}
            heading={(l) => l.label || "Shortcut"}
            intro="Extra buttons for your private Hub — any site you use often (Canva, CapCut, Boomplay for Artists, your bank…). Never put passwords here."
            render={(l, set) => (
              <div className="fields">
                <Field label="Name" value={l.label} onChange={(label) => set({ label })} />
                <Field label="Link" type="url" value={l.url} onChange={(url) => set({ url })} />
                <label className="field">
                  <span>Group</span>
                  <select value={l.group} onChange={(e) => set({ group: e.target.value as HubLink["group"] })}>
                    {HUB_GROUPS.map((g) => (
                      <option key={g} value={g}>
                        {GROUP_TITLES[g]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          />
        ) : null}
      </div>
    </>
  );
}

// ---------------------------------------------------------------- building blocks

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="fieldset">
      <h3>{title}</h3>
      {hint ? <p className="field-hint section-hint">{hint}</p> : null}
      {children}
    </section>
  );
}

type FieldProps = {
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "url" | "email" | "date";
  placeholder?: string;
  hint?: string;
  wide?: boolean;
  multiline?: boolean;
};

function Field({ label, value, onChange, type = "text", placeholder, hint, wide, multiline }: FieldProps) {
  return (
    <label className={`field${wide ? " field-wide" : ""}`}>
      <span>{label}</span>
      {multiline ? (
        <textarea value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          inputMode={type === "url" ? "url" : undefined}
          autoComplete="off"
          spellCheck={type === "text"}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {hint ? <small className="field-hint">{hint}</small> : null}
    </label>
  );
}

function PlatformField({ platform, value, onChange }: { platform: keyof typeof PLATFORMS; value: string; onChange: (v: string) => void }) {
  const info = PLATFORMS[platform];
  return (
    <Field
      label={
        <>
          <PlatformIcon icon={info.icon} name={info.name} size={16} /> {info.name}
        </>
      }
      type="url"
      value={value}
      placeholder={info.example}
      onChange={onChange}
    />
  );
}

type ImageCtx = { previews: Record<string, string>; addPreview: (path: string, url: string) => void; enabled: boolean };

function ImageField({ label, value, onChange, ctx }: { label: string; value: string; onChange: (v: string) => void; ctx: ImageCtx }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Freshly uploaded files aren't on the live site until it redeploys, so
  // show the copy from this computer meanwhile.
  const preview = ctx.previews[value] ?? value;

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    const data = new FormData();
    data.set("file", file);
    const result = await uploadImage(data);
    setBusy(false);
    if (result.ok) {
      ctx.addPreview(result.path, URL.createObjectURL(file));
      onChange(result.path);
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="field">
      <span>{label}</span>
      <div className="image-field">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="thumb" src={preview} alt="" />
        ) : (
          <div className="thumb" />
        )}
        <div className="grow">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy || !ctx.enabled}
            aria-label={`Upload ${label}`}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = "";
            }}
          />
          <div className="item-tools">
            {busy ? <span className="muted">Uploading…</span> : null}
            {value ? (
              <button type="button" className="btn btn-small btn-danger" onClick={() => onChange("")}>
                Remove
              </button>
            ) : null}
          </div>
          {error ? <small className="status-err">{error}</small> : null}
        </div>
      </div>
    </div>
  );
}

type ListEditorProps<T extends { id: string }> = {
  items: T[];
  onChange: (items: T[]) => void;
  create: () => T;
  render: (item: T, set: (patch: Partial<T>) => void) => ReactNode;
  heading: (item: T, index: number) => string;
  noun: string;
  addLabel: string;
  intro?: string;
  addToTop?: boolean;
};

function ListEditor<T extends { id: string }>({ items, onChange, create, render, heading, noun, addLabel, intro, addToTop }: ListEditorProps<T>) {
  const move = (from: number, to: number) => {
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };
  const add = () => onChange(addToTop ? [create(), ...items] : [...items, create()]);

  return (
    <div>
      <div className="item-head">
        {intro ? <p className="muted list-intro">{intro}</p> : <span />}
        <button type="button" className="btn btn-primary btn-small" onClick={add}>
          + {addLabel}
        </button>
      </div>
      {items.length === 0 ? <p className="empty">No {noun}s yet.</p> : null}
      {items.map((item, i) => (
        <section key={item.id} className="fieldset">
          <div className="item-head">
            <strong>{heading(item, i)}</strong>
            <div className="item-tools">
              <button type="button" className="btn btn-small" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label={`Move ${noun} up`}>
                ↑
              </button>
              <button
                type="button"
                className="btn btn-small"
                disabled={i === items.length - 1}
                onClick={() => move(i, i + 1)}
                aria-label={`Move ${noun} down`}
              >
                ↓
              </button>
              <button
                type="button"
                className="btn btn-small btn-danger"
                onClick={() => {
                  if (window.confirm(`Remove this ${noun}?`)) onChange(items.filter((x) => x.id !== item.id));
                }}
              >
                Remove
              </button>
            </div>
          </div>
          {render(item, (p) => onChange(items.map((x) => (x.id === item.id ? { ...x, ...p } : x))))}
        </section>
      ))}
    </div>
  );
}
