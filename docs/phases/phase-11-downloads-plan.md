# Phase 11 plan: Downloads (and `/surah-audios/[id]`)

Status: **approved 2026-10-23 with the picks and additions below; building in stages (section 0).** Written 2026-10-22 after reading the legacy `pages/downloads/index.vue`, `composables/useDownloads.ts`, `useAudioDownload.ts`, `useQuranDB.ts`, `useOnlineStatus.ts`, `pages/surah-audios/[id].vue`, `ReciterAudioCard.vue`, the legacy `nuxt.config.ts` service-worker rules and the built legacy `sw.js`, the legacy specs (`MODULE_BLUEPRINT.md` Module 12, `PROJECT_PLAN.md`), the prototype (`docs/design/prototype-remaining-pages.html`, `#/downloads`), and the revamp code this touches (`stores/player.ts`, `lib/audioEngine.ts`, `lib/surahAudio.ts`, `db/revampDb.ts`, `composables/useQuranText.ts`, `components/player/Sheet.vue`, the Settings Audio and Data sections, `lib/libraryItems.ts`, `nuxt.config.ts`). I also made real requests to the audio and text hosts and ran two throwaway browser spikes (sections 2 and 4). Units are decimal (1 MB = 1,000,000 bytes), as Settings already shows them.

**Baseline:** Phase 10's `npm run verify` (722 unit tests pass; 535 of 539 browser tests pass; the 4 failures are timing-sensitive audio-queue and per-page tests, recorded in `phase-10-search.md`). It is **not** a clean pass. Phase 11 changes how the player finds a file, so my first step is to find out why `queue.spec.ts:78` is flaky (section 9, risk 1).

## 0. Approval (2026-10-23): decisions, additions, order of work

**Decisions taken:** (1) `/surah-audios/[id]` is rebuilt small: five reciters, each with Play, size and Download or Saved. (2) Downloads use the **Settings reciter**; the page shows "Reciter: X · Change in Settings"; no separate select. (3) Saved audio plays through the **service-worker route**, not `blob:` URLs. (4) **No resume this phase:** an interrupted download deletes its partial file and the row shows "Failed · Retry"; a partial file is never marked saved. (5) The quick pick is labelled "Juz 30". Defaults in section 9 stand; decisions 5, 6, 8 and 9 stay as recommended in section 8.

**Additions to the plan**

1. **Validate every saved file** before it counts as saved: the response must be audio (an `audio/*` type, **or `application/octet-stream`, which GitHub uses for 210 of the 570 files**; text, HTML and JSON are refused), its byte count must equal the expected size, and its first bytes must look like MP3 (an `ID3` tag or an MPEG frame sync). Anything else fails and is discarded. This catches the 134-byte LFS pointer and error pages.
2. **Check space before starting:** `navigator.storage.estimate()`; if the free quota is smaller than the job (with a margin), say so before any byte is fetched ("Needs about 115 MB; about 80 MB free") and let the user go on or cancel. A `QuotaExceededError` during a download still stops it and removes the partial.
3. **Reconcile on app start** (not only when `/downloads` opens): compare the saved list with what is actually in Cache Storage and the reader's store; a missing file is marked **Not saved** (with a one-tap repair on `/downloads`). On **iOS Safari outside the Home Screen**, `/downloads` shows one note: add the app to the Home Screen to keep downloads.
4. **Tafsir is opt-in per surah** (off by default in the Add sheet). **"Whole Qur'an text" (6.74 MB) is one button**, text only.
5. **Order of work:** fix `queue.spec.ts:78` first (done, see below); then build the service-worker audio route, deploy a **Vercel preview** and **stop** so one real MP3 can be tested offline on a real phone; build the rest only after that is confirmed.

**`queue.spec.ts:78`, root cause and fix (2026-10-23).** Not a player bug. The test double's `end()` sent "ended" right after Play was pressed, possibly before the first file had started (the player starts it after an asynchronous lookup). Under load "ended" then arrived first, the queue jumped to the second ayah, and the test waited for a count that could no longer be reached. Reproduced under CPU load (1 failure in 15; 0 in 20 on a quiet machine), fixed in `e2e/mocks.ts` (`end()` waits until the file is playing, up to 3 s), then 40 of 40 passed under heavier load, covering the two `end()`-driven page-queue tests that had failed (:78 and :95). `queue.spec.ts:95` had the same cause. The two Per page failures from Phase 10 are a separate matter and still open.

