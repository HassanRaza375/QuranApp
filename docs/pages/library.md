# Page: Library

- Route: `/bookmarks` (the legacy route, kept). The page is titled **Library**; views are `?view=collections` and `?view=notes`, and a collection opens as `?view=saved&collection=<id>`.
- Phase: 6
- Prototype section: `d-page-library` / `m-page-library`
- Offline level: A for everything the Library stores (it is all on this device). Ayah text under a row is B: from the device's cache, or one small request (see Snippets).
- Indexable: no.

## Purpose

Everything you save and write, in one place: saved ayahs, surahs, juz and other items, notes on any ayah (saved or not), tags, collections, and the places you stopped.

## Layout

- One `h1`: **Library**, the sentence "Everything you save and write, in one place. Stored on this device.", and **Export** (with "Settings, Data & privacy has a full export.").
- **Where I stopped:** three cards, Reading, Page and Story.
  - Reading: the pin (`quran:pins:v1.reading`) with a **Clear the reading pin** button; with no pin, the automatic last-read place labelled "Last read" with no clear button; empty: "Not set. Pin a spot from the reader."
  - Page: the page pin (`quran:pins:v1.page`, written by the page reader in Phase 9) with a clear button; until then "Not set. Pinning a page arrives with the page reader."
  - Story: the most recent person study state until Phase 7; empty: "Not set. Appears when you read a person or story."
- Three views as buttons with `aria-current`: **Saved**, **Collections**, **Notes**, and a count line ("12 saved", "2 collections", "3 notes", a live region).
- **Saved:** search; **Show** (All types and only the types that exist in your library, the rarer ones under a "More types" heading); **Sort and group** (Recently saved, Surah order, Name (A–Z), and under a "Group" heading: Group by collection, Group by type); **Select**; **New note**; the rows.
- **Collections:** **New collection**; a list with counts and a two-title preview; opening one shows the Saved view filtered by it (a chip "Collection: Forgiveness ×"), listing **every** item in it, note-only ones marked "Note only, not in Saved"; a delete button per collection.
- **Notes:** search over notes and tags; **New note**; every item with a note (saved or not) grouped by surah, then "Other", newest edit first in a group; "not in Saved" marks unsaved ones.
- A row: the Arabic text when there is any (two lines at most, the Arabic size setting applies), the title (a link when the page exists), the type, detail and "saved 2 days ago" (or "saved earlier" when there is no saved time, or "Note only, not in Saved"), the note's first lines, collection and tag chips, and a **more** button that opens the edit panel.
- One notice names the saved types whose pages are not rebuilt yet ("The page reader, People and Daily Fiqh are still being moved to the new design, so opening those items shows a placeholder for now."). Those rows keep their links.

## The edit panel (and New note)

- A side sheet at 768px and up, a bottom sheet below it; focus is trapped, Escape closes, focus returns to the more button.
- **Note** (autosaved 600 ms after typing stops and on close or blur; the status line says "Saving…" then "Saved"), **Tags** (Enter or Add; trimmed, a leading `#` removed, no duplicate ignoring case, up to 30 characters and 12 tags), **Collections** (toggle chips with `aria-pressed`, and New collection inline), and the actions **Open**, **Remove from Saved** (or **Save this ayah too** for a note-only ayah) and **Delete note**.
- **Remove** and **Delete note** close the panel, so the Undo toast is reachable.
- **New note:** an ayah reference ("2:255"), checked against the real ayah counts ("Surah 2 does not have an ayah 999.", "There is no surah 115. Surahs are numbered 1 to 114.", "Enter an ayah reference like 2:255 (surah, then ayah)."), and a note ("Write a note first."). A note does not save the ayah. An ayah that already has a note opens that note instead.

## Select mode

**Select** turns every row into a real checkbox named for its item ("Select Al-Kahf"). The bar shows "N selected" (also announced politely), **Select all shown**, **Add to collection** (a menu of collections and "New collection…") and **Remove from Saved**. Space toggles a focused checkbox; Escape or **Done** leaves the mode. A bulk removal is one Undo.

