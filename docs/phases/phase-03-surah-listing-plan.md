# Phase 3: Surah listing, Juz, Page (plan, awaiting approval)

- Branch: `revamp-design-logic`
- Prototype: `d-page-surah` and `m-page-surah` (tabs Surah, Juz, Page; `renderDesktopList`, `renderMobileList`, `juzHTML`, `pagesHTML`, `renderListTools`, `filteredSurahs`, `goToPage`).
- Routes: `/surah-listing` (Surah tab, the default) and `/juz` (Juz tab, a legacy route kept). The Page tab is `/surah-listing?tab=page`. `/juz/[id]` and `/per-page-read` are **readers**, not listings: they stay on the "not rebuilt yet" page until the reader phases (see Open question 9).
- Offline level: **A**. Every list is built from bundled data; only playing audio needs a connection.

No code is written until this plan is approved. Also recorded in this review round (before the plan): the Asr (Hanafi) sentence was softened to "Hanafi uses the later Asr time." and the Ja'fari comparison is now a tracked pre-cutover item (CONTENT_TO_VERIFY.md and PROGRESS.md, Phase 16).

## 1. What the legacy app has

### Pages and behaviour (read from `app/pages` and `app/composables`)
- **`/surah-listing`** is one page: a search box, a reciter menu, a sort menu and a card per surah (Arabic name, transliteration, translation, place, ayah count), with Play, Download and a favourite star. The data is `app/assets/data/surah.json` imported **directly**, so the legacy listing makes no network request for the list. (The four `server/api` proxies are not used by it, or by anything else.)
- **Sort** (`useSurahs`): Surah No, Name (transliteration, `localeCompare`), Revelation Place (the strings "Mecca" and "Madina", alphabetical), Favourites (keeps only surahs bookmarked as `surah:<n>`), Ascending and Descending (by ayah count).
- **Search** (`useSurahs.search`): case-insensitive substring of the transliteration, the translation, the place, and the Arabic **long** name `سُورَةُ ٱلْفَاتِحَةِ`. Because that name carries vowel marks, typing `الفاتحة` finds nothing (a legacy bug; the data also has `surahNameArabic` without marks).
- **`/juz`** is a page of 30 chips "Juz# n" with a bookmark icon (`juz:<n>`) that links to `/juz/<n>`. No juz names, no start points, no page ranges, no progress. **`/juz/[id]`** fetches the juz text from the service (reader).
- **`/per-page-read`** is the page reader (`?page=N`, a dropdown of 604 pages, previous and next). The legacy app has no page listing.
- **Audio per row:** `getSurahUrl` finds the surah's audio by the chosen reciter's **name** in the surah's own `audio` map; Play uses the global `useAudioPlayer`; leaving the page resets it.

### Data files
| File | What it holds | What it lacks |
| --- | --- | --- |
| `app/assets/data/surah.json` (171 KB) | per surah: `surahNo`, `surahName` (service transliteration, e.g. "Al-Faatiha"), `surahNameArabic` (no marks), `surahNameArabicLong` (marks), `surahNameTranslation`, `revelationPlace` ("Mecca" or "Madina"), `totalAyah`, `audio` (5 reciters with URLs; this is most of the size) | **revelation order**, juz, page |
| `app/assets/data/reciters.json` | 5 reciter names | |
| the three APIs | `api.alquran.cloud/v1/meta` (see below) | |

## 2. Revelation order: no data exists, none will be invented

