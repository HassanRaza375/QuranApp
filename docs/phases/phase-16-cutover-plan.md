# Phase 16: Cutover: plan

- Branch: `phase-16-cutover` (from the merged `chore/standalone-repo`)
- Date: 2026-10-29
- Status: **Plan only. Nothing changed. Waiting for your approval.** Revised 2026-10-29 with the owner's four decisions (all 30 keys covered before cutover; the service-worker switch back rehearsed in a preview, with cutover blocked until it passes; the 136 checks sorted; `/poets` as stubs) and the new rule that a phase is accepted only after a full verify on its own branch.
- Read for this: `docs/DEPLOY.md`, `docs/PLAN.md` (Phase 16 and the cutover checklist), `docs/LEGACY_INVENTORY.md` (the storage keys), `docs/DEVICE_CHECKS.md`, `docs/CONTENT_TO_VERIFY.md`, the phase docs' flake records (10, 13, 14, 15), and the legacy repo's `app/pages`, `server/` and Poets files (read only).
- What I cannot see: the Vercel account (either project, the domain, the environment variables), and any real device. Where the plan needs a fact from there it says so and lists it under "Decisions and facts I need".

## 1. Summary

- **Every legacy route has a page in the revamp except two: `/poets` and `/poets/[slug]`.** Decided: both are **stub pages at cutover**; Poets is built later as its own phase (section 2).
- **The 136 manual checks are sorted** into **49 before cutover, 56 in the first week, 31 whenever** (section 3 and `phase-16-checks.md`). Five more things are open and are not rows: the screen-reader and keyboard pass, the Play-to-audio start time before and after Phase 14, and the two flake families (3.2).
- **Rollback covers all 30 legacy localStorage keys before cutover** (4.1): a test for each, today 9 are proven. **The service-worker switch back is designed (two designs) and rehearsed on a Vercel preview alias, and cutover is blocked until the rehearsal passes** (4.3).
- **The merge to `main` is safe and changes nothing for users** (section 5): `main` is an ancestor of `chore/standalone-repo`. What users see changes only when the **domain** moves, a separate, reversible step after production smoke tests.
- **Process:** the phase is accepted only after a **full verify on its own branch**; the merged-head verify is extra, not instead (stage 5).

## 2. Every legacy route, and what the revamp has

Legacy: 51 page files (`app/pages` at commit 7120b6c), `server/api` (four proxies) and an **empty** `server/api2`.

| Legacy route | Revamp | Notes |
| --- | --- | --- |
| `/` | `index.vue` | Home |
| `/about` | `about.vue` | Phase 15 |
| `/asma-ul-husna` | `asma-ul-husna.vue` | |
| `/bookmarks` | `bookmarks.vue` | the Library (same route, same keys) |
| `/calender` | `calender.vue` | Phase 15 (the legacy spelling kept) |
| `/commands`, `/commands/[id]` | `commands/index.vue`, `[id].vue` | |
| `/downloads` | `downloads.vue` | (legacy `downloads/index.vue`) |
| `/duas`, `/duas/[id]` | `duas/index.vue`, `[id].vue` | |
| `/events`, `/events/[id]` | `events/index.vue`, `[id].vue` | |
| `/fiqh`, `/fiqh/choose-marja`, `/fiqh/glossary`, `/fiqh/[category]`, `/fiqh/[category]/[topic]` | `fiqh/*` | |
| `/goals` | `goals.vue` | Phase 15 |
| `/hifz`, `/hifz/session` | `hifz/index.vue`, `session.vue` | (plus a new `/hifz/surah/[n]`) |
| `/juz` | `juz/index.vue` | |
| `/juz/[id]` | `juz/[id].vue` | **a redirect** to the reader at the juz's first ayah (decided; the legacy was a full-juz reader) |
| `/peoples`, `/peoples/[id]` | `peoples/*` | |
| `/per-page-read` | `per-page-read.vue` | |
| `/persons`, `/persons/[id]`, `/persons/timeline` | `persons/*` | |
| `/places`, `/places/[id]` | `places/*` | |
| **`/poets`, `/poets/[slug]`** | **none** (the catch-all says "This page is not rebuilt yet") | **gap, see below** |
| `/prayerTime`, `/qibla-direction` | `prayerTime.vue`, `qibla-direction.vue` | one component, both routes kept |
| `/ramadan` | `ramadan/index.vue` | |
| `/sajda` | `sajda.vue` | |
| `/search` | `search.vue` | |
| `/settings` | `settings.vue` | |
| `/signs`, `/signs/[id]` | `signs/*` | |
| `/sitemap` | `sitemap.vue` | Phase 15 |
| `/stories`, `/stories/[id]` | `stories/*` | |
| `/surah-audios/[id]` | `surah-audios/[id].vue` | |
| `/surah-listing` | `surah-listing.vue` | |
| `/surah-vedios` | `surah-vedios.vue` | Phase 15 (says there are no videos) |
| `/surah/[id]` | `surah/[id].vue` | the reader |
| `/tasbeeh`, `/tasbeeh/[id]` | `tasbeeh/*` | |
| `/themes`, `/themes/[id]` | `themes/*` | |

