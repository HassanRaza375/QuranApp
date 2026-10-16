# Phase 4A: Surah reader

- Branch: `revamp-design-logic`
- Date: 2026-10-16
- Status: Done, awaiting review
- Plan and decisions: `phase-04a-surah-reader-plan.md`

## Goal

The real reader at `/surah/[id]` (prototype `d-page-reader` and `m-page-reader`): the text, the bismillah, translation and tafsir, per-ayah save, pin and share, reading progress in the legacy format, the new Completed marker, and opening at a linked ayah. The full player is Phase 4B.

## Scope

- Page and components: `app/pages/surah/[id].vue`; `app/components/reader/` (`ReaderHeader`, `AyahList`, `ReaderSkeleton`, `icons.ts`).
- Logic (`app/lib/`, pure and unit-tested): `chapter.ts` (validation, route and hash parsing, bismillah rules, the tafsir shape), `quranText.ts` (cache, network, cache fill), `readerPrefs.ts`, `readSurahs.ts`, `pins.ts`, `goalLog.ts`, `readingProgress.ts`, `readingTracker.ts`, `shareText.ts`, `tafsirHtml.ts`. Composable `useQuranText`. `db/revampDb.ts` version 2.
- Changed: the listing (Completed marker and legend; `READERS_READY.surah` and `.juz` are now true; the notice appears only on the Page tab), `ResponsiveMenu` (already had `hint` and `wide`), `settingsData.ts` (Reset also clears `quran:reader-prefs:v1`), `bookmarks.ts` unchanged.
- Legacy code reused: `renderTafsirMarkdown` (through the bridge), `reciters.json` and `surah.json` (as in Phase 3).
- A one-off live check: `scripts/live/real-data.live.ts` (not in CI; `npx vitest run --config scripts/live/vitest.config.ts`).

## Approved decisions (from the plan review)

1. Split confirmed (4A reader, 4B full player); the image share card is a later phase of its own; plain share with a copy fallback and a brief "Copied".
2. Translation "Off" is in the new key `quran:reader-prefs:v1`, separate from `translationDefaultLang`.
3. Pin is built now with `quran:pins:v1`; the Library shows it in Phase 6.
4. Completed: `quran:read-surahs:v1`, an explicit Mark as read or not read with Undo, automatic only at the end of a surah with 90% read in one visit.
5. Goals log: every ayah that stayed on screen about 1.5 s (see the difference from the legacy count below).
6. The bismillah is never typed; it is omitted when surah 1 was never loaded and you are offline.
7. Tafsir wording: "No Ja’fari tafsir is available from this app’s data provider." and nothing about the schools.
8. `surah` and `juz` flags flipped; `page` stays false until Phase 9; `/juz/[id]` stays unbuilt with nothing linking to it.
9. One Share button (Web Share, else copy); no separate Copy button.

## What was built

### Data and cache
- One request per surah (`quranapi.pages.dev/api/<n>.json`: five texts of the same length) and one per ayah's tafsir (`.../tafsir/<s>_<a>.json`: all three sources). A response is **validated before it is shown or stored**: the surah number, the ayah count (against the bundled list) and each of the five arrays (length and element type); anything else is rejected with a reason and nothing is cached.
- `quran-revamp-db` is now **version 2** with two new stores, `chapters` and `tafsirs`; the upgrade only creates stores (a test builds a version 1 database and checks the prayer months survive). A cached record that no longer validates is treated as a miss and replaced. A cache that fails (private mode, quota) is a miss; reading from the network never depends on it.
- **`quran-app-db` is never opened.** Tested twice: at run time (the test records every `indexedDB.open` name and expects only `quran-revamp-db`), in the browser (same check while reading and opening tafsir), and by scanning the source for any line outside a comment that names it.
- Within a visit a surah or a tafsir is not requested twice, and two callers share one request; a failure is not remembered, so Retry asks again.
- **Real data:** `scripts/live/real-data.live.ts` ran against the real service on 2026-10-16: all 114 chapters validate; no surah's first ayah already begins with the bismillah (so it never shows twice); ten tafsir responses (1:1, 2:255, 2:286, 9:1, 18:10, 36:1, 55:13, 112:1, 114:6, 3:133) all parse. A group note (`groupVerse`) comes with any of the three sources, not only Tazkirul Quran. The largest tafsir seen was 51 KB (Ibn Kathir on 1:1).