- **Not in the legacy data.** `surah.json` has only the place. The quranapi `surah.json` has the same six fields. The alquran.cloud `/v1/surah` and `/v1/meta` entries carry `revelationType` (Meccan or Medinan) and no order. (The legacy place and the service's `revelationType` agree for all 114 surahs: 0 disagreements.)
- The prototype's `REV = {1:5, 2:87, ...}` (8 sample values) is a placeholder and is not used.
- **Proposal:** the sort "Revelation order" is **not built** in Phase 3. If you want it, a data source has to be chosen and named by you, because there is more than one traditional order (for example the Cairo standard edition and the scholarly chronologies differ), and the sort label would say which one ("Revelation order (<source>)"). Candidates I can check, if you choose one: the Tanzil metadata file, or the quran.com chapters data. Until then the sort menu offers Surah number, Name, Verse count, and "Revelation place" as a grouping. Open question 1.

## 3. Juz and Page: where the numbers come from

- **A real source in an API the app already uses:** `GET https://api.alquran.cloud/v1/meta` returns `juzs.references` (30 start points as surah and ayah) and `pages.references` (604 start points), plus the surah list. Checked on 2026-10-16:
  - 30 juz and 604 pages; both lists strictly increasing; every reference is a real ayah (checked against the legacy ayah counts); the 114 surah entries match the legacy `surah.json` in name and count.
  - Examples: Juz 2 starts 2:142, Juz 4 starts 3:93, Juz 7 starts 5:82, Juz 30 starts 78:1; page 2 starts 2:1, page 604 starts 112:1.
  - **26 of the 30 juz start exactly at the start of a page; 4 start mid-page (Juz 4, 7, 11 and 26).** So a juz's page range is derived (first page = the page that contains the start ayah, last page = the page that contains the ayah before the next juz) and those four ranges share a boundary page with the juz before them. The prototype's "Juz 1 = pages 1 to 21, every other 20 pages" is a placeholder and is wrong for the mid-page ones.
- **Plan:** a generator `scripts/gen-quran-meta.mjs` (as `gen-ayah-lengths.mjs` does) writes `app/data/quranMeta.generated.ts` from that response, with these checks as a hard failure: counts 30 and 604, increasing, valid against the legacy counts, surah list equal to the legacy list. The listing then needs **no network** and no runtime dependency on the API. The generated file also carries the 114 surah rows **without** the audio map, so the Home-sized chunk stays small (about 20 KB); the audio URLs are read from the legacy JSON by alias only when Play is used.
- **Juz names: no source.** The legacy data has no juz names, and `/v1/meta` has none. The prototype's transliterated names and Arabic opening words are typed from memory (CONTENT_TO_VERIFY.md) and are **not** shipped. Juz rows show "Juz n", the start ("Al-Baqarah 2:142", the surah name from the data), and the derived page range. If you want traditional names, supply a verified list and I will add them as data with a status label (Open question 4).
- **Page to surah:** the prototype's "first 186 pages" table is not used; for the Page tab the surah that starts on or contains the first ayah of each page is derived from the page references (shown on hover or in the page's accessible name).

## 4. Progress markers: what the legacy data can and cannot express

- **What exists:** `quran:reading-progress:v1` is **one record**: the last place read, `{ surahNo, ayahNo, surahName, surahNameArabic, totalAyah, updatedAt }`. Nothing records which surahs were finished.
- So the prototype legend "Completed ● / In progress ◐ / Not started ○" **cannot be drawn truthfully from it.** It can say exactly one thing: *the last place you read is surah N, ayah M of T*. Assuming "every surah before it is completed" would be false (people read out of order).
- A second source exists: the goals' `dailyLog` (`quran:reading-goals:v1`) lists unique `surah:ayah` keys read per day, but only on days when a goal was active, so it undercounts and could mark a read surah as "not started".
- **Proposal for Phase 3:** one marker only, on the surah of `reading-progress`: a half-filled marker with "Last read: ayah 285 of 286" (and the progress percent). No "completed" or "not started" markers and no ○ on every row; the legend shows only what is drawn. On the Juz tab the juz that contains the last-read ayah gets the same marker; on the Page tab the page that contains it is the "current page" (dashed), derived from the page references. The prototype's "shaded = read" for all earlier pages is **not** shown (not knowable).
- **For a real Completed marker later:** a new additive key (for example `quran:read-surahs:v1`, a set of finished surahs) written by the reader when someone reaches the end of a surah (Phase 4), which the legacy app would ignore. Open question 2.

## 5. Play per row, the mini player, and what Phase 3 includes

The real player (scrubber, speed, resume, Media Session, repeat, per-ayah audio, the full-screen overlay) is Phase 4. A Play button that does nothing would be worse than none, so:

