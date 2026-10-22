# Deploying to Vercel

This repository deploys on its own. It needs no legacy checkout and no other repo at build time: the legacy files it uses are in
`legacy/`. What the build does is checked, not assumed: `tests/independence.test.ts` pins the build command, the Node version and the
absence of install hooks, and `npm run build` was run (also with `VERCEL=1`, the Vercel preset) with Node's outbound connections routed to a proxy that refuses and logs them: it logged none.

## 1. Create the Vercel project

A new Vercel project for this repo (`HassanRaza375/QuranApp`, branch `main`). Do **not** reuse the legacy project: it stays as the
rollback target (section 4).

| Setting | Value | Why |
|---|---|---|
| Framework Preset | Nuxt | detected; Nitro switches to its `vercel` preset when `VERCEL=1` |
| Root Directory | the repo root (leave empty) | the old `revamp-quran` root directory and "Include source files outside of the Root Directory" are gone: nothing is imported from outside the repo |
| Node.js Version | **22.x** (Settings, General) | same as `.nvmrc` and `engines` (`22.x`); the generated function runtime is `nodejs22.x` |
| Install Command | `npm ci` | exact versions from `package-lock.json`; the only install hook is `postinstall: nuxt prepare` (local, no download) |
| Build Command | `npm run build` (= `nuxt build`) | no network, and it runs none of the `scripts/gen-*.mjs` generators or `sync-legacy.mjs`; the generated data files are committed |
| Output Directory | leave empty | Nitro writes the Build Output API (`.vercel/output`); an override copied from the legacy project would break the deploy |
| Ignored Build Step | none | one repo, one project |

Production Git branch: `main`. Pushes to other branches get preview URLs.

## 2. Environment variables

I cannot see either Vercel project, so this is derived from what the code reads. Check the legacy project's Settings,
Environment Variables, and mirror these for **Production** and **Preview**.

| Name | Copy from the legacy project? | Notes |
|---|---|---|
| `QURAN_API_BASE` | **Yes, if it is set there** (the legacy app has no default, so it must be) | Quran text API, default `https://quranapi.pages.dev/api`. Used by `nuxt.config.ts` and the `server/api` proxies |
| `QURAN_API_BASE2` | **Yes, if it is set there** | default `https://api.alquran.cloud/v1`; must start with `https://` (the README CORS gotcha) |
| `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` = `1` | No, new | `@playwright/test` is a dev dependency and the build needs no browser. `npm ci` does not download one today (that is `npx playwright install`); this keeps it that way if an install hook is ever added |

Both `QURAN_API_*` values are read at **build time** (`nuxt.config.ts`), so changing one needs a redeploy. If the legacy project does
not override them, leave them unset: the defaults are the same upstreams.

Do **not** copy: `NUXT_PUBLIC_WAJIBAT_SHOW_UNREVIEWED_HELPERS` (a legacy development flag; the legacy build refuses to run with it on in
production), `NUXT_PUBLIC_SUPABASE_URL` and `NUXT_PUBLIC_SUPABASE_ANON_KEY` (named in the legacy README as inert until Account/Sync exists; nothing here reads
them), and anything else for services this app does not use (the analytics package is not in this repo; Vercel Web Analytics, if you use it,
is a switch in the project, not a variable).

## 3. Check a deployment (preview first)

```bash
URL=https://<preview-or-production-host>
curl -sI $URL/sw.js | grep -i -E 'HTTP|content-type|cache-control'   # 200, javascript, NOT immutable (max-age=0 / must-revalidate)
curl -sI $URL/manifest.webmanifest | head -1                           # 200
curl -s  $URL/ | grep -o '<title>[^<]*'                                # Quran App
curl -s  $URL/about | grep -o '<title>[^<]*'                           # About · Quran App (prerendered, own head tags)
curl -s  $URL/api/surahs | head -c 120                                 # JSON from the proxy, not HTML
```

Then, in a real browser on that origin: open a deep link such as `/settings` (must render the app, not a 404); install the PWA; go offline
and open a page you visited; open the site on a phone. The deep-link and offline behaviour is proven by `e2e/` against the Node build; this
confirms it on Vercel's routing, which has not been rehearsed here.

A preview URL is a different origin from the production site, so it shows none of a user's data: localStorage, IndexedDB and service
workers are per origin. Test data migration by seeding keys (as the e2e tests do), not by expecting a preview to have them.

## 4. What cutover needs

### Same domain

Move the **production domain** from the legacy project to the new one (Settings, Domains on each project). Users keep their bookmarks,
goals, Hifz progress and settings only because the origin is the same: a new domain is a new empty browser profile. If the domain
already points at Vercel, no DNS change should be needed; confirm that in the domain's settings before the day.

