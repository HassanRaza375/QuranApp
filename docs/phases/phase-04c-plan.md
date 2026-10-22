# Phase 4C plan: per-ayah audio and queues

Status: **plan only, waiting for approval.** Written 2026-10-22 after reading the Phase 0 to 4B docs, `docs/audio-url-check.md`, the player (`lib/audioEngine.ts`, `stores/player.ts`, `lib/mediaSession.ts`), the reader's rows (`components/reader/AyahList.vue`), the Per-page frame, the Stories reader and chapter data, the Asma sheet, the legacy `names.json`, and live checks of every host below.

## 0. Baseline, your 4B decisions, and one correction

**Baseline** (`npm run verify`, Node 22, commit `8149884`, 10:20 to 10:36): build and lint clean, **617 of 617 unit tests**, dev smoke passed, **460 of 461 browser tests**. The one failure is the reader's performance budget at 4x CPU ("opening a tafsir" took 876 ms against 800). I ran a retry pass instead of patching the number: the same test alone on the same machine passed 2 of 6 right after verify, and later, once the machine was quieter, **5 of 6 on the pre-4B build and 5 of 6 on the 4B build** (the single failures were 4189 and 4047 ms against a 4000 ms first-render budget). So it is **not a 4B regression**: it is a timing test that sits at its limit on this machine, and it failed in verify while I was running a network sweep alongside it (my doing). It is not patched; see decision 11.

**Your 4B decisions, done:** the mini player's error now wraps onto two lines at 375px with **Try again** under it (so it cannot be pushed off the row), with a test for it; `docs/DEVICE_CHECKS.md` is written and committed (every real-device and manual review item, grouped by phase, with an empty "What I saw" column).

**One correction to the Asma note.** You said there is no recording for a name. There is: the legacy `names.json` holds a recording URL for each of the 99 names (`quranaudio.myislam.org`), and the legacy page played them through the shared player. I checked all 99: **96 answer `200 audio/mpeg`** (26 to 48 KB), and **3 return 404**: #53 Al-Qawiyy, #93 An-Noor, #97 Al-Warith. The host sends no CORS header (fine for an audio element, only relevant to caching). So per-ayah audio does not apply to names, but a **single-file clip** does. Decision 1 below.

## 1. The per-ayah endpoint (measured, not assumed)

- **URL shape:** `https://quranapi.pages.dev/api/<surah>/<ayah>.json` returns an `audio` object with five entries, `1` to `5` (the same five reciters, with the same names, as the full-surah list), each `{ reciter, url, originalUrl }`. The `url` is `https://the-quran-project.github.io/Quran-Audio/Data/<reciterId>/<surah>_<ayah>.mp3` and `originalUrl` is everyayah.com.
- **Completeness:** I fetched **all 6,236 ayahs**: every one answered, **every one has all five reciters, and all 31,180 URLs have exactly that shape.** Nothing is missing.
- **Files (HEAD-checked sample of 1,500 URLs: the first and last ayah of every surah for all five reciters, 2:255, 2:282, and 80 random ayahs):** all `200`, all `audio/mp3` (a real audio type, unlike the 210 large surah files), CORS `*`, `Accept-Ranges: bytes`. Sizes **14 KB to 3.47 MB, median 145 KB**; the largest is 2:282 by reciter 5. The other ~29,700 files were not individually checked.
- **The URL is taken from the endpoint's answer each time, never built from the pattern** (so a change at the host cannot silently break a rule in our code). The answers are small and the service worker already caches that host (`quran-api-cache`).

## 2. How whole-surah and per-ayah audio share one player

One audio element and one store, as now. The engine's `Track` becomes four kinds:

