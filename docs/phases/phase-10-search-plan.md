# Phase 10 plan: Search

Status: **approved 2026-10-22 with changes (section 8); building.** Written 2026-10-22 after reading the legacy `app/pages/search.vue`, `composables/useSearch.ts`, `composables/useSearchHistory.ts`, `utils/searchHighlight.js`, `composables/useTransliteration.ts`, the app bar and drawer entries, and the prototype (`docs/design/prototype-remaining-pages.html`, `#/search`). I also made about 18 read-only requests to the real search API (section 2).

**Baseline:** `npm run verify` passed on Node 22.23.4 in a clean export of the last commit (653 unit tests, 499 browser tests, 2026-10-22). Only docs have changed since.

## 1. Legacy report: what `/search` does today

**Reach.** Route `/search`, `noindex, follow`. An icon button in the app bar (hidden on phones), a "Search" row in the drawer, and a link on the legacy Sitemap page. Nothing else links to it.

**It searches ayah text only.** There is no search over people, stories, duas or notes. Those pages each have their own filter box (`personsSearch`, `storiesSearch`, `placesSearch`, and so on), and Daily Fiqh has its own (`wajibatSearch`). The legacy code says so in comments: each module's search is "separate from the site-wide `/search` page, not unified". **The prototype's grouped, cross-type Search is a new feature, not a rebuild.**

**What the page shows**

| Part | Legacy behaviour |
| --- | --- |
| Field | "Search the Qur'an", autofocus, clearable |
| Before typing | "Recent searches" (closable chips, "Clear all") and "Suggested": patience, mercy, forgiveness, gratitude, prayer, fasting, charity, guidance |
| Filters | **Search in:** English, Urdu, Arabic (Quran text), Arabic Tafsir. **Edition** (10): Pickthall, Yusuf Ali, Muhammad Asad; Jalandhry, Maududi; Arabic Quran text; Tafsir Muyassar, Al-Jalalayn, Al-Qurtubi, Al-Baghawi. **Surah** (1 to 114, shown as "Surah N") and **Juz** (1 to 30). **Bookmarked ayahs only** switch. A note under Tafsir: "Sunni tafsir sources, Arabic only" |
| Results | Up to **60**: "Surah name • n:m", an edition chip, the text with the match highlighted (right-to-left for Arabic, Urdu and tafsir). Tapping opens `/surah/<n>#ayah-<a>`. A line "N results (API returned T total, showing first 60)" |
| Messages | "Keep typing — search starts at 3 characters.", "No results found", "Search failed. Please try again." |
| URL | `?q=&g=&e=&s=&j=&b=` kept in sync (debounced 400 ms), so a result page is shareable |

**Data.** `https://api.alquran.cloud/v1/search/<query>/<surah or all>/<edition>`, called with `$fetch` straight from the composable (a hard-coded host, not through a service). Juz scope: the page fetches that juz's ayah list from the same provider and filters the results on the device. Bookmark scope: the saved-ayah check. Cache: a `Map` created inside `useSearch()`, so it lasts one visit.

**Storage.** One key, `quran:search-history:v1`: a JSON array of **plain strings**, newest first, **15 at most**, case-insensitive de-duplication. A search is added after its request finishes, when the text is 3 or more characters.

**Bugs and gaps found**

1. **The Juz filter can lie.** If the juz request fails, the filter is silently dropped and the list shows unfiltered results while the dropdown still says "Juz N".
2. **History is saved even when the search failed or found nothing.**
3. **No request cancellation.** Type quickly and a slow earlier response can overwrite a newer one.
4. **Highlighting is a literal case-insensitive substring match.** The API ignores Arabic marks (section 2), so a query without marks finds `رَبِّ` but highlights nothing.
5. **No offline state.** Offline shows "Search failed. Please try again."
6. **A third-party API is called outside the services**, against rule 8 of `CLAUDE.md`.
7. **The 3-character floor blocks 2-letter Arabic roots** such as `رب`, which the API accepts.
8. **Everything is downloaded, then cut to 60** (see the sizes below).
9. The Edition dropdown can disagree with the Search-in group when a URL is opened by hand.

