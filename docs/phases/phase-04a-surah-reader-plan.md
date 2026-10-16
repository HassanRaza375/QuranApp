# Phase 4A: Surah reader (plan, awaiting approval)

- Branch: `revamp-design-logic`
- Prototype: `d-page-reader` and `m-page-reader` (`readerHTML`, `ayahHTML`, `menuInner`, `ddHTML`).
- Routes: `/surah/[id]` (a legacy route, kept; `#ayah-<n>` opens at an ayah). `/juz/[id]` and `/per-page-read` stay as they are (see section 9).
- Offline level: **B**. A surah and the tafsir of an ayah work offline once they have been opened (or downloaded in Phase 11); nothing is bundled.

No code is written until this plan is approved. Done before the plan (the two items you asked for): the Sort menu is wider and says "Name ignores Al-, An-"; a keyboard test covers every row, star, Play and page chip; and `scripts/check-audio-urls.mjs` checked all 570 audio URLs (`docs/audio-url-check.md`): see "Audio files" under section 11, because one finding affects Phase 4B.

## 1. The split: 4A and 4B (confirmed, with one change)

| | Phase | Contents |
| --- | --- | --- |
| **4A** | Reader | `/surah/[id]`: header, bismillah, the ayahs (Arabic and translation, layout and size preferences), translation and tafsir menus and per-ayah tafsir, save (star) and pin, plain share, reading progress (legacy format), the new Completed marker, the listing's links. "Play surah" in the header uses the Phase 3 player (play and pause only). |
| **4B** | Full player | Seeking and the progress bar, resume (`quran:audio-resume:v1`), repeat, auto-next (`prefs.autoplay`), per-ayah audio (play, and download hands off to Phase 11), the player sheet, Media Session, the playing ayah highlighted in the reader. |

**One change:** the **image share card** is neither 4A nor 4B. The legacy card (`AyahShareCard`, `useAyahCardImage`: about 700 lines, 16 colour themes, custom colours, patterns, a canvas export) has **no screen in the prototype** (its Share button does nothing there), so there is nothing approved to build. 4A uses the plain share Home already has (Web Share, else copy), with the same text format. The card becomes a small phase of its own after a design exists (suggested 4C). Open question 1.

In 4A the per-ayah play and download buttons are **not shown** (a button that does nothing is worse than none); they arrive with 4B.

## 2. What the legacy reader does (read from `app/pages/surah/[id].vue` and its composables)