## 1. Legacy report: what `/downloads` does today

**Reach.** Route `/downloads`, `noindex, follow`. A "Downloads" row in the legacy drawer and a link on the legacy Sitemap. `isDownloaded()` is used **only on this page**: no "Downloaded" badge appears anywhere else in the legacy app.

**The page.** A header ("Offline", "You're offline — downloaded surahs still work" when offline). A storage meter (`navigator.storage.estimate()`: usage of quota for the whole origin) with **Clear temporary cache** (a confirm dialog; deletes `quran-api-cache` and `quran-audio-cache`, never the downloads). A form: a surah picker (114), a switch "Include Tafsir (all 3 authors, every ayah)" with the warning "one request per ayah", an optional reciter, and **Download for Offline** (one surah at a time). A list of downloaded surahs: Arabic name, size, "Tafsir included", "<reciter> audio", Open, and a delete icon that opens a confirm dialog.

**What a download does.**

| Part | Legacy behaviour |
| --- | --- |
| Text | `getChapter(n)`: one request returns Arabic and all four translations. Stored in the legacy IndexedDB `quran-app-db` (and, through the service worker, in `quran-api-cache`) |
| Tafsir | `getTafsir(n, a)` for every ayah, 6 at a time, into the same IndexedDB. A failed ayah is skipped silently |
| Audio | `fetch(url, { mode: "no-cors" })`, then `cache.put(url, response)` into `quran-downloads-audio-cache`. The response is **opaque**. Needed because the app's audio URLs 302 with an empty `Access-Control-Allow-Origin` (section 2) |
| Manifest | `quran:downloads:v1`: `DownloadedSurah[]` = `{ surahNo, surahName, totalAyah, hasTafsir, reciterKey, reciterName, audioUrl, sizeBytesEstimate, downloadedAt }` |

**Bugs and gaps found**

1. **Nothing ever plays the saved audio.** No code reads `quran-downloads-audio-cache`. I checked the built legacy `sw.js` (kept in `legacy/dist/`): three routes (`wajibat-data-cache`, `quran-api-cache`, `quran-audio-cache`), zero mentions of the downloads cache, no range-request support. The player sets the network URL, so a "downloaded" surah plays offline only if the opportunistic cache happened to have it. (`MODULE_BLUEPRINT.md` calls this "in-app offline reading/playback"; the code does not do that.)
2. **Opaque entries cannot be checked.** An opaque response hides its status and length, so an error page is stored as happily as audio, and browsers pad opaque entries in quota accounting. In my spike an opaque entry would not play and answered a Range request with 416 (section 4).
3. **The size shown is a guess:** `estimate()` usage after minus before (0 when the API is missing).
4. **Parts cannot be added later.** To add audio to a saved surah you "download again", which re-fetches everything. A re-download without tafsir overwrites `hasTafsir: false` while the tafsir stays stored, and Remove then skips it: **orphaned tafsir that is never freed**.
5. **Silent partial results.** Failed tafsir ayahs are skipped but `hasTafsir: true` is recorded; a failed audio write only leaves the audio label off, with no message.
6. **One surah at a time, no queue, no cancel, no resume;** closing the page loses it with no trace.
7. **Clear all data** wipes the manifest but leaves the audio in Cache Storage, so it takes space and is no longer listed (already recorded in `LEGACY_INVENTORY.md`).
8. **Remove asks a blocking confirm** (against our Undo rule).
9. **The "save a file" helper (`useAudioDownload`)**, used on the Surah list rows, per-ayah in the reader and on `AyahReferenceCard`, does a CORS `fetch` then an `<a download>`. For the full-surah GitHub URLs the CORS fetch always fails, so it **only ever opens the file in a new tab**. For per-ayah files it works. The revamp has no such button.

**`/surah-audios/[id]` today.** Header (Arabic name, translation, `#n`, ayah count), an **audio bookmark** toggle (`audio:<n>` in the legacy bookmarks), a "Now playing" block, and a grid of the five reciters, each with Play and its own seek slider. It loads the chapter over the network only to get the names. It is linked from the 114-row "Surah Audios" drawer group and from the legacy Bookmarks page. **The revamp already links to it:** `lib/libraryItems.ts:118` opens saved `audio:<n>` items at `/surah-audios/<n>` (pinned by `tests/library.test.ts:400`); today that lands on "not rebuilt yet". The revamp cannot create such a bookmark, but it keeps the ones users already have.

