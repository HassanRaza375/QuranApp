# Prototype map

`prototype.html` is a single file (about 3,600 lines of HTML, CSS and JS). Open it in a browser. It is a visual and behaviour reference, not code to port.

## How to use it

- The **control bar at the top** is prototype-only: page buttons, Desktop/Mobile, Light/Dark, Returning/New user, and the Ramadan state switch (Before Ramadan, Day 12, Last ten nights). Do not build it.
- Every page exists twice: `d-page-<name>` (desktop frame) and `m-page-<name>` (phone frame). Search the file for the id.
- Sample data, "sample" footnotes and "Prototype note" lines are prototype-only.
- All text, Arabic, dates and lists are placeholders. See `docs/CONTENT_TO_VERIFY.md`.

## Pages

| Page | Desktop / mobile ids | Main render functions | States to reproduce |
| --- | --- | --- | --- |
| Home | `d-page-home`, `m-page-home` | `renderResume`, `renderUtil`, quote block | Returning and New user; prayer schedule toggle |
| Surah listing | `d-page-surah`, `m-page-surah` | `renderDesktopList`, `juzHTML`, `pagesHTML`, `filteredSurahs` | Surah, Juz and Page tabs; sort; reciter; filter and empty state; playing row; progress markers |
| Surah reader | `d-page-reader`, `m-page-reader` | `readerHTML`, `ayahHTML`, `menuInner` | Translation and tafsir menus; per-ayah tools; playing ayah |
| Settings | `d-page-settings`, `m-page-settings` | `settingsPanel`, `renderSettings` | Eight sections; notifications dimmed when off; clear-all confirm; mobile section picker |
| Prayer and Qibla | `d-page-prayer`, `m-page-prayer` | `timesHTML`, `qiblaHTML`, `compassSVG` | Times and Qibla tabs; bell toggles; saved-times refresh; compass aligned and not aligned |
| Library | `d-page-library`, `m-page-library` | `renderLibrary`, `libPanelHTML`, `pinsHTML` | Saved, Collections, Notes; select mode; undo toast; edit panel; New user empty state |
| Prophets & People | `d-page-people`, `m-page-people` | `peopleListHTML`, `timelineHTML` | Browse and Timeline; category filter; search and empty state |
| Person | `d-page-person`, `m-page-person` | `personHTML` | Story, Passages, Family & notes tabs; Save |
| Story reader | `d-page-story`, `m-page-story` | `storyHTML`, `exHTML`, `cmpHTML`, `entHTML` | Yusuf (complete) and Adam (pieced together); compare drawer; entity sheet; end of story |
| Ramadan | `d-page-ramadan`, `m-page-ramadan` | `beforeHTML`, `duringHTML`, `ttHTML`, `evHTML` | Three states via the control bar; Today, Timetable, Events; fiqh switch; filter |
| Tasbeeh | `d-page-tasbeeh`, `m-page-tasbeeh` | `tasHTML` | Single and After prayer modes; reset confirm; completion |
| Sajda | `d-page-sajda`, `m-page-sajda` | `sajdaHTML` | Sunni and Ja'fari views |
| Asma-ul-Husna | `d-page-asma`, `m-page-asma` | `asmaHTML`, `nameSheetHTML` | Search; saved only; name sheet |
| Per page | `d-page-mushaf`, `m-page-mushaf` | `mushafHTML` | Slider and go-to; text size; pin |
| Full player | overlay (`d-ov`, `m-ov`) | `playerHTML` | Opens from the mini player track area |

## Shell

- Header, grouped sidebar, mobile drawer: top of the file (`.d-header`, `.d-sidebar`, `#drawer`).
- Mini player: `.d-player` and `.m-player` (play and pause icon, track text opens the full player).
- Overlays (side panel or bottom sheet): `renderOverlay` and `ovBody` select the content.
- Menus: `ddHTML` and `menuInner` define every dropdown; mobile uses the `#m-sheet` bottom sheet.

## Prototype-only logic (do not port)

The page switcher (`goto`), the control-bar listeners, `USER_STATE`, `RAM_STATE`, sample data arrays (`SURAHS`, `JUZ`, `PEOPLE`, `STORIES`, `EX`, `NAMES`, `SAJDA`, `RAM_EVENTS`, `LIB`), fake timers and the timetable formula.

## Second prototype: the remaining pages (`prototype-remaining-pages.html`)

Agreed 2026-10-22 for Phases 10, 11, 12, 13 and 15. Another single file (about 1,100 lines; 119 KB). It is one narrow-and-wide responsive layout (no separate desktop and mobile frames, no `d-page-` / `m-page-` ids), with **hash routes**: open it in a browser and change the part after `#` (for example `#/search`, `#/k/duas/ilm`, `#/fiqh/taharah/wudu`). Each page is built by one `pg…` function in the script. The sidebar greys out the pages that are already built.

