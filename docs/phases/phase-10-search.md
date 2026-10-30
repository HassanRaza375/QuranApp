# Phase 10: Search

- Branch: `phase-10-search`
- Date: 2026-10-22
- Status: **Done, awaiting review.** `npm run verify` was **not a clean pass** when this phase was built (4 browser tests outside Search failed once, see Result); **a later full run on `phase-11-downloads` was clean** (addendum at the end of Result); real-device checks are yours, rows X1 to X6 in `docs/DEVICE_CHECKS.md`

## Goal

Rebuild `/search` from the approved plan (`phase-10-search-plan.md`): one box over ayahs (online), surahs, people, stories and your notes; every legacy filter behind one Filters button; history in the legacy format; the three legacy bugs fixed.

## Scope

- Pages and components built: `app/pages/search.vue`; `app/components/search/` (`SearchPage`, `FiltersSheet`, `LocalRow`, `HighlightedText`); `app/components/QuranThread.vue` (shared).
- Prototype section used: `prototype-remaining-pages.html`, `#/search`.
- Legacy code reused: the surah, people and story tables and filters (`@legacy`, through `lib/people.ts` and `lib/stories.ts`); the legacy search history composable and edition list are vendored (`legacy/app/composables/useSearchHistory.ts`, `useSearch.ts`) and used by tests only.

## What was built

- **The engine** (`lib/ayahSearch.ts`): reads the upstream's answer with validation (a match with an impossible surah or ayah is dropped; no matches array is an error), applies the juz and saved-ayah filters to **all** matches and only then keeps 60, and a searcher that **cancels the request it replaces**, keeps 24 answers for the session (by text, scope and edition), and tells apart results, "none" (the upstream's 404), "offline" (no answer, or the browser says offline: then no request is made) and "failed" (an HTTP error or an unreadable answer).
- **Matching and highlighting** (`lib/searchFold.ts`): a character-mapped twin of the app's one normaliser, used to paint matches on the original text (a bare Arabic root inside the marked word, `yusuf` inside a name with a macron); segments are rendered as text, never as HTML.
- **Local groups** (`lib/searchLocal.ts`): Surahs, People, Stories, Notes behind a provider registry; ranked (title starts with the query first); loaded lazily so the first paint is small.
- **State in the URL** (`lib/searchQuery.ts`): the legacy names (`q g e s j b`) plus `t`; bad values ignored; an edition that does not belong to the group falls back (the legacy dropdown could disagree).
- **History** (`lib/searchHistory.ts`): `quran:search-history:v1` as a list of strings, 15 at most, saved only after a search that found something. The legacy composable is run against it in both directions.
- **Ayah jump** (`lib/ayahJump.ts`), **the `/` shortcut** (`lib/searchShortcut.ts`, `useSearchShortcut`), the **Filters** sheet, the **offline and error states**, the **"where your results fall"** strip.
- `SearchService` (through `useQuranApi2`); the e2e mock `mockSearch` and four recorded real responses.

## Decisions and why

| Decision | Alternatives considered | Reason |
| --- | --- | --- |
| Make the mapped fold a twin of `normalize`, not the new `normalize` | Replace `normalize` (one implementation) | The character-by-character version made the Surah listing test time out (it runs on every surah per keystroke). The original stays fast; the twin is only for the few dozen strings on screen, and `tests/searchFold.test.ts` proves they agree on 500+ real strings |
| Juz scope computed on the device | Keep the legacy second request | The legacy request could fail silently and showed unfiltered results under a filter label. The local table cannot fail |
| Filter before cutting to 60 | Cut first (legacy) | The legacy order hid matches that exist (shown in a test: more juz 30 matches exist than are in the first 60) |
| Numbers and typed references are never sent to the text search | Search them too | "2:255" opens the ayah; "18" is a surah; both would only produce a 404 |
| Success for history = the search finished and found something (results, or a local result, or a reference that opens), saved after 1.5 s or at once on Enter / opening a result | Save on every pause (legacy) | Approved rule; a failed or empty search is never saved |
| Suggested searches are the legacy eight; a note opens the item it is on; the box is focused on desktop only | The prototype's Browse chips; a note that opens nowhere; focus everywhere | Approved 2026-10-22 |
| Teh marbuta and heh are one letter in the device groups (`queryVariants`: the query as typed plus its word-final heh and teh forms, results merged) and in highlighting (the `teh` option) | Fold it in `normalize`; leave it out | Decided 2026-10-22: for Search only. `normalize` stays as it is (the Surah listing, Library and other filters tell the letters apart) and the upstream's ayah search is unchanged. Tested over every real surah name ending in either letter |
| The Ayahs group is headed "English: Pickthall" / "Urdu: Jalandhry" / "Arabic: Quran text" / "Tafsir: Muyassar"; no reader text beside results | A per-row translator name | Decided 2026-10-22 |
| Default English edition stays Pickthall | The reader's translation | The reader's English matches none of the upstream's 17 English editions (checked on 32:10); its Urdu is identical to Jalandhry, so Urdu defaults to Jalandhry |

## Files

