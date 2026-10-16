# Phase 3: Surah listing, Juz, Page

- Branch: `revamp-design-logic`
- Date: 2026-10-16
- Status: Done, awaiting review
- Plan and decisions: `phase-03-surah-listing-plan.md`

## Goal

The real listing (`/surah-listing`, `/juz`, `/surah-listing?tab=page`) with the prototype's three tabs, a filter that finds what people type (including Arabic without marks), sorting, saving, a real per-row Play and the global mini player, a "Go to page" box, and a "last read" marker taken from the one place the legacy data can say it truthfully.

## Scope

- Pages and components built: `app/pages/surah-listing.vue` (Surah and Page tabs), `app/pages/juz/index.vue` (Juz tab); `app/components/listing/` (`ListingPage`, `SurahList`, `JuzList`, `PageGroups`, `StarButton`, `EmptyList`); `app/components/layout/MiniPlayer.vue` now drives the real player.
- New logic (`app/lib/`, all pure and unit-tested): `quranMeta.ts` (juz and page lookups), `listingSearch.ts`, `listingSort.ts`, `readingMarker.ts`, `surahAudio.ts`, `readerLinks.ts`; `bookmarks.ts` gained `listBookmarks`, `bookmarkAddedAt` and key helpers.
- New store: `app/stores/player.ts` (replaces `playerShell.ts`, which is deleted).
- New generated data: `app/data/quranMeta.generated.ts` from `scripts/gen-quran-meta.mjs` (source: `api.alquran.cloud/v1/meta` for the 30 juz and 604 page starts; names, place and ayah counts from the legacy `surah.json`, **without** its audio map). The script fails, and writes nothing, when the upstream disagrees with the legacy data. Never hand-edit the generated file.
- Prototype sections used: `d-page-surah` and `m-page-surah` (`renderDesktopList`, `renderMobileList`, `juzHTML`, `pagesHTML`, `renderListTools`, `goToPage`).
- Legacy code and data reused: `@legacy/assets/data/surah.json` (lazily, only for the audio URL when Play is pressed), `@legacy/assets/data/reciters.json`.

## Approved decisions (from the plan review)

1. No revelation-order sort (returns only if you name the source and the order).
2. One "Last read" marker now; a Completed marker later, from a new key the Phase 4 reader writes.
3. A small real player (play and pause per row, the playing row, the mini player). Seeking, resume, repeat, auto-next, per-ayah audio and downloads stay out.
4. Juz rows show "Juz n", the start surah and ayah, and the derived page range only. No names.
5. The Juz star writes the legacy bookmark key (`juz:<n>`).
6. No A to Z strip.
7. Sort and filter: number, name, verse count, a place filter, a Saved toggle, and a way back to the last read place.
8. Audio keeps playing when you leave the page.
9. `/juz/[id]` and `/per-page-read` wait for Phases 4 and 9; no dead links (see below).

## What was built

### Data (checked, not typed)
- 30 juz and 604 pages, both strictly increasing, every reference a real ayah (checked against the legacy ayah counts), 114 surahs equal to the legacy list in name, place and count, 6,236 ayahs. `tests/quranMeta.test.ts` compares the generated tables with a recorded `/v1/meta` response (`tests/fixtures/alquran-meta.json`).
- **26 of the 30 juz start exactly where a page starts; juz 4, 7, 11 and 26 start partway down a page.** A juz's page range runs from the page that contains its first ayah to the page that contains the ayah before the next juz, so those four share a page with the juz before them. Their rows say "Starts partway down page N", and on the Page tab the shared page appears in both groups (608 chips for 604 pages). The prototype's "20 pages each" was a placeholder and is wrong for these.
- No juz names (no source); the prototype's transliterated and Arabic names are not used.

### Tabs
- **Surah:** 114 rows (number, name, translation, place, verse count, the Arabic name, star, Play). Filter, sort (Surah number, Name A to Z, Verse count most or fewest first), place menu, reciter menu, Saved toggle.
- **Juz:** 30 rows with a star (legacy `juz:<n>`), no Play (the data has no per-juz audio), no reciter menu.
- **Page:** 30 groups, one per juz, of 44px chips; "Go to page" (Enter or Go): a valid page scrolls to the chip, focuses it and flashes it (a still highlight under Reduce motion); an invalid one says "Enter a page from 1 to 604". "Jump to page N, where you stopped" appears when there is reading progress.
- The tabs are links (`aria-current="page"`), not a tab widget, because each is a route.

