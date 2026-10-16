# Surah listing next to the prototype (Phase 3)

`<device>-<theme>-<tab>.jpg` puts the prototype (left) next to the revamp (right): desktop is 1280px, mobile is 375px, tabs are `surah`, `juz` and `page` (12 pairs). The prototype is driven through its own buttons (its full frame is captured, so its Page tab is the whole 604-chip page; the revamp side is the first screen only). `state-<name>-<device>-<theme>.jpg` are revamp-only state shots (13 states at 1280 light and 375 dark = 26 images; the prototype has no counterpart for them). The revamp is the production build, the reading-progress record is Al-Baqarah 2:285, audio is a stand-in that records what it is asked to play, and no network is used.

## Differences

| # | Prototype | Revamp | Kind |
| --- | --- | --- | --- |
| 1 | Legend "Completed, In progress, Not started" and a marker on every row (sample statuses) | One marker (a ringed number, "Last read: ayah 285 of 286") on the surah, juz and page that hold the last read place; no legend. The legacy data holds one place, not a list of finished surahs | Approved |
| 2 | Surah names with diacritics ("Al-Fātiḥah") and translations (typed) | The legacy service's names ("Al-Faatiha"), exactly as the rest of the app and the data files spell them | Real data |
| 3 | Revelation-order sort (8 sample values) | Not built (no verified source) | Approved |
| 4 | Sort menu: Surah no., then sample options | Surah number, Name (A to Z, ignoring Al-, An- ...), Verse count (most or fewest first); plus a Place menu and a Saved toggle (legacy had Favourites) | Approved (the article rule is this phase's decision) |
| 5 | Play button first (left of the name) on desktop, last on mobile | Star then Play at the right on both sizes, so the tab order matches what you see | Intentional |
| 6 | Filled round Play buttons, always visible | A plain outline triangle (a filled button on 114 rows was heavy); the playing row shows animated bars and a tint | Intentional |
| 7 | Chevron "›" at the end of each row | None: the whole name area is the link | Intentional |
| 8 | Surah rows: the translation on desktop only | The same: it hides below 640px (the first draft showed it on mobile and wrapped each row to three lines) | Matches |
| 9 | Juz rows: transliterated name, Arabic first words, a Play button | "Juz n", start surah and ayah, derived page range, a star; no names (unverified), no Play (no juz audio) | Approved |
| 10 | Juz page ranges "20 pages each" | Derived: juz 4, 7, 11, 26 start partway down a page and say so ("Starts partway down page 62") | Real data |
| 11 | Juz note "start points are sample values" | Removed; the data is generated from `/v1/meta` | Real data |
| 12 | Page tab: chips shaded as read up to the current page, a dashed current page | The dashed current page only (what was read before is not known); the shared page of a mid-page juz appears in both groups | Approved |
| 13 | Page tab has the reciter menu | None (nothing plays on this tab) | Intentional |
| 14 | A one-line subtitle only | Plus a notice that the reading pages are still being moved ("opening a surah shows a placeholder for now") | Honesty (removed when Phases 4 and 9 ship) |
| 15 | Mobile tabs are a full-width segmented bar | Underlined tab links (they are routes; `aria-current`) | Intentional |
| 16 | The mini player is a progress bar with a track line | Title, "Recited by <name>", Play or Pause; no scrubber until Phase 4 | Intentional for now |
| 17 | Empty state is a note | A bordered box with the same sentence and a Clear button | Added |
| 18 | Page title "Surah listing" with the header "Surah listing" | The header says "Surahs", "Juz" or the section name; the page keeps "Surah listing" | Shell decision (Phase 1) |

The sidebar and header differences are the Phase 1 ones (`docs/design/home-compare/README.md`).

**Fixed after review (screenshots not regenerated):** the Sort menu is wider so its labels stay on one line (a browser test checks), and it says "Name ignores Al-, An-".

**Known cosmetic items, not fixed:** the long reciter name is tight in its mobile button (it fits, checked by a test); on mobile the "Last read" line on a row may wrap to two lines.

**Looked at individually:** desktop light Surah, Juz and Page pairs; desktop dark Surah; mobile light Surah; mobile dark Surah and Juz; states: playing (desktop light), cannot play (mobile dark), reciter sheet (mobile dark), page jump (mobile dark), no result (desktop light), saved (mobile dark), sort menu (desktop light). **Generated but not examined one by one:** the other pairs (desktop dark Juz and Page, mobile light Juz and Page, mobile dark Page), and the other state shots (filter results, Arabic search, last read, Juz mid-page, invalid page and no progress, at both sizes, and the remaining states at the other size).
