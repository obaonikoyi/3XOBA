# 3XOBA — official site, Studio and Hub

One website, three parts:

| Part | Address | Who sees it | What it's for |
| --- | --- | --- | --- |
| **Artist page** | `/` | Everyone | Your professional page: latest release with a live countdown and pre-save, every streaming platform, videos, shows, bio, bookings. |
| **Studio** | `/studio` | Only you | Edit everything on the artist page yourself: text, photos, cover art, releases, links, shows, colour. Press **Save & publish**. |
| **Hub** | `/hub` | Only you | Your command centre: one tap to upload to YouTube/TikTok/Instagram/DistroKid/Audiomack/SoundCloud, open Spotify for Artists, Apple Music for Artists, YouTube Studio, DistroKid bank, live YouTube numbers, a release checklist, and your own extra shortcuts. |

The Studio and Hub aren't linked from the public page. Bookmark `https://YOUR-DOMAIN/hub` on your phone.

---

## Set it up (about 30 minutes, once)

You'll need: this GitHub account, the Google account you want to sign in with, and the domain you bought.

### 1. Make this repository private (do this first)

GitHub → this repo → **Settings** → scroll to **Danger Zone** → **Change visibility** → **Private**.
While it's public, anyone can see that 3XOBA's site lives under your personal GitHub account. Private also hides your content history and Hub shortcuts. The site works exactly the same from a private repo.

### 1b. Make a separate Google account just for 3XOBA

Create a new Google account (e.g. a 3XOBA Gmail) and use it for **everything below**: the Google Cloud project, signing in to the Hub, and the YouTube key. Anyone can open the Google sign-in screen from your `/login` page, and Google shows the app's support email there, so it must be an artist email, not your personal one.

### 2. Put the site online with Vercel (free)