### Filter and sort
- Matching ignores Latin accents, Arabic vowel marks and tatweel, folds alef and yeh variants, ignores hyphens, and collapses repeated letters (the data says "Al-Faatiha"; people type "fatiha"). **Typing `الفاتحة` finds Al-Fatihah** (the legacy search could not). A purely numeric query means exactly that surah number (so `7` finds surah 7, not 7, 17, 27 ...). The place matches Mecca, Meccan, Madina, Medinan.
- **Name (A to Z) ignores the article** (Al-, An-, Ash- ...), so Al-Faatiha is under F; the legacy sort compared the whole transliteration, which put 61 surahs under "Al". Aal-i-Imraan is a name, not an article, and stays under A. This is a decision of this phase (not in the plan); say if you prefer the legacy order.
- Empty state: "No surahs match “xyz”. Try a name or a number." with Clear; "No saved surahs yet. Tap the star on a surah to save it." The count line shows "N of 114".

### Saving
The star writes `quran:bookmarks:v1` (`surah:<n>`, `juz:<n>`) and `quran:bookmarks:added-at:v1`, the legacy format. Removing shows an Undo toast; Undo puts the original first-saved time back.

### Last read
From `quran:reading-progress:v1`, which holds **one record** (the last place read). One marker only: the surah, the juz and the page that contain that place, with "Last read: ayah 285 of 286". There is no Completed or Not started marker (it cannot be known) and no legend. A damaged record shows nothing.

### Player
- `usePlayerStore`: one `HTMLAudioElement`, `playSurah`, `pause`, `toggle`; state `nowPlaying`, `playing`, `loading`, `error`. The reciter's file is found per surah **by name** in that surah's own audio map (`reciter` key, stored as `{ reciter: <name> }` like Settings; a whole legacy entry is read by name). Speed comes from the Settings preference. Starting another surah replaces the first; a newer request supersedes an older one that is still loading; changing the reciter while playing switches to the same surah by the new reciter.
- The row shows the animated bars and a tinted background while playing (still under Reduce motion, via the existing flag); the mini player shows the title, "Recited by <name>", Loading, or the error, and a play or pause button. Audio keeps playing when you open another page.
- **Offline wording:** when a file cannot play the row and the mini player say "Couldn’t play. Audio needs a connection unless it was downloaded." and the state returns to idle (no spinner). Nothing on the page says audio plays offline.
- The audio files are third-party (`github.com/The-Quran-Project/Quran-Audio-Chapters`). **One** file was checked by hand on 2026-10-16 (surah 1, reciter 1: a redirect to `audio/mpeg`, 840 KB, CORS open). The other 569 URLs were not fetched.