**Phase 3 includes (proposal):**
- A real, small **player store** (`app/stores/player.ts`) that replaces the Phase 0 `playerShell` placeholder: one `HTMLAudioElement`, `play(track)`, `pause()`, the state `nowPlaying`, `playing`, `loading`, `error`, and the playback speed from the Settings preference. Starting a surah pauses any other; leaving the page does **not** stop it (the legacy app reset on leaving; the mini player is global).
- **Per row Play/Pause** on the Surah tab, using the reciter chosen in the list (name matched against the surah's own audio map, as the legacy app does). The playing row shows the animated bars (still bars when "Reduce motion" is on) and a tinted background.
- The **mini player** (the Phase 0 shell) shows the title, reciter and a play/pause button for the current track.
- Error and offline states for playing (below).

**Stays out until Phase 4 (listed so nothing is implied):** seeking and the progress bar, the full player overlay, repeat, auto-play of the next surah (the preference is stored, but not acted on), per-ayah audio, Media Session and lock-screen controls, saving and resuming the position (`quran:audio-resume:v1` is not written), the download buttons (Phase 11), and any "play a whole juz" (**no per-juz audio exists** in the data, so the prototype's Juz Play button is not built).

**Placeholder that stays:** none after this, except that the mini player has no track area link to a full player (Phase 4). If you prefer that Phase 3 has no audio at all, the Play buttons and mini player wiring can wait for Phase 4 and the rows show only the open arrow; Open question 3 (I recommend the small real player).

## 6. Reciter, filter, search, sort

- **Reciter menu** (`ResponsiveMenu`): the five reciters from `reciters.json`, bound to the `reciter` preference (stored as `{ reciter: <name> }`, the same as Settings; the legacy listing stored the whole audio entry with its URL, which is still read by name). Changing it while a surah plays switches the current track to the same surah by the new reciter (as the legacy page did).
- **Filter box** (one box, three placeholders as in the prototype): Surah: "Filter by name, number or place"; Juz: "Filter by juz number or place"; Page: "Go to page (1 to 604)".
- **Matching** is accent- and mark-insensitive (a small tested normaliser: Latin diacritics removed, Arabic vowel marks and tatweel removed, alef and yeh variants folded), over the number, the transliteration, the translation, **both** Arabic names and the place, so typing `الفاتحة` works (the legacy bug) and `fatiha`, `opening`, `7` or `madina` find what they should.
- **Empty state:** "No surahs match 'xyz'. Try a name or a number." with a **Clear** action; the count line shows "N of 114".
- **Sort** (Surah tab only): Surah number, Name (A to Z, by transliteration), Verse count (longest first, as in the prototype, and shortest first), and a place filter (Meccan, Medinan). No Revelation order (section 2). The legacy "Favourites" becomes a "Saved" toggle (surahs bookmarked as `surah:<n>`).
- **Favourite star** per row writes `surah:<n>` in `quran:bookmarks:v1` and the added-at map (the existing `lib/bookmarks.ts`), with an Undo toast on removal. The Juz tab: the legacy page had a bookmark per juz (`juz:<n>`) that the prototype's Juz rows do not show (Open question 5).
- The chosen sort, tab and reciter are remembered per viewer only where a key already exists (`reciter`); the tab is in the URL; the sort is not stored.

## 7. The A to Z jump and the "Go to page" box

- **"Go to page"** is the Page tab's filter box in the prototype: type 1 to 604, press Enter (or the button), the chip scrolls into view and flashes (still highlight under "Reduce motion"); out of range or not a number shows "Enter a page from 1 to 604". A link "Jump to page N, where you stopped" appears when there is reading progress.
- **A to Z jump:** the prototype has **no** A to Z jump (it only has the Name sort). Proposal: when sorted by Name, a slim letter strip (A, B, D ... the initial letters that actually exist, after "Al-" and "An-" style prefixes are ignored) that scrolls to the first row of that letter. It is optional; Open question 6.
- Tapping a surah row opens the reader at `/surah/<n>`; a juz row opens `/surah/<s>#ayah-<a>` (its start ayah); a page chip opens `/per-page-read?page=<n>`. Those routes show "not rebuilt yet" until Phases 4 and 9 (stated on the page doc), exactly as today for other unbuilt routes.

## 8. Rendering 114 surahs, 30 juz and 604 pages on a mid-range phone

- **No virtualisation.** 114 rows at about 8 nodes is roughly 900 nodes; 30 juz rows are about 250; the Page tab is 604 chips in 30 groups, about 700 nodes. These are small; virtualising would add complexity and break find-in-page, keyboard order and screen-reader navigation for no measurable gain.
- **Keep it cheap anyway:** plain elements (no per-row component state), one delegated click handler per list, `content-visibility: auto` with an intrinsic-size hint on each page group (so off-screen groups are not laid out), the audio map and Arabic fonts not loaded until needed, no images, animation only on the one playing row.
- **Measured, not assumed:** a Playwright test emulates a mid-range phone (CDP CPU throttling 4x, 375px) and checks that each tab's first render completes, a keystroke in the filter box updates the list within a budget, no single task is longer than 100 ms, and layout shift is zero. The budgets are written into the test and the phase doc; if the measurement fails, virtualisation is revisited with the evidence.

## 9. Offline

| Part | Offline behaviour |
| --- | --- |
| Surah, Juz and Page tabs, filter, sort, saved, reciter menu, page jump | Fully work (bundled data) |
| Favourite star | Works (local) |
| Play | Works only if the audio file is already cached by the service worker (`quran-audio-cache`, `.mp3` rule, kept from the legacy app); otherwise the row shows "Couldn't play. Audio needs a connection unless it was downloaded." and the player returns to idle. Cross-origin audio and Range requests make "played once, plays offline" unreliable; the dependable answer is the Downloads manager (Phase 11). No spinner stays |
| Open a surah, juz or page | Phases 4 and 9 (the reader); until then the "not rebuilt yet" page |

## 10. Components, files, tests

- Page: `app/pages/surah-listing.vue` (Surah and Page tabs) and `app/pages/juz/index.vue` (the Juz tab on its legacy route; both render one `ListingPage` component with the tab as a prop). `components/listing/`: `ListingTabs`, `SurahRow`, `JuzRow`, `PageGroups`, `ListingTools` (filter, sort, reciter), `EmptyList`.
- Data and logic (`app/lib/`): `quranMeta.ts` (derived ranges, page and juz lookups), `listingSearch.ts` (normaliser and matching), `listingSort.ts`, `readingMarker.ts` (last-read marker, current page and juz); `app/data/quranMeta.generated.ts` (generated); `app/stores/player.ts`; `scripts/gen-quran-meta.mjs`.
- Unit tests: the generated data checks (counts, order, validity, equality with the legacy surah list, the four mid-page juz starts), derived page ranges, the normaliser (Latin, Arabic with and without marks, numbers), sort stability and the verse-count orders, the marker mapping (progress to surah, juz and page, bad records), the player store (play, pause, switch track, error), and the audio-URL resolution by reciter name against the legacy audio map.
- Browser tests (mocked network, fixed clock, `forbidRealApis`): the three tabs and their counts; filter and the empty state with Clear; Arabic search without marks; sort and the saved toggle; reciter change writes `{reciter}` and switches a playing track; Play, Pause, the playing row and the mini player (audio stubbed with a fake `HTMLAudioElement`); the error state; Go to page (valid, invalid, flash); the last-read marker on the right surah, juz and page; the star writes the legacy keys with Undo; the performance test above; keyboard order and focus; 44px targets; one `h1`; light and dark; offline.
- Screenshots: see below.
- **No change outside `revamp-quran/`.**

### Screenshot plan
The three tabs at **1280 and 375, light and dark** = 12 prototype-versus-revamp pairs, plus state shots at 1280 light and 375 dark: a filter with no result (empty state), a filter with results, the playing row and mini player, the reciter menu, the sort menu, the last-read marker, the Page tab with the jump flash, Juz with a mid-page start, an offline failed Play, and the "Saved" toggle. I will look at all 12 section pairs and every state shot individually, and say which I only generated.

## Open questions

1. **Revelation order.** Build it from a named source you choose (which order and which file), or leave it out? (Recommended: leave it out until you name the source.)
2. **Progress markers.** One "Last read" marker (and the current juz and page) in Phase 3, with a true Completed marker coming from a new `quran:read-surahs:v1` that the Phase 4 reader writes? Or add a "mark as read" action now?
3. **Audio in Phase 3.** The small real player (play and pause per row, mini player) as described in section 5, or no audio until Phase 4?
4. **Juz names.** Show "Juz n" with start reference and pages only, or supply a verified list of traditional names to add as sourced data?
5. **Bookmarks on the Juz and Page tabs.** The legacy app could save a juz (`juz:<n>`); the prototype does not show a star there. Add a star on Juz rows (legacy parity), or leave it to the Library?
6. **A to Z jump.** The prototype has none. Add the optional letter strip under the Name sort, or skip?
7. **Sort and filter set.** Surah number, Name, Verse count (both directions), place filter, and a "Saved" toggle. OK?
8. **Leaving the page.** The legacy listing stopped the audio when you left; the revamp's mini player is global, so audio continues. OK?
9. **`/juz/[id]` and `/per-page-read`** are readers; they wait for Phase 4 (shared with the surah reader) and Phase 9. OK, or should Phase 3 include a minimal Juz reader?

## Risks

- **Mid-page juz starts** make a "pages a to b" range overlap the previous juz by one page; the wording ("starts on page 62") says so.
- **The data comes from a third-party service** (`/v1/meta`); it is snapshotted at build time and re-checked by the generator, so a changed upstream is noticed, not silently followed.
- **Audio hosting:** the URLs are third-party; a dead link shows the error state and nothing else.
- The Arabic normaliser can over-match across letter variants; it is unit-tested against all 114 names.

## Not part of Phase 3

The reader (`/surah/[id]`, `/juz/[id]`, `/per-page-read`), the full player and resume, downloads, per-juz audio, a revelation-order sort (pending Open question 1), Library bookmarks UI.
