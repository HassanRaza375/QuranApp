# Phase 9 plan: split, and Phase 9A (Per-page reader)

Status: **plan only, waiting for approval.** Written 2026-10-21 after reading the legacy `app/pages/per-page-read.vue`, `useBookmarks.js`, the revamp's `quranMeta`, `readerLinks`, `pins`, `readingProgress`, the Listing Page tab, the surah reader and the prototype (`d-page-mushaf`, `m-page-mushaf`, `mushafFrameInner`).

## 1. The split

Agree with 9A (Per page) and 9B (Tasbeeh, Sajda, Asma-ul-Husna). 9A touches the listing, the Library, pins and the reader's text cache; 9B is three independent small pages on existing data. I would read the legacy sources of 9B (`/tasbeeh`, `/sajda`, `/asma-ul-husna` and the `sajda` server route) in the 9B plan, not now.

## 2. What the legacy page does and omits

`app/pages/per-page-read.vue` (about 130 lines of script and template):

| Does | Omits |
| --- | --- |
| Route `/per-page-read?page=N`; N outside 1 to 604 or not a number opens page 1 | Any text-size control (fixed 2.25rem, smaller on narrow screens) |
| Fetches `https://api.alquran.cloud/v1/page/N/quran-uthmani` from the browser (no server route, no IndexedDB, no app cache of its own) | Offline reading of its own (it works only if the browser or service worker happens to have the response) |
| Shows the page's ayahs as one continuous, justified, RTL text block with `﴿n﴾` after each ayah and `۩` after a sajda ayah | Mushaf lines (no line data exists) |
| Header badges: the surah name of the **first** ayah only; "Juz N" of the first ayah; "Hizb N" where N is actually `hizbQuarter` (a number from 1 to 240, so the label is wrong) | The other surahs on a page (a page can hold the end of one surah and the start of the next); the Bismillah; the juz change mid-page |
| Autocomplete of 604 "Page - N" entries, Prev and Next (disabled at ends), a skeleton while loading | A slider, a Go-to box, keyboard handling, an error or offline state (a failed request shows an empty page) |
| A bookmark toggle writing the legacy `page:N` item (the same `quran:bookmarks:v1` that Bookmarks and the Library read) | A pin, play, share, translation, any link to the surah reader |
| Records **no** reading progress | |

## 3. Where the page text comes from (the one real decision)

