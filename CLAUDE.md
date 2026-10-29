# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this repo is

A rebuild of the Quran companion app's UI as a **Nuxt 4 single-page app with shadcn-vue + Tailwind CSS v4**, replacing Vuetify. It began as the `revamp-quran/` folder of the legacy app's repo and is now its own repository: this folder is the repo root. It reuses the legacy app's data, services and logic through a vendored snapshot. At the end it replaces the legacy app.

The legacy app lives in its own repo and keeps running until cutover. This repo holds only:

- `legacy/`: a **read-only snapshot** of the legacy files this project imports or reads (data, pure utils, two composables run by the parity tests, the legacy service worker for the cutover test). It is refreshed only by `scripts/sync-legacy.mjs`. Never edit it, except for a cutover data fix (`legacy/README.md` has the rules).
- `docs/legacy-reference/`: read-only copies of the legacy specs our docs refer to (index in `docs/legacy-reference/README.md`).

Nothing here may reach outside this repository: no `../..` paths, no sibling checkouts. `tests/independence.test.ts` fails if something does.

## Read first, in this order

1. `docs/legacy-reference/LEGACY_CLAUDE.md` and `docs/legacy-reference/LEGACY_README.md` (legacy app: stack, architecture, SSR/hydration hazards, known gaps; its folder layout is not ours)
2. `docs/PLAN.md` (stack, rendering, offline model, phases)
3. `docs/design/DESIGN_SYSTEM.md` (tokens, components, patterns, content rules)
4. `docs/design/PROTOTYPE_MAP.md` (where each page lives inside `docs/design/prototype.html`)
5. `docs/CONTENT_TO_VERIFY.md` (placeholders in the prototype that must never ship)
6. `docs/PROGRESS.md` (what is done, what is next)

For feature behaviour, the legacy docs still win: `docs/legacy-reference/MODULE_BLUEPRINT.md`, `PROJECT_PLAN.md`, `prophets-quran-feature.md`, the `wajibat*` docs (`wajibat_decisions.md` wins over the spec), and the other specs listed in `LEGACY_CLAUDE.md`. For how the revamp is built and looks, this file and `docs/PLAN.md` win.

## Hard rules

1. **Stay inside this repository, and never edit `legacy/` or `docs/legacy-reference/` by hand.** Nothing is read from or written to a sibling checkout. New legacy files come in only through `scripts/sync-legacy.mjs` (dev-only; the build never calls it) after the code that needs them exists; the file list is `scripts/lib/legacy-files.mjs`.
2. **No Vuetify and no `@mdi/font`.** UI comes from shadcn-vue components and Tailwind tokens. Icons are Lucide through `@nuxt/icon`, bundled locally. Never load fonts or icons from a CDN, because they must work offline.
3. **Reuse the legacy app, do not fork its data.**
   - Pure code (JSON data, `app/utils`) is imported through the `@legacy` alias, which points at the vendored snapshot (`@legacy/utils/x` is `legacy/app/utils/x`). It is never copied into `app/`, so there is one copy.
   - Code that depends on Nuxt plugins or auto-imports (composables, `$storage`, `$api`) is copied and adapted into `app/`. The two legacy composables that the parity tests run (`useAudioPlayer`, `useTasbeeh`) sit in the snapshot unmodified; `scripts/lib/legacy-*.mjs` load them in memory.
   - Phase 0 chose the mechanism (`docs/phases/phase-00-foundation.md`, as built then); `legacy/README.md` is how it works now.