Server routes: the four proxies (`/api/chapters`, `/api/juz`, `/api/sajda`, `/api/surahs`) are in `server/api` here. The legacy `server/api2` folder is empty, so there is nothing to carry. The app itself calls the upstream services directly through `runtimeConfig`; the proxies only matter to an old link or a cached legacy page.

Revamp-only pages to deal with: **`/foundation`** (a spike page: remove, on the checklist); **the catch-all** `[...slug].vue` ("This page is not rebuilt yet"): once Poets is handled, replace it with a real **"Page not found"** (search link, `noindex`); a single-page app answers 200 for an unknown address, so it carries `noindex` and says plainly that the page does not exist.

**Poets: decided, stub pages at cutover.** The legacy has one module (Mir Anis): an index page and a seven-tab page over `mir-anis.json` (278 KB of Urdu verse, a biography, works, characters and themes, each fact with a verification level A to E and the banner "Seed data, not yet fully verified"), behind the Literary modules setting (`quran:additional-modules-enabled:v1`, which the revamp already stores). It is religious and literary content typed by a researcher; under the project's content rule it needs a review before it ships in a rebuilt UI. So for cutover: `/poets` and `/poets/[slug]` (every slug, `/poets/mir-anis` included) show one honest page ("Literary modules are not in this version yet. Your setting is kept."), no invented content, `noindex`; the Literary row stays behind the setting; the Sitemap lists nothing for it; `foundation.spec.ts`'s "unbuilt route" example moves to a made-up address (it uses `/poets` today). Building Poets is a later phase with a content review.

**Checks this section becomes** (automated, in this phase): a unit test that lists the 51 legacy page files' route patterns (read from the vendored legacy page list, kept in `legacy/manifest` terms) and fails if one has no page, no redirect and no stub; and a browser test that opens one concrete address per route and fails on "not rebuilt yet".

## 3. The open checks, in one list

### 3.1 Device and manual checks (`DEVICE_CHECKS.md`): 136 rows, sorted

133 table rows plus Daily Fiqh F1 to F3 (K1 is waived). Ids that repeat across phases (G, H and D each mean two things) get a phase prefix in the sorted list (`5-H1`, `14-H1`, `15-G1`, `11-D1`, `9-D1`). The full sorted table is `docs/phases/phase-16-checks.md`. The rule used:

