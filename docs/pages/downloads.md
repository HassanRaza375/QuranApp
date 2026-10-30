# Page: Downloads

- Route(s): `/downloads` (a legacy route)
- Phase: 11 (plan and decisions: `docs/phases/phase-11-downloads-plan.md`, `docs/phases/phase-11-downloads.md`)
- Prototype section: `docs/design/prototype-remaining-pages.html`, `#/downloads`
- Offline level: **A** for the page and the saved list (it reads the device), **B** for what is saved (text and tafsir in `quran-revamp-db`, audio in Cache Storage, played through the service worker), **C** for adding (needs a connection; queued work waits and says so)
- Indexable: no (`noindex, follow`)

## Purpose

Save surahs to read and listen with no connection: a surah's text, its tafsir (opt-in) and one reciter's audio, or the text of the whole Qur'an, with the real size shown before and the real state after.

## Layout

One column, 768 px at most. Title and one sentence with **Add surahs**; notes when relevant (offline, Safari's one-week rule on iPhone outside the Home Screen, browser cannot keep files); **On this device** (saved size, free space, a meter of audio, text and tafsir, and everything else, and the thread of the Qur'an with saved surahs shaded); **Downloading** (the queue, with Cancel all); **Quick picks** (Juz 30, Al-Kahf, Yaseen, Al-Mulk, Al-Waaqia, Ar-Rahmaan) and the whole-Qur'an text button; **Saved** (All or With audio; a row per surah with Text, Tafsir and Audio chips); **Preferences** (Wi-Fi only, the reciter line, Clear browsing cache) and the notes.

- **Add surahs** (side panel on desktop, bottom sheet on a phone): filter, tick surahs, Include Tafsir (off) and Audio (on), the total before pressing Download. Saved surahs are disabled.
- **A row** shows each part as saved (a check) or as a button to add it. A part the device lost is "Not saved" and the same button repairs it. Audio saved by the legacy app says "saved by the older app, download again". Play plays the saved recitation; Remove has Undo.
- **A job** says Waiting…, Waiting for a connection, Waiting for Wi-Fi, a space warning with Download anyway, a percentage, or "Failed · reason" with Retry. Cancel stops it and discards a half-saved audio file.

## Components

`DownloadsPage`, `DownloadsAddSheet` (`app/components/downloads/`); `QuranThread` (with the new `fills`); `Sheet`, `Button`, `Switch`, `SettingsSegmentedControl`. Rows are plain markup, not per-row components with their own state.

## Data

| Data | Source | Storage |
| --- | --- | --- |
| Text, tafsir | the reader's own cache functions (`loadChapter`, `loadTafsir`) over `quranapi.pages.dev` | `quran-revamp-db` `chapters` and `tafsirs` (no new store, still version 4) |
| Audio | the two hosts GitHub redirects to (`raw.` for most files, `media.` for the four Git LFS files), checked against the measured size table `app/data/audioSizes.generated.ts` | Cache Storage `quran-downloads-audio-cache`, key = the app's own URL |
| What was saved on purpose | `quran:downloads:v1`, the legacy `DownloadedSurah[]` plus optional `revamp` and `bytes` | localStorage; the legacy composable is run against it in `tests/downloadsParity.test.ts` |
| Wi-Fi only | `quran:download-prefs:v1` `{ wifiOnly }` | the same setting as Settings, Audio |
| Free space, persistence | `navigator.storage.estimate()` and `persist()` | none |

## How playing works

The player asks for `<audio url>?offline=1` only when the file is in the cache and a service worker controls the page. The worker's first rule answers it from `quran-downloads-audio-cache` with range support (`CacheOnly` and `rangeRequests`) and never reaches the network; if that fails the engine asks once for the plain URL. Downloads are fetched with `cache: "no-store"`, which the streaming-audio rule skips, so a file is stored once.

## States

First run (empty, with the quick picks); queued, waiting, running, failed, space; offline; browser cannot keep files; iPhone note; Not saved; saved by the older app.

## Accessibility

Real buttons, switches and a radio group; the queue has a `role="status"` line and a labelled progress bar; 44 px targets on a phone; the sheet closes with Escape and returns focus. Nothing animates. **Screen-reader pass not done.**

## Tests

`tests/downloads.test.ts`, `downloadManager.test.ts`, `downloadsParity.test.ts` (unit); `e2e/downloads.spec.ts` (24 browser tests, 3 describes: without the service worker, `/surah-audios`, and with the service worker).