4. **Keep storage keys and formats identical** to the legacy app (for example `quran:ramadan:v1`). Users must keep their bookmarks, goals, Hifz progress and settings at cutover. Migrations are additive and versioned. Inventory every key in Phase 0.
5. **Content integrity.**
   - Qur'an text, translations, tafsir, audio and prayer data come only from the existing services and data files.
   - Every Arabic string, translation, dua, date, name list and religious statement in `prototype.html` is a placeholder or was typed from memory. Never copy them into product code. See `docs/CONTENT_TO_VERIFY.md`.
   - New religious content needs a named source and a visible status label (Qur'an, Traditional, Scholarly, Source note).
   - Never present a ruling as app-generated advice. Where traditions differ, show them side by side and add: follow your own marja' or local scholar.
6. **Fiqh is a user setting**, not a build-time identity (legacy key: `prayerFiqh`, stored as a raw string, not JSON; values `sunni` and `jafari`. The prototype's internal value `shia` is prototype-only and never goes to storage). Prayer calculation, the events dataset and fiqh-sensitive content filter by that setting. Pages that explain both traditions must show both.
7. **Design rules (non-negotiable)**
   - Scripture is never boxed in a card. Ayahs sit on the page with hairline dividers.
   - Gold appears only on verse-end markers (and Hifz mastery later). Everything interactive uses the accent.
   - Borders instead of shadows. Shadows only for floating layers (menus, sheets).
   - Light theme by default; System and Dark are options. Dark is fully designed, not an inversion.
   - Arabic text is never letter-spaced and never truncated, and it scales with the user's Arabic size setting.
   - Touch targets are at least 44px on mobile. Desktop menus are popovers; mobile menus are bottom sheets.
   - No streaks, badges, points or guilt reminders anywhere.
   - No depictions of any person (prophets, companions, angels, family). Use calligraphy, places, objects and geometry only.
   - Removing something offers Undo instead of a blocking confirm, except for wiping all data.
8. **Rendering and offline** (details in `docs/PLAN.md`)
   - SPA by default; at most a few public pages are prerendered (Home, About, Surah listing), **as the SPA shell with their own head tags only** (title, description, Open Graph, from `app/lib/publicMeta.ts`). Their bodies are not prerendered: with JavaScript off a page shows no text.
   - Offline pages work from one precached app shell. Every page declares its offline level (A, B or C) in its page doc.
   - Level C (online-only) features must show a clear offline state, never a blank page or a spinner forever.
   - Never call `localStorage` directly. Use the storage wrapper. Never fetch third-party APIs from components; go through services.
9. **IndexedDB: one new database, never touch the legacy one.** All new IndexedDB data lives in a separate database, `quran-revamp-db` (its own versioning). Never open `quran-app-db` with a different version, never add or remove object stores in it, and never change its schema, so that rolling back to the legacy app stays safe (a version bump would make the legacy app fail to open its own database). The revamp may read `quran-app-db` only as the same version 1, read-only, if it ever needs the legacy cached chapters or tafsir. The same applies to `localStorage`: do not write to legacy keys that the legacy app interprets differently (for example the day-keyed `prayer_*` keys).
10. **Prayer times** use the monthly AlAdhan cache with an "Update now" action; fetch first, swap only on success; show "Last updated".

## Workflow for every phase

1. **Plan first, no code.** Read the previous phase doc and the relevant prototype section. Propose the plan, list risks and open questions, then wait for approval.
2. **Build** in small commits (`revamp(<scope>): <what>`).
3. **Verify** (all of it):
   - `npm run build` and `npx eslint .` clean; `npm test` for pure logic.
   - Browser walk-through at 1280px and 375px, light and dark, including empty and first-run states.
   - For level A/B pages: build, `npm run preview`, then test offline (Playwright `context.setOffline(true)` or DevTools).
   - Compare against the prototype section side by side. Note every intentional difference.
   - Keyboard-only pass: focus order, visible focus, labels, contrast.
   - No console errors, no hydration warnings.
4. **Write the two docs** from `docs/templates/`: `docs/phases/phase-NN-<name>.md` and one `docs/pages/<page>.md` per page. Update `docs/PROGRESS.md`.
5. **Stop.** Do not begin the next phase. Report what changed, what is unverified, and the open questions.

## Gotchas found while building

- `npx shadcn-vue add <component>` rewrites `app/assets/css/tailwind.css`: it re-adds a Google Fonts `@import` (breaks the offline rule) and a duplicate `@layer base`. Remove both after adding a component; `tests/tokens.test.ts` fails if either comes back.
- shadcn-vue's `ToggleGroup` renders `aria-pressed` buttons, not radios. For a "choose one" control use `SettingsSegmentedControl` (a real radio group).
- Browser tests must start with `forbidRealApis(context)` (`e2e/mocks.ts`): any unmocked request to AlAdhan or the verse API fails the test, so a test can never depend on the internet by accident. For notifications, replace `Notification` with a recording stub (see `e2e/settings.spec.ts`) and use `context.clock.install` plus `page.clock.runFor` to fire reminders.
- Anything that reacts to the saved place or the prayer settings must react to **changes**, not to the first read (`plugins/prayer-watch.client.ts`), or unrelated pages start making requests.
- Long lists (the 114 surah rows) use plain elements and one delegated click handler (`data-act`, `data-n`), not a component per row: per-row components made the Surah tab's longest task 591 ms at 4x CPU (Phase 3, `docs/phases/phase-03-surah-listing.md`). Measure with the throttled test in `e2e/listing.spec.ts` before adding per-row components.
- Audio in browser tests: `stubAudio` in `e2e/listing.spec.ts` replaces `window.Audio` with a recorder (`window.__audio`); the store creates its element lazily, so the stub works. No test plays real audio.
- Reader links come from `app/lib/readerLinks.ts`; flip `READERS_READY` when a reader phase ships.
- Browser tests of the reader mock `quranapi.pages.dev` with `mockQuranText` (`e2e/mocks.ts`): synthetic chapters (right counts, obviously fake text). Mocked routes **answer even when `context.setOffline(true)`**, so to test "offline" also set `api.mode = "network"`; and route interception disables the browser cache, so an offline test must navigate **in the app** (a full page load drops the already-loaded route code).
- Reading time in the page uses `performance.now()`, not `Date`: tests fix `Date` with `context.clock.setFixedTime`. On Windows the clipboard turns `
` into `
`; normalise before comparing.
- The reader's new keys are additive and the legacy app ignores them: `quran:reader-prefs:v1`, `quran:pins:v1`, `quran:read-surahs:v1`. `quran-revamp-db` is at version 2 (`chapters`, `tafsirs`); never open `quran-app-db` (a test scans for it).
- `scripts/live/*.live.ts` check the real services by hand (`npx vitest run --config scripts/live/vitest.config.ts`); they are not in CI.
- **Compass tests** use `stubSensors` and `window.__orient(type, props)` (`e2e/mocks.ts`); the heading is smoothed once per animation frame, so send events per frame and wait for the dial to settle. Desktop Chrome defines `DeviceOrientationEvent.requestPermission` (answering at once), so the iPhone tap flow is chosen by user agent (`useCompass.needsTapToRead`); the iPhone tests set an iPhone `userAgent`. Time in the compass uses `performance.now()`, not `Date`.
- **Place search:** AlAdhan's city endpoints return placeholder coordinates, so a typed city goes to Open-Meteo's geocoding API (`lib/geocode.ts`, only the typed text, only on Search, attribution shown). Mock it with `mockGeocode` and the recorded fixtures.
- **Declination:** `lib/declination.ts` is NOAA's WMM2025 on `app/data/wmm2025.generated.ts` (from `scripts/gen-wmm.mjs`), tested against NOAA's published values; it is valid to 2030.
- Nuxt does not auto-import from `app/services/`. Import `useQuranApi` and friends explicitly (`tests/services.test.ts` covers every service).
- Legacy files import their data with `~/...`; `build/legacyBridge.ts` redirects those imports to `legacy/app`. A legacy file that does a *dynamic* `~/` import (for example `quranAyahCounts.js`) is not rewritten under Vitest; do not call such functions from tests or from revamp code.
- **Search.** `normalize` (`lib/listingSearch.ts`) is the one normaliser and must stay a whole-string version: it runs over every surah on each keystroke, and a character-by-character version made the listing test time out. `searchFold.ts` has the mapped twin for highlighting only; `tests/searchFold.test.ts` keeps them identical. The ayah search keeps `quran:search-history:v1` as a list of strings (the legacy parser breaks on anything else). The upstream answers 404 for "nothing found", and Chromium logs that as a console error that a page cannot silence, so browser tests that watch the console avoid zero-result ayah queries (`e2e/search.spec.ts`). Mock it with `mockSearch` (real recorded answers).
- **Downloads.** Saved audio lives in Cache Storage `quran-downloads-audio-cache` under the app's own audio URL and plays through the service worker's first rule, asked for with `?offline` (`lib/savedAudio.ts`, `nuxt.config.ts`); a download is fetched with `cache: "no-store"`, which the streaming-audio rule skips, and from the **final** host (`raw.` or, for the four Git LFS files, `media.githubusercontent.com`), never from the redirecting `github.com` URL (its redirect sends an empty CORS header). A saved file must be audio, exactly the measured size (`app/data/audioSizes.generated.ts`, `scripts/gen-audio-sizes.mjs`) and MP3 bytes, or it is discarded. The Saved list is read from the device, not from `quran:downloads:v1` (which keeps the legacy shape; `tests/downloadsParity.test.ts` runs the vendored legacy composable). Downloads call `loadChapter` with `textDeps`, not `useQuranText()` (its per-visit memo would claim text is stored after a Remove). `e2e/downloads.spec.ts` runs most tests with the worker blocked and one describe with it allowed, and fails if a download touches `github.com`. In browser tests `stubAudio`'s `end()` waits until the file is playing (it used to race Play and made the queue tests flaky under load). The audio element must never get `crossOrigin`: the redirect's empty CORS header makes it fail.
- Tests never use the real upstream APIs: mock them (`e2e/mocks.ts`) and fix the clock. Errors that a `catch` swallows (like the ayah of the day's) are logged with `console.debug`.
- **Knowledge modules (Phase 12).** One list and one detail page serve seven modules; each module is an adapter in `lib/knowledge/<module>.ts` over the legacy dataset and its legacy `*Search.ts`. A module is linked only if `KNOWLEDGE_READY` says its pages exist (all seven do). The data's `statusNotes` are never shown (working notes); the basis label is the only claim a page makes. A dua's Arabic comes from the reader's text, its transliteration from `TransliterationService` (live, online only, nothing stored); mock it with `mockTransliteration` (`2:127` is a real recorded answer). Search's Duas and Knowledge base groups are registered by `loadKnowledgeGroups()` after the page opens; a group's `data-testid` is `group-<id>`, and the sidebar also has a `group-knowledge` button, so tests scope to `search-page`. A provider that wraps the previous lookup must capture it once (`const previous = …`), never read it inside the new function (the Library's `entry` lookup recursed without end that way). Real-text screenshots: `node scripts/screenshots/phase-12-knowledge.mjs real` (needs the internet).
- **Daily Fiqh (Phase 13).** What a reader sees of a ruling is decided in one pure place, `app/lib/fiqh/visibility.ts` (tested over every ruling, marja' and language): the marja's own text or a pointer or "Not added yet", never another marja's text, no Urdu in place of a withheld English, "Both" with each language's own source. `holds.ts` is derived from the vendored decision fixture and pinned by a test. A ruling's `note` goes through `readerNote` (it strips the legacy author's working references). The data is loaded only through `lib/fiqh/data.ts`; never import `@legacy/data/wajibat/index` from app code (it is every chunk in one). In `nuxt.config.ts`: the data chunks are named `wajibat-data-*` and kept out of the precache, `topics`/`categories`/`marja`/`types`/`access` are a precached chunk named `fiqh-shared` (**do not name a manual chunk `wajibat-…`: the bundler merged it into the core data chunk**), and Vite's preload helper has its own chunk (left alone it landed in the core data chunk, which put that chunk into the entry's imports and a tab opened offline showed nothing). A Daily Fiqh page catches its own chunk-load failure (`.catch(() => FiqhUnavailable)`): Vue reports a loader failure to Nuxt even with an `errorComponent`, and Nuxt then shows a 500 page. No Arabic-script text in `app/`: `lib/fiqh/ui.ts` builds the few Urdu and Arabic labels from code points. `e2e/fiqh.spec.ts` has the offline tests with the real service worker.
- **Daily Fiqh 13b (steps, recitations, live panel, helpers).** A step or a helper answer that quotes a ruling goes through `lib/fiqh/quoteView.ts` (which reuses `viewOf`), never straight to the text: held, English-withheld and on-hold rulings show the pointer in a step and in an answer too (`FiqhPointer`). The four helpers are **on in production** (owner decision 2026-10-28: no scholar sign-off needed; the sign-off gate, the dev flag and the build guard are removed); every result keeps "Not scholar-reviewed" and every question keeps "I'm not sure". Their walks run on the production build in `e2e/fiqhHelpers.spec.ts` (`npm run test:helpers` runs just that file). The live panel reads `usePrayerTimes().today` and makes no request: a test that expects times opens `/prayerTime` first and then navigates in the app.
- **Search URL writes (Phase 10 code, fixed in Phase 13).** The URL write the page makes for typed text can still be landing when the reader changes something else; it is remembered as an "echo" and not read back as Back or Forward (`useSearchPage.ts`). Without that a chip chosen within about a second of typing flicked back to All.
- **`tests/legacySnapshot.test.ts` "holds no file that nothing uses" has its own 30 s timeout.** It is a pure file scan (13b: 496 files and 2.52 MB under `app`, `build`, `e2e`, `scripts`, `tests` and the configs, against 486 and 2.47 MB before 13b; 82 vendored app files against 81), then one regex pass per vendored file over the joined text. Measured on a quiet machine: 0.24 to 0.36 s alone (three runs) and 0.385 s inside the full unit run (49 files, 20 s). Nothing in it waits or races, and 13b made it only about 2% bigger. In the failed verify of a0e7d95 (2026-10-27) it hit the global 5 s limit while the machine was busy (CPU 100% at launch) and all 49 files ran at once, so the limit is per test, with a comment; the global timeout is unchanged. If it ever needs more than a few seconds on a quiet machine, make the scan faster (read fewer files) instead of raising the limit again.
- **Hifz (Phase 14).** `lib/hifz/engine.ts` is the legacy `useHifz.ts` as pure functions; `tests/hifzParity.test.ts` runs the vendored legacy composables (`scripts/lib/legacy-hifz.mjs`) on random histories and must stay green: **do not change a grading, strength or budget rule without changing the legacy-parity expectation on purpose** (two deliberate breaks of the engine were checked to fail it). `quran:hifz:v2` and `quran:hifz-session:v1` are written in the legacy shape and keep unknown fields; `quran:hifz:v1` is never written. New additive keys: `quran:hifz-words:v1` (the words slipped on) and `quran:hifz-timing:v1`. **Free practice records nothing** (memory only; a test compares all of localStorage before and after). A word is found by its letters, not by a list of marks (`lib/hifz/words.ts`), and compared after NFC (the reader's text is not stored normalised). The default `mockQuranText` text has no Arabic letters, so Hifz tests use `mockHifzText` (register it after `mockQuranText`: the latest route wins). A single ayah that has played to its end is reported by the player as `paused` at position 0, which is how `useAyahPlays` counts a play. The ayah list on the surah page is plain elements with one click handler (a surah can have 286 rows). A new ayah is graded when its Recite stage ends (`applyGrade`, the item keeps its `result` while its joins are left; Resume then starts at the joins) and the join of the ayah before it is graded on its own (`finishJoins`); never grade the same item twice (`docs/phases/phase-14-followups.md`). Start-up cost of a change: `scripts/measure/startup.mjs` (dev-only, same file for before and after). Real-text screenshots: `node scripts/screenshots/phase-14-hifz.mjs` (needs the internet). Node 22 for a verify: this machine's default is Node 24; put a Node 22 `node.exe` first on PATH.

## Working rules learned the hard way

- **The e2e run is pinned to one worker and no retries (`playwright.config.ts`), and must run on a quiet machine.** The suite has timing tests (the reader at 4x CPU, request counts, a search cancelled by the next keystroke) and one server on port 3011. In Phase 13 three full runs on a machine that other programs were loading (63 to 96% CPU, VS Code the largest) failed in a different place each time, 2 to 3 tests of 668, all 30-second timeouts or ordering checks, and every one passed alone straight afterwards. More workers add the same kind of load, so do not raise the count to go faster, and do not turn retries on (a pass on the second try hides the flake). Before a verify, check the CPU is idle; a run slower than about 23 minutes means the machine was busy.
- **Do not run network sweeps or other heavy work while `npm run verify` runs.** Its performance test (the reader at 4x CPU) and the e2e suite share the machine's CPU and ports 3011 and 3012; a concurrent sweep once made a timing test fail. Wait for verify to finish, or run the research before or after it.
- **Never remove a git worktree whose `node_modules` is a junction or symlink without unlinking it first** (`[System.IO.Directory]::Delete(path, $false)` in PowerShell removes only the link). `git worktree remove --force` followed the junction and deleted part of the real `node_modules` (including `.bin`); it was repaired with `npm ci`. Better still: do not link `node_modules` into a worktree (the build also fails there); compare commits by checking one out in place and rebuilding.

## Commands

```bash
npm install                     # Node 22 (.nvmrc); no legacy checkout needed
npm run dev -- --port 3001
npm run build && npm run preview  # required for offline/PWA testing (offline does not work in dev)
npx eslint .
npm test                        # unit tests (tests/)
npm run test:e2e                # Playwright against the production build (run npm run build first; uses port 3011)
npm run test:dev               # starts the dev server and checks / renders with no errors
npm run verify                  # build + lint + unit + dev smoke + e2e

# dev-only, never part of a build: refresh ./legacy from a checkout of the legacy repo (see legacy/README.md)
LEGACY_REPO=<path to the legacy checkout> node scripts/sync-legacy.mjs [--check]
```

## When unsure

Ask. List open questions in the phase doc. Do not guess about religious content, storage formats or Qur'an data.