| Group | Count | What goes here |
| --- | --- | --- |
| **Before cutover** | **49** | Anything whose failure is **data loss, a dead end, a wrong prayer time or Hijri date, or breaks the hand-over**: install, update and offline (S1 to S3); location and its denied path (P1, P2, 5-G1, 5-G2); notifications (N1 to N4: they have never fired on a device); the core of the player on a phone (A1 to A4, A6 to A8, A11, A14, A17 to A19; A1 to A3 are reported tested by the owner on Safari); the compass (C1 to C4); the Hijri date and the Sunni and Ja'fari times against a source you trust (5-H1, 5-H4, 5-H5); your notes (B1); Downloads storage and offline play (11-D1, 11-D2, D4, D6); Hifz on a phone, offline, and your legacy data (14-H1, 14-H6, 14-H7); Phase 15 on a phone, offline, and your legacy goals and reminders (15-G1, 15-G2, 15-G5, 15-G6); Daily Fiqh offline (F1, F2); your reading of the wording and the data decisions (V1, V2); and the **screen-reader pass (V7, P6, R6)**. |
| **First week** | **56** | Things to notice while really using the installed app for a week: the rest of the player (repeat, next surah, lock screen, slow network, queues, Follow audio, offline per-ayah), the rest of the compass, Hijri adjustment and offline prayer times, notification details, Downloads variants, search, Library select mode, a long surah, stories offline, a real week of Hifz and of goals, the Hifz and Goals extras. |
| **Whenever** | **31** | Polish and low-risk: rotation, share and save toasts, dark-mode looks at 375 px, Tasbeeh, Asma, Sajda, the Firefox repeats, desktop-only checks, the wording I am less sure of. |

Three rules for the sorting: a check on something **already proven by an automated run and low-risk if wrong** is never "before"; a check on something **users rely on that no automated run can show** (real audio, GPS, notifications, the installed app, a trusted source for a date or a time) is "before"; a check that needs **days of use** is "first week" by nature. You can move any row; the list is a table so it is one edit.

### 3.2 Not rows, but open (each becomes work in this phase)

1. **Screen-reader and keyboard pass.** Each phase ran its own keyboard checks in a browser test (Hifz, Goals, Calendar and others), but there has been **no screen-reader pass on any page** and no single keyboard walk across the app. Plan: (a) an automated sweep over every route in light and dark at 375 and 1280 px with `@axe-core/playwright` (a new **dev** dependency, needs your OK), failing on serious or critical findings, each fixed or recorded with a reason; (b) a scripted keyboard walk per page (tab order reaches every control, a visible focus ring, no trap, Escape closes every sheet); (c) **you** run VoiceOver (iPhone) and TalkBack (Android) on Home, Settings, the listing, the reader, the player, Per page, Goals and the Calendar (V7); I write the script of what to listen for.
2. **Play-to-audio start time, before and after Phase 14.** Phase 14's merge was followed by test failures in the audio specs (`queue.spec.ts` in Phase 14, `player.spec.ts` twice after the Phase 14 follow-ups) that read the audio recorder once, right after a click, and found nothing yet. Each was fixed by waiting for the result, but **the cause of the changed timing is unproven**; the only candidate I have is the Hifz chunks prefetched in idle time (13 KB on every route, 15 KB on Home), which I measured as a size, not as a delay to Play. Plan: a dev-only script (`scripts/measure/play.mjs`, like `startup.mjs`) with the recorded audio element, measuring from the click to the element being asked for its file, on the listing row, the reader's ayah button, the page queue and the mini player; normal speed and 4x CPU slowdown; 15 runs each; on **3603e43 (before Phase 14), 2d5e8ed (Phase 14 merged), d32183e (follow-ups) and the head**; medians and the spread, and the same measurement with Hifz's prefetch turned off to test the one hypothesis. If the Play delay moved by more than the spread, the cause is found and fixed (or the prefetch policy changed, which you decided to keep: it would come back to you); if it did not, the flakes are the tests' and are recorded as such. A **real-device** version (a phone, a real file, a stopwatch or the Network panel) is added as a blocking row for the player.
3. **The two unexplained flake families.**
   - `perpage.spec.ts:345` and `:376` (Phase 10, one run): the first got the offline wording instead of the failed-request wording; the second ("Next quietly has the next page's surah ready") also failed. They passed 3 of 3 on re-run and in the Phase 11 verify. No cause was found.
   - `knowledgeModules.spec.ts:239` (Phase 13, one run): `k-name` not visible within 5 s after clicking a Connected link. It passed 10 of 10 alone, the spec was not changed, and no cause was found.
   Plan for both: run each 50 times under a controlled CPU load (a stress process pinned at 70 to 90%) and 50 times idle, on the current head and on the commit where it first failed; read the failures' traces; fix the test (a retrying assertion, a wait for the real condition) or the code if the traces show a race in the page; or record them as load-only with the numbers. No retries are turned on.
