# Phase 6: Library (plan, awaiting approval)

- Branch: `revamp-design-logic`
- Prototype: `d-page-library` and `m-page-library` (`renderLibrary`, `pinsHTML`, `savedHTML`, `collsHTML`, `notesHTML`, `libRowHTML`, `libPanelHTML`, `newNoteHTML`, `libRemove`, `libUndo`).
- Route: `/bookmarks` (the legacy route, kept). The page is titled **Library**; the nav row already says Library.
- Offline level: **A** for everything the Library stores (it is all on this device). Ayah text snippets are **B** (they come from the device's cache, or one small request, see section 8).

No code is written until this plan is approved. Done before the plan (your Phase 5 notes): the **Open-Meteo non-commercial reminder is now in the cutover checklist in `PLAN.md`** (a new "Cutover checklist" section, with the other pre-cutover items collected from the reviews); the three derived compass items (landscape sign, whether the iPhone heading is true or magnetic, the refusal wording) stay open in `CONTENT_TO_VERIFY.md` until you report from a phone. **The Open-Meteo attribution link is asserted by browser tests in both places**: beside the city results (`city-attribution`, `href="https://open-meteo.com/"`) and in Settings, Data & privacy (`privacy-place-search`, same link). (My screenshot of the results cut off above the link, so it is not in that image.)

## 1. What the legacy app has (read from `pages/bookmarks.vue`, `useBookmarks.js`, `useLibrary.ts`, `components/library/BookmarkMetaChips.vue`)

### Storage (all of this must stay readable by the legacy app)
| Key | Format |
| --- | --- |
| `quran:bookmarks:v1` | a JSON array of key strings |
| `quran:bookmarks:added-at:v1` | a JSON map key to first-saved time (ms); written once per key, deleted on removal |
| `quran:library:v1` | `{ collections: [{ id, name, description, createdAt }], itemMeta: { <key>: { note, tags[], collectionIds[], updatedAt } } }`; collection ids are `crypto.randomUUID()` |
| `quran:favorites:surah:v1` | the pre-library surah-only list; the legacy `load()` merges it into the bookmarks and **deletes** it |

**Bookmark key families** the legacy code writes: `surah:<n>`, `ayah:<s>:<a>`, `juz:<n>`, `page:<n>`, `audio:<n>` (a surah's reciters page), `sajda:<s>:<a>`, `name:<id>` (Asma-ul-Husna), `person:<id>`, `fiqh:<topicId>`. `itemMeta` is keyed by the **same** strings.

### The page
- Title "Bookmarks" with a count chip. A search box, a sort menu (Surah order, Recently saved, Tag, Collection), a "New" collection button, a row of collection chips (click to filter, a close icon to delete after a dialog), and **eight tabs**: Surahs, Ayahs, People, Fiqh, Audios, Sajdas, Pages, Juz. A card per item with Open and a remove button. An ayah card loads its Arabic and Urdu from the per-ayah endpoint (`/api/<s>/<a>.json`) on screen.
- Per item: a chips row (note, tags, collections) and "Edit note / tags", a dialog with a note (autosaved) and tags and collection chips.
- Search covers the title, the subtitle, the Arabic name, the note and the tags.

### What it cannot express (and the prototype does)
- **`name:<id>` bookmarks are saved but never shown** (the Asma-ul-Husna page writes them; no tab lists them).
- **Removing a bookmark deletes its note, tags and collections** (`removeItemMeta`); there is no Undo and nothing keeps a note.
- **No notes without a bookmark.** (The data format allows it: `itemMeta` for a key with no bookmark is simply ignored by the legacy page.)
- No Notes view, no group by type or collection, no select mode or bulk actions, no pins, no stories (no story key exists), no "saved 3 days ago" text, no empty or first-run state beyond "No bookmarks yet" alerts, no offline text for ayahs (it fetches each verse; offline it shows a loading state forever).
- Deleting a collection asks in a dialog (no Undo).

## 2. Data compatibility: nothing existing changes

- **Every key and format above stays byte-for-byte the same shape.** The Library reads and writes `quran:bookmarks:v1`, `quran:bookmarks:added-at:v1` and `quran:library:v1` with the legacy field names; unknown fields in any record are kept (read, merge, write). Collection ids stay `crypto.randomUUID()`; new collections have `description: ""`.
- **One deliberate behaviour difference, and it is data-safe:** removing a saved item **does not delete its `itemMeta`** when the meta has a note, tags or collections (the prototype's "Removed from Saved. Your note is kept."). The legacy app ignores an `itemMeta` entry whose key is not bookmarked, so a rollback loses nothing and shows nothing extra. A meta entry with no note, tags or collections is removed, so no empty records pile up. (Question 1.)
- **The migration of `quran:favorites:surah:v1`** that the legacy `load()` does (merge into the bookmarks, then delete the old key) is repeated by the Library on first load, so a user who comes from a very old version gets the same result. It is idempotent.
- **New, additive keys**, each of which the legacy parser already tolerates:
  - Bookmarks for item types the prototype shows and no legacy key exists for: **`story:<storyId>`** (the ids are the legacy story ids in `data/quranStories.ts`, for example `adamandiblis`). The legacy page filters bookmarks by prefix and ignores unknown ones; the Set round-trips them. Nothing writes it until Phase 7 adds a Save on the story page; the Library only reads and shows it.
  - Pins: `quran:pins:v1` (Phase 4A: `{ v: 1, reading }`) gains an optional **`page`** pin (`{ pageNo, pinnedAt }`) for Phase 9; the legacy app never reads this key.
  - Item types that **already have a legacy format** and only needed a place to be shown: `name:<id>`, `sajda:<s>:<a>`, `person:<id>`, `fiqh:<topic>`, `juz:<n>`, `page:<n>`, `audio:<n>`.
- **Tests prove it:** a legacy-shaped fixture (written the way `useBookmarks` and `useLibrary` write) round-trips through every Library operation with every field intact; the JSON the Library writes is read back by a copy of the legacy parsing (`list` from the array, `getMeta(key)` shape, `addedAt` map) with no difference; unknown prefixes and unknown fields survive.

## 3. The page

- `h1` "Library", the sentence "Everything you save and write, in one place. Stored on this device.", and **Export** (section 9).
- **Where I stopped** (section 4), then three views as **link-less tabs in the page** (state in the query: `?view=saved|collections|notes`, so the back button and a link work): Saved, Collections, Notes.
- **Saved:** search, a **Show** menu (All types plus only the types that actually have items: Ayahs, Surahs, Juz, Pages, People, Stories, Names, Sajda verses, Fiqh topics, Audios), a **Sort and group** menu (Recently saved, Surah order, Name A to Z, Group by collection, Group by type), **Select**; rows (section 5).
- **Collections:** a list with counts and a two-title preview; "New collection"; a collection opens as the Saved view filtered by it (a chip "Collection: Forgiveness ×").
- **Notes:** every item with a note (saved or not), grouped by surah for ayahs and "Other" for the rest, newest edit first within a group (the prototype sorts by surah order); search over notes and tags; **New note**.
- Count line "N saved", "N collections", "N notes".

## 4. Where I stopped (pins)

Three slots, as in the prototype, each a card that opens the place and has a clear button (a real `button`, "Clear the reading pin"):
- **Reading:** the **pin** from `quran:pins:v1.reading` (the reader writes it, Phase 4A). With no pin it shows the automatic **last read** place from `quran:reading-progress:v1` labelled "Last read" with no clear button (clearing a reading record is not what a pin clear means; the record is the resume position Home uses). Empty: "Not set. Pin a spot from the reader."
- **Page:** `quran:pins:v1.page` (written by the page reader in Phase 9; until then always "Not set").
- **Story:** until Phase 7, the most recent person study state (`quran:persons-study:v1`, "You were reading: <section>", the same source as Home's second row); Phase 7 switches it to story chapters with a new key (one adapter, as for Home).
- **Clear** removes only the pin (the one field of the pins record), with an **Undo** toast; **Replace** happens in the reader: pinning another ayah replaces the pin and its toast already says so (Phase 4A); the Library updates at once (it listens for storage changes).
- A pin that points at something that no longer exists (a damaged value) is shown as "Not set" and ignored, never thrown.

## 5. Saved view: rows, search, filters, select

- **Row:** the Arabic snippet (when available, never typed; section 8), the title ("Al-Baqara 2:255" from the bundled surah list), the type and detail ("Ayah · saved 2 days ago", "Surah · 286 verses · Madina"), the note's first lines, collection and tag chips, a more button (the edit panel) and the open link. "Saved 2 days ago" comes from the added-at map; an item saved before that map existed (no entry) says "saved earlier".
- **Titles and details** come from real data, no typed text: surahs from the bundled list; juz and pages from `quranMeta`; people from the legacy persons data (`@legacy/data/quranPersons`); fiqh topics from the wajibat data; names from `assets/data/names.json`; stories from `data/quranStories.ts`; sajda and audio items from the key itself ("Al-A'raaf 7:206 · Sajda verse", "Al-Baqara · reciters").
- **Opening an item:** surah, ayah and sajda open the reader (`/surah/<n>#ayah-<a>`, working since 4A); juz opens its first ayah; page, audio, person, fiqh, name and story open routes that are **not rebuilt yet**, so such rows keep their link and the page shows one notice naming only the types present ("Pages, People and Daily Fiqh pages are still being moved to the new design"); the flags are the same one-per-type pattern as `readerLinks.ts` and flip as phases ship. No dead link is hidden.
- **Search** (the Phase 3 normaliser: accents, Arabic marks, case): title, detail, type name, note, tags, collection names. **Sort:** Recently saved (the added-at time; items without one sort last in key order), Surah order (surah then ayah; non-Quran items after), Name; **Group** by collection (an item in several collections appears under each, "No collection" last) or by type.
- **Select mode:** "Select" turns rows into checkable rows (real checkboxes with names), a bar "N selected" with **Add to collection** (a menu of collections, and "New collection"), **Remove**, and Done. Escape or Done leaves it. Bulk remove is one Undo.
- Empty results with filters: "Nothing matches your search or filters." with Clear; no saved items at all: the first-run state (section 11).

## 6. Edit panel, notes, tags, collections

- **The panel** (a bottom sheet on mobile, a side sheet on desktop; focus is trapped and returns to the more button): the Arabic and title, a type chip, "Saved 2 days ago" or "Note only", then
  - **Note:** a labelled textarea that **autosaves** 600 ms after typing stops and on close, with a live status ("Saved", "Saving…"); never loses text if the panel is closed mid-typing.
  - **Tags:** chips with remove buttons; an input where Enter or an **Add** button adds a tag (trimmed, no duplicates ignoring case, up to 30 characters, up to 12 tags); tags are stored as typed, shown with `#`.
  - **Collections:** toggle chips (`aria-pressed`) for each collection, and "New collection" inline.
  - Actions: **Open**; **Remove from Saved** (or, for a note-only item, **Save this ayah too**); **Delete note** (clears only the note, with Undo).
- **New note:** a form for any ayah reference ("2:255"); validated against the real ayah counts (a reference that is not an ayah says so; "2:999" is refused); a note is required; it creates `itemMeta["ayah:2:255"]` with **no bookmark** (appears under Notes, "not in Saved"); if that ayah already has a note it opens that note instead of creating a second one.
- **Collections:** create (trimmed, 1 to 60 characters, duplicate names refused ignoring case), open, **delete with Undo** (restores the collection and every membership; legacy asked in a dialog, but the project rule is Undo over confirm); no rename in the legacy app or the prototype, so none now (Question 5). Deleting a collection removes its id from every `collectionIds` (as the legacy `deleteCollection` does) and Undo puts them back.

## 7. Remove, Undo, and the last reference

| Action | Bookmark and added-at | itemMeta | Undo |
| --- | --- | --- | --- |
| Remove a saved item that has a note, tags or collections | removed | **kept** ("Removed from Saved. Your note is kept.") | restores the bookmark with its **original** first-saved time |
| Remove a saved item with no meta | removed | nothing to keep | restores the bookmark and time |
| Delete a note on a note-only item | n/a | the note is cleared; if no tags and no collections remain the whole entry goes | restores the entry |
| Delete a collection | n/a | its id leaves every `collectionIds` | restores the collection and the memberships |
| Bulk remove | all removed | each kept or dropped as above | one Undo for all |
| The reader's star (Phase 4A) and the listing's star | removed | **never touches itemMeta** (they did not before; unchanged) | their own Undo |

When the **last reference** disappears (no bookmark, no note, no tags, no collections) the item simply has no record and is gone; nothing is left behind. A note-only item whose note, tags and collections are all removed disappears the same way.

## 8. Ayah snippets: the Arabic comes from the device, never from the code

- **Order:** (1) the cached chapter in `quran-revamp-db` (`chapters`, filled by the reader), (2) a new small store **`ayah-text`** in `quran-revamp-db` (version 2 to 3, additive, `quran-app-db` is never opened) holding `{ arabic1 }` per ayah, (3) one request to the per-ayah endpoint `/api/<s>/<a>.json` (about 2 KB; the legacy bookmarks page used it) when online, then stored. Chapters are **not** fetched for a snippet (Al-Baqarah alone is 527 KB).
- **Only visible rows** load text (an `IntersectionObserver`), so a long Library does not fire hundreds of requests; requests are one at a time with a small gap.
- **Not cached and offline:** the row shows the reference and "Text appears once you are online or have opened this surah." (no spinner left running, no placeholder Arabic). **Online request fails:** the same text and a retry link on the row. A damaged cached record is a miss.
- The text is `arabic1` (with marks, the legacy Qur'an font, the Arabic size setting, two lines then clipped by line-clamp, never truncated mid-word by script).

## 9. Export and Clear all

- **Settings keeps both, unchanged:** Export (every localStorage key, so all Library keys are in it) and Clear all (`localStorage.clear()` plus `quran-revamp-db`, which also drops the cached chapters and the new `ayah-text` store). Reset settings does not touch Library data (the Phase 2 rule, tested).
- **Library's Export button** (the prototype has one) exports **only the Library's keys** in the same flat format as the Settings export: `quran:bookmarks:v1`, `quran:bookmarks:added-at:v1`, `quran:library:v1`, `quran:pins:v1`, `quran:read-surahs:v1`; the file is `quran-library-<local date>.json`; the toast reports the real counts ("Exported 11 saved items and 4 notes."). It says "Settings, Data & privacy has a full export". There is **no Library-only Clear** (a separate destructive button next to the page's content would be easy to hit; Clear all in Settings already lists "bookmarks, notes" in what it deletes). Question 7.
- There is no import (the legacy app had none).

## 10. State, sync and safety

- A small pure model (`lib/library.ts`) holds every rule (types, titles, search, sort, group, remove and restore, meta clean-up, validation) over plain objects, unit-tested; a Pinia store reads the three keys when the page opens, re-reads on the `storage` event and when the tab becomes visible again (another tab or the reader changed something), and writes through the model.
- **Writes re-read before writing** and merge by key, so two tabs cannot silently overwrite each other's different items; a conflicting edit of the same note is last-writer-wins (documented, tested).
- The reader's and the listing's stars keep using `lib/bookmarks.ts`; the Library does not replace them.
- Everything is wrapped so storage failing (private mode, quota) shows "Couldn’t save. Your browser is blocking storage for this site." and keeps the screen's state; nothing throws.

## 11. Empty, first-run and offline states

| State | Shows |
| --- | --- |
| First run (no bookmarks, no meta) | "Nothing saved yet. Tap the star under any ayah in the reader and it will appear here. Notes you write show up under Notes." with **Open the reader** and **Surah listing**; Where I stopped shows its "Not set" cards |
| No match | "Nothing matches your search or filters." with Clear |
| No collections | "No collections yet. Collections group saved items." and New collection |
| No notes | "No notes yet. Add one from the more menu on a saved item, or write one for any ayah with New note." |
| Storage unavailable | The blocked message above; reading still works for what is in memory |
| Offline | Everything works; ayah snippets show from the cache or the "once you are online" line |
| A bookmark whose data is unknown (an id that no longer exists, a future key) | The row shows the key's readable form ("Person: nuh") and still can be removed; it is never dropped silently |

## 12. Files, tests, screenshots

- **Files:** `app/pages/bookmarks.vue` (the legacy route); `app/components/library/` (`LibraryPage`, `WhereIStopped`, `SavedList`, `CollectionsList`, `NotesList`, `ItemRow`, `EditSheet`, `NewNoteSheet`, `SelectBar`); `app/lib/library.ts` (the model), `libraryItems.ts` (titles, details, links per type), `libraryExport.ts`; `app/stores/library.ts`; `lib/bookmarks.ts` gains the pieces the model needs (the added-at map read and write by key, the favourites migration); `db/revampDb.ts` version 3 (`ayah-text`); `composables/useAyahSnippets.ts`.
- **Unit tests:** the legacy fixture round trip (every operation keeps every field, order and unknown fields); the favourites migration; titles and details for every type including an unknown id; search with Arabic marks and tags; every sort and group; the remove and Undo table in section 7 (original added-at restored, meta kept or dropped); collection create, duplicate refusal, delete and Undo; note validation (a bad reference, a duplicate, an empty note); tag rules; pins read, clear and Undo (a damaged pin ignored); the Library export contents and file name; concurrent-writer merge; the `ayah-text` cache and the offline snippet rule; the version 2 to 3 upgrade keeps the other stores.
- **Browser tests** (mocked per-ayah endpoint with synthetic text; fixed clock): first run; a seeded legacy library (all key families) renders every row; each type's title, detail and link; the not-rebuilt notice naming only present types; search, Show, sort, group by collection and by type; select mode with bulk add and bulk remove and one Undo; the edit panel (note autosave and its status, closing mid-typing, tags, collections, Open, Remove, Delete note with Undo, Save this ayah too); New note (valid, bad reference, duplicate opens the existing note); collections create, duplicate, open, delete and Undo; Where I stopped (pin, last read fallback, clear with Undo, a damaged pin); the reader's star and pin appear in the Library without a reload (storage event); Export contents and name; Settings Export still has everything; Clear all empties the Library; snippets (cached, per-ayah request, offline none, retry); keyboard for rows, select mode, the sheet (focus trap, Escape, focus return); 44px at 375; one `h1`; light and dark; `quran-app-db` never opened.
- **Screenshots (prototype next to revamp):** the Library at **1280 and 375, light and dark** for Saved = 4 pairs, plus Collections and Notes at 1280 light and 375 dark, plus state shots: first run, no match, select mode with a selection, the edit panel (desktop sheet and mobile bottom sheet), New note with an error, a group by collection, the Undo toast with "note is kept", the pins (set, last read, cleared), a row with no cached text offline. I look at every one and say which I only generated.
- **Docs:** phase doc, `docs/pages/library.md`, PROGRESS.md, CONTENT_TO_VERIFY.md (the prototype's sample ayahs, names and collections are not used).

## Open questions

1. **Keep the note when an item is removed** (the prototype; the legacy app deleted it). Data-safe as explained in section 2. OK?
2. **Type filter.** Show every type that exists in the data, including the three the prototype omits but the legacy page had (Fiqh topics, Audios, Pages), each only when it has items? (Recommended: yes; nothing the user saved disappears.)
3. **Ayah snippets** from the cache, then a new `ayah-text` store filled by one small per-ayah request, never by fetching a whole surah. OK, or cache-only (no network at all on this page)?
4. **Stories.** Reserve `story:<storyId>` (legacy story ids) as the additive bookmark key; nothing writes it until Phase 7. OK?
5. **Collections.** Delete with Undo (instead of the legacy dialog), no rename. And a collection view lists **every item in it**, including note-only ones (marked "Note only"), rather than only saved items as the prototype does. OK?
6. **Migration** of `quran:favorites:surah:v1` as the legacy `load()` does. OK?
7. **Export.** A Library-only export file plus Settings' full export unchanged; **no separate Library "Clear"** (Settings' Clear all already covers it). OK?
8. **Where I stopped, reading slot.** The pin, else the automatic last-read place (no clear button). And the Page and Story slots as described (Page empty until Phase 9; Story from the person study until Phase 7). OK?
9. **Notes on any item.** The prototype only offers New note for an ayah reference; the edit panel allows a note on any saved item (as legacy did). Keep both?

## Risks

- **Two tabs writing the same key** (mitigated by re-read and merge; the same note edited in two tabs is last-writer-wins).
- **A large Library** (hundreds of items): plain rows, one delegated click handler and `content-visibility`, measured with the same throttled test as the listing and the reader.
- **Names, people and fiqh titles** need those legacy data files (through the bridge); if a data file changes an id, the row falls back to the readable key rather than disappearing.
- **The not-rebuilt pages** (people, fiqh, pages, names, audios, stories) are linked and flagged, not hidden.
- **`crypto.randomUUID`** exists on secure origins (the preview and production are HTTPS; localhost works); a fallback id generator covers anything else.

## Not part of Phase 6

Saving from the people, story, names, sajda and fiqh pages (those phases add their Save buttons; the Library already shows their keys), import, sharing a collection, sync between devices, rename, and the Library inside Search (Phase 10).
