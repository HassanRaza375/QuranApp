# Phase 11: Downloads (and `/surah-audios/[id]`)

- Branch: `phase-11-downloads`
- Date: 2026-10-23
- Status: **Built, awaiting your review.** Verify result below. **Real-device checks still open** (offline seek, reopen offline, Al-Baqarah, iPhone Safari, the 7-day Safari check; `docs/DEVICE_CHECKS.md`, section Phase 11)

## Goal

Rebuild `/downloads` from the approved plan (`phase-11-downloads-plan.md`): save a surah's text, its tafsir (opt-in) and one reciter's audio, or the whole Qur'an's text, with real sizes, a queue, honest states, and saved audio that plays with no connection; rebuild `/surah-audios/[id]` small; make the player's Save audio live.

## Scope

- Pages and components built: `app/pages/downloads.vue` with `app/components/downloads/` (`DownloadsPage`, `AddSheet`); `app/pages/surah-audios/[id].vue`; the player sheet's Save audio; `QuranThread` gains `fills`.
- Prototype section used: `prototype-remaining-pages.html`, `#/downloads` (nothing for `/surah-audios`).
- Legacy code reused: `reciters.json` and `surah.json` (`@legacy`); the legacy `useDownloads.ts` is vendored (by `scripts/sync-legacy.mjs`) and run by the parity test. Nothing copied.

## What was built

