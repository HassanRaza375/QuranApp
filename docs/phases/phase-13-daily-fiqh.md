# Phase 13: Daily Fiqh (Wajibat), stages 13a and 13b

- Branch: `phase-13-daily-fiqh` (off `phase-12-knowledge`)
- Date: 2026-10-26 (13a), 2026-10-27 (13b)
- Status: **ACCEPTED by the owner on 2026-10-28.** Built 13a (2026-10-26) and 13b (2026-10-27); full verify clean on the third run (b42b129). **Owner decisions of 2026-10-28:** the Khamenei spot check is **waived** (his pointers stay as built; not a claim that his text was checked); no scholar sign-off is required, so the four helpers are **enabled in production** (the gate, the dev flag and the build guard are removed) with "Not scholar-reviewed" and "I'm not sure" kept. See `docs/DECISIONS.md`, "Owner decisions, 2026-10-28".
- Plan: `docs/phases/phase-13-daily-fiqh-plan.md` (approved 2026-10-26 with your ten answers, listed below)

## Goal

Rebuild `/fiqh` on the legacy data exactly as the legacy decided what a reader may see, with the changes you decided: a marja's own text or a pointer, never another's; the 66 needs-human rows held; English-withheld rulings shown as a pointer with no substitute; "Both" never implying a translation; "Not added yet for X. Refer to his risala." everywhere a ruling is missing.

## Scope (13a)

- Pages and components built: the five legacy routes (`/fiqh`, `/fiqh/choose-marja`, `/fiqh/glossary`, `/fiqh/[category]`, `/fiqh/[category]/[topic]`), each a one-line route over a component in `app/components/fiqh/`; `app/lib/fiqh/`; `app/composables/useFiqh.ts`; the Library `fiqh` kind opens; a **Daily Fiqh** group and chip in Search.
- Prototype section: `prototype-remaining-pages.html`, `#/fiqh`, `#/fiqh/choose-marja`, `#/fiqh/<category>`, `#/fiqh/<category>/<topic>`, `#/fiqh/glossary`.
- Legacy code reused: all of `app/data/wajibat/` (31 files), `utils/wajibat{Search,Labels,Validate,Review,Mismatch,Coverage}.ts` and `wajibatMismatchWords.json`, and three test fixtures, vendored by `scripts/sync-legacy.mjs` and never edited. `legacy/app/data/wajibat/runtime.ts` is used as the loader.
- Not in 13a (built in 13b, below): guided steps (11 procedures), recitations (2), the live-times panel, the four decision helpers. "Save all" is in (it is part of offline) but the Downloads page does not list Daily Fiqh.

## What was built

