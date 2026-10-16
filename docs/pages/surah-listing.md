# Page: Surah listing, Juz, Page

- Route(s): `/surah-listing` (Surah tab), `/surah-listing?tab=page` (Page tab), `/juz` (Juz tab, a legacy route). `/juz/<n>` and `/per-page-read` are readers and are not part of this page.
- Phase: 3
- Prototype section: `d-page-surah` / `m-page-surah`
- Offline level: A. Every list is built from bundled data. Only playing audio needs a connection.
- Indexable: `/surah-listing` is prerendered with its own title and description; `/juz` is not.

## Purpose

Find a surah, a juz or a page quickly, start listening to a surah, save one, and get back to where you stopped.

## Layout

- One `h1` ("Surah listing"), a count line ("114 surahs", "3 of 114 surahs", "30 juz", "604 pages"), three tab links, then the tools, a short notice, the last read link and the list.
- Tools: a filter box (Surah: "Filter by name, number or place"; Juz: "Filter by juz number or place"; Page: "Go to page (1 to 604)" with a Go button). On the Surah tab also: Sort, Place, Reciter menus and a Saved toggle. They are two columns on mobile and a row on desktop; the menus are dropdowns on desktop and bottom sheets on mobile.
- **Surah row:** number (ringed when it holds the last read place), name and translation (the translation hides below 640px), "Mecca · 7 verses", the Arabic name (never truncated, scales with the Arabic size setting), a star, Play or the animated bars. The whole name area is the link.
- **Juz row:** number, "Juz n", "Starts at <surah> <s>:<a> · Pages a–b", "Starts partway down page N" for juz 4, 7, 11 and 26, a star.
- **Page tab:** 30 groups headed "Juz n" and "Pages a–b"; 44px chips; the current (last read) page is dashed.
- The mini player (global) appears at the bottom once something has been played.

## States

| State | What shows |
| --- | --- |
| Filter with results | Count "N of 114 surahs" |
| Filter with no result | "No surahs match “xyz”. Try a name or a number." and Clear |
| Saved on, nothing saved | "No saved surahs yet. Tap the star on a surah to save it." |
| Reading progress present | A "Last read" line (Surah tab), the ringed number and "Last read: ayah N of T" on the surah row, the same ring on the juz row, a dashed page chip and "Jump to page N, where you stopped" (Page tab) |
| Reading progress missing or damaged | No marker, no message |
| Playing | The row tinted with bars; the mini player shows the title and "Recited by <name>" with Pause |
| Loading | The mini player says "Loading…" |
| Cannot play | The row and the mini player say "Couldn’t play. Audio needs a connection unless it was downloaded." and Play returns |
| Invalid page typed | "Enter a page from 1 to 604" |
| Readers not built | A one-line notice above the list (see below) |

## Data and storage

- Reads: bundled tables (`app/data/quranMeta.generated.ts`), the legacy `surah.json` (lazily, for the audio URL only), `reciter` (by name), `quran:audio-prefs:v1` (speed), `quran:reading-progress:v1` (read only), `quran:bookmarks:v1`.
- Writes: `quran:bookmarks:v1` and `quran:bookmarks:added-at:v1` (`surah:<n>`, `juz:<n>`), `reciter` (`{ reciter: <name> }`). Nothing else.
- No network request except the audio file when Play is pressed (checked by a browser test).

## Accessibility

- Tabs are links with `aria-current`. Star: a button with `aria-pressed` and a name ("Save Al-Faatiha"). Play: "Play Al-Faatiha" or "Pause Al-Faatiha". Tab order in a row: the link, the star, Play.
- The count, the error text and the mini player's status are polite live regions; the page error is an alert.
- 44px targets on mobile for every control in a row, the tabs, the filter and the chips.

## Not on this page (yet)

Revelation order, juz names, juz audio, the Completed marker, seeking, resume, repeat, auto-next, per-ayah audio, downloads; the readers (Phases 4 and 9).