4. **The checklist in `PLAN.md`** (collected through the phases): remove `/foundation`; compare the Ja'fari times (Leva, Tehran) with an independent source; replace the WMM coefficients before 2030 (not a cutover blocker: they are valid to 2030); the Open-Meteo non-commercial note (revisit only if the app gains ads or subscriptions); normalise the persons relationship data and fix the `nuhflood` story status (each a **content decision of yours**, then one reviewed commit to `legacy/app/data`, the one allowed edit there); `/poets` (section 2).
5. **`DEPLOY.md`, "Before the day":** refresh `legacy/dist/sw.js` from what production serves today and re-run `e2e/cutover.spec.ts`; `robots.txt` (the legacy serves allow-all; the build has none, so `/robots.txt` returns the shell) and the two legacy favicons; the SEO pass (a unique title and description per page, a default share image, `noindex` on personal pages, a sitemap file); a PWA audit and a performance pass (Lighthouse on Home, the reader and the listing, mobile profile; the budgets are agreed in 3.3).

### 3.3 Performance and PWA: what I will measure and what counts as passing

Using `scripts/measure/startup.mjs` and Lighthouse (mobile, throttled): the Home start set (814 KB of script at Phase 14), first contentful paint and load on the five routes measured in Phase 14, and the precache size. **Proposed gate: no route more than 10% slower than the legacy app on the same machine and settings, and Lighthouse PWA, accessibility and best-practices each at least 90.** The legacy app is built from commit 7120b6c on port 3016 for the comparison. Say if you want different numbers.

## 4. Rollback

### 4.1 All 30 legacy keys, covered before cutover

**Decided:** every one of the 30 legacy localStorage keys gets a test that runs the legacy reader against revamp-written data, before the domain moves. Today 9 are covered (by running 7 vendored composables: `audio-prefs`, `audio-resume`, `tasbeeh`, `downloads`, `hifz:v1`, `hifz:v2`, `hifz-session`, `reading-goals`, `reminders`). The other 21:

| Key | Who reads it in the legacy | How it is run |
| --- | --- | --- |
| `quran:bookmarks:v1`, `quran:bookmarks:added-at:v1` | `useBookmarks.js` | vendor the composable, loader as for Hifz |
| `quran:library:v1` | `useLibrary.ts` | vendor, loader |
| `quran:reading-progress:v1` | `useReadingProgress.ts` | vendor, loader (the goals loader already stubs it) |
| `quran:ramadan:v1` | `useRamadan.ts` | vendor, loader |
| `quran:persons-study:v1` | `usePersonStudy.ts`, `utils/personStudy.ts` | vendor (the util is vendored already), loader |
| `quran:search-history:v1` | `useSearchHistory.ts` | vendor, loader (the legacy parser breaks on anything but a list of strings: a test pins that) |
| `quran:fiqh-prefs:v1` | `useFiqhPrefs.ts` | vendor, loader |
| `quran:accessibility:v1` | `useAccessibilityPrefs.ts` | vendor, loader |
| `quran:additional-modules-enabled:v1` | `usePoetModules.ts` | vendor, loader |
| `reciter` | `useReciter.ts` | vendor, loader |
| `tafsirDefaultAuthor`, `translationDefaultLang` | `useTafsirPreference.ts`, `useTranslationPreference.ts` | vendor, loader |
| `ayah-of-day` | `useAyahOfTheDay.ts` | vendor, loader (the revamp adds `localDate`; the legacy compares the UTC `date`: a test pins both) |
| `prayerFiqh`, `prayerSettings`, `last_location`, `prayer_<lat>_<lon>_<fiqh>_<DD-MM-YYYY>` | the legacy prayer store (`stores/prayer.js`) and the Qibla page | the store is plain JS: vendor and run it with a stubbed `$storage` and `$api`; `last_location` is written by the revamp in the same shape; the `prayer_*` day keys are **never written** by the revamp, and the test asserts they are byte-identical after a full revamp session |
| `calendar_v2_<lat>_<lon>_<fiqh>_<m>_<y>` | inline in `calender.vue` | the revamp never reads or writes it; the test asserts untouched, and runs the page's own cache-key and read expression from its vendored script block |
| `themeMode`, `preferredVerseDisplay` | the Vuetify plugin (`plugins/vuetify.js`) and the reader page | extract and run the plugin's and the page's read code (the `<script>` block) with stubs; where a page cannot run in isolation, the test runs the exact read expression and says "expression-level" in its report |

