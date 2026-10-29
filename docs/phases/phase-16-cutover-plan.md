# Phase 16: Cutover: plan

- Branch: `phase-16-cutover` (from the merged `chore/standalone-repo`)
- Date: 2026-10-29
- Status: **Plan, revised 2026-10-29 for the owner's deployment setup; stage 1 is built and waits for review.** Setup (owner, 2026-10-29): users use the **new Vercel project's own address**; the legacy app stays at its own address and **is not changed**; **no domain move**; **legacy data does not carry over** (a fresh start, no export or import). Earlier decisions that still hold: `/poets` as stubs; the 136 checks sorted (now re-sorted); a phase is accepted only after a **full verify on its own branch** (the merged-head verify is extra). Dropped by this setup: the service-worker switch-back rehearsal, the 21 extra legacy-key tests, the domain move, and everything about a hand-over from the legacy worker.
- Read for this: `docs/DEPLOY.md`, `docs/PLAN.md` (Phase 16 and the cutover checklist), `docs/LEGACY_INVENTORY.md` (the storage keys), `docs/DEVICE_CHECKS.md`, `docs/CONTENT_TO_VERIFY.md`, the phase docs' flake records (10, 13, 14, 15), and the legacy repo's `app/pages`, `server/` and Poets files (read only).
- What I cannot see: the Vercel account (the new project, its address, the environment variables), and any real device. Where the plan needs a fact from there it says so and lists it under "Decisions and facts I need".

## 1. Summary

- **Cutover is a merge:** `chore/standalone-repo` → `main` on the new project, whose Production Branch is `main`. The production deployment is the address users use. **Rollback is Vercel Instant Rollback on the new project.** Nothing is done to the legacy site or its project.
- **Fresh start.** Nothing from the legacy app is carried over (a different address is a different browser origin, and the legacy app has few users). No export or import is built. **About says so briefly** (stage 1).
- **Every legacy route still has a page in the revamp except `/poets` and `/poets/[slug]`**, which become **stub pages** (stage 1, built). The routes list stays: an old link to a legacy path on the new address must not land on "not rebuilt yet" (section 2).
- **The checks are re-sorted for this setup** (3.1 and `phase-16-checks.md`): **135 rows: 48 before cutover, 56 in the first week, 31 whenever.** Two rows about legacy data are dropped and one is added: that an Instant Rollback reaches an installed phone within a visit or two (4.1).
- **Rollback is within the new project:** the 9 legacy keys already tested stay tested; **the other 21 are not added** (4.2). Instant Rollback means the previous deployment of the same app, so the storage and the service worker are the same app's.
- **Process:** the phase is accepted only after a full verify on its own branch; the merged-head verify is extra.

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

### 3.1 Device and manual checks (`DEVICE_CHECKS.md`): 135 rows after the setup change, sorted

133 table rows plus Daily Fiqh F1 to F3 (K1 is waived), **minus 14-H7 and 15-G6** (they test opening legacy Hifz and goals data, which no longer carries over), **plus 16-RB** (the Instant Rollback check). Ids that repeat across phases get a phase prefix in the sorted list (`5-H1`, `14-H1`, `15-G1`, `11-D1`, `9-D1`). The full table is `docs/phases/phase-16-checks.md`.

| Group | Count | What goes here |
| --- | --- | --- |
| **Before cutover** | **48** | Anything whose failure is **data loss, a dead end, a wrong prayer time or Hijri date, or breaks how an installed app updates**: install, update and offline (S1 to S3, where S2 now means "a new deploy reaches an installed app"); location (P1, P2, 5-G1, 5-G2); notifications (N1 to N4); the core of the player on a phone (A1 to A4, A6 to A8, A11, A14, A17 to A19; A1 to A3 reported tested by the owner on Safari); the compass (C1 to C4); the Hijri date and the Sunni and Ja'fari times against a trusted source (5-H1, 5-H4, 5-H5); your notes (B1); Downloads storage and offline play; Hifz on a phone and offline; Phase 15 on a phone and offline; Daily Fiqh offline (F1, F2); your reading of the wording and the data decisions (V1, V2); the **screen-reader pass (V7, P6, R6)**; and **16-RB, the Instant Rollback check**. |
| **First week** | **56** | Things to notice while really using the installed app for a week. |
| **Whenever** | **31** | Polish and low-risk. |

The three rules for sorting are unchanged (proven by an automated run and low-risk: never "before"; users rely on it and no automated run can show it: "before"; needs days of use: "first week"). You can move any row.

### 3.2 Not rows, but open (each becomes work in this phase)