### Same `sw.js` name and scope

The new worker replaces the installed legacy worker only because it is the same file at the same scope. Do not change any of these (they are
in the `pwa` block of `nuxt.config.ts`, with `docs/LEGACY_INVENTORY.md` as the reference):

- file `/sw.js`, scope `/`
- manifest identity: no `id`, `start_url` `/`, `scope` `/`
- `registerType: "prompt"` and the runtime cache names `quran-api-cache` and `quran-audio-cache`

Existing users keep the legacy app until they accept the **"A new version of Quran App is available. Reload"** toast; the legacy
worker answers until then. `e2e/cutover.spec.ts` rehearses exactly this (legacy worker installed, site replaced, update accepted, runtime cache kept,
works offline afterwards).

### Before the day

- [ ] Replace `legacy/dist/sw.js` and `legacy/dist/workbox-*.js` with the files **production serves today** (`curl -O https://<domain>/sw.js`, then the
  `workbox-<hash>.js` it imports), run `node scripts/sync-legacy.mjs --rehash`, note it under "Local edits" in `legacy/README.md`, and re-run
  `npm run build && npx playwright test e2e/cutover.spec.ts`. The vendored worker is from a local build of the legacy app
  (`builtAt` in `legacy/manifest.json`), which may not be what is deployed.
- [ ] `robots.txt`: the legacy site serves an allow-all one (`User-Agent: *` / `Disallow:`); this build has none yet (it is on the SEO checklist in
  `docs/PLAN.md`). Without it, `/robots.txt` returns the app shell. `favicon.png` and `favicon3.png` are in the legacy `public/` and not here either.
- [ ] Every legacy route has a real page. A route that still shows "This page is not rebuilt yet" (`app/pages/[...slug].vue`) is a regression for its users.
- [ ] The items in `docs/PLAN.md`, "Cutover checklist" (remove `/foundation`, the Ja'fari prayer-time comparison, the data fixes below, real-device checks).
- [ ] Data fixes the checklist names (the persons relationships, the `nuhflood` story status) edit files in `legacy/app/data/`. That is the one
  allowed edit there: its own commit, `node scripts/sync-legacy.mjs --rehash`, and a line under "Local edits" in `legacy/README.md`.
- [ ] Keep the legacy Vercel project and its last production deployment. Do not delete either until the rollback window (below) has passed.

## 5. Rollback

**When:** users cannot load the app, saved data appears to be missing, or the update toast does not appear/work after cutover.

**How (minutes):**

1. In Vercel, move the production domain back to the legacy project (Settings, Domains), whose last production deployment is still there.
   Do not redeploy the legacy app first; its previous deployment is the known-good one.
2. Leave the new project and its deployments alone so the problem can be reproduced on its preview URL.
3. Do not clear site data, rename `sw.js`, or change the scope while rolled back.

**What users see:** a browser that already took the new worker gets the legacy `/sw.js` on its next update check (at the latest within 24 hours, or
on a navigation). It installs and waits. Both apps use `registerType: "prompt"` and both workers answer the `SKIP_WAITING` message, so the page they are on
should offer the same "new version available, Reload" toast, and accepting it should put them back on the legacy app (this direction is not
rehearsed, see below). Until they accept, they keep seeing the new app from its cache.

**Their data is safe on rollback by construction:** the revamp keeps the legacy storage keys and formats (parity-tested against the legacy
`useAudioPlayer` and `useTasbeeh` code, `tests/audioLegacy.test.ts`, `tests/tasbeeh.test.ts`); everything it adds uses new keys the legacy app
ignores (`quran:reader-prefs:v1`, `quran:pins:v1`, `quran:read-surahs:v1`, ...); and its IndexedDB data lives in a separate database,
`quran-revamp-db`, while `quran-app-db` is never opened with another version. What a user did only in the new app (pins, read surahs, reader
preferences) is not shown by the legacy app, and is still there when they return.

**Not rehearsed, and what to do about it:**

- `e2e/cutover.spec.ts` covers legacy to new only. The reverse (new to legacy) follows from the points above but no test runs it. Rehearse it by hand
  on a preview before cutover: install the new worker on a throwaway origin, switch the site back to the legacy build, and accept the toast.
- If the new worker itself were the problem (for example it stops updating), the lever is a replacement `/sw.js` at the same URL that calls
  `self.skipWaiting()`, deletes the caches and unregisters itself. That file is not prepared; write and test it before cutover if you want that
  safety net.

**Keep the rollback target for a few weeks** (the Phase 0 decision, `docs/phases/phase-00-foundation.md`), then retire the legacy project.
