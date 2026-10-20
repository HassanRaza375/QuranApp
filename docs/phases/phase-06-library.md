# Phase 6: Library

- Branch: `revamp-design-logic`
- Date: 2026-10-16
- Status: Done, awaiting review
- Plan and decisions: `phase-06-library-plan.md`

## Goal

The real Library at `/bookmarks` (prototype `d-page-library` / `m-page-library`), reading and writing the legacy storage keys in their legacy shapes so a rollback to the legacy app loses nothing.

## Approved decisions (all nine built)

1. Removing keeps note, tags and collections; Undo restores the original saved time.
2. Every type present in the data is shown (Fiqh, Reciters pages, Pages too); rarer ones are grouped under "More types".
3. Snippets from cached chapters, then the new `ayah-text` store (`quran-revamp-db` version 3), then one small per-ayah request. Never a whole surah, never typed Arabic; offline with nothing cached shows the reference and a clear line.
4. `story:<id>` was described as "reserved; nothing writes it until Phase 7". **Correction (Phase 7B review): that was wrong. The legacy app already writes `story:<id>` bookmarks** (the Save button on its story page), and the Library already lists them. It is a legacy key, not a new one.
5. Collections: delete with Undo, no rename; a collection view lists note-only items too.
6. The `quran:favorites:surah:v1` migration is repeated, idempotently (test).
7. Library-only export with real counts; no separate Clear.
8. Three Where I stopped slots; empty ones say "Not set" and why.
9. Notes on any item via the edit panel, and New note for any ayah reference validated against the real ayah counts.
Holds: after every operation the stored keys parse with a copy of the legacy loading code (unit and browser tests); collection ids are never reused (`retiredCollectionIds`); a test scans the source for hard-coded Arabic; select mode has checkbox semantics, keyboard selection and an announced count; menu options stay short; dark and 375px shots of the edit panel and Undo toast.

## What was built

- **Model** `app/lib/library.ts` (pure): add, remove and restore, notes, tags, collections, bulk add, ayah reference parsing, `newNote`. `libraryStorage.ts` (legacy keys, tolerant reads, unknown fields kept, writes only what changed, migration), `libraryItems.ts` (title, detail, link and search/sort/group for every key family, with a readable row for unknown keys), `libraryExport.ts`, `ayahSnippet.ts`, `pins.ts` (page pin).
- **Store** `stores/library.ts` (re-read before each write; `storage` and visibility listeners; lazy legacy data providers for people, names, stories and fiqh topics), `composables/useAyahSnippets.ts` (visible rows only, sequential).
- **UI** `components/library/`: `LibraryPage`, `WhereIStopped`, `SavedList`, `ItemRow`, `CollectionsList`, `NotesList`, `EditSheet`, `NewNoteSheet`; `ResponsiveMenu` gained optional group headings and a guard against a repeated pick.
- **DB** `quran-revamp-db` version 3 adds the `ayah-text` store; the other stores are kept.

## Findings and fixes during the build

- Provider loading raced when calls overlapped (names and stories stayed unresolved); each kind now merges as soon as it loads.
- The menu's radio group can report one pick twice; the shared menu now ignores the second.
- The shared search normaliser collapses repeated letters ("zzzz" finds "Juz"), as on the listing; kept.
- The edit panel's overlay hid the Undo toast; Remove and Delete note now close the panel.
- Rows below the fold request no text (checked by a test); a revisit re-asks for rows that had none.
- "Sajda verse" appeared twice in a row; fixed.

## Verification

- `npm run verify` on Node 22: build, lint, unit tests, dev smoke and 257 browser tests all pass (the Library spec has 22). Unit tests: 402 passed before the last two changes; the 42 in `library.test.ts` pass after them.
- Screenshots: `docs/design/library-compare/` (34 images). I looked at three of them; see the README.
- Not done by me: real-device checks (the user's), including Library on a phone.

## Open items

See `CONTENT_TO_VERIFY.md` (Library) and `PROGRESS.md` (cutover notes). Still open from earlier phases: the compass items, Open-Meteo non-commercial reading, WMM expiry (2030), Ja'fari times comparison, translator and tafsir attribution, the phone audio test and Phase 4B.