## 2. What the real hosts do (checked 2026-10-22)

**Audio.** Every full-surah URL is `github.com/The-Quran-Project/Quran-Audio-Chapters/raw/...`, which answers **302** and the final host differs per file:

| Fact | Result |
| --- | --- |
| CORS `fetch` of the app's own URL | **Fails** (the 302 sends an empty `Access-Control-Allow-Origin`), as the legacy comment said |
| Final hosts | `raw.githubusercontent.com` for 566 files; `media.githubusercontent.com` for the **4 Git LFS files, surah 2 for reciters 1, 2, 4 and 5**. Both send `Access-Control-Allow-Origin: *`, support `Range` (206) and allow a simple `Range` header from a page with **no preflight** |
| Rewriting to the raw host | Right for 566 files; **wrong for the four LFS files**: it returns a 134-byte text pointer (`version https://git-lfs.github.com/spec/v1 ... size 120643350`). A naive download would store 134 bytes |
| `<audio>` | Plays the app's own URL, including Al-Baqarah (125.7 min). With `crossorigin="anonymous"` it **fails** (error 4), so the player's element must never set `crossOrigin` |
| Type | 210 files are `application/octet-stream`; the cache copy must be stored as `audio/mpeg` |

**Sizes of all 570 files** (HEAD through the redirect; recorded in `docs/audio-url-check.md`). **This replaces "up to 91 MB" in the roadmap, status and progress docs: the largest file is 120.6 MB.**

| Reciter (legacy `reciters.json` names) | Whole Qur'an | Al-Baqarah |
| --- | --- | --- |
| Mishary Rashid Al Afasy | 1.72 GB | 120.6 MB |
| Abu Bakr Al Shatri | 1.50 GB | 113.4 MB |
| Nasser Al Qatami | 1.18 GB | 90.7 MB |
| Yasser Al Dosari | 1.49 GB | 116.0 MB |
| Hani Ar Rifai | 1.48 GB | 114.2 MB |

All five: 7.38 GB. Of 570 files: 4 over 100 MB, 28 over 50 MB, 85 over 25 MB, **253 under 5 MB**. Examples across reciters: Al-Kahf 22.2 to 31.9 MB, Yaseen 11.6 to 17.0, Al-Mulk 4.9 to 7.3, Ar-Rahmaan 6.8 to 10.9, surahs 78 to 114 together 45.9 to 61.0 MB. The prototype's "0.318 MB per ayah" rule is wrong for short surahs and for the long ones alike, so the build uses the measured sizes.

**Text and tafsir** (`quranapi.pages.dev`, CORS `*`):

- Chapters: 114 of 114 answered; **6.74 MB for the whole Qur'an** (what the app keeps: 6.61 MB; 1.06 KB per ayah, the prototype said 2.5). Al-Baqarah 513 KB, Al-Fatiha 3 KB.
- Tafsir: one request per ayah returns all 3 authors (Ibn Kathir, Maarif Ul Quran, Tazkirul Quran). A seeded uniform random sample of 150 ayahs: **mean 10.7 KB (95% interval 9.8 to 11.5), median 9.7, largest 35.0**. So the whole Qur'an is about **66 MB** (61 to 72) and 6,236 requests; Al-Baqarah about 3.0 MB (286 requests); surahs 78 to 114 about 6.0 MB (564 requests). The prototype said 12 KB per ayah, close. (An earlier hand-picked sample of mine suggested 23 KB; it over-represented long ayahs, so I replaced it.)
- Both go through the service worker's `quran-api-cache` (capped at 1,000 entries) **and** into the reader's own IndexedDB, so text and tafsir are stored twice. I accept that for text and tafsir (small); I do not for audio (section 4).

## 3. What the prototype adds and what it drops

**Adds (new):** an Add-surahs sheet (filter by name or number, checkboxes, running size); **parts per surah** (Text, Tafsir, Audio) that can be added one at a time; a **queue** with per-surah progress, Cancel and Cancel all; **quick picks** (Juz 'Amma, Al-Kahf, Ya-Sin, Al-Mulk, Al-Waqi'ah, Ar-Rahman); a **Wi-Fi only** preference with a "Waiting for Wi-Fi" state; a thread showing what is saved across the Qur'an; a meter with audio, text and tafsir, and everything else; removal with Undo; an offline state.