1. **Screen-reader and keyboard pass.** Each phase ran its own keyboard checks in a browser test (Hifz, Goals, Calendar and others), but there has been **no screen-reader pass on any page** and no single keyboard walk across the app. Plan: (a) an automated sweep over every route in light and dark at 375 and 1280 px with `@axe-core/playwright` (a new **dev** dependency, needs your OK), failing on serious or critical findings, each fixed or recorded with a reason; (b) a scripted keyboard walk per page (tab order reaches every control, a visible focus ring, no trap, Escape closes every sheet); (c) **you** run VoiceOver (iPhone) and TalkBack (Android) on Home, Settings, the listing, the reader, the player, Per page, Goals and the Calendar (V7); I write the script of what to listen for.
2. **Play-to-audio start time, before and after Phase 14.** Phase 14's merge was followed by test failures in the audio specs (`queue.spec.ts` in Phase 14, `player.spec.ts` twice after the Phase 14 follow-ups) that read the audio recorder once, right after a click, and found nothing yet. Each was fixed by waiting for the result, but **the cause of the changed timing is unproven**; the only candidate I have is the Hifz chunks prefetched in idle time (13 KB on every route, 15 KB on Home), which I measured as a size, not as a delay to Play. Plan: a dev-only script (`scripts/measure/play.mjs`, like `startup.mjs`) with the recorded audio element, measuring from the click to the element being asked for its file, on the listing row, the reader's ayah button, the page queue and the mini player; normal speed and 4x CPU slowdown; 15 runs each; on **3603e43 (before Phase 14), 2d5e8ed (Phase 14 merged), d32183e (follow-ups) and the head**; medians and the spread, and the same measurement with Hifz's prefetch turned off to test the one hypothesis. If the Play delay moved by more than the spread, the cause is found and fixed (or the prefetch policy changed, which you decided to keep: it would come back to you); if it did not, the flakes are the tests' and are recorded as such. A **real-device** version (a phone, a real file, a stopwatch or the Network panel) is added as a blocking row for the player.
3. **The two unexplained flake families.**
   - `perpage.spec.ts:345` and `:376` (Phase 10, one run): the first got the offline wording instead of the failed-request wording; the second ("Next quietly has the next page's surah ready") also failed. They passed 3 of 3 on re-run and in the Phase 11 verify. No cause was found.
   - `knowledgeModules.spec.ts:239` (Phase 13, one run): `k-name` not visible within 5 s after clicking a Connected link. It passed 10 of 10 alone, the spec was not changed, and no cause was found.
   Plan for both: run each 50 times under a controlled CPU load (a stress process pinned at 70 to 90%) and 50 times idle, on the current head and on the commit where it first failed; read the failures' traces; fix the test (a retrying assertion, a wait for the real condition) or the code if the traces show a race in the page; or record them as load-only with the numbers. No retries are turned on.
4. **The checklist in `PLAN.md`** (collected through the phases), as it stands for this setup: `/foundation` removed and `/poets` stubs (stage 1); compare the Ja'fari times (Leva, Tehran) with an independent source (row 5-H4); replace the WMM coefficients before 2030 (not a cutover blocker); the Open-Meteo non-commercial note (revisit only if the app gains ads or subscriptions); the persons relationship data and the `nuhflood` story status (content decisions of yours, V2). The items about domains and the legacy service worker no longer apply.
5. **`DEPLOY.md` rewritten for this setup:** no domain move, no legacy rollback; Instant Rollback and the release rule (section 4); `robots.txt` (the build has none, so `/robots.txt` returns the app shell) and favicons; the SEO pass (a unique title and description per page, a default share image, `noindex` on personal pages, a sitemap file); a PWA audit and a performance pass (Lighthouse on Home, the reader and the listing, mobile profile; budgets in 3.3).

### 3.3 Performance and PWA: what I will measure and what counts as passing

Using `scripts/measure/startup.mjs` and Lighthouse (mobile, throttled): the Home start set (814 KB of script at Phase 14), first contentful paint and load on the five routes measured in Phase 14, and the precache size. **Proposed gate:** no route more than 10% slower than the Phase 14 numbers recorded in `phase-14-followups.md` (the legacy comparison is no longer needed: nothing switches between the two apps), and Lighthouse PWA, accessibility and best-practices each at least 90. Say if you want different numbers.

## 4. Rollback, inside the new project

### 4.1 Vercel Instant Rollback, and the one check that it reaches an installed phone