- **What a reader sees (`lib/fiqh/visibility.ts`, pure, tested over every ruling, marja' and language):**
  - the chosen marja's own entry or nothing; `visibleTo` hides an entry that belongs to one marja' (his own points, his supplementary Q&A) from everyone else;
  - **249 Khamenei entries show a pointer and no text, in any language:** 92 held for review by the legacy data, **100** whose English differs from his Persian original (the legacy showed the Urdu instead; here neither is shown, decision 5), and **57** on our needs-human hold list (decision 1; `lib/fiqh/holds.ts`, derived from the vendored decision fixture and pinned by a test);
  - a ruling with no entry says "Not added yet for <Sistani, Khamenei, Makarem Shirazi>. Refer to his risala." with a link to his official site (decision 4); a topic where he has nothing at all (all 7 Zakat topics and zakat al-fitrah for Khamenei, everything for Makarem Shirazi) shows that line once;
  - **"Both"** shows English and Urdu each with its own source line (book and number), with a plain "English" and "Urdu" label and no word that relates them (decision 6); the Urdu comes only from the marja's own Urdu book (the data holds no other);
  - an Urdu reader gets the English where there is no official Urdu, with a notice; the Urdu-lag notice (Sistani) and the Urdu-only notice (Khamenei) are the legacy's words;
  - `readerNote`: a ruling's `note` is shown with the legacy author's working references ("(decision P6)", "rule R7") and one sentence that said it is "not shown in the UI" cut out (the legacy page printed it): a test scans all 1,840 entries.
- **Pages:** hub (gate until a marja' is chosen, notices, search, nine categories of which three say Coming later, glossary link, Prayer times and Qibla links, Save all for offline); choose-marja (three maraji' with their books, the reading language); category (topic cards with "N of M rulings shown for X", real counts); topic (Overview, Qur'anic basis from the reader's text, the rulings with the first ten and Show all, collapsed women's and "Purity of persons" panels, where to pay as a link to his own site only, related topics, terms, sources, disclaimer, Save with Undo under `fiqh:<topic id>`); glossary (94 terms, filter in any script, A to Z).
- **Library:** `fiqh:<topic>` rows open `/fiqh/<category>/<topic>` (all kinds now open; the "pending" notice is gone). **Search:** a Daily Fiqh group (topics, rulings, glossary terms from the one-line ruling index, so no category chunk is needed) and chip, found by the chosen marja's followers only for his own points.
- **Data loading and offline (level B):** one chunk per category plus a core (`wajibat-data-*`), none in the install-time precache; `lib/fiqh/offline.ts` (ported from the legacy) writes the chunks a reader has opened into Cache Storage `wajibat-data-cache` and a service-worker rule serves them; "Save all for offline" fetches all seven. A page that cannot load its data (offline, never opened online) shows a plain "Daily Fiqh isn't on this device yet" page.
- **Preferences:** `fiqhLang` (English, Urdu, Both) is the `lang` field of the legacy record `quran:fiqh-prefs:v1`, beside `marjaId`; Settings and these pages read and write one record, other fields kept.

## Decisions and why

| Decision | Alternatives considered | Reason |
| --- | --- | --- |
| The needs-human hold list is derived from the vendored fixture, pinned by a test | Edit the data (never) or hand-write a list | One source of truth; a decision recorded in the legacy data shows up as a failing test |
| English-withheld rulings show a pointer, not the Urdu the legacy showed | Keep the Urdu substitute | Your decision 5: no substitute text |
| `readerNote` trims working references, nothing else | Show notes as they are, or hide them all | The notes carry reader-useful lines ("part of this ruling is an obligatory precaution") and developer lines; the legacy page printed both |
| The category page counts "shown" rulings, from the loaded chunk | Show the number of rulings only | The prototype's meter, with real data; it also saves the category for offline |
| `topics`, `categories`, `marja`, `types` and `access` stay in an ordinary precached chunk (`fiqh-shared`) | Everything in the core data chunk | The Library, Search and Settings use them; they must work offline and must not pull the 228 KB core chunk |
| Offline: cache on open, plus Save all | Precache everything | Install size (the legacy decision), and your answer 7 |
| The page chunk catches its own load failure | Vue's `errorComponent` | Vue reports the failure to Nuxt either way, and Nuxt showed a 500 page (found by the offline test) |

## Files

- Added: `app/lib/fiqh/*`, `app/components/fiqh/*`, `app/composables/useFiqh.ts`, `app/pages/fiqh/*`, `tests/fiqhData.test.ts`, `e2e/fiqh.spec.ts`, `scripts/screenshots/phase-13-fiqh.mjs`, `docs/design/fiqh-compare/`, `docs/pages/fiqh.md`, `docs/phases/phase-13-khamenei-spot-check.md`, `legacy/` additions (27 data files, 7 utils, 3 fixtures).
- Changed: `nuxt.config.ts` (chunking, precache exclusion, the cache rule), `app/lib/preferences.ts`, `app/lib/libraryItems.ts`, `app/lib/searchLocal.ts`, `app/lib/searchQuery.ts`, `app/composables/useSearchPage.ts`, `app/components/search/SearchPage.vue`, tests and specs that pinned the old state (`tests/preferences.test.ts`, `tests/settingsLogic.test.ts`, `tests/library.test.ts`, `e2e/library.spec.ts`, `e2e/search.spec.ts`), `scripts/lib/legacy-files.mjs`.
- Changes to `legacy/` (only by the sync script): the files above; nothing edited.

## Stage 13b: what was built (2026-10-27)

- **Guided procedures (`FiqhProcedure`, `FiqhStep`).** The 11 procedures (wuḏūʾ, ghusl 2, tayammum 2, the guided prayers 6) appear under "Step by step" on the topic that carries them, for the chosen marja' only. One step at a time (Next, Previous, "Show all steps" and back), with a counter. Each step shows the app-written title, then the passage quoted from the ruling it cites with that ruling's book and number (`FiqhSourceLine`), and, where the data has one, the app's note under "Written by the app: …". The procedure says "Step titles are written by the app. The text under each title is quoted from the ruling it cites." A step whose ruling may not be shown (held, English withheld, on our hold list) shows the **same pointer as a ruling card** and none of its text, with no Urdu substitute: exactly 3 Khamenei steps (`maghribkhamenei:s19`, `zuhrkhamenei:s19`, `zuhrkhamenei:s26`, all English-differs), pinned by `tests/fiqhGuided.test.ts`. A marja' with no guide for a topic: "Not added yet for X. Refer to his risala. The rulings above still apply."
- **Recitations (`FiqhRecitation`).** The 2 recitations (the dhikr of ruku' and of sujud) are Sistani's, taken from his official Urdu edition; each is shown beside the ruling and the step that carry it, with its transliteration, its own source line and its note (through `readerNote`). Khamenei's followers see none.
- **Live panel (`FiqhLivePanel`).** On the prayer-times, fasting-times and qibla topics: the Prayer Times feature's own times as it has loaded them (`usePrayerTimes().today`), shown as they are, with the Sunni note when the setting is Sunni, and links to Prayer Times, the Ramadan log and the Qibla tool. **It makes no request itself**; if Prayer Times has not loaded, it says "Open Prayer Times to load today's times for your location." It does not decide anything the rulings below decide.
- **Helpers (`FiqhHelper`, `FiqhHelperQuote`, `lib/fiqh/helperWalk.ts`): built, hidden.** One question per screen, a real radio group, "I'm not sure" on every question (it always ends at a pointer to his risala with where to look), Back and Start over, the answer in his own words with the phrase that states it marked and "Open the full ruling on this page". Every helper says "Not scholar-reviewed". Visibility is the legacy's `isHelperVisible(tree, TREE_REVIEWS, devFlag)`: with 0 of 262 paths approved they appear only when `NUXT_PUBLIC_WAJIBAT_SHOW_UNREVIEWED_HELPERS=true` on the development server. **A production build fails if that flag is on** (the legacy guard `wajibatBuildGuard.ts`, now vendored, is called from `nuxt.config.ts`; tested in all common spellings and on Vercel).
- **A quote that may not be shown shows the pointer (`lib/fiqh/quoteView.ts`).** Helpers and steps use one function, so they follow the same rules as a ruling card. **For the sign-off reviewer: 20 helper quotes now show the pointer instead of text (Khamenei doubts 19, Khamenei wudu 1), so the legacy's review pack for those 20 answers does not match what a reader here sees.** The Sistani helpers are unchanged.

### Stage 13b decisions

| Decision | Alternatives considered | Reason |
| --- | --- | --- |
| Steps and helper answers go through one pure function (`quoteView`) that reuses `viewOf` and `pointerReason` | Re-check inside each component | One place decides what may be shown, tested over every step and every answer |
| The live panel reads what Prayer Times already loaded and never fetches | Fetch in the panel | Your rule: no third-party fetch from components; the panel cannot cause a request on an unrelated page |
| The helpers are tested on a development server with the flag (`npm run test:helpers`, port 3013); the production suite tests only the hidden state | Add a way to show them in production | A production build must not be able to show them; the legacy guard fails the build if the flag is on |
| Step notes are labelled "Written by the app: …" | Show them as the ruling's words | They are the legacy author's reasons for marking a step wajib, not a marja's words |

### Stage 13b files

- Added: `app/components/fiqh/{FiqhPointer,FiqhRecitation,FiqhProcedure,FiqhStep,FiqhLivePanel,FiqhHelper,FiqhHelperQuote}.vue`, `app/lib/fiqh/{quoteView,helperWalk}.ts`, `tests/fiqhGuided.test.ts`, `e2e-helpers/helpers.spec.ts`, `playwright.helpers.config.ts`, `legacy/app/utils/wajibatBuildGuard.ts` (synced), 16 images in `docs/design/fiqh-compare/`.
- Changed: `FiqhRulingCard.vue` (uses `FiqhPointer`, `FiqhRecitation`), `FiqhTopic.vue`, `FiqhLivePanel.vue` (cell alignment, after the screenshots), `nuxt.config.ts` (the guard, `wajibatShowUnreviewedHelpers: false`), `package.json` (`test:helpers`; `verify` ends with it), `scripts/lib/legacy-files.mjs`, `e2e/fiqh.spec.ts` (8 tests), `scripts/screenshots/phase-13-fiqh.mjs`.

### Stage 13b verification

- [x] `npx eslint .` clean; unit tests: 49 files, 835 passed (13 new: all 262 helper paths walked, every "I'm not sure" ends at a pointer, 150 helper quotes verbatim in the marja's own entry, the 20 pointer quotes pinned, the 11 procedures, the 3 pointer steps, the 2 recitations, notes free of working references, the build guard).
- [x] `e2e/fiqh.spec.ts` 13b tests (8) pass on the production build; `e2e-helpers/helpers.spec.ts` (7) passes on the development server with the flag on (1.5 min).
- [x] 1280 and 375 px, light and dark, empty and loaded states: 16 images, all looked at (`fiqh-compare/README.md`).
- [x] **Full `npm run verify` after 13b: clean on the third run** (b42b129, exit 0). Runs 1 and 2 were not clean; all three are recorded under "Verify result after 13b" below.
- [ ] Keyboard and screen-reader pass: not done (real radios, buttons and links).
- [ ] **Khamenei text against leader.ir: yours to run**, and the helpers' sign-off waits for it.

## After acceptance: the helpers enabled in production (2026-10-28)

- **Changed:** `FiqhTopic.vue` shows the chosen marja's helpers without `isHelperVisible`; removed `wajibatShowUnreviewedHelpers` (runtime config), the `assertNoUnreviewedHelpersInProduction` call in `nuxt.config.ts`, and the vendored `legacy/app/utils/wajibatBuildGuard.ts` (taken off `scripts/lib/legacy-files.mjs` and removed by `scripts/sync-legacy.mjs`, 87 other files unchanged; legacy commit still `7120b6c`). `treeReviews.json` stays vendored (the unit test counts the 262 paths and the 0 signed off).
- **Tests:** the dev-server config and `e2e-helpers/` are gone (they existed only because a production build hid the helpers). The seven helper tests moved to `e2e/fiqhHelpers.spec.ts` and run on the production build with the rest of the suite; `npm run test:helpers` now runs that one file, and `npm run verify` no longer has a separate helper step. `e2e/fiqh.spec.ts` now checks that the helpers are shown (Sistani and Khamenei: one on the wuḍūʾ topic and one on doubts; Makarem Shirazi none), each saying "Not scholar-reviewed". The three tests of the removed build guard are deleted (unit tests 832).
- **Still true, and unchanged:** the helper answers that quote a ruling that may not be shown show the pointer (20 for Khamenei), "I'm not sure" always ends at a pointer, and no helper path has been read by a scholar.

## Data and storage

- Services: none (no request is made by Daily Fiqh, the live panel included; the Qur'anic basis uses the reader's text path).
- Storage keys: `quran:fiqh-prefs:v1` (read and written, `marjaId` and `lang`, other fields kept), `quran:bookmarks:v1` (`fiqh:<topic>`). Cache Storage: `wajibat-data-cache` (the legacy's name). No IndexedDB, no new key.
- Migrations: none.

## Offline

- **Hub, categories, topics, glossary: level B.** A category opened online is saved and works offline, including after a reload; a category never opened says so with Try again; "Save all for offline" saves everything. A brand-new tab opened offline on a device that never opened Daily Fiqh shows the plain not-on-this-device page. Tested with the real service worker (`e2e/fiqh.spec.ts`, "offline"). The Library and Search work offline without Daily Fiqh data (the Search group is simply absent).

## Verification

- [x] `npm run build`, `npx eslint .`, unit tests: see the result below.
- [x] 1280 and 375 px, light and dark: `docs/design/fiqh-compare/` (what was looked at is listed there).
- [x] Offline, with the real service worker.
- [ ] Keyboard and screen-reader pass: not done (the controls are real links, buttons, radios and disclosure buttons).
- [x] Compared against the prototype: README of `fiqh-compare`.
- [ ] **Khamenei text against leader.ir: yours to run** (the spot-check document); not accepted until it passes.
- [x] A real bug found and fixed on the way (Phase 10 Search, below).

**Verify result: clean, one run, Node 22.23.4 (`.nvmrc`), 2026-10-27, exit 0, 20.7 min:** `npm run verify` = build, `eslint .`, **822 unit tests in 48 files**, the dev smoke, and **668 browser tests, all passed** (one worker, no retries, both now pinned in `playwright.config.ts`; the CPU was about 50% from other programs when it started, so it was not a perfectly idle machine, but it ran in 20.7 minutes against 22.1 for the first run).

**The three earlier runs on 2026-10-26 were not clean** and are kept here for the record: run 1 (22.1 min) failed 2 Search tests, both real timing bugs (a search sent twice for an opened `?q=` link; a test racing a 404), fixed, with `e2e/search.spec.ts` passing 252 of 252 over six repeats; runs 2 and 3 (28.6 and 26.9 min, with other programs at 63 to 96% CPU) failed 3 and 2 different tests (Settings, Stories, the reader), all timeouts or ordering checks, each passing alone straight afterwards. Nothing in those specs or the code they test changed between the runs. Why the worker count is pinned: `CLAUDE.md`, "Working rules".

**Verify result after 13b: NOT clean.** `npm run verify` on a0e7d95 stopped at the unit tests: 834 of 835 passed, 1 failed, 48 of 49 files passed (build and eslint had passed). The failing test is `tests/legacySnapshot.test.ts` > "holds no file that nothing uses: every legacy/app file is imported by the code, read by path, or imported by another legacy file": **"Test timed out in 5000ms"**, not an assertion failure. Because the unit step failed, the dev smoke, the 668-test browser suite and `test:helpers` did not run in this verify, so nothing is recorded for them from it (their earlier targeted runs are above).

What I know and do not know: run alone straight afterwards, the same test file passes 3 of 3 times in about 0.8 s (the test itself about 0.4 s). In the verify it ran with 48 other files in parallel (whole step 18.7 s), and the machine was not idle when it started: the CPU reading was 100% at the launch moment (Chrome, XAMPP and Wallpaper Engine were running). That points to a load-induced timeout, but I have not shown it: I did not reproduce the failure, and the test scans every file under `app`, `build`, `e2e`, `scripts`, `tests` and the config files, which 13b grew (new components, `e2e-helpers` is not scanned). No code was changed after this failure. Decision for you: rerun on a really idle machine (close Chrome and the other programs first), or raise this test's timeout, which I have not done.

**Run 2, after the unit-test timeout fix (commit after 65c89e6; Node 22.23.4, started 2026-10-27 17:04, ended 17:34, exit 1, about 30 min): still NOT clean.**
- **What the measurement showed (your step 1):** `legacySnapshot.test.ts` "holds no file that nothing uses" takes 0.24 to 0.36 s alone (three runs) and 0.385 s inside a full unit run (49 files, 20 s). It scans 496 files and 2.52 MB now against 486 files and 2.47 MB before 13b (about 2% more), and 82 vendored app files against 81. Nothing in it waits or races, so it is a pure file scan and I gave that one test a 30 s timeout with a comment (global timeout unchanged), and wrote the numbers in `CLAUDE.md`. The failure in run 1 was therefore load, not growth: the test is about 13 times faster than the limit it hit.
- **Run 2 result:** build, `eslint .`, **835 of 835 unit tests (49 files, the timeout fix held)** and the dev smoke passed. The browser suite finished **674 passed, 2 failed (24.4 min)** of 676 (the 668 of the 13a run plus the 8 13b tests), and `npm run test:helpers` **did not run** because `test:e2e` failed first (it is the last step of the chain). The two failures: `e2e/knowledgeModules.spec.ts:239` ("a place's Connected list reaches the people, the people reach the events, and every link opens": `k-name` not visible within 5 s after clicking the first Connected link) and `e2e/player.spec.ts:406` ("the error keeps its meaning without promising offline": the mini-player status still read "Loading…" when the test read it once, instead of "needs a connection").
- **What I know:** neither spec nor the code they exercise (`app/components/knowledge`, `app/components/player`, `app/stores`) changed between 99fe67e (the clean 13a verify) and a0e7d95 (`git diff --stat` empty), and 13b touches neither page. Run alone straight afterwards, both tests passed 3 of 3 times (13.5, 7.6 and 5.8 s). Both failures are a 5 s wait or a single read that raced a slow page, the same pattern as the three loaded runs of 2026-10-26.
- **The machine was not idle, against what was said:** at 17:04 Chrome (42 processes), XAMPP and Wallpaper Engine were still running, with the CPU at 30 to 39% before the run; the run took about 30 minutes against about 21 for the clean 13a run, and `CLAUDE.md` says anything over about 23 is a busy machine. I did not close your programs. So this is again **a failure I believe is load, not shown to be**, and I did not rerun the whole suite. The helper tests (`npm run test:helpers`) have therefore not run inside any verify; they passed alone (7 of 7, 2.4 min) before the commit.
- **Needed:** a verify with Chrome, XAMPP and Wallpaper Engine actually closed (check with Task Manager that the CPU is under about 10% first). I stopped here as instructed.

**After run 2 (2026-10-27, 18:07): the two failing specs, and why there is no run 3 yet.**
- `e2e/player.spec.ts:406` read the mini-player status once (`textContent()`), right after the click, when it still said "Loading…". It now uses the auto-retrying `expect(status).toHaveText(/needs a connection/)` and `not.toHaveText(/offline/i)`: no sleep, no timeout change. A real test bug (a read that races the status update), not only load.
- `e2e/knowledgeModules.spec.ts:239` has no custom timeout: the 5 s is Playwright's default `expect` timeout, so there was nothing to change to "the suite default", and I left the test as it is. The page does not take more than 5 s: the whole test (two navigations) runs in 2.1 to 3.7 s. The failure was the assertion after the click on the first "Connected" link of `/themes/tawhid` (a full page load, then a click, then `k-name`) taking over 5 s on a loaded machine. I changed nothing there because I cannot show a cause beyond load.
- **Both specs, 10 runs each (`--repeat-each=10`): 20 of 20 passed**, in 55 s, on the existing production build, while the machine was at 77 to 100% CPU.
- **Run 3 of `npm run verify` was NOT started.** Asked to start it on a quiet machine, I measured the CPU first: **93 to 100%** with none of my processes running (no node process, nothing on ports 3001, 3011 to 3013), and **Chrome (46 processes), XAMPP (xampp-control) and Wallpaper Engine were still running** (VS Code is the largest user of CPU time). `CLAUDE.md` says to check the CPU is idle before a verify; a 30-minute run in that state would only add another load-dependent result. Needed: those programs closed and the CPU under about 10% (it should be checked by Task Manager, not assumed).

**Run 3 (b42b129, Node 22.23.4, 2026-10-27 18:50 to 19:13, 23.5 min): CLEAN, exit 0.** `npm run verify` = build (2 min 9 s), `eslint .`, **835 unit tests in 49 files, all passed**, the dev smoke (200, rendered, no errors), **676 browser tests, all passed (18.9 min, one worker, no retries)**, and **`npm run test:helpers`: 7 of 7 passed (52 s)**, so the helper tests have now run inside a verify. Tree clean, no change between the commit and the run.
- **The machine was not perfectly idle:** CPU samples before the start were 52, 12, 18, 12, 52 and 35% (about 30%); Chrome (18 processes), VS Code (14), XAMPP and Wallpaper Engine still showed in the process list, against "closed". The run did not suffer for it (the browser suite took 18.9 min, faster than the 20.7 of the 13a run), but this is **not** a measurement on a machine under 10%.
- **The record of the three runs after 13b:** run 1 (a0e7d95): 1 unit test timed out at 5 s under load (fixed: its own 30 s limit; it takes 0.4 s on a quiet machine). Run 2 (e5d1ef2): 2 of 676 browser tests failed (a status read once in `player.spec.ts`, fixed to a retrying assertion; a 5 s default wait in `knowledgeModules.spec.ts` that passed 10 of 10 alone, left unchanged). Run 3: nothing failed. The knowledge test was not changed, so it has now passed once in a full run and 10 of 10 alone, and I still cannot show why it failed in run 2 beyond load.
- Not covered by any run: the keyboard and screen-reader pass, the device checks, and your Khamenei spot check.

## Differences from the prototype

In `docs/design/fiqh-compare/README.md`.

## Content placeholders replaced

The prototype's samples (its categories, 34 topics, ruling slots, counts, glossary, "Continue" row) are replaced by the real data; the prototype's authored sentences are not used. The wording that is ours (the pointer sentences, "Not added yet for …", the gate, notices) is listed in `docs/CONTENT_TO_VERIFY.md`.

## Open issues and risks

1. **Khamenei is unverified by me against leader.ir** and is on hold until your spot check passes. 2. **No person has read the rulings**; "Not scholar-reviewed" stays on every page. 3. **249 of his entries show a pointer**, so his followers see fewer rulings than the legacy showed (the legacy showed Urdu for 100 of them and text for the 57). 4. A **Search race** (Phase 10 code) was found and fixed here: a chip chosen within about a second of typing was briefly undone when the earlier address write landed; `e2e/search.spec.ts` has a regression test that fails without the fix (shown: chip flipped back to All at 500 ms). 5. The data's `lastSourceCheck` dates are from the legacy's build (2026-10-07 to 09). 6. Chunk sizes: foundations 37 KB, zakat 160, taharat 302, sawm 582, khums 675, salat 833 and core 228 raw (gzip 11, 32, 68, 106, 130, 148, 51). 7. Sensitive content is collapsed as decided.

## Next phase needs

Your Khamenei spot-check result (30 entries; any difference holds his module), then the helpers' sign-off (a person going through `treeReviews.json`, with the review pack and the 20-quote note above). Phase 14 is not started.