| Kind | What it is | Resolves to | Saved place | Previous / Next |
| --- | --- | --- | --- | --- |
| `surah` | A full surah file (4B, unchanged) | the surah file for the reciter | `quran:audio-resume:v1` (legacy shape, unchanged) | previous / next surah |
| `ayah` | One ayah (the reader's play button) | the endpoint's `url` for that ayah and reciter | none (a few seconds long) | previous / next ayah of the same surah |
| `queue` | An ordered list of ayahs: a page or a story chapter | one ayah at a time, in order | `quran:audio-queue:v1` (new, additive; section 5) | previous / next ayah in the queue |
| `clip` | One recording that is not an ayah (an Asma-ul-Husna name) | its own URL | none | none |

Starting any of them replaces what is playing (one thing at a time). The mini player shows the kind's own title: "Al-Baqara" (surah), "Al-Baqara 2:255" (ayah), "Page 49" or the chapter's title (queue), the name (clip); the sheet's second line says "Recited by <reciter>" and, for a queue, "Al-Baqara 2:6 · ayah 3 of 13". **Whole-surah audio has no per-ayah timing data**, so the reader highlights nothing while a full surah plays; it highlights only when an ayah or a queue is playing.

"Play the next surah automatically" (the Settings switch) applies only to `surah`. **Repeat** repeats what was started: the ayah, the whole queue, the surah, the clip; its label says which ("Repeat this ayah", "Repeat this page", "Repeat this recitation").

## 3. The reader

- **A play control per ayah** in the tools row (after Tafsir and the spacer, before Save): a real button, 44px on a phone (36px on desktop, the row's existing size), `aria-label` "Play ayah 5" / "Pause ayah 5", `aria-pressed` while that ayah is the one playing.
- **The playing-ayah highlight:** the row gets `aria-current="true"` and a soft accent background with a 3px brand-colour left edge (not gold: gold stays for verse markers), distinct from the pale flash that `#ayah-N` uses. It follows the queue ayah by ayah.
- **Following the audio:** off by default. A switch in the sheet, "Keep the playing ayah in view", stored in a new additive key `quran:player-prefs:v1` (`{ followAyah }`). When on, and **only when Reduce motion is off**, the row scrolls into view (instant, no smooth scrolling, no focus change) only if it is not already fully visible. With it off nothing moves.
- **Repeat one ayah:** the sheet's Repeat switch while an ayah plays.
- The same highlight (`aria-current`, accent background) is added to the ayah being played in the **Per-page frame** (each ayah's text gets its own inline span so the highlight can wrap) and in the **Stories reader's** chapter text.

## 3a. The two queues

- **Play page** (Per page): the page's ayahs in order from `pageSegments(page)` (the same table, so a page that crosses a surah plays on into the next surah); title "Page 49"; the button becomes a real **Play page / Pause page** and reflects whether *this page's* queue is the one playing. The Bismillah at the start of a surah is **not** played as a separate file: the data has per-ayah files only, and whether a reciter's first-ayah file includes the Bismillah depends on the recording (I could not tell from the data), so it is a device check, not something the page claims.
- **Listen to this chapter** (Stories): the chapter's passages in order from `chaptersOf`, flattened to ayahs (the reader still shows only the first 8 until "Show all"; the queue plays the whole chapter, and the sheet says "ayah 12 of 17"). Title: the chapter's title.
- **How a queue advances:** when an ayah ends, the next one starts at once. **No artificial pause** (recommended: the recordings carry their own silence; the engine waits only if the next file is not ready, showing "Buffering…"); the constant exists (`QUEUE_GAP_MS = 0`) so a device check can change it.
- **Preloading:** when an ayah starts, the next ayah's URL is resolved and its file is fetched once so the switch is instant (one ayah ahead only). Skipped when the browser's Save-Data flag is on. The fetched file goes into the existing audio cache by the existing rule (below).
- **One failed ayah:** the engine retries it once (it asks the endpoint for the URL again), then **stops on it** with "Couldn’t play ayah 2:6." and two buttons, **Try again** and **Skip this ayah**. It never skips silently (leaving part of a recitation out without saying so would be wrong). The text is also read out by the status line. (Decision 2.)
- **The end:** the queue stops after its last ayah (no auto-continue into the next page or chapter; "Play the next surah automatically" is for surahs). The saved place is reset to the first ayah, as a finished surah is.

## 4. Asma-ul-Husna Play (see the correction in section 0)

Recommended: **enable it as a `clip`** for the 96 names that have a recording, through the same player: Play / Pause in the name sheet, a mini player titled with the name, "Recited" is not claimed (the host does not say who recites; the sub-line reads "Asma-ul-Husna"). The three missing names (#53, #93, #97) keep the disabled button with its own reason, **"No recording for this name"**, so nothing says "arrives soon" for something that will not arrive. The recording is third-party hosted like the surah audio; no embed or script is loaded, only the audio file. Alternatives: keep all 99 disabled with a different reason, or remove the control (decision 1).

## 5. Media Session, saved places, no autoplay

- **Media Session metadata:** ayah: title "Al-Baqara 2:255", artist the reciter, album "Quran App"; queue: title the current ayah's reference, artist the reciter, album the queue's title ("Page 49" or the chapter's title); clip: the name's transliteration, artist "Asma-ul-Husna". Previous and next track follow the kinds' rules above and are removed where they do not apply.
- **Saved places.** `quran:audio-resume:v1` stays exactly as it is (surah only, legacy shape). A queue writes a **new additive key `quran:audio-queue:v1`** = `{ v: 1, kind: "page" | "story", ref: { page } | { storyId, chapter }, index, reciter, position, savedAt }` (the queue is rebuilt from the data on resume, so no list is stored), saved like the surah place: every 5 seconds while playing, on pause, on `pagehide`, reset to the first ayah at the end. After a reload the mini player shows the last thing that was started, **paused** (starting a surah removes the queue key; starting a queue leaves the surah record alone, and the queue key wins on restore). A single ayah and a clip save nothing. The legacy app ignores the new key.
- **No autoplay anywhere:** every kind starts only from a press (a row button, Play page, Listen, Play in the name sheet, the mini player, the resume line, the lock screen's Play). A restored queue shows paused. A queue moves from one ayah to the next only because the user started it.

## 6. Offline: what is proven and what is not

I tested the service worker's real audio rule (`CacheFirst`, `quran-audio-cache`, statuses 0 and 200, 300 entries) in the production build with **real files from the real host, in desktop Chromium only**:

| Test | Result |
| --- | --- |
| `fetch()` of a whole per-ayah file (2:255, 832 KB) through the service worker | Stored in `quran-audio-cache` |
| An audio element playing a per-ayah file that was never fetched | It played, seeking worked, and the file **was in the cache afterwards** |
| The same files with the network switched off | **Both played offline.** Seeking worked for the file the element had loaded; it did **not** work for the file stored by `fetch()` (the cache answers a range request with the whole body) |
| A file never touched, offline | Fails (`MEDIA_ERR_SRC_NOT_SUPPORTED`) |

So small per-ayah files that were played or preloaded once **can** play again offline in desktop Chromium, with seeking unreliable for preloaded ones. **This is not proven on iPhone Safari, Chrome on Android or Firefox, so the app makes no offline-play claim** (the existing "Audio needs a connection unless it was downloaded" meaning stays), and I will add the rows for it to `docs/DEVICE_CHECKS.md` when 4C is built, for you to run. Nothing about the 74 MB surah files changes. Preloading will cause queue files to be stored by the existing rule (cap 300 entries, one year); I would rather not add a new cache or a new store. Real "download this page for offline" is Downloads (Phase 11).

## 7. Keyboard and screen reader, targets

Native buttons only: the ayah play button is in the row's existing tab order (Tafsir, Play, Save, Pin, Share); Play page and Listen are real buttons; no single-key shortcuts. The status line (`role="status"`, polite) says "Playing Al-Baqara 2:6, ayah 3 of 13" when the ayah changes and the failure text above. The playing row carries `aria-current`. Every new control is 44px on a phone. Nothing animates.

## 8. Tests

- **Unit** (fake element and fake endpoint): the four kinds through the engine, queue advance, end, previous/next, repeat per kind, the retry-then-stop failure and Skip, preload (once ahead, skipped on Save-Data), the resume key (written on the three triggers, reset at the end, restore precedence, the surah key untouched), the Media Session metadata per kind, the per-ayah URL taken from the answer, and that a legacy-shaped record is unchanged.
- **Browser** (the existing stand-in element plus a mocked per-ayah endpoint with synthetic URLs): the ayah button and its label, the highlight and `aria-current`, follow on/off and never with Reduce motion, repeat one ayah, Play page across a surah boundary, Listen to this chapter, a failed ayah (Try again / Skip), the Asma clip and the three disabled names, the resume after reload (paused), no autoplay, 375px, dark mode, 44px, and that **no page still says "Playing single ayahs arrives soon"** (the test from 4B, inverted).
- **Real playback, gaps between files and offline on phones are device checks** (DEVICE_CHECKS.md).

## 9. Screenshots

1280 and 375, light and dark: the reader row with the play button, a playing ayah (highlight), the Per-page frame with a playing ayah, the Stories chapter with the queue playing, the mini player and sheet in queue mode ("ayah 3 of 13"), the failed-ayah state with Try again and Skip, the Asma sheet with Play and with a missing name.

## 10. Order of work and splitting

Five commits in this order, so the phase can be split at any boundary if a verify run is long or fails: (1) the engine's kinds and the queue, with unit tests; (2) the reader's per-ayah play, highlight and follow; (3) the Asma clip; (4) Play page; (5) Stories Listen. Hifz will reuse the queue later.

## 11. Decisions I need

1. **Asma Play:** enable as a clip for the 96 names that have a recording and show "No recording for this name" for #53, #93 and #97 (recommended); or keep all 99 disabled with a different reason; or remove the control.
2. **A failed ayah in a queue:** retry once, then stop with Try again and Skip (recommended), or skip automatically with a notice.
3. **Pause between ayahs:** none (recommended; the constant allows 300 ms later), or 300 ms now.
4. **Preload one ayah ahead by fetching its file** (stored by the existing audio cache rule), skipped on Save-Data (recommended), or no preload.
5. **Follow the audio:** a sheet switch, off by default, never with Reduce motion, stored in the new `quran:player-prefs:v1` (recommended), or stored inside `quran:audio-prefs:v1` (legacy writes would drop it).
6. **The queue's saved place** in the new additive key `quran:audio-queue:v1` (recommended), or no queue resume.
7. **Repeat** repeats what was started, with a label that says so (recommended).
8. **The queue stops at its end** (no auto-continue to the next page or chapter) (recommended).
9. **No separate Bismillah file** at a surah's first ayah on a page queue, with the device check above deciding whether anything is missing (recommended).
10. **Wording of ours** (flagged in CONTENT_TO_VERIFY.md when built): "Play page" / "Pause page", "Couldn’t play ayah 2:6.", "Skip this ayah", "Keep the playing ayah in view", "No recording for this name", "ayah 3 of 13".
11. **The reader's 4x-CPU performance budget** (first render under 4000 ms, tafsir under 800 ms): it fails about 1 run in 6 on this machine with or without 4B. Options: leave it and rerun when it flakes; make both budgets relative to the control run (as the longest-task one already is); or raise them a little. I changed nothing.
