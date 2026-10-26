# Phase 13: Daily Fiqh (Wajibat), stage 13a

- Branch: `phase-13-daily-fiqh` (off `phase-12-knowledge`)
- Date: 2026-10-26
- Status: **13a built, awaiting your review (first stop).** Not accepted: **Khamenei's module is on hold until your browser spot check of 30 entries passes** (`docs/phases/phase-13-khamenei-spot-check.md`). 13b (guided steps, recitations, the live panel, the helpers behind the sign-off flag) is not started.
- Plan: `docs/phases/phase-13-daily-fiqh-plan.md` (approved 2026-10-26 with your ten answers, listed below)

## Goal

Rebuild `/fiqh` on the legacy data exactly as the legacy decided what a reader may see, with the changes you decided: a marja's own text or a pointer, never another's; the 66 needs-human rows held; English-withheld rulings shown as a pointer with no substitute; "Both" never implying a translation; "Not added yet for X. Refer to his risala." everywhere a ruling is missing.

## Scope (13a)

- Pages and components built: the five legacy routes (`/fiqh`, `/fiqh/choose-marja`, `/fiqh/glossary`, `/fiqh/[category]`, `/fiqh/[category]/[topic]`), each a one-line route over a component in `app/components/fiqh/`; `app/lib/fiqh/`; `app/composables/useFiqh.ts`; the Library `fiqh` kind opens; a **Daily Fiqh** group and chip in Search.
- Prototype section: `prototype-remaining-pages.html`, `#/fiqh`, `#/fiqh/choose-marja`, `#/fiqh/<category>`, `#/fiqh/<category>/<topic>`, `#/fiqh/glossary`.
- Legacy code reused: all of `app/data/wajibat/` (31 files), `utils/wajibat{Search,Labels,Validate,Review,Mismatch,Coverage}.ts` and `wajibatMismatchWords.json`, and three test fixtures, vendored by `scripts/sync-legacy.mjs` and never edited. `legacy/app/data/wajibat/runtime.ts` is used as the loader.
- Not in 13a: guided steps (11 procedures), recitations (2), the live-times panel, the four decision helpers, docs for those, and "Save all" is in (it is part of offline) but the Downloads page does not list Daily Fiqh.

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

## Data and storage

- Services: none (no request is made by Daily Fiqh; the Qur'anic basis uses the reader's text path).
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

**Verify result:** **NOT a clean run: three full runs on Node 22.23.4, each with browser-test failures, none recorded as accepted.** Build, `eslint .`, **822 unit tests (48 files)** and the dev smoke passed in all three. Browser tests (668 in all):
  - **Run 1 (22.1 min): 666 passed, 2 failed, both in Search and both real.** One search was sent twice for an opened `?q=` link (the search was armed on mount and asked for again after the Search chunk loaded; on a slow run the chunk took longer than the pause); the other test relied on a request being cancelled before Chromium logged its 404. Fixed (the search starts once, at mount; the test no longer uses a query the recorded answers do not cover); `e2e/search.spec.ts` then passed 252 of 252 over six repeats.
  - **Run 2 (28.6 min): 665 passed, 3 failed** (a Settings notification switch, a Stories link crawl, a Stories `networkidle` wait), all 30-second timeouts. **Run 3 (26.9 min): 666 passed, 2 failed** (the reader's warm-load request count, 3 against 2; the reader's first audio source). The failing tests differ every run, they passed in isolation straight afterwards (settings and stories 75 of 75; reader 43 of 43), and both runs were slower than run 1 while the machine was at 63 to 96% CPU from other programs (VS Code was the largest). That points to load, but I have not proved it; I did not change any of those specs or the code they test.
  - **So there is no fully clean run yet.** A quiet machine is needed for one: please close other programs, or tell me to run it again.

## Differences from the prototype

In `docs/design/fiqh-compare/README.md`.

## Content placeholders replaced

The prototype's samples (its categories, 34 topics, ruling slots, counts, glossary, "Continue" row) are replaced by the real data; the prototype's authored sentences are not used. The wording that is ours (the pointer sentences, "Not added yet for …", the gate, notices) is listed in `docs/CONTENT_TO_VERIFY.md`.

## Open issues and risks

1. **Khamenei is unverified by me against leader.ir** and is on hold until your spot check passes. 2. **No person has read the rulings**; "Not scholar-reviewed" stays on every page. 3. **249 of his entries show a pointer**, so his followers see fewer rulings than the legacy showed (the legacy showed Urdu for 100 of them and text for the 57). 4. A **Search race** (Phase 10 code) was found and fixed here: a chip chosen within about a second of typing was briefly undone when the earlier address write landed; `e2e/search.spec.ts` has a regression test that fails without the fix (shown: chip flipped back to All at 500 ms). 5. The data's `lastSourceCheck` dates are from the legacy's build (2026-10-07 to 09). 6. Chunk sizes: foundations 37 KB, zakat 160, taharat 302, sawm 582, khums 675, salat 833 and core 228 raw (gzip 11, 32, 68, 106, 130, 148, 51). 7. Sensitive content is collapsed as decided.

## Next phase needs

13b: procedures (the guided steps; a step that quotes a held ruling must show the pointer, not the quote), recitations, the live panel for three topics, the helpers behind `isHelperVisible` and the production build guard, and the remaining docs.
