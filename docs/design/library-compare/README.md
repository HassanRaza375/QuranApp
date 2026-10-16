# Library next to the prototype (Phase 6)

`<device>-<theme>-<view>.jpg` puts the prototype (left) next to the revamp (right): desktop 1280px, mobile 375px; views `saved` (4 pairs: both sizes, light and dark), `collections` (1280 light, 375 dark) and `notes` (1280 light, 375 dark) = 8 pairs. `state-<name>-<device>-<theme>.jpg` are revamp-only state shots at 1280 light and 375 dark: first-run, pins-set, pins-last-read, pins-cleared-undo, no-match, group-by-collection, show-menu, select-mode, edit-panel, undo-note-kept, new-note-error, collection-open, snippet-unavailable (13 states x 2 = 26). 34 images in all.

The revamp is the production build with a legacy-shaped seeded library, the clock fixed at 15 Oct 2026 09:14 Karachi, and the per-ayah endpoint answered with **synthetic text** ("TEST ARABIC 2:255 (synthetic text)"), so no Qur'an text was stored by the screenshot script. The Arabic in the prototype column is the prototype's own sample.

## Differences

| # | Prototype | Revamp | Kind |
| --- | --- | --- | --- |
| 1 | Typed sample ayahs, notes, tags, collections, people and a "Resume: Chapter 2 of 4" story state | Your real data only; none of the samples is used | Real data |
| 2 | Arabic snippet under every ayah, typed | From the device cache or one small request per visible ayah; with neither, the reference and "Text appears once you are online or have opened this surah." | Approved |
| 3 | Removing deletes everything | The note, tags and collections are kept; Undo restores the original saved time | Approved |
| 4 | Types shown: ayahs, surahs, juz, people, stories | Every type present in the data (Fiqh topics, Pages, Names, Sajda verses, Reciters pages too); the rarer ones sit under "More types" | Approved |
| 5 | Notes only on saved items, New note for an ayah | Same, plus a note on any saved item from the edit panel; New note checks the reference against the real ayah counts and refuses "2:999" | Approved |
| 6 | Collection view lists saved items | Lists every item in it, note-only ones marked | Approved |
| 7 | Delete collection (no detail) | Delete with Undo; no rename | Approved |
| 8 | Story slot "Yusuf, Chapter 2 of 4" | The latest person study state until Phase 7 (then story chapters); "Not set" with a reason when empty | Approved |
| 9 | Page slot "Page 49" | The same, from `quran:pins:v1.page`; "Not set" until the page reader (Phase 9) | Approved |
| 10 | Export button | Library-only file with the real counts in the toast; no Library-only Clear | Approved |
| 11 | Select mode, bulk actions | Real checkboxes with names, a polite count, Space and Escape, one Undo for a bulk remove | Intentional |
| 12 | Edit panel as a card | Side sheet at 768px and up, bottom sheet below; autosaved note with a status line; Remove and Delete note close it so the Undo toast is reachable | Intentional |
| 13 | A rows' item types without a page yet open normally | Their links stay; one notice names the types whose pages are not rebuilt | Intentional |
| 14 | Mini player bar always shown | Hidden until something plays | Intentional for now |

The sidebar and header differences are the Phase 1 ones (`docs/design/home-compare/README.md`).

**Looked at individually:** the desktop light Saved pair; mobile dark edit panel; mobile dark undo toast (it showed "Sajda verse" twice, fixed and the shots regenerated). **Generated but not examined one by one:** the other pairs and the other state shots.
