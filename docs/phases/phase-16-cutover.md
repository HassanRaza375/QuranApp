# Phase 16: Cutover: stage 1 record

- Branch: `phase-16-cutover` (from the merged `chore/standalone-repo`)
- Date: 2026-10-29
- Status: **Stage 1 built and checked; stopped for the owner's review.** The plan is `phase-16-cutover-plan.md` (revised 2026-10-29 for the owner's setup). Later stages are not started. The phase is not ready for acceptance: its full verify on this branch is stage 4.

## Setup (owner, 2026-10-29)

Users use the new Vercel project's own address; the legacy app stays at its own address and is not changed; no domain move; legacy data does not carry over (fresh start). Cutover is the merge of `chore/standalone-repo` into `main`; rollback is Vercel Instant Rollback.

## Stage 1: what was built

- **Poets is deferred with no stub** (owner, 2026-10-29, replacing the stub I first built): `/poets` and `/poets/[slug]` show the normal "Page not found"; the stub pages, their component and their page doc are deleted; the sidebar group "Literary modules" (its only row was Poets) is removed. `tests/legacyRoutes.ts` marks the two routes as deferred.
- **"Page not found"** replaces "This page is not rebuilt yet" (`pages/[...slug].vue`, `docs/pages/not-found.md`): `noindex`, links to Home, Search and the Sitemap.
- **`/foundation` is left out of the build Vercel makes** (`build/testPages.ts`, a `pages:extend` hook in `nuxt.config.ts`: Vercel sets `VERCEL`). A local build still has it, because about 25 browser tests and the dev smoke exercise the shell's pieces on it. I did not delete the page: that would have meant rewriting those tests onto other pages for no user-visible gain. A Vercel-style build (`VERCEL=1 npm run build`) was made and checked: the route is not registered (the only remaining mention of "Foundation check" is a title string in `lib/nav.ts`).
- **About says it is a fresh start:** "A fresh start: nothing from the older version of this app carries over to this address, so you begin with nothing saved."
- **Route tests:** `tests/legacyRoutes.ts` lists the 51 page files of the legacy app (commit 7120b6c, as routes) and marks Poets as deferred; `tests/legacyRoutes.test.ts` (7) fails if a non-deferred one has no page or redirect, and checks that Poets has none; `e2e/routes.spec.ts` (4) opens a concrete address for each of the other 49 on the production build and fails if one lands on "Page not found", and checks that `/poets`, `/poets/mir-anis` and any slug do show it.
- Tests that used the old wording or `/goals` as an "unbuilt" example now use an unknown address (`foundation.spec.ts`, `offline.spec.ts`).

## What was checked (stage 1 only, not the full verify)

`npx eslint .` clean; unit tests 960 of 960 (58 files); a Vercel-style build checked as above; a local build and the browser files `routes`, `foundation`, `offline`, `smallpages` and `prerender` (53 tests) pass. **The full `npm run verify` is not run in stage 1** (stage 4, on this branch, is what acceptance rests on).

## Not done (as planned)

The investigations (axe sweep, keyboard walk, Play-to-audio start time, the two flake families), SEO, `robots.txt`, favicons, the performance and PWA gate, `DEPLOY.md` rewritten for this setup, the Instant Rollback check, the smoke-test script, and `e2e/cutover.spec.ts` (proposed for retirement).

## Open questions for the review

1. The `/foundation` approach: kept in local builds, left out of Vercel builds. Say if you would rather delete it and have me move its tests.
2. **Done (owner, 2026-10-29):** the Settings section "Modules" and its switch are removed and the `literaryModules` preference is gone; the stored key is never read or written; it returns with Poets (`DECISIONS.md`). Settings now has seven sections.
3. The wording of the not-found page and the About line (listed in `CONTENT_TO_VERIFY.md`).


## Stage 2 (investigations): done, see `phase-16-stage2.md`

Accessibility: 0 axe violations in 196 page views after three small fixes; no keyboard trap on 49 pages. Play-to-audio start: no change across Phase 14, the prefetch hypothesis not supported. Flakes: `knowledgeModules.spec.ts:239` reproduced (about 2%) and fixed (an unordered choice of link); the two Per page tests not reproduced in 100 runs each. **The V7 screen-reader pass is still yours.**

## Stage 3 (SEO, accessibility tool, deployment doc): built, waiting for review

