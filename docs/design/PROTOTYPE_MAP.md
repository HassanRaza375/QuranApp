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
