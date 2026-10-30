# Page: Surah audios

- Route(s): `/surah-audios/[id]` (a legacy route; `id` 1 to 114, anything else shows a message)
- Phase: 11 (decision: rebuild small, `docs/phases/phase-11-downloads-plan.md` section 0)
- Prototype section: none (the route is in neither prototype)
- Offline level: **A** (the page is bundled data); playing a file that is not saved needs a connection and says so
- Indexable: yes (a title and description per surah, as the legacy page had)

## Purpose

One surah's recitation by each of the five reciters: Play, the file size, and Download or Saved. It is the only place to play or save a surah by a **different** reciter without changing the Settings reciter. Saved "audio" items in the Library open here.

## Layout

Title with the surah's name and its Arabic name (from the bundled table), the meaning, ayah count, place and number; a **Save** toggle (the legacy audio bookmark `audio:<n>`, with Undo); then five rows. Each row: the reciter (with "Your reciter" on the Settings one), its size or state, **Play**, and **Download** (progress, Retry, Download anyway, Cancel) or **Remove** (with Undo). A line says what a saved recitation covers, with links to Downloads and to the reader.

## Dropped from the legacy page

The seek slider on each card and the "Now playing" block (the player sheet and the mini player own them), the 114-row "Surah Audios" drawer group (the grouped navigation already dropped it), and the network request made only to fetch the names.

## Data

The surah table (`SURAH_ROWS`), the measured sizes, the downloads store. Writes `quran:bookmarks:v1` (the key `audio:<n>`, legacy format) and, through Download, the Downloads storage. Plays through the player store; Play never changes the stored Settings reciter.

## Tests

`e2e/downloads.spec.ts`, describe "/surah-audios/[id]": five reciters and sizes; Play by another reciter leaves Settings alone; the bookmark and its Undo; Download, Saved, Remove, Undo and the link to Downloads; invalid ids; saving from the player sheet.
