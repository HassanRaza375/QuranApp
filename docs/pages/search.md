# Page: Search

- Route(s): `/search` (a legacy route). `?q=` text, `g` / `e` edition group and edition, `s` surah, `j` juz, `b=1` saved ayahs only (the legacy names), `t` the type chip (new).
- Phase: 10 (plan and decisions: `docs/phases/phase-10-search-plan.md`, `docs/DECISIONS.md`)
- Prototype section: `docs/design/prototype-remaining-pages.html`, `#/search`
- Offline level: **C for ayah text** (online only; a designed offline state), **A for the rest** (Surahs, People, Stories and Notes are on the device, and an ayah typed as `2:255` opens without a request). The page itself is in the precached shell.
- Indexable: no (`noindex, follow`, as the legacy page was)

## Purpose

One box that searches the Qur'an's ayahs (online) and, on the device, the surahs, the people, the stories and your own notes. Typing an ayah number opens that ayah.

## Layout

One column, 768 px wide at most. Top to bottom: the title and one sentence; the box and a **Filters** button (with the number of filters on); the type chips (All, Ayahs, Surahs, People, Stories, Notes) with counts once something is typed; a "Filters on: …" line with Clear when any filter is on; then either the start view or the results.

- **Start view** (box empty): Recent searches (chips you can reuse or remove, and Clear) or "Your searches appear here, on this device only."; and the eight suggested searches of the legacy page.
- **Results:** the "Open <surah> n:m" card for a typed reference (or a one-line message when the numbers are impossible); the "where your results fall" strip (the whole Qur'an as one line, a mark per shown ayah); the **Ayahs** group (up to 60, with the true total) headed by the edition searched ("English: Pickthall", "Urdu: Jalandhry", "Arabic: Quran text", "Tafsir: Muyassar"); each result opens the reader at that ayah, with no reader text beside it; then **Surahs, People, Stories, Notes** (four each under All, with "Show all N"; the chip shows one group in full, up to 50).
- **Filters** (side panel on desktop, bottom sheet on mobile): Search in (English, Urdu, Arabic (Quran text), Arabic Tafsir), Edition (the ten legacy editions), Surah, Juz, Saved ayahs only, Reset, Done. Every change applies at once.

Desktop starts with the cursor in the box (as the legacy page did); on a phone it does not, so the keyboard does not cover the page.

## Components

| Component | Source | Notes |
| --- | --- | --- |
| `SearchPage`, `SearchFiltersSheet`, `SearchLocalRow`, `SearchHighlightedText` | custom (`app/components/search/`) | highlighting renders segments as text, never as HTML |
| `QuranThread` | custom, shared (`app/components/`) | the whole Qur'an as one line; reused by Downloads, the knowledge modules and Goals later |
| `Sheet`, `Input`, `Button`, `Switch`, `Skeleton`, `SettingsSegmentedControl` | shadcn-vue and the existing settings control | the edition controls are real radio groups |

## Data

| Data | Service / composable | Cache or storage key |
| --- | --- | --- |
| Ayah text search | `SearchService` (`useQuranApi2`, `https://api.alquran.cloud/v1/search/<text>/<surah or all>/<edition>`) through `createAyahSearcher` | an in-memory cache for the session (24 answers, by text, scope and edition); nothing stored |
| Surahs | the bundled surah table (`SURAH_ROWS`, the legacy spellings) | none |
| People, Stories | `searchPeople`, `filterStories` over the legacy data (`@legacy`) | none |
| Notes | the Library store (`itemMeta` notes and tags of any item, saved or not) | `quran:library:v1` (read only) |
| Saved ayahs filter | the Library's bookmarks | `quran:bookmarks:v1` (read only) |
| Recent searches | `lib/searchHistory.ts` | `quran:search-history:v1`, **a JSON array of strings, 15 at most, newest first** (the legacy format; the legacy composable is run against it in `tests/searchHistory.test.ts`) |

## States

- **Loading:** "Searching…" with three placeholders in the Ayahs group (the group has `aria-busy`); earlier results stay, dimmed, while a newer search runs.
- **Empty / first run:** the start view. A single character shows the device groups at once and no ayah request.
- **No results:** "No ayahs match “…” in <edition>" inside the Ayahs group; if nothing matches anywhere, "Nothing matches “…”. Check the spelling, try fewer words, or search an ayah number like 18:10."
- **Filtered out:** "None of the N matches pass your filters. Clear filters."
- **Error:** "The search service didn't give an answer this time. Try again." (an HTTP error or an unreadable answer).
- **Offline:** "Searching ayah text needs a connection. What is on your device still works, and an ayah opens directly by its number, like 2:255. Try again." No request is made when the browser reports it is offline.
- **Fiqh variants:** not applicable.
- **Dark mode:** designed (screenshots in `docs/design/search-compare/`); the highlight uses the accent's soft tone in both themes.

## Interactions

- Typing: device groups update at once; the ayah search starts at 2 characters after about 300 ms, and replaces (cancels) the request before it. Digits only, or a typed reference, are never sent to the text search.
- Enter, or opening a result, saves the search to Recent if it succeeded; otherwise it is saved once it has settled for about 1.5 s. A failed or empty search is never saved.
- Recent: tap a chip to reuse it; the cross removes it; Clear removes all. Both show a toast with **Undo** (no confirmation).
- Type chips narrow the page to one group (`aria-pressed`). "Show all N" does the same.
- `/` on any page opens Search with the cursor in the box (not while typing in a field, with a modifier key, or while a sheet or dialog is open).
- Opening an ayah, surah, person or story goes to its page; a note opens the item it is on (an ayah in the reader, a person's page, …), or is shown without a link if that item has no page yet.

## Accessibility

Focus order: box, Filters, the chips, then the results. One `h1`. A visually hidden live region announces the counts ("Found 155 ayahs, 5 people, …") and "Searching…". Chips and filter controls are real buttons, radios and a switch with labels. Touch targets are at least 44 px at 375 px (tested). Arabic and Urdu results are `lang`/`dir="rtl"`, never truncated or letter-spaced, and the Arabic scales with the Arabic size setting. The Arabic name beside a surah, person or story shows on every width.

## Cross-links

Linked from the header (the box on desktop, the icon on mobile), the sidebar and the `/` key. It links to the reader (`/surah/n#ayah-a`), `/persons/<id>`, `/stories/<id>`, and the Library's items.

## Known differences from the prototype

See `docs/design/search-compare/README.md` for the full table (the groups for Duas, the knowledge modules and Daily Fiqh are absent until Phases 12 and 13; the Filters control; the history format; no "Saheeh International" label; and others).

## Tests

- Unit: `tests/searchFold.test.ts` (the fold equals the old normaliser on 500+ strings; highlighting), `searchState.test.ts` (editions against the vendored legacy list, URL state, ayah jump), `searchHistory.test.ts` (including the legacy composable run both ways), `ayahSearch.test.ts` (on real recorded answers: parsing, filters before the cut, cancellation, cache, outcomes), `searchLocal.test.ts`, `searchShortcut.test.ts`, the service URL in `services.test.ts`.
- Browser: `e2e/search.spec.ts` (40 tests, on the production build with the upstream answered from recorded real responses and every real API blocked).

## Open questions

- The reader's English translation is not one of the upstream's English editions, so result wording can differ from the reader's for the same ayah (`DECISIONS.md`). Decided: the group names the edition searched, and no reader text is shown beside results.
- Teh marbuta and heh count as one letter in the device groups and in highlighting (not in the app's other filters, and not in the upstream's ayah search). A reader of Arabic should still confirm the rule (`CONTENT_TO_VERIFY.md`).