## 2. What the real API does (checked 2026-10-22, from this machine)

| Request | Result |
| --- | --- |
| `mercy`, all surahs, Pickthall | 200, 155 matches, 1.1 s, about 15 KB |
| `رب` (2 letters), `quran-simple` | 200, **1,115 matches**, 2.5 to 3.1 s, **96 KB** compressed |
| `ربي` (3 letters) | 200, 140 matches, 1.1 s |
| `رَبِّ` (with marks) on the unmarked edition | the same 1,115 matches: **the API ignores marks** |
| `رب` on the marked `quran-uthmani` edition | the same 1,115 matches |
| `zzzzqqq` | **404** "Nothing matching your search was found" (this means "no results", not an error) |
| `mercy` in surah 2 only | 200 (the scope is accepted) |
| `go` (2 letters, English) | 200, 617 matches, 2.3 to 2.7 s, 58 KB compressed (336 KB uncompressed) |
| `mercy` in `en.sahih` (Saheeh International) | 200, 143 matches: **that edition exists** |

The six responses whose headers I read all carried `Access-Control-Allow-Origin: *`, so a browser can call the API directly. Latency is 0.7 to 3.4 s, so a loading state and cancelling stale requests matter.

## 3. What the prototype adds and what it drops

**Adds** (all new): one box over Ayahs, Surahs, People, Stories, Duas, Knowledge base, Daily Fiqh and Notes; result-type filter chips with counts; typing `2:255` jumps to the reader (and says "Al-Baqarah has 286 ayahs" for `2:999`); a strip showing where the results fall in the Qur'an; history with Undo; a designed offline state; mark-insensitive matching with highlighting; a `/` shortcut; no 3-character floor.

**Drops** (the legacy page has them, the prototype does not). **Each needs your yes or no (question 1):**

- choosing the edition (English, Urdu, Arabic, Arabic tafsir; 10 editions);
- limiting to one surah or one juz;
- "Bookmarked ayahs only";
- the shareable filter URL (the prototype keeps only `?q=`);
- the "Suggested" searches (it shows other "Browse" chips).

**Conflicts with the legacy data**

- **History format.** The prototype stores `{id, q, at}` objects, 12 at most, in `quran:search-history:v1`. The legacy parser expects strings (it calls `q.toLowerCase()` on each), so objects would **break the legacy app after a rollback**. The build keeps **`string[]`, 15 at most**, as above.
- **Which translation.** The prototype labels ayah results "Saheeh International". The legacy search offered Pickthall, Yusuf Ali and Asad, and the reader's English text comes from a different provider with **no translator named anywhere in the app** (a recorded gap in `DECISIONS.md`). A result could therefore show different English from the reader for the same ayah.
- **Checked 2026-10-22:** the reader's English text equals none of the search API's 17 English editions on 32:10 (it is not Saheeh, Pickthall, Yusuf Ali, Asad or Itani; closest by shared words is Itani at 81%). The reader's **Urdu** text is identical to the API's Jalandhry edition. So the default Urdu edition is Jalandhry; there is no English edition to default to that matches the reader, and the legacy default (Pickthall) stays. The edition's name is shown on every result, and the reader's translator is never shown next to other text.

## 4. Proposed design

**Route and levels.** `/search`, `?q=` kept in the URL, `noindex`. The page shell is level A. Ayah text search is level C (online only). Everything else is on the device.

**Which groups ship in Phase 10.** Only the groups whose data and pages exist today: **Ayahs, Surahs, People, Stories, Notes.** Duas, Knowledge base and Daily Fiqh need pages that do not exist until Phases 12 and 13 (and their data is not vendored yet), so a result would open "This page is not rebuilt yet". I would build a small **provider registry**: each group is one provider (a function from the query to results), and Phases 12 and 13 add theirs when their pages land. No dead links, no rework.

**Filters.** One **Filters** button next to the field opens a popover on desktop and a bottom sheet on mobile, holding the legacy controls: edition (10, grouped English, Urdu, Arabic, Arabic tafsir), one surah, one juz, bookmarked only. The type chips (Ayahs, Surahs, People, Stories, Notes) stay visible on the page. Filters are kept in the URL (`?q=&g=&e=&s=&j=&b=`, the legacy names) so a search is shareable; the button shows how many are active.