- **`npm run test:a11y`** (`@axe-core/playwright`, a dev dependency; `scripts/measure/a11y.spec.ts`; not part of verify). Needs `npm run build` first. It runs axe (WCAG 2.0 A/AA, 2.1 A/AA, 2.2 AA) on the 49 routes at 1280 and 375 px, light and dark, plus the keyboard walk. **On the final build it reports 36 views with one rule, `label-content-name-mismatch` (WCAG 2.5.3, Label in Name, level A)**: a control whose `aria-label` does not contain its visible text, which matters to voice-control users ("click Juz 1"). The packaged axe (4.14) has this rule on and the copy used in stage 2 did not report it. Nine places: the Surah listing rows and Juz rows (114 and 30 nodes), the Asma ul-Husna cards (99), the Calendar day cells (30), the Play button of a surah (1), Per page's text-size buttons (2), the Tasbeeh tap target (1), and one Settings drawer trigger at 375 px. **Not fixed**: the fix renames labels that many browser tests select by, so it needs a full browser run; say if you want it in this phase.
- **Address.** The canonical address is the project's production address: `NUXT_PUBLIC_SITE_URL` if set, else Vercel's `VERCEL_PROJECT_PRODUCTION_URL` (`app/lib/seo.ts`, tested in `tests/seo.test.ts`). Every prerendered page gets a canonical link in its head; the rest get it from `app/app.vue` once they open. With no address known (a local build) there is no canonical and the sitemap lists nothing.
- **Previews send noindex.** Only a Vercel build with `VERCEL_ENV=production` is indexable. Any other build sends `X-Robots-Tag: noindex, nofollow` on every response (`nitro.routeRules`), has the robots meta tag, and serves `robots.txt` with `Disallow: /`. **Checked on simulated Vercel builds, not on a real preview URL** (I cannot reach your project): `VERCEL=1 VERCEL_ENV=preview` gave `X-Robots-Tag` in `.vercel/output/config.json` for `/(.*)`, a disallow-all `robots.txt`, one robots meta tag and the canonical on the production host; `VERCEL_ENV=production` gave no header and no robots meta, `Allow: /`, `Disallow: /api/`, the sitemap line, and the Search Console tag from `GOOGLE_SITE_VERIFICATION`. `scripts/smoke-prod.mjs <url>` checks the real header on a real address (preview must send it, `--production` must not).
- **`sitemap.xml`** lists 136 routes at one host: 22 public pages and the 114 surah pages. No personal page, no Poets, no `/foundation` (tests check each route has a page and no page is `noindex`). `/robots.txt` and `/sitemap.xml` are prerendered files and are denied to the service worker's navigation fallback.
- **Titles.** `e2e/seo.spec.ts` opens the 22 public pages and `/surah/18` and fails on a missing description, a generic title or a repeated title. It found one: the People timeline had the directory's title and description; it has its own now.
- **`scripts/smoke-prod.mjs <url> [--production]`** (21 checks, dated report in `docs/phases/`). Run here against local builds of both kinds: all pass except "`/foundation` is not shipped", which is expected on a local build and passes on a Vercel one.
- **`docs/DEPLOY.md`** is rewritten for this setup (new project, `main`, env vars, noindex, Instant Rollback and the release rule, check 16-RB) and has the **after-launch steps for you**: add the production address to Google Search Console (URL prefix, HTML tag), set `GOOGLE_SITE_VERIFICATION`, redeploy, verify, submit `sitemap.xml`.
- V7 (TalkBack, Pixel 7 Pro, Home, Search and Hifz) is recorded as done in `DEVICE_CHECKS.md`.

### Checked in stage 3 (not the full verify)

`npx eslint .` clean; unit tests 972 of 972 (59 files); browser files `seo`, `prerender`, `people`, `routes`, `offline` (36) pass on a local build. Builds were made on Node 24 (no Node 22 on this machine); the full verify on Node 22 is stage 4. A stale `.nuxt` cache once reused an old prerendered sitemap after a code change: delete `.nuxt` and `.output` when a build's address or environment changes (Vercel builds from clean).

### Not done

Lighthouse (I had planned it; you did not ask, and the tool is not installed); a header check on a real preview URL; the label fix above; `e2e/cutover.spec.ts` is still in place awaiting your answer.