## States

| State | What shows |
| --- | --- |
| First run (nothing saved) | "Nothing saved yet. Tap the star under any ayah in the reader and it will appear here. Notes you write show up under Notes." with **Open the reader** and **Surah listing**; the three slots say "Not set" |
| No match | "Nothing matches your search or filters." with Clear |
| No collections | "No collections yet. Collections group saved items." |
| No notes | "No notes yet. Add one from the more menu on a saved item, or write one for any ayah with New note." |
| Text loading | A short placeholder line, only for rows on screen |
| Text not on the device and offline | "Text appears once you are online or have opened this surah." (the reference stays; no retry, no spinner) |
| Text request failed | The same line with **Try again** |
| Storage blocked | "Couldn’t save. Your browser is blocking storage for this site." and the screen keeps what you did |
| An unknown or future key | A readable row ("mystery: x"), never dropped, and it can be removed |
| Removed | Toast "Removed Al-Baqara 2:255 from Saved. Your note is kept." with Undo (the original saved time comes back) |

## Data and storage

- Reads and writes the legacy keys in the legacy shapes: `quran:bookmarks:v1`, `quran:bookmarks:added-at:v1`, `quran:library:v1` (`{collections, itemMeta}`; unknown fields kept). Reads `quran:pins:v1` and writes the page and reading pins' clear/undo, `quran:reading-progress:v1` (last read), `quran:persons-study:v1` (Story slot).
- **One difference from the legacy app:** removing a saved item keeps its note, tags and collections (the legacy app deleted them). The legacy app ignores that data for a key that is not bookmarked, so a rollback loses nothing. An empty record (no note, tags or collections) is not kept.
- **New, additive:** `quran:pins:v1.page`; `retiredCollectionIds` in the library record (ids of deleted collections, never handed out again; the legacy app ignores it); the `story:<id>` bookmark key is reserved (nothing writes it until Phase 7); the `ayah-text` store in `quran-revamp-db` (version 3).
- The old `quran:favorites:surah:v1` list is merged into the bookmarks and removed once, exactly as the legacy `load()` does, and only when the merged list was written.
- Every write re-reads first, so a second tab's items are not overwritten; the page follows other tabs, the reader's star and pin (`storage` event) and the tab returning to the foreground. Two tabs editing the same note: the last writer wins.
- Never opens `quran-app-db`.

## Known quirk

Search uses the shared normaliser (the same as the listing), which collapses repeated letters so that "fatiha" finds "Al-Faatiha". A side effect: a query like "zzzz" becomes "z" and matches "Juz". Harmless; kept for consistency with the listing.

## Snippets

The Arabic is never typed in the code (a test scans the source). Order: the cached chapter in `quran-revamp-db`, then the `ayah-text` store, then (online only) one request for just that ayah (about 2 KB), stored for next time. A whole surah is never fetched for a snippet. Only rows on screen ask, one at a time with a short gap. A damaged cached value counts as a miss.

## Export

**Export** downloads `quran-library-<local date>.json` with only the Library's keys (`quran:bookmarks:v1`, `quran:bookmarks:added-at:v1`, `quran:library:v1`, `quran:pins:v1`, `quran:read-surahs:v1`, those that exist), parsed, and the toast gives the real counts ("Exported 12 saved items and 3 notes."). There is no Library-only Clear; Settings keeps Clear all (its confirmation already lists bookmarks and notes) and Reset settings leaves the Library alone.

## Accessibility

One `h1`; the views are buttons with `aria-current`; every control is at least 44px at 375px; rows in select mode are real checkboxes with names; the selected count is a polite live region; sheets trap focus and return it; the Arabic is never letter-spaced or clipped; no colour alone marks the state.

## Tests

`tests/library.test.ts` (unit: the model, the legacy parsing after every operation, migration, never-reused ids, ayah references, items, search, sort, group, snippets, export, pins, the Arabic source scan) and `e2e/library.spec.ts` (browser). See `docs/phases/phase-06-library.md`.