**Plan (a test per key, then a real rehearsal):**

1. **A data fixture from the revamp itself.** A browser test (`e2e/rollbackData.spec.ts`) uses the revamp for a representative session (a bookmark, a note, a collection, progress, a goal, a reminder with a repeat, Hifz, Tasbeeh, fasting, a saved place, every Settings choice, a download manifest, a search) and writes all of `localStorage` to a fixture. IndexedDB is not in it: `quran-app-db` is never opened by the revamp (a test scans for that).
2. **Vendor the readers** in the table through `scripts/sync-legacy.mjs` (about 15 files), each with a `scripts/lib/legacy-*.mjs` loader in the same style.
3. **`tests/rollbackKeys.test.ts`: one test per key (30).** Feed the fixture to the legacy reader: it loads without throwing and returns the user-visible values the revamp showed. Then let the legacy code **write** (add a bookmark, toggle a goal, edit a reminder) and assert that the revamp-only fields (`repeat`, `quran:hifz-words:v1`, pins, the new keys) survive and the revamp reads the result. The report lists, per key, which legacy code ran; **no key is allowed to say "by reading code"**.
4. **A real-browser rehearsal on one origin** (4.3 uses the same rig): legacy (7120b6c) and revamp builds served alternately on one origin with a persistent profile: legacy → revamp → legacy → revamp; at each step bookmarks, goals, Hifz, reminders, Tasbeeh, saved place, settings and downloads are as left, and IndexedDB `quran-app-db` opens at version 1 in the legacy app.

### 4.2 Switching Vercel back to the legacy build in one step

DEPLOY.md already says it: the new project is separate; the **legacy project and its last production deployment stay untouched**; rollback is to **move the production domain back to the legacy project** (Settings, Domains), minutes, no redeploy. Two sharper forms so it is one action under stress:

- **The command:** `vercel alias set <legacy-production-deployment-url> <your-domain>` (one line; the legacy deployment URL written down beforehand), or the two clicks in the dashboard. I will write the exact line with your real names into `docs/DEPLOY.md` and **run it for real in the rehearsal (4.3) on a throwaway alias**, because I cannot see your account.
- **The window:** keep the legacy project and that deployment for at least four weeks (the Phase 0 decision); delete neither until you say.

### 4.3 The service-worker switch back: designed, rehearsed in a preview, and a blocker

**Why it matters.** Users who took the new worker keep the new app from its cache until their browser takes a different `/sw.js`. After a rollback the legacy project serves its own `/sw.js` at the same URL and scope. **This direction has never been tested** (`e2e/cutover.spec.ts` does legacy to new only). **Cutover is blocked until the rehearsal below passes.**

**Two designs, both built and both rehearsed; I recommend A as the normal path with B staged as the emergency path.**

- **A. The legacy worker replaces ours (nothing extra to ship).** The rollback is only the domain move. A browser checks `/sw.js` on a navigation or within 24 h, gets the legacy file (different bytes), installs it, and waits. Both workers use `registerType: "prompt"` and answer `SKIP_WAITING`, so our running app shows "A new version of Quran App is available. Reload"; accepting it activates the legacy worker and reloads into the legacy app. **Weakness:** it needs the user to tap. Until then they keep the new app, so a rollback is not immediate for everyone.
- **B. A clean-up worker, staged and not deployed.** A legacy deployment (the legacy build with one change: `/sw.js` is the clean-up file) is built ahead of time and sits as a non-production deployment, ready to alias. The clean-up worker: on install `skipWaiting()`; on activate, **delete the precache and the API cache but not the user's saved audio** (`quran-downloads-audio-cache` and `quran-audio-cache` stay), write a marker into Cache Storage, `unregister()` itself, then **reload every open window** so it fetches the legacy app fresh. **A loop breaker is part of the design:** if the marker already exists when a clean-up worker activates (the legacy app re-registers `/sw.js` on load and gets the clean-up file again), it does nothing except unregister itself, so there is no reload loop. A later deployment (a day or two on) restores the real legacy `sw.js`, which installs normally because no worker is left. **Weakness:** two deployments and a window with no precache (online-only legacy app) in between.