- **Data:** one request per surah, `GET quranapi.pages.dev/api/<n>.json`, which holds the names, place, ayah count, five `audio` entries and **five texts**: `arabic1` (with diacritics), `arabic2` (plain), `english`, `urdu`, `bengali`. (Checked 2026-10-16: Al-Baqarah is 527 KB.) Translations are therefore part of the chapter and need no further request.
- **Tafsir:** one request per ayah, `GET .../api/tafsir/<s>_<a>.json` (29 KB for 2:255), returning `tafsirs: [{ author, groupVerse, content }]`. Three authors exist: **Ibn Kathir, Maarif Ul Quran, Tazkirul Quran** (the last gives a group note, for example "a tafsir for the group of verses 2:255 to 2:257"). The content is markdown-lite (headings, bold, italics), rendered by `renderTafsirMarkdown`, which escapes the text first, so it is safe for `v-html`; I will reuse it through the bridge and test that markup in the text stays text.
- **Cache (legacy):** IndexedDB `quran-app-db` (`chapters` and `tafsirs` stores, immutable text, "fetch once, read forever"), then the service worker's `quran-api-cache` (CacheFirst for `quranapi.pages.dev`, kept in the revamp). **`quran-app-db` is never opened by the revamp** (rule). See section 5 for the revamp's own cache.
- **Verse display:** a tab per text (`arabic1`, `arabic2`, `english`, `bengali`, `urdu`) shown **instead of** the Arabic, remembered in the raw key `preferredVerseDisplay`. A per-ayah **Translation** button opens a panel with a language chip (the choice sets the global default `translationDefaultLang`), and a per-ayah **Tafsir** button opens a panel with an author chip (the choice sets `tafsirDefaultAuthor`). The prototype replaces this with one Translation menu for the page and one Tafsir menu (the default source) plus a per-ayah Tafsir toggle (section 3).
- **No bismillah** in the legacy reader. (Data check: `arabic1[0]` of surah 2 and the others is the first ayah only; the bismillah is `arabic1[0]` of **surah 1**, where it is ayah 1; surah 9 has none.)
- **Hash links** (`/surah/2#ayah-285`, from Home, the Library and Goals) are produced everywhere, but the legacy reader has no code that scrolls to the hash after the data loads, so they depend on the browser's own anchor handling (the elements have `id="ayah-N"` but appear after an async fetch). The revamp will scroll to the ayah once it is rendered.
- **Reading progress:** a scroll listener (400 ms debounce) finds the last ayah whose top is above 35% of the viewport and calls `setProgress(surah, ayah, { surahName: surahNameTranslation, surahNameArabic: surahNameArabicLong, totalAyah })`, which writes `quran:reading-progress:v1` = `{ surahNo, ayahNo, surahName, surahNameArabic, totalAyah, updatedAt }` (one record, replaced each time). Ayah 1 is not written on open (the check `ayahNo === lastTrackedAyah` skips it), so merely opening a surah changes nothing until you scroll to ayah 2 or later.
- **Goals:** each tracked ayah also calls `recordAyahRead`, which appends `"<surah>:<ayah>"` to `quran:reading-goals:v1` `dailyLog[<local date>]` (unique per day). Only the ayah the debounce lands on is recorded, so a fast scroll skips the ones in between. The reader calls `loadGoals()` first so it never overwrites saved goals with an empty state.
- **Save:** the star toggles `ayah:<s>:<a>` in `quran:bookmarks:v1` (+ `added-at`), no Undo in legacy.
- **Pin:** **does not exist in the legacy app.** The prototype's "Pin as where I stopped" feeds the Library's "Where I stopped" section (Phase 6), which has no legacy data. See section 7.
- **Per-ayah audio:** uses only reciter 1's file per ayah (`verse.audio["1"]`, from `/api/<s>/<a>.json`), ignoring the chosen reciter (4B decides).
- **Reciter on the page:** the legacy page re-resolved the chosen reciter's URL for each surah by name (same as Phase 3).

## 3. Layout and behaviour in the revamp

### Header (prototype `reader-head`)
Back link "Surah listing", the Arabic name (`arLong`, which already begins with the word surah), "Surah 2 · 286 ayahs · Madina", then the bar: **Play surah** (Phase 3 store: play and pause, the reciter from `prefs.reciter`), **Translation** menu, **Tafsir** menu (the default source), **Reciter** menu. Menus are popovers on desktop and bottom sheets on mobile (the shared `ResponsiveMenu`, 46px rows). On mobile the bar is two columns with Play surah full width, as in the prototype.

### Bismillah
Shown above the first ayah for surahs 2 to 114 **except 9**, never for surah 1 (where it is ayah 1). **Its text is not typed anywhere in the code:** it is read from the real data (`arabic1[0]` of chapter 1, fetched once and cached). If chapter 1 is not available (first visit, offline) the line is omitted rather than invented. Open question 6.

### Ayah row
- Arabic: `arabic1`, the legacy Qur'an font, size from the Arabic size setting, a gold verse marker with the number (the only gold), RTL, never truncated.
- Translation (from the Translation menu) below, in its own font (Urdu Nastaliq, Bengali serif, English serif) and direction.
- **Verse layout** preference: Arabic first or Translation first (`verseLayout`, Phase 2).
- Tools row: **Tafsir** (toggle), then Save (star), Pin, Share. 44px targets on mobile.
- **Tafsir panel** under the ayah: tabs for the three sources (a segmented control; the default comes from `tafsirAuthor`, else the last used; choosing one writes `tafsirDefaultAuthor`, as legacy). Loading text, an error with Retry, the group note, and a source line. A note in the Tafsir menu and panel states **"No Ja'fari tafsir is available from this app's data provider."** (the legacy wording says the same; I will not add "Sunni sources", which I cannot verify: Open question 7).
- Previous and next surah links at the end.

### Preferences used (all from Phase 2, none new)
`prefs.verseLayout`, `effectiveTranslationLang` (explicit `translationDefaultLang`, else the translation of the old reader tab), `prefs.tafsirAuthor`, the Arabic size, `prefs.reciter`, `prefs.playbackRate`, Reduce motion. The reader menus write the same legacy keys as Settings.