The revamp already holds `PAGE_STARTS` (604 entries of `[surah, ayah]`, from the same service's `/v1/meta`), so a page's ayahs are `PAGE_STARTS[p]` up to just before `PAGE_STARTS[p+1]` (page 604 runs to 114:6). No page-to-surah or juz mapping is typed: it is all from that table.

- **Option A (recommended):** build each page from the surah text the surah reader already loads and caches (`quranapi.pages.dev`, `arabic1`, the `chapters` store in `quran-revamp-db`). A page needs one surah, or two when it crosses a boundary. Advantages: the exact same Arabic as the surah reader (no second edition to disagree), the Hifz and Listen text, offline for any surah opened once, no new endpoint, no new store, no new CORS surface. Cost: a page of an unopened surah needs that whole surah once (the cache then serves every page of it).
- **Option B:** the legacy `alquran.cloud /v1/page/N/quran-uthmani`. A different edition from the surah reader's Arabic (so the same ayah could read slightly differently between the two readers), a new store and a request per page.

**Check before relying on A:** I will record the real `page/N` responses for a handful of pages (1, 2, a page that crosses a surah boundary, 49, 604) and a test will assert that the ayah list the service returns equals the range derived from `PAGE_STARTS` (and a unit test asserts that the 604 ranges are contiguous and cover all 6,236 ayahs exactly once). If they ever disagree, A is dropped and I come back to you.

Not used from the prototype: its page-1 text, its `pageSurah`/`juzOfPage` mapping, the "20 pages per juz" rule, and page 49 as the demo page.

## 4. Route, navigation and focus

- The route stays `/per-page-read` with `?page=N` (confirmed: `readerLinks.pageHref` and the Listing's Page tab chips already point there, and the legacy Bookmarks page links the same way). Flipping `READERS_READY.page` to true removes the listing's "not rebuilt yet" note and makes the Library's Page row open it; the existing no-dead-links test then covers it.
- Out-of-range or non-numeric `page` opens page 1, as the legacy page does (documented, tested). A change of page uses `router.replace` (no history flood) and the heading receives focus with a polite live region announcing "Page 49 of 604".
- Controls, in this order: Previous page, Next page (disabled at 1 and 604 with `aria-disabled`, not removed), a **slider** (`input[type=range]`, 1 to 604, `aria-valuetext` "Page 49 of 604", commits on change so dragging does not load 600 pages), a **Go to page** box (numeric, Enter to go, "Enter a page from 1 to 604." inline on a bad value, no navigation), and a link "Open <surah> in the reader" for the first ayah on the page (`/surah/N#ayah-M`).
- Keyboard: Tab order as above; no global key shortcuts by default. **Decision for you:** also bind ArrowLeft = next page and ArrowRight = previous (mushaf direction), only when focus is not in a field, or leave arrows alone. I recommend leaving them off (they conflict with scrolling and screen-reader navigation); say if you want them.
- Targets are 44px on mobile; the slider's thumb is 44px.

## 5. Layout of the page

- **Flowing text, not mushaf lines.** There is no line data, and inventing line breaks would misrepresent the printed mushaf, so the page is a framed, justified RTL block (`lang="ar" dir="rtl"`, no letter spacing, the reader's `.ar` face and the existing `verse-mark` markers). It is titled "Page 49", not "mushaf page 49", and the page doc says it reads in the order and page boundaries of the standard 604-page Madani layout but is not a line-for-line copy. **Decision for you:** accept that wording, or hold the page back until real line data is supplied.
- **Inside the frame:** a thin head ("Juz 2", or "Juz 1 to 2" when a juz starts on the page, taken from `juzOfAyah` of the first and last ayah) with the surah names on the page; a banner where a surah **starts** on the page (the Arabic name from `SURAH_ROWS`) followed by the Bismillah where the surah reader shows it (not on Al-Fatihah, whose Bismillah is ayah 1, and not on At-Tawbah), taken from the cached text of Al-Fatihah ayah 1 as the surah reader does, never typed; the ayahs with `﴿ ﴾`-style markers (the reader's `verse-mark`, gold, as the design system allows for verse markers only); `۩` after a sajda ayah only if the cached text carries it. The legacy sajda mark is not reproduced unless the data marks it (the surah text from `quranapi` has no sajda field I know of; I will check and, if absent, show none rather than type a list; Sajda is 9B).
- **No "Hizb" label.** The legacy label is wrong and the revamp has no hizb data; leaving it out is better than a typed one. (If you want Hizb, it needs the service's per-page `hizbQuarter`, which Option A does not use.)
- **Text size:** the Arabic size follows the global `arabicScale` setting (0.8 to 1.6, default 1) through `--arabic-font-scale`, as the surah reader does. The prototype's A- and A+ buttons would write that same global setting (so the surah reader changes with them) in 0.1 steps; **Decision for you:** keep A-/A+ on the page (writes the global setting) or leave size to Settings only. I recommend keeping them: it is the same value, one source of truth.
- Dark mode and 375px follow the existing tokens; the frame uses the reader's surface and border tokens, no gold except the verse markers.

## 6. Tools

- **Pin page:** writes the Page slot of `quran:pins:v1` (`{ pageNo, pinnedAt }`, the reading pin and unknown fields kept, `lib/pins.ts` already has `readPagePin`/`writePagePin`), with a toast and Undo; one page pin (a new pin replaces it, Undo restores the old one); the Library's Page slot, which says "Not set" today, then shows it and opens this page.
- **Save (the star):** writes the legacy bookmark `page:N` exactly as the legacy toggle does, with Undo; the Library and Bookmarks already read it. (Pin and Save are different things and both stay, as for the surah reader and People.)
- **Play page:** **not possible before Phase 4B** (no per-page audio exists and the player is not rebuilt). The control is a real disabled button with the reason "Listening arrives with the audio player (Phase 4B)", as on Stories. It is not hidden and not a dead link.
- **Text size:** as in section 5. Link to the surah reader: above.
- No translation here (the legacy page has none; a per-page translation view would be new behaviour and needs its own decision).

## 7. Reading progress

The legacy page records nothing. The revamp keeps that: **opening a page does not write `quran:reading-progress:v1`**, so the Listing's "Last read" marker (which comes from the surah reader and the legacy shape) is not overwritten by browsing pages. The Listing's Page tab does show the page of the last read ayah (`pageOfAyah`) as the current page, so a user who reads in the surah reader still sees their page highlighted. The only per-page state the user creates is the Page pin and `page:N` bookmarks.

**Decision for you:** if you would rather have the page reader count as reading (writing the progress to the first ayah on the page), say so; it changes what Home's "Continue reading" shows, which is why I did not choose it by default.

## 8. Offline

- Level B: text for a page is available offline if the surah(s) it touches are in the `chapters` store (any surah opened once in the surah reader or the page reader, plus the Workbox `CacheFirst` copy of the `quranapi` responses). Nothing new is stored: no version bump, no new store, `quran-app-db` is never opened.
- A page whose surah is not saved and there is no connection: "This page’s text is not saved on this device yet. Connect once to get it." with Try again; the controls still work (the user can go to a saved page). A failed request with a connection shows "Couldn’t load the page. Try again in a moment."
- When online and idle, the reader quietly loads the next page's surah if it differs from the current one (a page crossing into the next surah), so Next does not stall at a boundary. No bulk download (that is Phase 14).

## 9. Tests

- Unit: the 604 page ranges (contiguous, 6,236 ayahs once each, page 604 ends at 114:6, page 1 is 1:1 to 1:7, the pages that start mid-surah), a page that spans two surahs and one that starts a surah mid-page (the banner and Bismillah rules including Al-Fatihah and At-Tawbah), the juz label (single and "1 to 2"), query parsing (NaN, 0, 605, a float), the Go-to validation, `PAGE_STARTS` against recorded real `page/N` responses, the pin write keeping the other fields, `page:N` bookmark shape.
- Browser (recorded real surah responses, production build): the page renders Arabic from the cached surah; Previous and Next, the slider, the Go-to box (valid and invalid), the URL follows (`replace`), focus and live region; Pin with Undo (and the Library's Page slot); Save with Undo (legacy key); Play disabled with its reason; text size at 0.8, 1 and 1.6 (no horizontal scroll at 375px); offline with a saved and an unsaved surah; the Listing's Page chips open it and the "not rebuilt yet" note is gone; the no-dead-links test; dark mode and 375px (one h1, 44px targets).

## 10. Screenshots (prototype pair plus states)

1280 and 375, light and dark, prototype beside revamp: page 1 (the only page the prototype shows with text), and a revamp-only set: a page that starts a surah (with the banner and Bismillah), a page that crosses two surahs, **the Arabic at the largest scale (1.6)** at 1280 and 375, the loading skeleton, the offline-unsaved state, the invalid Go-to message, a pinned page, a saved page. Written to `docs/design/per-page-compare/` with a README listing differences (flowing text instead of lines, no Hizb, real data instead of typed page 1, Play disabled).

## 11. Content to verify (to be added to CONTENT_TO_VERIFY.md at the end of 9A)

Wording of ours: "Page N of 604", the header line, "Open <surah> in the reader", the offline and error lines, the Play-disabled reason, the invalid Go-to line, and the page doc's "not a line-for-line mushaf" sentence. The Arabic comes only from the cached text.

## 12. Decisions I need

1. Option A (text from the surah reader's cached text, with the recorded-response check) or Option B (the per-page endpoint).
2. Flowing text with the "not a line-for-line copy" wording, or hold back until real line data is supplied.
3. Keep A-/A+ on the page writing the global Arabic size.
4. Opening a page does not write reading progress (recommended), or does.
5. No Hizb label (recommended), or add it from the service.
6. Arrow keys: off (recommended) or ArrowLeft/ArrowRight for next and previous.
7. Out-of-range `page` opens page 1, as the legacy page does.