**The mechanism.** Instant Rollback re-points the project's production address at a **previous production deployment of the same project**: no rebuild, seconds. Users are already on the new address, so a rollback is the new app's previous version, not a different app. **What a user keeps is the same origin's storage** (localStorage, IndexedDB `quran-revamp-db`, Cache Storage), so no data question arises. The rule that keeps it safe is the one already followed: a release does not change a stored format in a way the previous release cannot read (additive keys and additive fields only, versioned migrations; `quran-revamp-db` only moves forward by one version at a time, and **a release that bumps its version must be rolled back with care: the older code would fail to open a newer database**; I will list this in `DEPLOY.md` and check that no release between now and cutover bumps it).

**What can go wrong on a phone.** An installed app runs from the service worker's precache. After a rollback the server serves the previous version's `/sw.js` (different bytes), and the browser must notice, install it, and the app must switch. Two worker facts decide how fast:

- **The check.** The code makes **no explicit update call** (no `registration.update()` on load or on visibility; the build uses the default `registerType: "prompt"`). Browsers check `/sw.js` themselves on navigation, but the standard limits that check to once in 24 hours unless something calls `update()`; Chrome and Safari differ in practice. **I cannot confirm "our SW checks on every load" from the code**, so the check below measures it. If it is not true, the fix is small and I would build it in stage 4: call `registration.update()` on load and when the page becomes visible.
- **The switch.** With `registerType: "prompt"` a new worker waits until the user taps "A new version of Quran App is available. Reload". After a rollback the toast is the same toast. So "reaches an installed phone within a visit or two" means: the worker is found, the toast appears, and one tap puts the phone on the rolled-back version. If you would rather a rollback applied by itself, say so (`skipWaiting` on install, a reload on activation): it also means every normal update applies unasked mid-reading, so I recommend keeping the prompt.

**The check (row 16-RB, before cutover, once, on the new project):** (1) install the app on your phone from the new project's address; (2) deploy a harmless visible change (the About page's last line) and confirm the phone gets the toast and the change; (3) Instant Rollback to the previous deployment; (4) on the phone, open the app once, then again if needed, and note **how many visits until the toast and until the rolled-back page**; (5) pass means **within two visits, one tap**; the number is written in `DEPLOY.md`. Android Chrome and iPhone Safari (installed and as a tab) separately. I script the steps; you run them on your phone.

### 4.2 The legacy-key tests: kept, not extended

The tests already written stay as they are: the vendored legacy composables that run in memory against the revamp's data (`useAudioPlayer`, `useTasbeeh`, `useDownloads`, `useHifz` and `useHifzSession`, `useReadingGoals`, `useReminders`, covering 9 of the 30 legacy keys). **The other 21 are not added**: they protected a rollback to the legacy app, which no longer exists. The inventory of the legacy keys stays in `LEGACY_INVENTORY.md` as history. The additive-keys rule (`CLAUDE.md`, hard rule 4) is unchanged because Instant Rollback still needs the previous release to read what the current one wrote.

### 4.3 Not done (the setup makes them unnecessary)

The service-worker switch-back rehearsal (a legacy worker replacing ours; a clean-up worker), the throwaway-alias rehearsal, the legacy worker file in `legacy/dist` as a cutover fixture, the one-origin legacy-to-revamp data rehearsal, and any change to the legacy site or its project. `e2e/cutover.spec.ts` (legacy worker to ours on one origin) tests a hand-over that will not happen; I propose retiring it in stage 4 (with your OK), since a test for a scenario that cannot occur only costs verify time.

## 5. Cutover: the merge to `main`

**State:** `origin/main` is at 2d097f6, an **ancestor** of `chore/standalone-repo` (0 commits ahead, many behind). The pull request is a clean update with no conflicts. There is **no CI** in the repository (no `.github`), so a pull request runs no checks: the gate is the recorded full `npm run verify` **on the phase branch** (the acceptance), quoted in the PR with its date, Node version and counts, and the merged-head verify as extra.