**The rehearsal (a preview, mirroring the real mechanism).**

1. **A rehearsal origin:** a Vercel alias on a preview (`rehearsal-<something>.vercel.app`) that I point first at a **revamp preview**, then at a **legacy preview** with `vercel alias set`, exactly as the real rollback would. A browser profile has the new worker and data on that origin.
2. **Automated (Playwright with the real service worker, against the alias):** (A) after the repoint, `registration.update()` finds a waiting legacy worker, the revamp shows the update toast, accepting it lands on the legacy app, **data intact** (the 30-key fixture), the app opens **offline** afterwards; (B) the same with the clean-up deployment: the clean-up worker clears the right caches, **keeps the saved audio**, reloads the page by itself, loads the legacy app, does not loop (count reloads), and after the real legacy `sw.js` is restored the legacy worker installs and the app works offline. Also with **no window open** during the switch (the next visit must still end on the legacy app) and with **two windows** open.
3. **By hand, on your phone (a numbered script from me):** repeat (A) and (B) on **Android Chrome and iPhone Safari**, installed to the Home Screen and as a tab, because service-worker update timing differs on Safari.
4. **Pass means:** every scenario ends on the legacy app, data intact, saved audio intact, offline working, no reload loop. A failure is fixed and the whole rehearsal rerun. The result is a dated report in `docs/`.
5. **The same rig** runs the one-origin data rehearsal of 4.1 step 4 and the exact `vercel alias set` rollback line.

## 5. The merge to `main`

**State:** `origin/main` is at 2d097f6 (the standalone layout), an **ancestor** of `chore/standalone-repo` (57 commits ahead, 0 behind). The pull request is a clean, conflict-free update. There is **no CI** in the repository (no `.github`), so a pull request runs no checks: the gate is the recorded `npm run verify` on the head being merged, which the PR description quotes with its date, Node version and counts.