**Drops (the legacy has them, the prototype does not):**

- **Clear temporary cache.** I would keep it as a quiet row (decision 6).
- The **"save the mp3 as a file"** button (decision 8).
- The legacy **Open** button (the prototype has no per-row link; I would make the surah name the link).

**Conflicts with real data**

- **Reciter for downloads** (prototype: a separate select, stored as a list position). The app already has one reciter setting, stored by name. Decision 3.
- **Wi-Fi only default.** The prototype defaults it on; Settings, already shipped, defaults it **off** and greys it where the browser does not report the connection type (only Chrome on Android does). The Downloads switch is the same setting (`quran:download-prefs:v1`, `wifiOnly`), so the shipped default stays.
- **Names and spellings** come from the data, not the prototype: Al-Kahf, Yaseen, Al-Mulk, Al-Waaqia, Ar-Rahmaan. **"Juz 'Amma" is a Juz name, and Juz names are a recorded content gap** (`DECISIONS.md`, section 4), so the quick pick is labelled "Juz 30" until a verified name is supplied. The five surah picks are our choice.
- **Promises the browser cannot all keep:** "Downloads keep going while you use the rest of the app" is true inside the app (it is a single-page app) but not if the tab is closed or the phone sleeps. The page will say "Keep the app open until a download finishes." (`CONTENT_TO_VERIFY.md`).

## 4. Proposed design

**Route and levels.** `/downloads`, `noindex`. The page and the saved list work offline (level A); text and audio already saved are level B; **adding** needs a connection (level C) and says so, with queued items shown as "Waiting for a connection" or "Waiting for Wi-Fi". Never a blank page or an endless spinner.

**What "saved" means, per part**