**Merge method:** a merge commit (keeps each phase's history).

**What Vercel does on merge** (new project, Production Branch `main`): a production deployment of `main` (`npm ci`, `npm run build`, Node 22), published at the project's **production address, the one users use**. **Merging is the cutover.** There is no domain step and nothing to do on the legacy project. Before the merge, every push to `chore/standalone-repo` already gets a **preview** deployment from the same project: **the preview is where every smoke test runs first.**

**Order of the day:** full verify on the phase branch (accepted) → preview smoke test → check 16-RB can be done on a preview-then-production pair → merge → production smoke test → tell users the address.

### The smoke test (written in this phase as `scripts/smoke-prod.mjs`, run on the preview and again on production)

Against a base URL, in a real browser, no secrets:

1. `/sw.js` answers 200, JavaScript, **not** immutable; `/manifest.webmanifest` 200; `/` title and description; `/about` head tags; `/api/surahs` is JSON, not HTML; `/robots.txt` is the real file.
2. A deep link (`/settings`, `/surah/18`, `/persons/…`) renders the app, not a 404; an unknown address shows "Page not found" with `noindex`; `/juz/7` lands in the reader; `/poets` shows the stub.
3. The service worker registers and controls the page; after one visit, **offline reload of `/` works**; the manifest and icons load.
4. The reader loads a real surah from the real service; the Play button asks for the real audio file (the request is made and answers 200 or 206; not played); Prayer times for a saved place load (one real request) and "Last updated" shows.
5. A **first run on a clean profile** shows the empty states (Home, Library, Goals, Hifz), with no error.
6. Each run writes a dated report (URL, commit, Vercel deployment id, results) to `docs/`.

## 6. Decisions and facts I need

Decided: the setup above (new project's own address, no domain move, fresh start, Instant Rollback, no legacy-site changes); `/poets` stubs; the sorting (re-sorted); the branch-verify rule.

1. **Vercel facts:** does the new project exist and has it built `chore/standalone-repo`; its address; its production branch setting; the values of `QURAN_API_BASE` and `QURAN_API_BASE2` (or "unset": the code defaults are the same upstreams); whether Instant Rollback is available on your plan (it needs a previous production deployment, so it only exists after the second production deploy).
2. **A release rule for rollback:** no release bumps the `quran-revamp-db` version or changes a stored format incompatibly without telling you first (proposed; the Phase 16 work does not).
3. **If the 16-RB check shows slow pick-up:** whether to add the `registration.update()` on load and on visibility (my recommendation), and whether a rollback should apply by itself or keep the prompt (4.1; I recommend the prompt).
4. **Retire `e2e/cutover.spec.ts`** (legacy worker to ours on one origin) in stage 4?
5. **`@axe-core/playwright` as a dev dependency**, and the performance and Lighthouse gate in 3.3 (without the legacy comparison now: see 3.3).
6. **Content decisions that edit `legacy/app/data`:** the persons relationship convention and the `nuhflood` status: V2 in the "before" list. Decide now or defer.
7. **Your time:** the 48 before-cutover checks (including the screen-reader pass and 16-RB) need a few hours of yours; I give a numbered script for each.

## 7. Stages (stops for you)

1. **Stage 1 (built, waiting for your review):** the route test and the Poets stubs (`/poets`, every `/poets/[slug]`), `/foundation` removed, a real "Page not found" in place of "This page is not rebuilt yet", and a short fresh-start note on About. See `phase-16-cutover.md` (stage 1 record) for what changed. **Stop.**
2. The investigations (3.2 items 1 to 3): the axe sweep and keyboard walk, `play.mjs`, the two flake runs. A short report with numbers. **Stop.**
3. SEO, `robots.txt`, favicons, the performance and PWA gate (3.3), `DEPLOY.md` rewritten for this setup (no domain move; Instant Rollback; the release rule), possibly the update-check fix (4.1), `smoke-prod.mjs`, `cutover.spec.ts` retired if you agree. **Stop.**
4. **A full `npm run verify` on the phase branch, clean, recorded in the phase doc: this is what the acceptance rests on.** Preview smoke test. **Stop for your acceptance.**
5. After acceptance: merge to `main` (the cutover), the **merged-head verify (extra)**, production smoke test, check 16-RB, the 48 before-cutover checks. Then tell users the address.

Nothing in 1 to 4 changes what users get; step 5's merge does.

## 8. Risks

- **Instant Rollback and the service worker:** an installed phone may not notice a rollback quickly, because nothing calls `registration.update()` and the toast needs a tap. That is what 16-RB measures, and 4.1 has the small fix.
- **A newer IndexedDB version cannot be opened by older code.** A rollback after a release that bumped `quran-revamp-db` would break the old version on any phone that already upgraded. The release rule in section 6 covers it.
- **Fresh start means every user starts empty:** no bookmarks, goals or Hifz carry over. About says so; nothing is lost from the legacy app, which keeps its own address and its own data.
- **Real devices:** iPhone Safari and Android Chrome behave differently from the desktop browser for sheets, the keyboard, the audio element and the installed app; the blocking device rows exist for this.
- **Two sets of old links:** a legacy path on the new address works (section 2); an old bookmark on the legacy address keeps working there, untouched.
- **A bug found late costs more.** Stage 1 is small and safe on purpose; the investigations come before the final verify so any fix lands early.
