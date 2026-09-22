# WhatsApp DP Downloader

**Live:** <https://whatsapp-dp-downloader.vercel.app>

A fast, free, SEO-optimized web tool to **view and download WhatsApp profile pictures (DPs) in full HD** by phone number — no login, no app install, works on every device.

![WhatsApp DP Downloader](assets/og-image.jpg)

## Features

- 🔍 **Lookup by number** — 190+ country codes, auto-normalizes pasted numbers
- 🖼️ **Full-HD originals** — always requests the highest-resolution DP WhatsApp serves (up to 640×640)
- ⚡ **Fast** — smart caching, results in seconds
- 🔒 **Private** — searched numbers are never stored; owners are never notified
- 📱 **Any device** — pure web app (Android, iOS, Windows, macOS, Linux)
- 🆓 **Free & unlimited** — no sign-up, no watermarks
- 🧭 **SEO-ready** — structured data (WebApplication, HowTo, FAQPage, Article, BreadcrumbList), sitemap, robots, OG/Twitter cards, clean URLs, semantic HTML

## Architecture

```
Browser ──▶ Vercel (static site + /api serverless proxy)
                │  secret API key held in env vars
                ▼
        VPS (nginx HTTPS :443) ──▶ tg-wa-bot process (Baileys)
                                      └── live WhatsApp sessions serve profilePictureUrl()
```

| Piece | Location | Notes |
|---|---|---|
| Static site | `index.html`, `*.html`, `assets/` | Deployed on Vercel |
| API proxy | `api/dp.js`, `api/health.js` | Vercel serverless functions; add rate limiting + validation; hide the upstream key |
| Upstream API | runs on your own VPS inside the WA bot process (`dp_api.js`) | loopback only, exposed via nginx at `https://<vps-host>/wa-dp-api/` |

## Environment variables

Set these on the Vercel project (already configured for the live deployment):

| Variable | Purpose |
|---|---|
| `WA_DP_API_BASE` | HTTPS base of the VPS API, e.g. `https://your-host/wa-dp-api` |
| `WA_DP_API_KEY`  | Secret key shared with the VPS `dp_api.js` service |

## Local development

Any static server works for the pages; the tool itself needs the Vercel env vars + reachable VPS API:

```bash
npx serve .
# or with functions:
vercel dev
```

## Pages

- `/` — tool + full SEO landing
- `/how-to-download-whatsapp-dp` — step-by-step guide (Article + HowTo schema)
- `/whatsapp-dp-size` — DP dimensions & quality guide (Article schema)
- `/whatsapp-profile-picture-guide` — the complete profile-picture guide: crop, format, display, quality (Article schema)
- `/whatsapp-dp-faq` — consolidated question hub: errors, privacy, blocked accounts, group photos (FAQPage schema)
- `/about`, `/contact`, `/privacy-policy`, `/terms-of-service`, `/dmca`

## Legal

Independent project — not affiliated with WhatsApp LLC or Meta Platforms, Inc. Photos belong to their owners; personal use only. See [DMCA](https://whatsapp-dp-downloader.vercel.app/dmca).

## Runtime architecture

- **Frontend**: static site on Vercel (`index.html` + guides + `assets/`) — vanilla HTML/CSS/JS, no framework.
- **API**: `api/` serverless functions proxying to the self-hosted DP API (`/api/health`, `/api/dp?number=…`).
- **Engine**: private WhatsApp-session API (see backend repo notes).

## Monetization (configurable, isolated, easily disabled)

`assets/ads-config.js` holds the master switch + rotation/cooldown settings + the
sponsored link list; `assets/ads.js` renders clearly labeled "Advertisement"
cards into the single `[data-ads-mount]` slot per page. Tracking is local-only
(browser localStorage): the searched phone number or any user data is never
transmitted to advertisers, and there are no third-party ad scripts/iframes.
Set `enabled: false` in the config to turn all of it off instantly.

## SEO tooling

- `tools/submit_indexnow.py` — pushes the XML sitemap URL set to the IndexNow
  endpoint (official protocol, key file at the site root).
- `tools/seo_health_check.py` — periodic SEO/health audit (status codes,
  canonicals, meta uniqueness, H1s, JSON-LD validity, internal links, security
  headers, API health) for monitoring after each deploy.

## Search consoles

Manual one-time step (owner account required): verify the site in Google
Search Console + Bing Webmaster Tools using the HTML-tag method, then submit
`/sitemap.xml`.

## Deploy

    vercel build --prod && vercel deploy --prebuilt --prod

`sitemap.xml`, `robots.txt`, favicons and the OpenGraph image are at the site root.