- **Text:** the reader's own cache (`chapters` in `quran-revamp-db`) through the existing `useQuranText().getChapter`, so the reader needs no change. Remove deletes that record.
- **Tafsir:** the reader's `tafsirs` store through `getTafsir`, every ayah, 6 at a time (the legacy value), with a retry on 429 or 5xx. A part counts as saved **only when every ayah is stored**; a failure is shown ("48 of 286 saved. Try again"), never recorded as done.
- **Audio:** **Cache Storage, `quran-downloads-audio-cache`** (the legacy name), **key = the original GitHub URL** (so the legacy app's own Remove still frees it after a rollback), value = a complete, readable `200` response stored as `audio/mpeg`.
  - Fetched with `cache: "no-store"` from the file's real host with CORS (`raw` first; if the answer is the 134-byte LFS pointer, the `media` address it stands for). One small pure function maps the app URL to those addresses; a URL of any other shape is fetched as it is. **No opaque fallback, ever.**
  - Streamed through a counting stream into `cache.put`, so progress is real and nothing is buffered in memory. It is stored **only if the byte count equals the size** (`Content-Length`, checked against the measured table), otherwise discarded: no partial file is ever listed as saved.
  - Sizes: a generated table of the 570 measured sizes (`scripts/gen-audio-sizes.mjs` writes `app/data/audioSizes.generated.ts`, in the style of `gen-quran-meta.mjs`), so the Add sheet shows real figures before a download starts. The size from the response replaces it once the download begins.

**Playing a saved file: the service-worker question (the one real technical risk).** I built a throwaway spike (a generated service worker with **only built-in `generateSW` options**, a local audio host on another origin, desktop Chromium, a 104.9 MB response, host switched off and the browser offline):

| Check | Result |
| --- | --- |
| Download streamed into Cache Storage under the original URL | 104,857,644 of 104,857,644 bytes in 0.6 s locally |
| `Range` requests offline (first bytes, middle, to the end, last 1000, past the end) | All answered `206` with the right `Content-Range` |
| `<audio>` offline | Loaded, played, **seeked to 60% in 4 to 7 ms**, no request reached the host |
| An opaque (legacy-style) entry | Does not play (error 4); `Range` gives 416 |
| A download made with `cache: "no-store"` | Skipped the opportunistic `quran-audio-cache` rule, so the big file is stored **once** (the legacy-style `no-cors` file landed in both caches) |

So the plan needs **two small edits to the existing service-worker config, no custom worker code**: (1) a first runtime rule, `CacheOnly` on `quran-downloads-audio-cache` with `rangeRequests: true` and `matchOptions.ignoreSearch`, matching an audio URL that carries a marker (`?offline`); (2) the existing audio rule gains `request.cache !== "no-store"`. The player asks for `<original url>?offline` **only when the file is saved**; if that fails (evicted, or the page is not controlled by the worker, as after a hard reload) it retries the plain URL, so online playback never breaks. The cutover rules (`sw.js`, scope `/`, cache names, `prompt`) are untouched.
**Not proven:** the spike used a generated WAV on localhost in desktop Chromium. Real MP3s from the real host, **iPhone Safari, Chrome on Android and Firefox** are device checks (new rows X7 onward in `DEVICE_CHECKS.md`). Workbox slices the stored file as a blob, which on a phone may need memory for a 100 MB file; the fallback is to play from a `blob:` URL of the stored file, which needs no worker at all (decision 4).

**The queue.** Sequential (one active job; big files in parallel would slow every one), in memory. Per surah: text, then tafsir, then audio. Statuses: waiting (offline or Wi-Fi), downloading (percent and, for audio, "34 MB of 115 MB"), failed (reason and Try again), done. Cancel stops and discards the partial. Wi-Fi only applies to **audio** and only where `navigator.connection.type` is reported (same rule as Settings); a job waiting for Wi-Fi starts when the connection changes. A Web Lock keeps a second tab from running the same queue. The player sheet's disabled **Save audio to device** becomes a live **Download audio** (for the playing surah and reciter) showing progress, then "Saved on this device".

**After a download.** The first successful audio download asks the browser to keep storage (`navigator.storage.persist()`, from the user's own tap); the page shows whether it was granted. A pre-check compares the size with the free quota and says so before starting; `QuotaExceededError` stops the job, removes the partial and says "Not enough space: needs 115 MB, about 80 MB free".

**Removing.** No confirm. The row disappears and a toast offers **Undo**; the files are deleted when the toast ends (or the page is hidden). Undo restores the row because nothing was deleted yet. If the tab dies inside that window, the audio is still in Cache Storage and the next open lists it again (below), which is safe.

**Truth from storage, not from the manifest alone.** On open, the page checks each saved part (text in `chapters`, every ayah in `tafsirs`, the audio key and its size) and shows "Needs download again" with a one-tap repair where one is missing (evicted, or removed by Clear all). Audio found in Cache Storage with no manifest entry (after **Clear all data**, which keeps downloaded audio) is listed again, so audio can never be orphaned and unfreeable.

**Legacy downloads at cutover.** The manifest `quran:downloads:v1` keeps the legacy shape; the revamp adds optional fields only (per-part sizes, a `revamp` marker), which the legacy app ignores. A **parity test runs the vendored legacy `useDownloads.ts`** against what the revamp writes, in both directions, as was done for search history. Legacy entries: **text and tafsir** were saved in `quran-app-db`, which the revamp must not read; but the same responses are normally in `quran-api-cache`, so on first open the page copies what it finds there into the reader's store **without any network** and shows "+ Add" for anything missing. **Legacy audio is opaque and cannot play** (section 1, bug 1; spike), so those rows say "Saved by the older app, can't play from the device. Download again" and Download again replaces the entry under the same key.

**Storage meter.** Real figures from `estimate()`: audio, text and tafsir (our known sizes), and "everything else" (the remainder), with free space when the browser reports a quota; without `estimate()` only our own figures are shown. The prototype's made-up 2,048 MB quota is gone. `QuranThread` (built in Phase 10) shows what is saved across the Qur'an; it needs a small `fills` option.

**`/surah-audios/[id]` (decision 1, my recommendation: rebuild it small, do not redirect).** A "Listen to <surah>" page on the same URL: the surah's name, translation, ayah count and place from the bundled table (no network), an **audio bookmark** toggle (`audio:<n>`, the legacy key, so existing Library items keep their meaning), and five reciter rows, each with **Play** (that reciter, without changing the Settings reciter), its file size, and its state: **Download**, a progress bar, or **Saved** with Remove. "Your reciter" marks the Settings choice. Why not a redirect to the reader (as `/juz/[id]`): (a) real user data points here (saved audio items open this URL, pinned by a test); (b) it is the only place to play or save a surah by a *different* reciter without changing the global setting, and the per-reciter sizes and Saved state are exactly Phase 11's content; (c) it is small (one page, one row component, no new data); (d) the cutover list needs every legacy route. **Dropped from the legacy page:** the per-card seek slider and the "Now playing" block (the player sheet and mini player own them), the 114-row drawer group (already dropped by the grouped navigation), and the network fetch just to get the names. Offline level A (the page); Play of an unsaved file needs a connection and says so.

## 5. Content integrity

Qur'an text, tafsir and audio come only from the existing services and data files; sizes come from measured responses. Nothing from the prototype ships: its sample saved surahs (1, 18, 36, 67, 78 to 114), its reciter list and order, its size estimates, its "free space", its simulated progress. New wording of ours (to read through at the end of the phase, listed under Downloads in `CONTENT_TO_VERIFY.md`): "Keep the app open until a download finishes.", "Waiting for Wi-Fi", "Waiting for a connection", "Saved by the older app, can't play from the device. Download again", "Needs download again", the not-enough-space line, and what a saved surah covers. **One statement must be exact:** a saved surah plays the **whole surah recitation** offline. Playing a single ayah, "Play page" or a story's Listen uses small per-ayah files that are **not** part of this download, and need a connection unless they were played before. The page and the player say so plainly (decision 9).

## 6. Files, tests, screenshots

**Added:** `app/pages/downloads.vue`, `app/pages/surah-audios/[id].vue`; `app/components/downloads/*` (storage card, queue, saved list, add sheet, preferences); `app/lib/downloadPlan.ts` (host mapping, LFS pointer, sizes, parts, progress), `downloadQueue.ts` (state machine), `downloadStore.ts` (manifest, Cache Storage, reconcile, adoption); `app/stores/downloads.ts`; `app/composables/useConnection.ts`; `app/data/audioSizes.generated.ts` and `scripts/gen-audio-sizes.mjs`; `docs/pages/downloads.md`, `docs/pages/surah-audios.md`, `docs/phases/phase-11-downloads.md`.
**Changed:** `nuxt.config.ts` (the two service-worker edits only); `app/stores/player.ts` (`resolve` asks the downloads store first); `components/player/Sheet.vue` and `lib/audioText.ts` (Save audio); `lib/nav.ts` (phase flag); `SectionData.vue` (the Clear-all sentence: it says "cached Qur'an text stay", but the reader's copy lives in `quran-revamp-db`, which Clear all deletes); `QuranThread.vue`; `scripts/lib/legacy-files.mjs` (adds `useDownloads.ts` for the parity test; refreshed with `scripts/sync-legacy.mjs`, which needs the legacy checkout); `docs/DEVICE_CHECKS.md`, `CONTENT_TO_VERIFY.md`, `DECISIONS.md`, `ROADMAP.md`, `PROGRESS.md`, `STATUS_2026-10-22.md`, `audio-url-check.md` (the "91 MB" claims), `CLAUDE.md` (gotchas).
**Storage:** no new `localStorage` keys beyond the planned `quran:download-prefs:v1` (`{ wifiOnly }`); `quran:downloads:v1` additive; Cache Storage `quran-downloads-audio-cache`; **no IndexedDB change** (`quran-revamp-db` stays at version 4; `quran-app-db` is never opened).

**Unit tests:** host mapping with the real URLs (raw, media, the 4 LFS files, an unknown URL); LFS pointer detection; the size table (570 entries, Al-Baqarah 120,643,350; per-reciter totals); the queue state machine (order, cancel, retry, Wi-Fi and offline waits, progress); the download function with fake fetch and cache (streaming count, size mismatch discarded, quota error, abort, no partial left); reconcile (evicted audio, orphaned audio, legacy opaque entries); manifest parity in both directions with the legacy `useDownloads`; byte formatting; Wi-Fi rule. **Browser tests** (production build, `forbidRealApis` plus mocks for the two audio hosts with small synthetic files and for text/tafsir; the real github.com URL must never be fetched): add a surah with all parts; progress; saved list after reload; **offline reload still lists and opens it**; play offline (the element's source is the marked URL and the bytes come back through the worker); remove with Undo and without; cancel; Wi-Fi-only wait with a stubbed connection type; offline wait; LFS-pointer path; failure and quota paths; legacy-manifest adoption; Clear all keeps audio and the page lists it; `/surah-audios/36`; first-run empty state; 375 and 1280 px, light and dark; keyboard-only. `scripts/live/downloads.live.ts` (not in CI) re-checks the real sizes and the pointer. **Screenshots** against the prototype with every difference listed in `docs/design/downloads-compare/README.md`.

## 7. Risks

1. **Audio-queue flakiness** (`queue.spec.ts:78`, 2 of 3 passes in isolation; failed before Phase 10 too). I will find out whether it is the test or a real race before changing `resolve`.
2. **Big files on phones:** memory when the worker slices a 100 MB blob, and iPhone behaviour, are unproven. Mitigation: device checks first; the `blob:` fallback (decision 4).
3. **iPhone Safari's 7-day limit.** WebKit documents that script-writable storage (including Cache Storage and `localStorage`) can be cleared for a site not used for 7 days unless it is added to the Home Screen. If that applies here, downloads on an iPhone in a browser tab would silently disappear. I cannot test it; the page will suggest adding the app to the Home Screen on iPhone, and it is a device check. (Not claimed as fact until tested.)
4. **A third party hosts every audio file.** Files come from a public GitHub repository I do not control. The four LFS files (Al-Baqarah) go through GitHub's LFS host, which has bandwidth limits per repository owner that I cannot see; heavy use could make exactly those four fail for everyone, for streaming as well. The page shows a plain failure and Try again. Longer term, self-hosting the audio is worth a conversation, outside this phase.
5. **Eviction.** Without persistent storage a browser can drop Cache Storage under pressure. Handled by the truth-from-storage check and `persist()`; not preventable.
6. **Background limits.** Phones pause pages; a download can stall or fail when the screen locks. It is all-or-nothing per file (decision 5).
7. **Double storage of text and tafsir** (service-worker cache plus the reader's store, up to about 66 MB for tafsir of the whole Qur'an, twice). Shown honestly by the meter.
8. **The marker URL** depends on the worker controlling the page; the plain-URL retry covers a hard reload.

## 8. Decisions I need from you

| # | Question | My recommendation |
| --- | --- | --- |
| 1 | `/surah-audios/[id]`: rebuild small, or redirect to the reader? | **Rebuild small** (section 4). The alternative is a one-line redirect to `/surah/<n>`, as for `/juz/[id]`; then saved audio items in the Library would open the reader |
| 2 | Legacy audio copies (opaque, never playable): show them as "download again", or ignore them? | Show them and replace on Download again |
| 3 | "Reciter for downloads": keep the prototype's separate select, or use the Settings reciter (other reciters from the `/surah-audios` page)? | **Use the Settings reciter**; one reciter concept, no second silent default. The Wi-Fi switch is the only download preference |
| 4 | How saved audio plays: service-worker route (spike-proven, two config edits) or a `blob:` URL from the stored file (no worker, works in dev, but loads the file as a blob on the page)? | **Service-worker route**, with the `blob:` URL as the documented fallback if the iPhone check fails |
| 5 | Resume of an interrupted download | **Not in Phase 11.** All-or-nothing with Try again. The stored format (one whole file per entry) allows resume later. Revisit after device tests |
| 6 | Keep "Clear temporary cache" (no confirm, a toast with the amount freed)? | Keep, as a quiet row in Preferences |
| 7 | Quick-pick label "Juz 30" instead of "Juz 'Amma" until a verified name exists? | Yes |
| 8 | The legacy "save the mp3 as a file" button (Surah list, reader, reference cards)? | Not in Phase 11; a "Save a copy as a file" action on a saved row is a small later addition (the bytes are already stored) |
| 9 | Per-ayah audio offline (roughly doubles the audio size) | Not included; the page says what a saved surah covers |

## 9. Defaults I will use unless you object

Add sheet defaults: Tafsir and Audio on (as the prototype), with the total size always visible before Download. Wi-Fi only stays off by default (the shipped Settings default). `persist()` is requested on the first audio download. Audio concurrency is one file at a time; tafsir six requests at a time. Sizes in decimal MB and GB. Saved rows link to the reader from the surah name. No badges, streaks or counters; removal always has Undo. A page-level online/offline note only on `/downloads` (the legacy app bar chip is a separate shell question).

## 10. Not part of Phase 11

Background Fetch or wake locks, resume, self-hosted audio, per-ayah offline audio, a "Downloaded" badge on the Surah list (the listing is performance-measured; easy to add later from the same manifest), choosing tafsir authors (a single answer carries all three), Knowledge-module and Daily Fiqh offline data (`wajibat-data-cache` returns with Phase 13), and the image share card.