### Translation "Off"
The prototype has Off; the legacy data has no way to store it (Settings' "Not set" removes the key, and then the old reader tab can still supply a language). Proposal: **Off is a new additive key `quran:reader-prefs:v1` = `{ "translation": "off" }`**, read by the reader only, cleared when a language is chosen; the legacy app ignores it. Unset and nothing else known means English (as Home does). Open question 2.

### Opening at an ayah
`/surah/2#ayah-255` renders, then scrolls that ayah under the header and moves focus to it (`tabindex="-1"`), with a brief highlight (still under Reduce motion). A bad hash (ayah 0, 999, text) is ignored; a bad surah number (0, 115, `abc`) shows "That surah doesn't exist" with a link to the listing.

## 4. Text rendering and performance

- Al-Baqarah is 286 ayahs and 527 KB. Same approach as Phase 3: plain elements, one delegated click handler (`data-act`, `data-n`), `content-visibility: auto` with an intrinsic size per ayah, no per-ayah components. Tafsir panel state in one object keyed by ayah.
- The throttled test (375px, CPU 4x, with a no-list control) is repeated on Al-Baqarah; budgets are set from the first measurement and the numbers recorded in the phase doc.
- Cold load shows a skeleton (header and three placeholder ayahs, no layout shift when text arrives).

## 5. Data, cache, cold, warm and offline

| Case | Behaviour |
| --- | --- |
| **Warm** (opened before) | `quran-revamp-db` `chapters` store, instant; no request. |
| **Cold, online** | One request for the chapter, skeleton meanwhile, then written to the store (best effort; IndexedDB failing never blocks reading). |
| **Offline, opened before** | From the store (and the service worker cache as a second layer). Works. |
| **Offline, never opened** | A clear state: "This surah isn't saved on this device yet. Connect once to read it, or download it in Downloads." with Retry (Downloads arrives in Phase 11; until then the text says only "Connect once to read it."). No spinner left running. |
| Tafsir, online | One request per ayah on first open, cached in the `tafsirs` store. |
| Tafsir, offline, not cached | "Tafsir for this ayah isn't saved on this device. Connect to load it." with Retry. |
| Bismillah | Needs chapter 1 once; omitted if it was never loaded (offline first visit). |

**The revamp's own cache:** `quran-revamp-db` gets two new stores, `chapters` and `tafsirs` (key `surahNo` and `"<s>_<a>"`), through a version bump **of `quran-revamp-db` only** (1 to 2). `quran-app-db` is not opened, changed or version-bumped. Cached chapters are not copied from the legacy database: a user who read before simply fetches again once (the service worker cache usually answers without the network).

**Rules carried over from the legacy notes:** the SPA has no SSR hazard (the legacy "don't await before `useNuxtApp()`" rule does not apply with `ssr:false`), and the cache is never load-bearing. **Clear all** (Phase 2) already deletes `quran-revamp-db`, so the cached text goes with it.

## 6. Reading progress and the Completed marker

### Write what legacy writes
Same debounce and same 35% rule; same record in `quran:reading-progress:v1` with the same field values (`surahName` = the English translation of the name, `surahNameArabic` = `arLong`, so a rollback to the legacy app reads it unchanged). The goals' `dailyLog` is appended in the legacy format through a small helper that merges into the existing `quran:reading-goals:v1` record and keeps every other field (no goals UI until Phase 15). Dates use the local calendar day (never `toISOString`). Open question 5: record only the landing ayah (legacy), or every ayah scrolled past?

### The new key: `quran:read-surahs:v1`
```json
{ "v": 1, "surahs": { "1": { "completedAt": 1760000000000 }, "114": { "completedAt": 1760000100000 } } }
```
- Additive; the legacy app ignores it; it is exported with the other keys (Settings Export reads every key).
- **When a surah counts as completed:** its last ayah is reached on the 35% line **and** at least 90% of its ayahs were scrolled past in this visit (so a link straight to the last ayah does not complete a surah, and a fast flick is not enough). Also an explicit **"Mark as read / Mark as not read"** action in a small menu next to the Play button, with an Undo toast (people read from a printed copy, and legacy never tracked this).
- **The listing** (Phase 3) then draws a filled marker for completed surahs, keeps the half marker for the last read place, and the legend returns ("Completed, Last read"). Juz and Page get no Completed marker (not derivable from surah completion).
- Corrupt value: ignored, no marker, nothing thrown.
- Open question 4.

## 7. Save, pin, share

- **Save (star):** writes `ayah:<s>:<a>` in `quran:bookmarks:v1` and the added-at map through `lib/bookmarks.ts` (the same code the listing uses), **with an Undo toast on removal** (legacy had none). Starred ayahs show a filled gold-free star (gold is only for verse markers), with `aria-pressed`.
- **Pin ("where I stopped"):** the prototype's Library has a "Where I stopped" section; there is no legacy data. Proposal: a new additive key **`quran:pins:v1`** = `{ "v": 1, "reading": { "surahNo": 2, "ayahNo": 255, "pinnedAt": 1760000000000 } | null }` (one reading pin; the study pin is Phase 7). The reader writes it (pin or unpin, Undo on unpin); **the Library (Phase 6) shows it.** Until then nothing else displays it, so Open question 3 asks whether to build the control now or with the Library.
- **Share (plain):** Web Share with the text "Arabic, translation, `Surah name 2:255`" (the format Home already uses), else copy to the clipboard with a toast. The image card is deferred (section 1).

## 8. Accessibility and keyboard

- One `h1` (the surah name). Each ayah is an `article` with `id="ayah-N"`, a label ("Ayah 255"), `tabindex="-1"`. Tools are real `button`s with names ("Save ayah 255", "Show tafsir for ayah 255", `aria-expanded` and `aria-controls` on the toggle); the tafsir panel has a live status. Enter and Space work (same keyboard test as the listing).
- Arabic uses `lang="ar" dir="rtl"`; translations get their own `lang` and direction; Urdu and Arabic (Alt) are RTL.
- 44px touch targets on mobile; reading text honours the Arabic size setting, High contrast and Large touch targets.

## 9. The listing, the readers and the flags

- `READERS_READY.surah = true` and `READERS_READY.juz = true` (a juz row opens the surah reader at the juz's first ayah, which now works). `page` stays false until Phase 9. The listing's notice becomes page-specific: "Opening a page shows a placeholder for now." and appears only on the Page tab.
- `/juz/[id]` (the legacy full-juz reader, which fetches the juz from the service) is **not** rebuilt in 4A: no row links to it (juz rows link to `/surah/<s>#ayah-<a>`), so it is not a dead link, but a bookmarked legacy URL still lands on "not rebuilt yet". It stays on the catch-all until a later reader phase; I would rather decide that with you than add a second reader to this phase.
- The Home "Continue reading" row and the nav's "Continue reading" already link to `/surah/<n>#ayah-<a>`; after 4A they work.
- `app/stores/player.ts` keeps its Phase 3 role; the header Play uses it unchanged.

## 10. Files

- Page: `app/pages/surah/[id].vue`; components in `app/components/reader/` (`ReaderHeader`, `AyahList`, `TafsirPanel`, `ReaderSkeleton`).
- Data and logic (`app/lib/`, pure, unit-tested): `chapter.ts` (parse and validate a chapter response; the text arrays must all have `totalAyah` entries), `readerPrefs.ts`, `readingTracker.ts` (the 35% line, debounce, seen set, completion rule), `goalLog.ts`, `readSurahs.ts` (the new key), `pins.ts` (the new key), `bismillah.ts` (when it shows), `shareText.ts`. Services: `app/services/chapter.service.ts`, `tafsir.service.ts` (explicit imports, as before). `db/revampDb.ts`: version 2 with the two stores. Listing: `readerLinks.ts` flags, the notice, the Completed marker and legend, `readingMarker` reads the new key.
- No change outside `revamp-quran/`. `quran-app-db` is never imported.

## 11. Tests and screenshots

### Unit
Chapter validation (a response with a missing or short text array is rejected, not rendered); bismillah rules for all 114 surahs (shown for 2 to 114 except 9, never 1); the tracker (35% line, debounce, ayah 1 not written, the completion rule, a direct jump does not complete); the progress record equals the legacy shape field by field; goals log merges without touching other fields and uses the local day; the Completed and pin keys (round trip, corrupt values, unknown fields kept); share text; markdown-lite keeps tags as text; the IndexedDB cache (with `fake-indexeddb`): miss, hit, write failure never throws, version 2 upgrade leaves `prayer-months` intact, and **`quran-app-db` is never opened** (a test fails if it is).

### Browser (mocked network, fixed clock, `forbidRealApis`)
The chapter and tafsir endpoints are mocked with **synthetic chapters (correct ayah counts, obviously fake text)**, so no Qur'an text is stored in tests. Covered: cold load skeleton then text; warm load makes no request; offline after one visit; offline never opened (the clear state and Retry); a failed request and Retry; bismillah present for surah 2, absent for 1 and 9, omitted when chapter 1 is unavailable; layout order and the Arabic size; translation menu (each language, Off, the keys written); tafsir toggle, three sources, the group note, loading, error, offline-uncached, and the Ja'fari line; save with Undo and the legacy keys; pin (if approved); plain share; `#ayah-N` scroll and focus, a bad hash, a bad surah; reading progress written with the exact legacy record after a scroll, not on open; goals log; Completed written only by a real read-through and by Mark as read; the listing shows the Completed marker; keyboard test for every tool; 44px and no horizontal scroll at 375px; one `h1`; light and dark; the CPU-throttled test on the largest surah; every link from the listing, Home and the nav lands on a working reader; `READERS_READY` flags.

### Screenshots (prototype next to revamp)
Reader at **1280 and 375, light and dark** = 4 pairs for Al-Fatihah (the only surah the prototype draws), plus revamp-only state shots at 1280 light and 375 dark: Al-Baqarah with the bismillah, At-Tawbah (none), translation menu open, tafsir open (each of the three), tafsir loading and error, tafsir offline-uncached, offline-never-opened, saved and pinned ayahs, translation first layout, Urdu translation, an ayah opened by hash, Completed marker on the listing. I will look at every one individually and say which I only generated.

### Audio files (the check you asked for)
`docs/audio-url-check.md`: **570 of 570 audio URLs are reachable (HEAD, redirects followed, 0 failures).** One finding for 4B: **210 of them are served as `application/octet-stream` with `nosniff`** (the larger surahs; the biggest file is 91 MB). A browser `Audio` element in desktop Chromium accepted them (metadata loaded for a 74 MB and a 91 MB file), but **Safari and iOS, Firefox and Chrome on Android were not tried**, and the sizes matter for "download for offline" (Phase 11). Please try two of the large ones (for example Al-Baqarah and Aal-i-Imraan) on your phone on the preview before 4B builds on them.

## Open questions

1. **Split and the share card.** Confirm 4A (reader) and 4B (player); the image share card deferred to its own phase until a design exists (4A: plain share). OK?
2. **Translation Off.** Store it in a new `quran:reader-prefs:v1` `{ translation: "off" }`, or drop Off from the menu (the legacy reader had none) and always show a language?
3. **Pin.** Build the control and `quran:pins:v1` now (the Library shows it in Phase 6), or build it together with the Library?
4. **Completed.** The rule (last ayah reached and 90% scrolled past in one visit), the key `quran:read-surahs:v1`, and a "Mark as read / not read" action. OK, or a different rule?
5. **Goals log.** Record only the landing ayah (the legacy behaviour, which undercounts fast scrolling), or every ayah scrolled past (more accurate, but it changes what Home's "today's goal" count shows compared with the legacy app)?
6. **Bismillah.** Read from chapter 1's data and omitted when it is unavailable offline. OK? (I will not type the Arabic.)
7. **Tafsir wording.** Say only "No Ja'fari tafsir is available from this app's data provider" and not "Sunni sources"? (The three authors' schools and the translators of the English, Urdu and Bengali texts are **not stated anywhere in the data**; I will show only the language and the tafsir author's name, and list the missing attribution in CONTENT_TO_VERIFY.md until you supply it.)
8. **Juz flag and `/juz/[id]`.** Flip the `juz` flag with the surah reader (juz rows open the start ayah) and leave the legacy full-juz reader `/juz/[id]` for later?
9. **Per-ayah copy.** The legacy app has a copy helper (used on Home). Include "Copy" next to Share on each ayah, or keep one Share button that falls back to copy?

## Risks

- **Size and speed:** 286 rows and a 527 KB response; mitigated as in Phase 3 and measured.
- **Third-party data shape:** a changed response is rejected by validation with a clear error, not rendered half-empty.
- **Scroll tracking** is the only way to know what was read; the Completed rule is a heuristic and the Mark as read action exists because of it.
- **IndexedDB unavailable** (private mode): reading still works from the network; offline does not.
- **Audio hosting and large files** (above) affect 4B, not 4A.

## Not part of Phase 4A

The full player, per-ayah audio and its download button, the image share card, the juz and page readers, the Library's "Where I stopped" display, Reading goals UI, Hifz and Search jumps.