**Merge method:** a **merge commit** (keeps each phase's history, like every phase merge so far); not a squash.

**What Vercel does on merge** (assuming the new project exists, as DEPLOY.md section 1 describes, with Production Branch `main`):

1. A push to `chore/standalone-repo` (already done for every phase) gives a **preview deployment** if the project exists; that is where the first smoke test runs, before the merge.
2. Merging to `main` starts a **production deployment** of the new project: `npm ci`, `npm run build` on Node 22, published at the project's own address (`<project>.vercel.app`). **It does not touch your real domain while the domain is still on the legacy project.** Users see no change.
3. Only moving the **domain** changes what users get: the last, reversible step.

So the order of the day is: preview smoke test → merge → production smoke test on the project address → move the domain → smoke test on the real domain → watch.

**If the Vercel project does not exist yet, or already has the domain, I need to know (section 6): the order above changes.**

### The smoke test (written in this phase as `scripts/smoke-prod.mjs`, run three times: preview, project address, real domain)

Against a base URL, in a real browser, no secrets:

1. `/sw.js` answers 200, JavaScript, **not** immutable; `/manifest.webmanifest` 200 with the legacy identity; `/` title and description; `/about` head tags; `/api/surahs` is JSON, not HTML; `/robots.txt` is the real file.
2. A deep link (`/settings`, `/surah/18`, `/persons/…`) renders the app, not a 404; an unknown address shows "Page not found" with `noindex`; `/juz/7` lands in the reader; `/poets` shows the stub.
3. The service worker registers and controls the page; after one visit, **offline reload of `/` works**; the install prompt criteria hold (the manifest and icons load).
4. The reader loads a real surah from the real service; the Play button asks for the real audio file (the request is made and answers 200 or 206; not played); Prayer times for a saved place load (one real request) and "Last updated" shows.
5. Seeded data survives: with a profile whose `localStorage` holds a legacy bookmark, goal, Hifz record and reminder (seeded in the test), the app shows them.
6. **Only on the real domain, with your own browser or phone** (the one that has the legacy app installed): the "new version available" toast appears, Reload works, and your bookmarks, goals, Hifz progress, settings and downloads are all there; you then open Settings and the Calendar once. I script the checklist; you run it.
7. Each run writes a dated report (URL, commit, Vercel deployment id, results) to `docs/`.

## 6. Decisions and facts I need

Decided already (2026-10-29): all 30 keys before cutover; the service-worker rehearsal as a blocker; the sorting (you can still move rows); `/poets` stubs; the branch-verify rule.

1. **Vercel facts** (I cannot see them): does the new project exist and has it built the current branch; the production domain; the name of the legacy project and its last production deployment URL; the values of `QURAN_API_BASE` and `QURAN_API_BASE2` there (or "unset"); whether the Vercel CLI is logged in on this machine (the rehearsal needs `vercel alias set`), and whether I may create a throwaway alias on your team.
2. **Which service-worker design to ship as the normal path** (4.3): my recommendation is A with B staged; the rehearsal may change it.
3. **Content decisions that edit `legacy/app/data`:** the persons relationship convention and the `nuhflood` status: decide now (they are in the "before" list as V2) or defer.
4. **`@axe-core/playwright` as a dev dependency**, and the performance and Lighthouse gate in 3.3.
5. **A canary period:** leave the domain on the legacy app for N days while you use the new project's own address daily, then move it; or move it as soon as the gates pass.
6. **Your time:** the 49 before-cutover checks, the screen-reader pass and the phone rehearsal need a few hours of yours; I will give a numbered script for each so it can be done in sittings.

## 7. Stages (stops for you)

1. The route test, the Poets stubs, `/foundation` removed, the real "Page not found" (small; first commit).
2. The investigations (3.2 items 1 to 3): the axe sweep and keyboard walk, `play.mjs`, the two flake runs. A short report with numbers. **Stop.**
3. The rollback work: the 30-key tests (4.1) and the service-worker rehearsal (4.3), with the clean-up worker. A report with the rehearsal results. **Stop. Cutover does not proceed unless the rehearsal passed.**
4. SEO, `robots.txt`, favicons, the performance and PWA gate (3.3), `legacy/dist/sw.js` refreshed from production, `DEPLOY.md` filled with your real names, `smoke-prod.mjs`.
5. **A full `npm run verify` on the phase branch itself, clean, recorded in the phase doc: this is what the acceptance rests on.** Then the preview smoke test and the PR to `main`. **Stop for your acceptance.**
6. After acceptance: merge, the **merged-head verify (extra, not instead)**, push; production smoke test on the project address; the 49 before-cutover checks; then, on your word, the domain move and the smoke test on the real domain.

Nothing in 1 to 5 changes what users get; only step 6's domain move does.

## 8. Risks

- **The worker switch both ways is the largest unproven thing.** The forward direction is rehearsed in `cutover.spec.ts`; the back direction is not. It is the reason for the rehearsal and the kill switch.
- **Real devices:** iPhone Safari and Android Chrome behave differently from the desktop browser for sheets, the keyboard, the audio element and the installed app; the blocking device rows exist for this.
- **Vendoring about 15 more legacy files** enlarges the snapshot (`legacy/`); each is added only with a test that runs it, and the legacy snapshot test already enforces "no file nothing uses".
- **The domain's service worker is shared by two apps for weeks.** Any change to the worker's file name, scope, cache names or the manifest identity breaks the hand-over (DEPLOY.md lists them: do not change them).
- **A bug found late costs more.** The first stage is small and safe on purpose; the investigations come before the rollback work so any fix lands early.