### The page
- Header: back link, the Arabic name (as the service gives it, with or without marks), "Surah n · N ayahs · Mecca" (the legacy data's word), Play surah (the Phase 3 player), Translation, Tafsir and Reciter menus (popovers on desktop, bottom sheets on mobile), and Mark as read.
- Bismillah above surahs 2 to 114 except 9, from the data of surah 1; the line's height is reserved while it loads (the first version made the text jump: layout shift 0.125).
- Each ayah: the Arabic (`arabic1`, the Qur'an font, the Arabic size setting, a gold verse marker), the translation, then Tafsir, Save, Pin and Share. Verse layout (Arabic first or Translation first) changes the **DOM order**, not only the look. Urdu and Arabic (Alt) are right-to-left with their own fonts.
- **Translation shown:** Off wins; else the explicit `translationDefaultLang`; else the old reader's text tab (`preferredVerseDisplay`); else English. Choosing a language writes the legacy key; Off writes only `quran:reader-prefs:v1`.
- **Tafsir:** a button per ayah opens a panel with the three sources as toggle buttons, the group note, the text (markdown-lite rendered by the legacy escape-first renderer; a test shows `<script>` in the text stays text and nothing runs), the source name and the Ja'fari line. The default source is the legacy key, else Ibn Kathir (not written until you choose); choosing a source writes `tafsirDefaultAuthor`, as legacy. Loading, error with Retry, and "isn't saved on this device" (offline) states; no spinner is left running.
- **Opening at an ayah** (`#ayah-N`): after the text renders it scrolls until the position is stable (rows below are laid out lazily), focuses the ayah and highlights it for 1.6 s. A bad hash is ignored. A bad surah (0, 115, `abc`, `1.5`) shows "That surah doesn’t exist".
- Previous and next surah links.

### Save, pin, share
- **Save:** `ayah:<s>:<a>` in `quran:bookmarks:v1` (+ `added-at`) with an Undo that restores the first-saved time.
- **Pin:** `quran:pins:v1` = `{ "v": 1, "reading": { "surahNo", "ayahNo", "pinnedAt" } | null }`; one pin, moving it replaces the old one; Undo restores the previous pin; other fields are kept. Nothing shows pins yet (Library, Phase 6).
- **Share:** Web Share when present (the Arabic, the shown translation, the reference, and a link to the ayah), else a copy to the clipboard with "Copied". With the translation Off only the Arabic and the reference are shared.

### Reading progress, the daily log, Completed
- **Resume position (legacy, unchanged):** the last ayah whose top is above 35% of the viewport after 400 ms of stillness; ayah 1 is not written on open. The record is **exactly the legacy one**, field for field (`surahName` is the English meaning, for example "The Cow"; `surahNameArabic` the long Arabic name), so a rollback reads it unchanged. A browser test checks the keys and values.
- **Daily log (changed, approved):** every ayah that stayed on screen for about 1.5 s in total, while the tab was visible, is added to `quran:reading-goals:v1` `dailyLog[<local day>]` (unique, local calendar day; `goals`, `activeGoalId`, other days and unknown fields are kept exactly). The legacy reader added only the one ayah the 400 ms pause happened to land on.
- **Completed:** `quran:read-surahs:v1` = `{ "v": 1, "surahs": { "<n>": { "completedAt": <ms> } } }`. Automatic when the last ayah is reached **and** at least 90% of the ayahs were counted as read (the same 1.5 s rule) in this visit; on a short surah where the page cannot scroll far enough for the last ayah to reach the 35% line, "reached" also means the last ayah is on screen and the page is scrolled to its bottom. Mark as read and Mark as not read are always available, each with an Undo. A link straight to the last ayah, a scrollbar jump, a flick or a skim does not complete a surah. The first completion time is kept. A damaged value reads as empty.
- **The listing** draws a filled marker for completed surahs, keeps the half marker for the last read place, and shows the legend ("Completed", "Last read").

#### How the daily log differs from the legacy count (simulated, then confirmed in a browser)
`tests/readingTracker.test.ts` replays reading sessions through the legacy rule and the new one (a phone: ayahs of 320 px, a 700 px screen, 60 fps frames, 40 ayahs passed). It records what each logs for the day:

| Reader | Legacy logs | New logs |
| --- | --- | --- |
| Careful (8 s per screen) | 24 | 39 |
| Normal (4 s per screen) | 24 | 39 |
| Quick (about 1 s per screen) | 24 | 36 |
| Skim (0.6 s per screen) | 0 | 2 |
| One fast flick to the end | 1 | 0 |
| A slow, steady scroll with no stop (60 s) | 1 | 40 |

So for someone who really reads, Home's "today's goal" count will be **about 60% higher** than the legacy app would have shown for the same reading (39 against 24 for 40 ayahs), and a steady scroller who never pauses, which the legacy rule barely counted, now counts fully. Skimming and flicking count for almost nothing under both rules. **Because the difference is large, please confirm it before it ships** (open question 1). In the browser (`e2e/reader.spec.ts`): after about 2.3 s on the first screen of Al-Baqarah the log held the ayahs on that screen (and none that was never shown); a quick scroll down and away logged none of the ayahs it passed.

### Reader-only preferences
`quran:reader-prefs:v1` = `{ "translation": "off" }` (field removed when a language is chosen; other fields kept). It is in Settings' Reset list (it is a setting) and in Export (Export reads every key).

## Rendering cost: measured

375px, CPU 4x slower, Al-Baqarah (286 ayahs, 6,170 elements), `e2e/reader.spec.ts`, written to `test-results/reader-perf.json`; the control is the Settings page (the app's own start-up).

| | Run 1 | Final run |
| --- | --- | --- |
| first render, cold (text over the mocked network, then stored) | 2,152 ms | 2,033 ms |
| the same surah again, from the device | 1,478 ms | 1,987 ms |
| opening one ayah's tafsir | 625 ms | 450 ms |
| longest task (control: 280 ms, 414 ms) | 102 ms | 170 ms |
| layout shift | 0.015 | 0.014 |

Budgets: first render under 4,000 ms, tafsir under 800 ms, the longest task no more than the control (or 250 ms) plus 250 ms, layout shift under 0.02. **The first measurement had a layout shift of 0.125**: the bismillah arrived after the text and pushed it down; its height is now reserved. A residual 0.014 remains. Run to run the figures move by several hundred milliseconds (the warm figure rose between runs, which is noise, not a regression); these are a ceiling check, **not a real phone**. The same approach as Phase 3 (plain elements, one delegated click handler, `content-visibility: auto`, inline icons, no per-ayah components) is what keeps 286 rows cheap.

## Verification

- [x] `npm run verify` on Node 22.23.3: build, lint clean, **296 unit tests** (44 new), dev-server smoke test, **198 browser checks** (46 new: 43 for the reader, 3 added to the listing; two Phase 0 checks and the listing's link and notice checks were updated for the real reader). The first browser run had 10 failures: two were real bugs (the Translation menu options were built wrongly and showed empty labels; the late bismillah caused a layout shift), the rest were mistakes in the new tests (a loose selector, two Undo toasts at once, Windows `\r\n` in the clipboard, the app's hidden skip link in a 44px check, and offline tests that did not account for mocked routes still answering offline and for a full page load dropping the already-loaded route code). All fixed, then the whole suite re-run.
- [x] Browser tests (`e2e/reader.spec.ts`): cold skeleton then text; bismillah for surahs 2 and 114, never for 1 and 9, omitted when surah 1 fails; warm load makes no request; failed request, message and Retry; offline: a surah read before opens from the device, one never opened says so, Retry works once back online; bad surah and bad hash; `quran-app-db` never opened; `#ayah-N` scroll, focus and highlight, and a hash change on the same surah; default English; Translation first order; each language and Off with the exact keys; the old reader tab as default; tafsir (one request, three sources, group note, default from the legacy key, choosing writes it, escaped text, the Ja'fari line and no claim about schools, error and Retry, offline not saved); save with Undo and the first-saved time; saved ayahs shown on open; pin (replace, Undo, unpin, Undo); share with Web Share and with the copy fallback (no separate Copy button); progress not written on open and exactly the legacy record after scrolling; the daily log with its local day and other fields kept; a quick scroll logs nothing; a short surah completes with Undo; a link to the end does not; Mark as read both ways; the listing's Completed marker, legend and a damaged value; Play surah, reciter and the failed-file message (no offline claim); previous and next; links from the listing, a juz row, Home and the nav; keyboard (names, Enter, Space, tab order); light and dark; 375px (no horizontal scroll, 44px targets, Arabic not clipped, the sheet's 46px rows); the throttled run.
- [x] Unit tests (`tests/reader.test.ts`, `tests/readingTracker.test.ts`, plus `settingsLogic`): chapter validation and every kind of bad response; route and hash parsing; the bismillah for all 114 surahs and **no Arabic bismillah string anywhere in the app source**; tafsir parsing and escaping; the cache order, damaged records, 404 versus unavailable, failing reads and writes, an invalid response not stored; the version 1 to 2 upgrade; the reader's keys (round trips, damage, unknown fields kept); the exact legacy progress record; the daily log; the tracker rules and the simulated sessions.
- [x] Real-data check (above).
- [x] Screenshots: `docs/design/reader-compare/` (see its README for what was looked at one by one).
- [ ] **Real audio on a phone** (Play surah): every browser test uses a stand-in. Yours, with the two large files (Al-Baqarah, Aal-i-Imraan), in Safari on iPhone and Chrome on Android. `docs/audio-url-check.md` explains why.
- [ ] Share on real devices (the Web Share sheet), the screen-reader pass, and a real-phone check of scrolling a long surah.

## Differences from the prototype

See `docs/design/reader-compare/README.md`.

## Content placeholders replaced

See `docs/CONTENT_TO_VERIFY.md` (Surah reader items).

## Open issues and risks

1. **Home's goal count reads higher** than in the legacy app (table above); approved, and counts before and after cutover are not merged.
2. **No translator is named anywhere in the data** for the English, Urdu, Bengali and Arabic (Alt) texts, and the three tafsir authors' schools are not stated; the page shows only the language and the author's name. Attribution to fill in (CONTENT_TO_VERIFY.md).
3. **A first visit offline cannot read a surah** (nothing is bundled); the page says so. Downloads (Phase 11) will save surahs ahead of time. Surah files are small (Al-Baqarah 527 KB), but the audio is not: files up to 91 MB (`docs/audio-url-check.md`), which Phase 11 must plan for.
4. **The Completed rule is a heuristic** (one visit, 90% read): a long surah read over several days is never marked automatically; Mark as read exists for that.
5. **The bismillah needs surah 1 once;** opening any surah while online loads it and caches it, so it appears on later offline visits. On a first visit that is offline it is left out.
6. **Pins and the Completed list are written but not shown** except the Completed marker on the listing; the Library (Phase 6) shows pins.
7. **`/juz/[id]`** (the legacy full-juz reader) still shows "not rebuilt yet" if opened by an old link; no row links to it.
8. **Residual layout shift 0.014** on the largest surah at 4x CPU (below the 0.02 budget).
9. The `.live.ts` check needs the internet and is run by hand.

## Decision on the goals count (Phase 4A review)

**Approved: keep the 1.5 s rule.** Goal counts read higher than in the legacy app (39 against 24 per 40 ayahs for a careful reader, in the simulation) because the legacy rule undercounted the readers who most deserve credit. Counts recorded before and after cutover use different rules and are **not merged or converted**; the new rule simply applies from cutover. Phase 15 (Reading goals) may need to recalibrate pace targets (see PROGRESS.md).

## Open questions

1. ~~Confirm the daily-log change.~~ Confirmed (above). Original question: With the 1.5 s rule, Home's "today's goal" count is about 60% higher than the legacy app would show for the same careful reading (39 against 24 per 40 ayahs in the simulation), and a steady scroller is counted fully. You asked to confirm before shipping if the numbers differ by a lot; they do. Keep the 1.5 s rule, change the time (a longer wait gives lower counts), or go back to the legacy rule?
2. **Translator and tafsir attribution (still open, does not block Phase 5):** supply the exact names for the four translations (English, Urdu, Bengali, Arabic (Alt)) and the three tafsir authors, and they become labels. Until then the app shows only the labels it already shows.

## Next phase needs

Phase 4B (full player): extend `usePlayerStore` (seeking, resume `quran:audio-resume:v1`, repeat, auto-next from `prefs.autoplay`, per-ayah audio and the playing ayah highlighted in the reader, Media Session, the player sheet); the per-ayah play and download buttons go into the tools row of `AyahList`. **First check the audio files on real phones** (the 210 generic-type files). Phase 6 (Library) shows `quran:pins:v1` and reads `quran:read-surahs:v1`. Phase 9 flips `READERS_READY.page`. Phase 11 plans for the audio file sizes. Phase 15 (Reading goals) reads the `dailyLog` the reader writes (and the legacy reader wrote), now with the 1.5 s rule.
