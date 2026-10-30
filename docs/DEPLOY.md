# Deploying to Vercel

This repository deploys on its own. It needs no legacy checkout and no other repo at build time: the legacy files it uses are in
`legacy/`. What the build does is checked, not assumed: `tests/independence.test.ts` pins the build command, the Node version and the
absence of install hooks.

**The setup (owner decision, 2026-10-29).** The revamp is a **new Vercel project with its own address**. The legacy app keeps running at its own
address and is not changed; no domain moves. Users move by using the new address. The cutover is the merge `chore/standalone-repo` into `main` of the
new project; the rollback is Vercel's Instant Rollback (section 6). Legacy data does not carry over (a fresh start; About says so).

## 1. The Vercel project

| Setting | Value | Why |
|---|---|---|
| Git repository / Production Branch | this repo, `main` | the production deployment is what users use; every other branch gets a preview |
| Framework Preset | Nuxt | detected; Nitro switches to its `vercel` preset when `VERCEL=1` |
| Root Directory | the repo root (leave empty) | nothing is imported from outside the repo |
| Node.js Version | **22.x** (Settings, General) | same as `.nvmrc` and `engines`; the generated function runtime is `nodejs22.x` |
| Install Command | `npm ci` | exact versions from `package-lock.json`; the only install hook is `postinstall: nuxt prepare` |
| Build Command | `npm run build` (= `nuxt build`) | no network; runs none of the `scripts/gen-*.mjs` generators or `sync-legacy.mjs` |
| Output Directory | leave empty | Nitro writes the Build Output API (`.vercel/output`) |
| Ignored Build Step | none | one repo, one project |

Settings, General, Instant Rollback must be available on the plan (check this before the day; section 6).

## 2. Environment variables

Set for **Production** and **Preview** (Vercel's own variables are not set by hand).

| Name | Set by hand? | Notes |
|---|---|---|
| `QURAN_API_BASE` | only to override | Quran text API, default `https://quranapi.pages.dev/api`. Read at build time |
| `QURAN_API_BASE2` | only to override | default `https://api.alquran.cloud/v1`; must start with `https://` |
| `GOOGLE_SITE_VERIFICATION` | **yes, in Production** (section 5) | the token from Google Search Console's "HTML tag" method; written into the pages' head **only in a production build** |
| `NUXT_PUBLIC_SITE_URL` | only if the address is a custom domain | `https://your.domain`. Otherwise the address is read from `VERCEL_PROJECT_PRODUCTION_URL`, which Vercel sets itself |
| `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` = `1` | optional | the build needs no browser |

Do **not** set `ALLOW_INDEXING` on Vercel (it is for rehearsing a production build locally). Do not copy `NUXT_PUBLIC_WAJIBAT_SHOW_UNREVIEWED_HELPERS`,
`NUXT_PUBLIC_SUPABASE_*`, or anything else the legacy project has: nothing here reads them.

## 3. What search engines are told (`app/lib/seo.ts`)

- **The address.** Canonical links and `sitemap.xml` use the project's production address (`VERCEL_PROJECT_PRODUCTION_URL`, or `NUXT_PUBLIC_SITE_URL`
  when set). A preview deployment gets the same canonical address: a preview is not a second site.
- **Only a Vercel production build is indexable.** Every other build (a preview, a local build) sends `X-Robots-Tag: noindex, nofollow` on every
  response, has `<meta name="robots" content="noindex, nofollow">`, and serves a `robots.txt` that disallows everything with no sitemap. Vercel adds its own
  noindex to previews as well; ours makes it testable.
- **Production** serves `Allow: /`, `Disallow: /api/`, the sitemap line, and no `X-Robots-Tag`.
- **`sitemap.xml`** lists 136 real routes: the 22 public pages and the 114 surah pages. It lists no personal page (Library, Downloads, Hifz, Goals,
  Calendar, Settings, Tasbeeh, Per page, Surah videos), no Poets (deferred), no `/foundation`, and no detail pages of the study modules.
- `/foundation` is not in a Vercel build at all (`build/testPages.ts`).

Check it on a real address with `node scripts/smoke-prod.mjs <url>` (a preview) or `node scripts/smoke-prod.mjs <url> --production`.
That script checks the real response header; a preview must send `X-Robots-Tag`, production must not.

## 4. Check a deployment (preview first)

```bash
node scripts/smoke-prod.mjs https://<preview-host>                    # writes docs/phases/smoke-<date>.md
node scripts/smoke-prod.mjs https://<production-host> --production
```

It checks `/sw.js` (200, JavaScript, not immutable), the manifest, the titles and head tags of `/`, `/about` and `/surah-listing`, that `/api/surahs` is JSON,
`robots.txt` and `sitemap.xml` (host, routes, headers), deep links, that an unknown address and `/poets` show "Page not found", that `/juz/7` redirects, that the
service worker registers and a reload works offline, and a first run with a clean profile. Then in a real browser on that origin: install the PWA and
open it on a phone.

A preview URL is a different origin from production, so it shows none of a user's data (localStorage, IndexedDB and service workers are per origin).

## 5. After launch (for you, once the production address is live)

1. Open <https://search.google.com/search-console> and **Add property**, choosing **URL prefix** and the new production address
   (for example `https://quran-xxxx.vercel.app`; a Vercel address cannot use the DNS method, so use the URL-prefix one).
2. Choose **HTML tag** verification and copy the `content` value of the `<meta name="google-site-verification">` tag it shows.
3. In Vercel, Settings, Environment Variables, add `GOOGLE_SITE_VERIFICATION` for **Production** with that value, then **redeploy** the production
   deployment (it is read at build time). Check the tag is in the page: `curl -s https://<address>/ | grep google-site-verification`.
4. Back in Search Console press **Verify**.
5. Open **Sitemaps**, enter `sitemap.xml`, **Submit**. The status should read "Success" and show 136 discovered pages (it can take a day).
6. Optionally **URL inspection** on the home page, then **Request indexing**.

The legacy site's own Search Console property is separate and is not touched.

## 6. Rollback: Instant Rollback

**When:** users cannot load the app, or saved data appears to be missing after a deployment.

**How (a minute):** Vercel, the project, Deployments, choose the last good production deployment, **Instant Rollback**. The address does not change.
Then fix on a branch and promote a new deployment. The legacy app is a separate address and is unaffected either way.

**What an installed phone does:** the service worker is `registerType: "prompt"`: a browser that has the bad version fetches `/sw.js` (the file the
rolled-back deployment serves), installs it, and shows "A new version of Quran App is available. Reload". Until the toast is accepted the phone keeps
the cached version. **How fast this reaches a phone is check 16-RB**, measured, not assumed: deploy a harmless change, roll it back, and note on a phone
how many visits it takes.

**The release rule that keeps a rollback safe:** do not bump `quran-revamp-db`'s version or change a stored format incompatibly in a release without telling
the owner first. A rolled-back build that finds a database from a newer version cannot open it. Storage changes are additive and versioned
(CLAUDE.md, rules 4 and 9).

**Same `sw.js` name and scope.** Keep file `/sw.js`, scope `/`, no manifest `id`, `registerType: "prompt"` and the cache names
(`quran-api-cache`, `quran-audio-cache`): they are in the `pwa` block of `nuxt.config.ts`.