**Ayah search.**

- A new `app/services/search.service.ts` through the existing `useQuranApi2()` client (`https://api.alquran.cloud/v1`), so no component fetches a third-party API.
- Starts at **2 characters** (any script) after a pause of about 300 ms; **older requests are cancelled** with an `AbortController` when the text or a filter changes (fixes bug 3); a loading state; three distinct outcomes: results, **404 = no results**, and **failure or offline = the error or offline note**. Repeated searches in a session come from a cache keyed by query, scope and edition.
- **History is saved only after a search succeeds** (it returned results), once the text has settled for about 1.5 s, or at once on Enter or when a result is opened. Failed and empty searches are never saved (fixes bug 2).
- Show at most **60** with the true total ("60 of 1,115"); the response is downloaded whole (up to about 96 KB compressed), as in the legacy page.
- The **local groups** (Surahs, People, Stories, Notes) match from **1 character**, instantly, with no request.
- Juz scope is computed on the device from the juz table the app already has (`juzOfAyah`), so it needs no second request and **cannot fail silently** (fixes bug 1); if anything about a filter cannot be applied, the page says so instead of showing unfiltered results under a filter label. Bookmark scope uses the existing saved-ayah keys.

**Highlighting.** Text is split into plain and matched parts and rendered as elements, never as HTML (the legacy escaped then used `v-html`). Matching uses one shared normaliser. The app already has `normalize()` in `app/lib/listingSearch.ts` (marks and tatweel removed, alef and yeh folded, repeated letters collapsed). The prototype has a second, different one (`ة` to `ه`, no collapsing). I would **extend the existing one and use it for both the listing and Search**, rather than keep two, and add the cases the prototype needs. Whether to fold `ة` to `ه` is a question for a reader of Arabic (it is listed in `CONTENT_TO_VERIFY.md`); I would leave it out until confirmed.

**Local groups.** `searchPeople` and `filterStories` already exist. Surahs come from the bundled surah table (legacy spellings). Notes come from the Library's stored notes. Each result opens an existing page (`/persons/<id>`, `/stories/<id>`, the reader through `surahHref`). Notes: question 4.

**History.** `quran:search-history:v1` stays a `string[]`, 15 at most, case-insensitive de-duplication, tolerant of damaged data on read. Remove one and Clear all both offer Undo (no confirm). A **parity test runs the legacy `useSearchHistory.ts` itself** (vendored unmodified, as with `useAudioPlayer`) against what the revamp writes, in both directions.

**Ayah jump.** `2:255`, `2.255` or `2 255` becomes "Open <surah> 2:255" (opens `/surah/2#ayah-255`, which the reader already handles). Numbers are checked against the real ayah counts, not a typed list.

**Other pieces.**

- A shared **`QuranThread`** component (the prototype's one-line map of the Qur'an), because Downloads, the knowledge modules and Goals reuse it. Built once here, from the real ayah table.
- The `/` shortcut focuses the search field when no input has focus. The header's existing search link and the drawer row keep working.
- Accessibility: results in a list with a live count, filter chips with `aria-pressed`, 44 px targets, 375 px layout, Arabic never truncated or letter-spaced, visible focus.
- No new storage keys, no IndexedDB, no streaks or counters.

## 5. Content integrity

Nothing from the prototype ships: not its 13 sample ayahs, its sample index, its history, its "Browse" chips, or its "Saheeh International" label unless that edition is the one used. Result text and the edition name come from the API response itself (`edition.englishName`). The wording of ours (hints, empty states, the offline note) is listed in `CONTENT_TO_VERIFY.md` under Search and gets a read-through at the end of the phase.

## 6. Files, tests, screenshots