### Opening a row, and "no dead links"
Surah rows open `/surah/<n>`, juz rows `/surah/<s>#ayah-<a>` (the juz's first ayah), page chips `/per-page-read?page=<n>`. None of these readers exists yet, so each route shows the "not rebuilt yet" page, and **the listing says so above the list** ("The reading pages are still being moved to the new design, so opening a surah shows a placeholder for now."). `app/lib/readerLinks.ts` has one flag per reader (`READERS_READY`); flip it, and the notice goes, when Phases 4 and 9 ship. A browser test checks every link on every tab uses a real number (surah 1 to 114, ayah within the surah, page 1 to 604) and follows one of each kind to a page that has an `h1`.

## Rendering cost: measured

375px wide, Chrome with the CPU slowed 4x (CDP), the production build, `e2e/listing.spec.ts` ("mid-range phone"), written to `test-results/listing-perf.json` on every run. A control page (Settings, no list) is measured in the same run, because the longest task includes starting the app itself.

| | Surah (114 rows) | Juz (30 rows) | Page (604 chips) | Control (Settings) |
| --- | --- | --- | --- | --- |
| first render until the list is visible | 971 ms | 556 ms | 627 ms | 741 ms |
| one keystroke in the filter until the list changes | 133 ms | 37 ms | n/a | n/a |
| longest main-thread task | 237 ms | 221 ms | 126 ms | 435 ms |
| layout shift | 0.001 | 0 | 0 | |
| DOM elements | 1,984 | 414 | 903 | 178 |

Budgets (in the test): first render under 3,000 ms, a keystroke under 600 ms, the longest task no more than the control's (or 250 ms, whichever is more) plus 150 ms, layout shift under 0.01.

**The first measurement failed, and led to a change.** With each row built from a link component, an icon component and a star component, the Surah tab had 1,871 elements and a **591 ms** longest task (first render 1,390 ms; the control was 271 ms). The rows were changed to plain elements with one delegated click handler (as the plan said), which brought the longest task to between 160 and 312 ms across three runs (237 ms in the final one) and the first render to about 1,020 ms. **No virtualisation:** the numbers do not call for it, and it would break find-in-page and screen-reader navigation. Run-to-run the figures move by 100 ms or more, especially when the whole suite runs together; these are a ceiling check, not a benchmark, and **not a real phone.**

## Verification

- [x] `npm run verify` on Node 22.23.3: build, lint clean, **252 unit tests** (35 new), dev-server smoke test, **152 browser checks** (26 new, 126 existing; two Phase 0 checks were updated for the real page heading). The run before it had 3 failures (those two, and the perf budget, which was then made relative to the app's own start-up); all three were fixed and the whole suite was run again.
- [x] Browser tests (`e2e/listing.spec.ts`, 26): no network request of its own; the three tabs and counts; tabs and legacy routes; filter, N of 114 and empty state with Clear; Arabic without marks and numbers; sort and place; star keys, Undo and Saved toggle; juz star; Play, Pause, the playing row, the mini player and playing on after leaving the page; reciter change and `{reciter}`; a legacy reciter entry and playback speed; the failed-file message (no "plays offline" text anywhere); the last-read marker on the right surah, juz and page; a damaged record; Go to page (valid, focus, flash, invalid, shared pages); every link target; the readers-pending notice; in-app navigation of page chips; Tab order inside a row; light and dark; offline after one visit (three tabs, failed Play); the CPU-throttled test; 44px targets, no horizontal scroll; Arabic not clipped.
- [x] Unit tests (`tests/quranMeta.test.ts`, `tests/listing.test.ts`, `tests/player.test.ts`): generated tables against the recorded response and the legacy list; page and juz lookups; the four mid-page juz; the normaliser and search (including every surah found by each of its own names, and `الفاتحة` finds exactly surah 1); sorts; the marker mapping and bad records; audio URL resolution (every surah has a file for every reciter); the player store with a fake audio element.
- [x] Screenshots: `docs/design/listing-compare/` (see its README for what was looked at one by one).
- [ ] **Real audio playing:** every browser test uses a stand-in for the audio element (all 570 URLs answer, and desktop Chromium loads the metadata of the largest files; Safari, iOS and Firefox are untested). Real playback, pause and resume, and the speed on a device are yours to check on the Vercel preview.
- [ ] Screen-reader pass (not done).
- [ ] Real-device check on a mid-range phone (the 4x test is only an estimate).

## Differences from the prototype

See `docs/design/listing-compare/README.md`.

## Content placeholders replaced

See `docs/CONTENT_TO_VERIFY.md` (Surah listing, Juz, Page).

## Changes after the Phase 3 review

- Sort menu widened (labels on one line) and a line added: "Name ignores Al-, An-" (`ResponsiveMenu` gained optional `wide` and `hint`; the default is unchanged).
- A keyboard test (`e2e/listing.spec.ts`): every control in the surah list and page chips is a real `button` or `a` with a name and no odd `tabindex`; Space and Enter work on the star, Play and the open link; page chips open with Enter; Go to page works from the keyboard; the sort menu labels do not wrap. Browser suite for the listing: 29 tests, all passing; lint clean. (The full suite was not re-run for this follow-up; only the listing tests, lint and the build.)
- All 570 audio URLs were checked once (`docs/audio-url-check.md`): 570 reachable, 210 served as a generic type (see CONTENT_TO_VERIFY.md).

## Open issues and risks

1. **Readers do not exist yet:** every row opens a placeholder until Phases 4 and 9 (stated on the page).
2. **Mid-page juz starts** make four page ranges overlap by one page (stated on the rows).
3. **Audio hosting is third-party;** a dead URL shows the error state. Only one URL was checked.
4. **Cross-origin audio and offline:** "played once, plays offline" is not reliable; the dependable path is the Downloads manager (Phase 11).
5. **The `quran:bookmarks:v1` list is read from storage on mount;** a bookmark added in another tab is not shown until the page is revisited (the Library, Phase 6, owns live syncing).
6. **No juz Play.** The legacy data has no per-juz audio; the prototype's juz Play button is not built.
7. The generated data comes from a third-party service snapshot; re-running the generator re-checks it.

## Next phase needs

Phase 4 (the reader): replaces the reader placeholders (flip `READERS_READY.surah`), builds on `usePlayerStore` (seeking, resume `quran:audio-resume:v1`, repeat, auto-next from `prefs.autoplay`, per-ayah audio, Media Session, the full player), and writes the new "surahs finished" key so the listing can draw a Completed marker. Phase 9 flips `READERS_READY.page`.