1. Go to [vercel.com](https://vercel.com) → **Sign up with GitHub**.
2. **Add New → Project** → import **3XOBA** → **Deploy**.
3. Project → **Settings → Domains** → add your domain (e.g. `3xoba.com`) and follow the DNS instructions Vercel shows for wherever you bought the domain.

### 3. Google sign-in (so only you can get into the Studio and Hub)

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → create a project called **3XOBA site**.
2. Open **Google Auth Platform** (called *OAuth consent screen* in older menus): app name "3XOBA site", audience **External**, your email as the support and developer contact. Under **Audience**, press **Publish app** (only basic email sign-in is used, so Google doesn't need to review it).
3. **Clients** (or **APIs & Services → Credentials**) → **Create client / OAuth client ID** → type **Web application**.
   - **Authorized redirect URIs**: `https://YOUR-DOMAIN/api/auth/google/callback`
4. Copy the **Client ID** and **Client secret** for step 6.

### 4. Let the Studio save (a GitHub key that can only touch this repo)

1. GitHub → your profile picture → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. Name: "3XOBA Studio". Expiration: 1 year (put a reminder in your calendar).
3. **Repository access → Only select repositories → 3XOBA**.
4. **Permissions → Repository permissions → Contents → Read and write**. Nothing else.
5. Generate and copy the token.

### 5. (Optional) Live YouTube numbers and automatic videos

In the same Google Cloud project: **APIs & Services → Library → YouTube Data API v3 → Enable**, then **Credentials → Create credentials → API key**. Click the key → **API restrictions → Restrict key → YouTube Data API v3** → Save.

### 6. Add the settings to Vercel

Vercel → your project → **Settings → Environment Variables**. Add each of these (for **Production**):

| Name | Value |
| --- | --- |
| `SITE_URL` | `https://YOUR-DOMAIN` |
| `AUTH_SECRET` | A long random password, 40+ characters (use a password manager's generator) |
| `GOOGLE_CLIENT_ID` | From step 3 |
| `GOOGLE_CLIENT_SECRET` | From step 3 |
| `OWNER_EMAILS` | Your 3XOBA Google email from step 1b (add more separated by commas, e.g. a manager) |
| `GITHUB_TOKEN` | From step 4 |
| `GITHUB_REPO` | `your-github-username/3XOBA` (the part after github.com/ in this repo's address) |
| `GITHUB_BRANCH` | `main` |
| `YOUTUBE_API_KEY` | From step 5 (optional) |

Then **Deployments → ⋯ → Redeploy**.

### 7. Sign in

Open `https://YOUR-DOMAIN/hub` → **Continue with Google**. Then go to **Studio**, fill in your links, bio, photos and releases, and press **Save & publish**. The public page updates about a minute later.

---

## Using it

- **New single coming?** Studio → Releases → **Add a new release**. Set the date in the future and paste your DistroKid HyperFollow link as the pre-save link. The page shows a live countdown and a pre-save button, then switches to "Out now" with every platform on release day by itself.
- **The top release is the big one.** Use the ↑ ↓ buttons to reorder.
- **Videos update themselves** if you add your YouTube channel ID (Studio → Videos) and the `YOUTUBE_API_KEY`.
- **Every save is kept.** Hub → *Site history* shows every version. To undo a bad save, open that commit on GitHub and revert it (or ask Claude to).
- **Players load only when someone presses play**, so the page stays fast on mobile data and Spotify/YouTube can't track visitors who don't play anything.

---

## How it's kept secure

- **No password to steal.** Sign-in is through Google (with your 2-step verification), and only emails in `OWNER_EMAILS` get in. Everyone else is turned away, even with a valid Google account.
- **Locked session.** After sign-in you get a signed cookie that page scripts can't read, that's only sent over HTTPS to this exact domain, and that other websites can't make your browser use. It lasts 7 days.
- **Every private action re-checks it's you.** The Studio's save and upload buttons each verify your session on the server; calling them directly without it does nothing.
- **Strict input checks.** Every save is validated: links must be `https://`, text has length limits, colours must be real colours. Uploads must really be JPG/PNG/WebP (checked from the file's bytes, not its name) and under 4 MB.
- **Strict browser rules.** The site sends a Content-Security-Policy with a fresh random code on every page, so the browser runs only this site's own scripts and only loads players from Spotify, Apple Music, YouTube and SoundCloud. It also can't be put inside another site's frame (clickjacking), and HTTPS is enforced.
- **No database to hack.** Content is a single file in this (private) repo; the GitHub key can only edit this one repo.
- **Private pages are hidden from Google** and never cached.
- **Photos are cleaned on upload.** The Studio re-encodes every image, which strips the hidden data phones add (GPS location, phone model, owner name).

**Your part:** turn on 2-step verification for your Google and GitHub accounts, keep this repo private, and never paste keys anywhere except Vercel's settings. If you ever think someone got in, change `AUTH_SECRET` in Vercel and redeploy. That signs out every device instantly.

---

## Keeping your identity private

The public site only ever shows what you type into the Studio. These are the places your real identity could still leak, and what to do:

| Where | What could leak | What to do |
| --- | --- | --- |
| This GitHub repo | Your GitHub username next to 3XOBA | Make it **private** (step 1). |
| Google sign-in screen | The Google Cloud project's support email | Use a **separate 3XOBA Google account** (step 1b). |
| Domain records (WHOIS) | Your name, address, phone | Turn on **domain privacy / WHOIS privacy** where you bought the domain (usually free). |
| Vercel | Your Vercel username appears in preview links (`…-yourname.vercel.app`) | Vercel → **Account Settings** → change your username to something neutral. Visitors use your own domain. |
| Booking email | Your personal address | Use an artist address (e.g. `bookings@your-domain`). |
| Photos | GPS location, phone, owner name hidden inside the file | Uploads through the Studio are cleaned automatically. Images you **link** from elsewhere aren't, so upload them instead. |
| Song credits | Songwriter names | DistroKid asks for songwriter real names, and stores can show them in song credits. Check what you enter there. |

---

## What the platforms do and don't allow (checked October 2026)

| Platform | In the Hub today | Why not more |
| --- | --- | --- |
| YouTube | Shortcuts + live subscriber/view/video counts + auto videos on the site | Uploading through the API is possible, but until Google audits the app, every video uploaded that way is stuck as private. Possible later. |
| TikTok | Shortcuts | Posting through the API also requires an audit (posts stay private until approved). Draft uploads are possible later. |
| Instagram | Shortcuts | Publishing/insights via the official API are possible for your own account. Later. |
| Spotify | Shortcuts + embedded player | Spotify removed follower/popularity data for new apps in Feb 2026; Spotify for Artists has no API. |
| Apple Music | Shortcuts + embedded player | Apple Music for Artists has no public API. |
| Audiomack, Boomplay, DistroKid | Shortcuts | No public upload or stats API. |

---

## Ideas for next

- **Your own fan list**: email/WhatsApp sign-ups tagged by city (Lagos, London, Houston…) for tour planning and release-day blasts.
- **Weekly stats log** in the Hub: type in Spotify/Apple/Audiomack numbers each week and see the trend.
- **Upload to YouTube from the Hub** (after Google's audit) and **TikTok drafts**.
- **Lyrics pages** with Yoruba/Pidgin translations, which also help people find you on Google.
- **Press kit page** (`/press`) for promoters: one-sheet, downloadable photos, key numbers.
- **"Era" themes** that re-skin the whole site for each album.

---

## For developers

Next.js 16 (App Router), React 19, TypeScript. No database.

```bash
npm install
cp .env.example .env.local   # fill in AUTH_SECRET, GOOGLE_*, OWNER_EMAILS
npm run dev                  # http://localhost:3000
npm run lint && npx tsc --noEmit && npm run build
```

Without `GITHUB_TOKEN`, local development saves straight to `content/site.json`.

| Path | What |
| --- | --- |
| `content/site.json` | All public page content (validated by `src/lib/content/schema.ts`) |
| `src/app/page.tsx` | Public artist page |
| `src/app/studio/` | Studio page and its server actions (save, upload) |
| `src/app/hub/page.tsx` | Hub |
| `src/lib/hub-links.ts` | Built-in Hub shortcuts |
| `src/lib/auth/` | Google sign-in and session cookie |
| `src/lib/content/store.ts` | Reading/saving content (GitHub commits or local file) |
| `src/proxy.ts` | Per-request Content-Security-Policy |
| `next.config.ts` | Other security headers |
