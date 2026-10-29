# Phase 16: Cutover: stage 1 record

- Branch: `phase-16-cutover` (from the merged `chore/standalone-repo`)
- Date: 2026-10-29
- Status: **Stage 1 built and checked; stopped for the owner's review.** The plan is `phase-16-cutover-plan.md` (revised 2026-10-29 for the owner's setup). Later stages are not started. The phase is not ready for acceptance: its full verify on this branch is stage 4.

## Setup (owner, 2026-10-29)

Users use the new Vercel project's own address; the legacy app stays at its own address and is not changed; no domain move; legacy data does not carry over (fresh start). Cutover is the merge of `chore/standalone-repo` into `main`; rollback is Vercel Instant Rollback.

## Stage 1: what was built

- **`/poets` and `/poets/[slug]` are stubs** (`components/poets/Stub.vue`): "Literary modules are not in this version yet. Your setting is kept." `noindex`; nothing from the legacy module (`docs/pages/poets.md`).
- **"Page not found"** replaces "This page is not rebuilt yet" (`pages/[...slug].vue`, `docs/pages/not-found.md`): `noindex`, links to Home, Search and the Sitemap.
- **`/foundation` is left out of the build Vercel makes** (`build/testPages.ts`, a `pages:extend` hook in `nuxt.config.ts`: Vercel sets `VERCEL`). A local build still has it, because about 25 browser tests and the dev smoke exercise the shell's pieces on it. I did not delete the page: that would have meant rewriting those tests onto other pages for no user-visible gain. A Vercel-style build (`VERCEL=1 npm run build`) was made and checked: the route is not registered (the only remaining mention of "Foundation check" is a title string in `lib/nav.ts`).
- **About says it is a fresh start:** "A fresh start: nothing from the older version of this app carries over to this address, so you begin with nothing saved."
- **Route tests:** `tests/legacyRoutes.ts` lists the 51 page files of the legacy app (commit 7120b6c, as routes); `tests/legacyRoutes.test.ts` (7) fails if one has no page, a redirect or a stub; `e2e/routes.spec.ts` (4) opens a concrete address for each of the 51 on the production build and fails if one lands on "Page not found", and checks the stubs and the not-found page.
- Tests that used the old wording or `/goals` as an "unbuilt" example now use an unknown address (`foundation.spec.ts`, `offline.spec.ts`).

## What was checked (stage 1 only, not the full verify)

`npx eslint .` clean; unit tests 960 of 960 (58 files); a Vercel-style build checked as above; a local build and the browser files `routes`, `foundation`, `offline`, `smallpages` and `prerender` (53 tests) pass. **The full `npm run verify` is not run in stage 1** (stage 4, on this branch, is what acceptance rests on).

## Not done (as planned)

The investigations (axe sweep, keyboard walk, Play-to-audio start time, the two flake families), SEO, `robots.txt`, favicons, the performance and PWA gate, `DEPLOY.md` rewritten for this setup, the Instant Rollback check, the smoke-test script, and `e2e/cutover.spec.ts` (proposed for retirement).

## Open questions for the review

1. The `/foundation` approach: kept in local builds, left out of Vercel builds. Say if you would rather delete it and have me move its tests.
2. The wording of the stub, the not-found page and the About line (listed in `CONTENT_TO_VERIFY.md`).