| Page (build phase) | Prototype route | Render functions | States to reproduce |
| --- | --- | --- | --- |
| Search (10) | `#/search`, `#/search?q=…` | `pgSearch`, `runSearch`, `searchIndex`, `hl`, `norm` | Empty (Recent, Browse); results grouped by type with count chips and "Show all"; the "where your results fall" thread; ayah jump (`2:255`) and invalid numbers (`200:1`, `2:999`); no results; history delete and Clear with Undo; **offline** (header "Offline preview" button: the Ayahs group says it needs a connection, device results still show) |
| Downloads (11) | `#/downloads` | `pgDownloads`, `sheetAdd`, `queueHTML`, `enqueue`, `tickDL` | Storage meter and thread; quick picks; queue with per-surah progress; **Waiting for Wi-Fi / offline** state (Offline preview); Saved list with per-part (Text, Tafsir, Audio) add; remove with Undo; Add-surahs sheet with filter and size estimate; preferences (Wi-Fi only, reciter) |
| Knowledge list, 7 modules (12) | `#/k/peoples`, `#/k/places`, `#/k/themes`, `#/k/duas`, `#/k/events`, `#/k/signs`, `#/k/commands` | `pgKList`, `ktabs`, `STATUS` | Tab strip across modules; card grid with the ayah thread; status tag only when not "Qur'an states"; filter and empty state |
| Knowledge detail, 7 modules (12) | `#/k/<module>/<id>` | `pgKDetail` | Where it appears (thread, ayah chips); the ayahs with translation; Connected chips (inert when the target page is not in the prototype: persons, stories, fiqh); Referenced by; Save; Play all / Listen (duas show their Arabic large) |
| Daily Fiqh home (13) | `#/fiqh` | `pgFiqh`, `fiqhGate`, `marjaBar`, `fiqhBanner` | **No marja' chosen** (the gate); marja' bar; Continue row; nine categories (three "Coming later"); save-all-offline row; the Sunni notice exists in code but the prototype has no control that shows it |
| Choose marja' (13) | `#/fiqh/choose-marja` | `pgChooseMarja` | Three maraji' (one "Rulings not added yet"); language EN / اردو / Both |
| Fiqh category (13) | `#/fiqh/<category>` | `pgCategory`, `FTOPICS` | Rulings-added meter; topic list with flags; filter (more than 6 topics); the pending-marja' empty state; only Foundations, Taharah, Salah and Sawm have sample topics |
| Fiqh topic (13) | `#/fiqh/<category>/<topic>` | `pgTopic`, `slot`, `helperSheet`, `HELP` | Wudu (step by step, women's panel, Qur'anic basis); a live-times topic (`salah/times`); the decision helper (`salah/doubts`, a bottom sheet, one question per screen); a ruling "not added yet" for one marja'; the pending marja' |
| Fiqh glossary (13) | `#/fiqh/glossary` | `pgGlossary`, `GLOSS` | Search in any script; A to Z jump; empty state |
| Reading goals (15) | `#/goals` | `pgGoals`, `sheetGoal`, `dailyFor` | Today, Through the Qur'an (30 juz spine), This week bars, Other goals (completed, paused); New goal sheet with four types and a live preview; Log reading sheet with Undo |
| Calendar (15) | `#/calender` | `pgCal`, `sheetRem`, `hijriOf` | Month grid with Hijri or Gregorian first; selected-day panel; Add reminder sheet; remove with Undo; Coming up; previous and next month |

Shared: `thread()` draws the whole Qur'an as one line (used for marks, saved surahs and the Juz spine); `norm()` and `hl()` do mark-insensitive matching and highlighting; `openSheet`, `toast` (with Undo) and the delegated click handler are prototype plumbing.

**Not in this prototype, still to design or defer:** `/about`, `/sitemap`, `/surah-vedios`, `/poets` (and `/poets/[slug]`). `/surah-audios/[id]` is in neither prototype nor the decisions yet. `/juz/[id]` redirects to the reader (`DECISIONS.md`).

**Superseded inside this file:** the `#/hifz` and `#/hifz/session` pages (`pgHifz`, `pgSession`, `sheetHifzNew`, `HS`, `HIFZ`, the Missed / Got it / Easy buttons) are the older Hifz design. Do not build them; use `prototype-hifz.html`.

## Third prototype: Hifz (`prototype-hifz.html`)

Agreed 2026-10-22 for Phase 14: a new simple mode (see `DECISIONS.md`). About 560 lines; hash routes; mobile-width single column.

| Page | Prototype route | Render functions | States to reproduce |
| --- | --- | --- | --- |
| Hifz home | `#/` | `home`, `dots` | Today's plan (one tricky ayah, review, one new ayah) with one Start button; My surahs rows with strength dots; "Recite to someone" and "Practise anything, no grading" |
| Session | `#/session`, `#/session?mode=check`, `#/session?mode=free` | `newSession`, `session`, `recite`, `done` | A queue of one-screen steps. **Review:** recite from memory, tap a word to reveal it, "Reveal all", then tap the words slipped on. **Learn (new ayah), four stages:** Listen (3 times), Read along (word highlight), Fade (hide more words with a slider), Recite. **Join:** ayahs "2", "3", "2 + 3", "1 + 2 + 3". **Recite to someone:** a listener taps the words slipped on, nothing is hidden. **Free practice:** "doesn't change your schedule". Verdict line after each ayah; "Done for today" with the tricky words |
| Surah page | `#/surah/<n>` | `surah`, `TXT`, `SUR` | Per-ayah state list; "Slipped on <word> twice"; Tricky words; Check the whole surah / Pause |
| Add a surah | sheet from Home | `addSheet` | Pace: Gentle, Steady, Faster; the "about 6 weeks" sentence |

Build note: the Read along stage lights up words on a 420 ms timer. The app has per-ayah audio only, no word timings; this is for the Phase 14 plan to resolve.

## Prototype-only logic in the two new files (do not port)

The "Offline preview" button and `S.offline`; the hash router (`render`, `route`); the fixed date `TODAY` (22 Oct 2026); `quran:cal-rem-proto` (calendar reminders, a prototype-only key); the simulated download timer and its random progress; the sample constants (`AYAT`, `KN`, `PERSONS`, `STORIES`, `NOTES`, `MARAJI`, `FCATS`, `FTOPICS`, `GLOSS`, `HELP`, `HMONTHS`, `HEVENTS`, `G`, `DL`, `RECITERS`, `TXT`, `SUR`); the "Prototype of the pages still to build" note in the sidebar.