- **Service worker** (`nuxt.config.ts`, the only worker change): a first `CacheOnly` rule on `quran-downloads-audio-cache` for URLs with `?offline`, with `rangeRequests` and `ignoreSearch`; the streaming-audio rule now skips `cache: "no-store"` requests. Proven in a spike, then on a **Pixel 7 Pro, Android 17, Chrome**: a saved surah downloaded and played in airplane mode (D2 and D4 pass, 2026-10-23).
- **Download engine** (`lib/audioDownload.ts`, `downloadPlan.ts`): `raw.githubusercontent.com` first, `media.githubusercontent.com` when the answer is the Git LFS pointer; a file is stored only if it is audio (or GitHub's octet-stream), has exactly the expected byte count (measured table `app/data/audioSizes.generated.ts`, made by `scripts/gen-audio-sizes.mjs`) and starts like an MP3; streamed into the cache, counted, nothing partial ever kept. No resume: an interrupted download starts again from nothing and shows "Failed · Retry".
- **Queue** (`lib/downloadManager.ts`): parts (text, opt-in tafsir where every ayah must be stored, one reciter's audio), the whole-Qur'an text as one job, one job at a time (and one tab, by a Web Lock), a space check first (with Download anyway), waits for a connection and for Wi-Fi (audio only, where `navigator.connection.type` is reported), Cancel and Cancel all.
- **The list is read from the device** (`downloadRows.ts`, `stores/downloads.ts`): saved audio from Cache Storage, text and tafsir from the reader's store, compared with `quran:downloads:v1` (what was saved on purpose). A part the device lost shows "Not saved" with a one-tap repair; audio left by Clear all data is listed again; audio saved by the legacy app (opaque, cannot play) says so and Download again replaces it.
- **Start-up** (`plugins/downloads-start.client.ts`, idle): reads local stores only, adopts legacy downloads' text and tafsir from the service worker's cache with no network (`downloadAdopt.ts`), watches the connection; does nothing when nothing was ever saved.
- **Page**: the prototype's layout with the real data (meter from `estimate()`, thread of saved surahs, quick picks with "Juz 30", the Add sheet, per-part chips, Preferences with Wi-Fi only, the reciter line and Clear browsing cache), the Home Screen note on iOS outside the Home Screen, and `persist()` after the first saved audio.
- **`/surah-audios/[id]`**: five reciters with Play, size and Download or Saved; the audio bookmark `audio:<n>`.
- **Player sheet**: Save audio is live (progress, then "Saved on this device"); Settings wording about what Clear all data keeps.

## Decisions and why

| Decision | Alternatives considered | Reason |
| --- | --- | --- |
| `/surah-audios/[id]` rebuilt small | A redirect to the reader | Saved audio items in the Library open it; it is the only place to pick another reciter per surah; small |
| Downloads use the Settings reciter ("Reciter: X · Change in Settings") | The prototype's separate select | One reciter concept; other reciters from `/surah-audios` |
| Saved audio plays through the service worker | `blob:` URLs | Decided 2026-10-23; proven in a spike and on a Pixel |
| No resume | Ranged parts in IndexedDB | Decided; the stored format (one whole file per entry) allows it later |
| The list is read from the device | Trust the manifest | Eviction, Clear all data and the legacy app all make the manifest wrong; the device is the truth |
| `quran:downloads:v1` keeps the legacy shape, extra fields optional | A new key | Rollback safety; the legacy composable runs against it in a test |
| Downloads bypass the per-visit memo of the reader (`textDeps`) | `useQuranText().getChapter` | After a Remove the memo would claim the text is stored when it is not |
| Tafsir off every time the Add sheet opens | Remember the last choice | Opt-in means opt-in |
| `queue.spec.ts` flakiness fixed in the test double | Retry the test | The double sent "ended" before the first file started; not a player bug |

## Files

- Added: `app/pages/downloads.vue`, `app/pages/surah-audios/[id].vue`, `app/components/downloads/*`, `app/stores/downloads.ts`, `app/plugins/downloads-start.client.ts`, `app/lib/audioDownload.ts`, `downloadPlan.ts`, `downloadManager.ts`, `downloadRows.ts`, `downloadAdopt.ts`, `downloadsManifest.ts`, `savedAudio.ts`, `connection.ts`, `app/data/audioSizes.generated.ts`, `scripts/gen-audio-sizes.mjs`, `scripts/lib/legacy-downloads.mjs`, `scripts/screenshots/phase-11-downloads.mjs`; tests `downloads`, `downloadManager`, `downloadsParity`; `e2e/downloads.spec.ts`; docs `pages/downloads.md`, `pages/surah-audios.md`, `design/downloads-compare/` (20 images and a README), this file and the plan.
- Changed: `nuxt.config.ts`, `app/stores/player.ts`, `app/lib/audioEngine.ts` (the plain-URL fallback), `app/db/revampDb.ts` (key helpers), `app/composables/useQuranText.ts` (exports `textDeps`), `components/player/Sheet.vue`, `lib/audioText.ts`, `lib/audioState.ts`, `QuranThread.vue`, `SectionData.vue` (wording), `e2e/mocks.ts` (the `end()` fix), `e2e/player.spec.ts`, `e2e/settings.spec.ts`, `scripts/lib/legacy-files.mjs`, docs.
- Changes to `legacy/`: `app/composables/useDownloads.ts` added by `scripts/sync-legacy.mjs` (commit `7120b6c`, nothing edited by hand).

## Data and storage

- Services: the reader's `ChaptersService` and `TafsirService` (through `loadChapter`, `loadTafsir`); the audio hosts are fetched by `lib/audioDownload.ts` from the store, not from a component.
- Keys: `quran:downloads:v1` (legacy shape, additive `revamp`, `bytes`), `quran:download-prefs:v1` (`wifiOnly`, already shipped), `quran:bookmarks:v1` (`audio:<n>`, legacy). Cache Storage `quran-downloads-audio-cache` (the legacy name). **No IndexedDB change** (`quran-revamp-db` stays at version 4; `quran-app-db` is never opened).
- Migrations: none; legacy entries get `revamp: 1` once checked.

## Offline

Page and saved list: level A. Saved text, tafsir and audio: level B. Adding: level C with a designed state. Tested in the browser: queued work waits offline and starts when the connection returns; offline range requests answered from the device with the service worker; moving around inside the app offline still lists what is saved. **Not tested on a device:** seeking offline, reopening the app offline, Al-Baqarah, iPhone Safari, Firefox.

## Verification

- [x] Unit tests for every pure piece and the queue; the legacy composable run against our list in both directions
- [x] 25 browser tests on the production build (audio hosts and text mocked; real APIs and the redirecting URL blocked)
- [x] 1280, 375 and 390 px, light and dark (20 images); empty and first-run states; the keyboard-only path is a test
- [x] Offline tested in the browser and on one phone (see above)
- [x] Compared against the prototype; differences in `docs/design/downloads-compare/README.md`
- [ ] Screen-reader pass, iPhone, Firefox: **not done** (yours)

### Result

RESULT_PLACEHOLDER

## Differences from the prototype

See `docs/design/downloads-compare/README.md`.

## Content placeholders replaced

`CONTENT_TO_VERIFY.md`, Downloads: the size estimates (real sizes now), the reciter names (the legacy names), the quick picks ("Juz 30"), the promises about background downloads (rewritten), the wording of ours (listed there to read), the preference key.

## Open issues and risks

- **Real-device checks:** offline seek, reopen offline, Al-Baqarah (90 to 121 MB; memory when the worker slices it), iPhone Safari, Firefox, and the 7-day Safari check (`DEVICE_CHECKS.md`).
- **Whether the worker's slicing holds on a phone for 100 MB files.** If not, the fallback is a `blob:` URL of the stored file.
- **GitHub hosts every file.** The four Al-Baqarah files are Git LFS files with bandwidth limits per repository owner that cannot be seen from here.
- **Text and tafsir are stored twice** (the worker's `quran-api-cache` and the reader's store); the meter says what the browser reports.
- **The legacy composable's text and tafsir were in `quran-app-db`**, which this app does not open; adoption uses the worker's cache, so a legacy download whose cache entries were evicted shows "Not saved" (with a repair button).
- The two Per page browser tests that failed once in Phase 10 are still without a found cause.

## Next phase needs

Phase 12 (knowledge modules) adds its Search providers; nothing from Downloads. At cutover, `quran-downloads-audio-cache` entries made by the legacy app stay as they are (listed as "saved by the older app").