**Added or changed:** `app/pages/search.vue`; `app/components/search/` (field, result groups, ayah result, filter sheet, thread); `app/components/layout/QuranThread.vue`; `app/services/search.service.ts`; `app/lib/searchMatch.ts` (normalise, highlight), `searchIndex.ts` (providers), `searchHistory.ts`, `ayahJump.ts`; `app/lib/listingSearch.ts` (shares the normaliser); `legacy/app/composables/useSearchHistory.ts` (added to `scripts/lib/legacy-files.mjs` and synced); `docs/pages/search.md`, `docs/phases/phase-10-search.md`.

**Unit tests:** the normaliser and highlighter on the cases above (`yusuf` finds Yūsuf, `رب` finds `رَبِّ` and is highlighted, the Latin and Arabic length floors); the ayah-jump parser against the real counts; history compatibility in both directions with the legacy code; result mapping from recorded API responses (200, 404, an odd shape); the provider registry.

**Browser tests** (mocked API, fixed clock, `forbidRealApis`): grouped results and filter chips; the filter sheet (edition, surah, juz, bookmarked); `2:255` jump and `2:999` message; 404 versus failure; **offline** (set the context offline and `api.mode = "network"`, per `CLAUDE.md`) shows device groups and the offline note for ayahs; stale-response cancellation; history add, remove and Clear with Undo; `/` shortcut; deep link `?q=`; keyboard-only pass; 1280 px and 375 px, light and dark. A live-check script (`scripts/live/search.live.ts`, not in CI) confirms the real response shape still parses.

**Screenshots** against `prototype-remaining-pages.html#/search`, with every intentional difference listed in a `docs/design/search-compare/README.md`.

## 7. Risks

- **One upstream for ayah text.** It is third-party, 1 to 3 s, and returns every match in one response; there is no paging. The 60-result cap and cancelling mitigate it; an outage shows the offline note.
- **Result wording can differ from the reader's** (section 3). Resolved by question 2.
- **The shared normaliser changes the Surah listing's matching** if I extend it. The listing's existing tests pin its behaviour; I would run them first and keep them green.
- **The `/` shortcut** can clash with typing elsewhere; it is limited to when no input, textarea or editable element has focus.
- **Index cost** is small (114 surahs, 59 people, the stories, the notes) and built once on first open.

## 8. Decisions (answered 2026-10-22)

| # | Question | Decision |
| --- | --- | --- |
| 1 | Keep the legacy filters? | **Yes, all of them** (10 editions, one surah, one juz, bookmarked only, shareable URLs) behind one **Filters** control; the type chips stay visible |
| 2 | Which editions and default | Keep the legacy 10 (Saheeh International is **not** added). Label every result with the edition used. Default English would be the reader's translation if the API had it; **it does not** (section 3), so the default stays Pickthall. Default Urdu is Jalandhry (identical to the reader's Urdu). Arabic tafsir search stays, with the legacy note "Sunni tafsir sources, Arabic only" |
| 3 | History format | **`string[]`, 15 at most**, legacy key. Saved only after a successful search |
| 4 | Where a note opens | Not answered; I will open the note's ayah in the reader (Library items already open there). Tell me if you want otherwise |
| 5 | Minimum length | **Changed:** local groups from 1 character; ayah search from 2 characters, after about 300 ms |
| 6 | Groups now | **Approved:** Ayahs, Surahs, People, Stories, Notes. Duas, knowledge modules and Fiqh join in Phases 12 and 13 |
| 7 | "Browse" chips | Not answered; I will show the legacy eight suggested searches (patience, mercy, forgiveness, gratitude, prayer, fasting, charity, guidance) |
| 8 | When history is saved | After a successful search (above) |
| 9 | `ة` to `ه` folding | Not answered; left out until someone who reads Arabic confirms |
| 10 | `QuranThread` shared component | **Keep the "where results fall" strip if cheap.** It is cheap here: it needs only the ayah positions already in the results and the app's ayah table. Built as a shared component |

Also decided: real data wins over the prototype's spellings, ids and dates everywhere (`DECISIONS.md`).

## 9. Not part of Phase 10

Downloads (11), the knowledge-module pages and their search provider (12), Daily Fiqh and its provider (13), Goals and Calendar (15), a full-text search over tafsir other than the four legacy editions, search suggestions as you type, and any server-side index.