- Added: `app/pages/search.vue` (replaced the placeholder route), `app/components/search/*`, `app/components/QuranThread.vue`, `app/composables/useSearchPage.ts`, `useSearchShortcut.ts`, `app/lib/ayahSearch.ts`, `ayahJump.ts`, `searchEditions.ts`, `searchFold.ts`, `searchHistory.ts`, `searchLocal.ts`, `searchQuery.ts`, `searchShortcut.ts`, `app/services/search.service.ts`; tests `searchFold`, `searchState`, `searchHistory`, `ayahSearch`, `searchLocal`, `searchShortcut`; `e2e/search.spec.ts`; four fixtures `tests/fixtures/alquran-search-*.json` (real responses); `scripts/lib/legacy-search-history.mjs`, `scripts/screenshots/phase-10-search.mjs`; `docs/pages/search.md`, `docs/design/search-compare/` (30 images and a README).
- Changed: `layouts/default.vue` and `AppHeader.vue` (the shortcut and a comment), `e2e/mocks.ts` (`mockSearch`), `tests/services.test.ts`, `scripts/lib/legacy-files.mjs` (two files added), `legacy/` (the two files, by `scripts/sync-legacy.mjs`), docs.
- Changes to `legacy/` or `docs/legacy-reference/`: `legacy/app/composables/useSearch.ts` and `useSearchHistory.ts` added by `scripts/sync-legacy.mjs` from commit `7120b6c`; nothing edited by hand.

## Data and storage

- Services: `SearchService` (api.alquran.cloud, the legacy upstream). Components never fetch it directly.
- Storage keys: `quran:search-history:v1` (read and written, legacy format); `quran:library:v1` and `quran:bookmarks:v1` read only. **No new key.** `quran-revamp-db` untouched; `quran-app-db` never opened (a test checks).
- Migrations: none.

## Offline

Level **C** for ayah text (a designed offline state), level **A** for everything else. Tested: the upstream unreachable (mock `network`), the browser offline (no request is made), a server error, and recovery with Try again; device groups and typed ayah numbers keep working in all of them (`e2e/search.spec.ts`).

## Verification

See "Result" below.

- [x] Unit tests for every pure piece, on real recorded responses
- [x] 40 browser tests for Search on the production build (upstream mocked from real recordings; real APIs blocked); all 40 pass
- [x] 1280, 375 and 390 px, light and dark (47 screenshots; the 390 px dark, offline, Arabic, Urdu and people images, the 375 Filters sheet and the desktop results looked at one by one; four problems found and fixed, listed in `docs/design/search-compare/README.md`)
- [x] Offline and error states tested
- [x] Keyboard pass (Tab order, `/`, Escape) tested; **screen-reader pass not done**
- [x] Compared against the prototype; differences in `docs/design/search-compare/README.md`

### Result

`npm run verify` on the final code, Node 24.22.1, 2026-10-22 (18:51 to 19:10):

| Step | Result |
| --- | --- |
| `npm run build` | passed (33.9 s) |
| `npx eslint .` | clean |
| `npm test` | **722 passed** in 42 files |
| `npm run test:dev` (dev smoke) | passed |
| `npm run test:e2e` | **535 passed, 4 failed** (539 tests, 17.0 min). All 40 in `e2e/search.spec.ts` passed |

The 4 failures, none in code Phase 10 touches:

- `perpage.spec.ts:345` ("a failed request says so…"): got the offline wording instead of the failed-request wording; `perpage.spec.ts:376` ("Next quietly has the next page's surah ready…").
- `queue.spec.ts:78` ("Play page … goes back to the first ayah") and `queue.spec.ts:95` ("a page that crosses into the next surah…"): the queue did not move to the next ayah within 5 s after the test sent "ended".

Re-run on the same build, three times each: both perpage tests and `queue.spec.ts:95` passed 3 of 3; **`queue.spec.ts:78` passed 2 of 3** (it failed once with the machine otherwise quiet). That same test also failed in the independence run of the standalone-repo task, on a commit made before Phase 10 existed, and passed when re-run. So the audio queue tests are timing-sensitive on this machine and this is not new, but it is not fixed here and the run above is **not a clean pass**. Whether it is only the test harness (the test sends "ended" before the engine is ready) or a real race in the queue is not yet known; it is worth its own look.


**Addendum, 2026-10-23: the same tests, clean.** `npm run verify` on `phase-11-downloads` (commit `07688b4`, Node 24.22.1, 15:36 to 15:58): build, lint, **756 unit tests**, dev smoke and **547 browser tests passed, 0 failed** (the 539 of this phase plus 8 new Downloads tests). Cause of the queue failures: the test double sent "ended" before the first file had started (not a player bug); reproduced under CPU load (1 in 15 runs), fixed in `e2e/mocks.ts`, then 40 of 40 passed under heavier load. The two Per page failures (`perpage.spec.ts:345`, `:376`) passed in this run and in the earlier re-runs; **their cause was not found** and they are not fixed, only unseen since.

## Differences from the prototype

`docs/design/search-compare/README.md`.

## Content placeholders replaced

From `CONTENT_TO_VERIFY.md`, Search: the sample ayahs and the "Saheeh International" label (real results, the edition used), the sample index and seeded history (real data and the user's own), the Browse chips (the legacy suggestions), "which service answers ayah search" (the legacy upstream, through a service), the history shape and cap (legacy format). Still open: a reader of Arabic confirming the teh marbuta rule, and the wording of ours (listed there).

## Open issues and risks

- Result English differs from the reader's (the upstream does not have the reader's text); decided: the group names the edition searched, and no reader text is shown beside results.
- **One upstream** answers ayah search (third party, 1 to 3 s, up to about 100 KB compressed for a broad two-letter query). It is cancelled, capped and cached; an outage shows the error state.
- A search with no ayah match logs one 404 line in the browser console (the upstream's "nothing found"); a page cannot silence it.
- Real-device behaviour (keyboard, offline, the sheet, Arabic results) is yours: `DEVICE_CHECKS.md` X1 to X6.
- Not done: a screen-reader pass; the `/` hint inside the box.

## Next phase needs

Phases 12 and 13 register their providers in `PROVIDERS` (`lib/searchLocal.ts`) when their pages exist, with a test that every hit opens a real page. Phase 11 (Downloads) and later pages can reuse `QuranThread`.
