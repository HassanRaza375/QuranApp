# Phase 4B plan: the full audio player

Status: **plan only, waiting for approval. One input is missing: your phone audio test result** (the prompt had the placeholder `[paste the result here…]` unfilled). Everything below that does not depend on it is ready; the part that does is written as "if it plays / if it fails" so no result is assumed.

Written 2026-10-21 after reading the legacy `useAudioPlayer.ts`, `useReciter.ts`, `useAudioDownload.ts`, the Phase 3 player (`stores/player.ts`, `MiniPlayer.vue`, `lib/surahAudio.ts`), `docs/audio-url-check.md`, `docs/legacy-reference/MODULE_BLUEPRINT.md` Module 4, the prototype's player overlay (`playerHTML`), the service worker rules in `nuxt.config.ts`, and live checks of the audio hosts.

**Reviewed 2026-10-21.** Your decisions are applied below (they replace my first split): 4B is the whole-surah player, 4C is per-ayah audio in the reader (with the ayah queue); resume is a new feature shown as a line in the sheet, never automatic; Save audio stays visible but disabled with a reason until Phase 11; no offline-play claim; the audio cache names and the two storage keys stay exactly as they are. The phone audio test result is **still not supplied** (the placeholder was empty again), so section 1 stays conditional.

**Baseline:** `npm run verify` on Node 22 passed on the last pushed commit (566 unit, 428 e2e, exit 0). A new run after the 9B follow-up (duplicate sign removed) is in progress and is reported with the 9B hand-back.

## 1. Your audio test, and what I could check without a phone

**What I checked from this machine today** (not a substitute for a phone):

| Check | Result |
| --- | --- |
| Full-surah files (`github.com/The-Quran-Project/Quran-Audio-Chapters/raw/…` → `raw.githubusercontent.com`) | Redirect, then `200`/`206`, **`Content-Type: application/octet-stream` with `X-Content-Type-Options: nosniff`** for the 210 large files (surah 3 reciter 1: 74,406,621 bytes) |
| Range requests on those files | `206 Partial Content` with `Content-Range`, `Accept-Ranges: bytes`, `Access-Control-Allow-Origin: *` (so seeking in a 74 MB file should work without downloading it) |
| **Per-ayah audio exists** | Yes. `quranapi.pages.dev/api/<surah>/<ayah>.json` returns `audio` for all five reciters, with a `url` (`the-quran-project.github.io/Quran-Audio/Data/<reciter>/<surah>_<ayah>.mp3`) and an `originalUrl` (everyayah.com). Files are **`audio/mp3`**, small (146 KB for 1:1, 590 KB for 2:255), `206` on Range, CORS `*`. The reciter names are identical to the full-surah list for all five |
| Desktop Chromium plays the generic-type files | Yes (2026-10-16, `docs/audio-url-check.md`) |

**What is still unknown: iOS Safari, Firefox, and Chrome on Android with the generic-type files.** That is the test I need from you:

1. On the phone preview open `/surah-listing`, press Play on **surah 1** (control: `audio/mpeg`), **surah 3** and **surah 18** (generic type, big), with two different reciters. Try it in Safari on iPhone and in Chrome (and Firefox if you use it) on Android.
2. Report per browser: plays, does not play, plays but cannot be paused/resumed, or stalls (and for how long before the first sound).

**How I will use the result, only for what actually fails:**

- *Everything plays:* nothing to do; the player needs no workaround.
- *A browser refuses the generic type* (the media element errors): options in order of cost: (a) a clear message on that browser ("This device cannot play this recording") and the surah's **per-ayah files** as the fallback source (`audio/mp3`, so the same player plays ayah after ayah: needs the queue of 4C); (b) nothing else I recommend: fetching 90 MB into a blob (memory) or proxying through our own server (the app has no backend, and a proxy for 90 MB files is a hosting cost and a new thing to run).
- *It plays but takes too long to start* (a Range or buffering issue): `preload="metadata"` and a "Buffering…" state; no workaround for the host.

## 2. The legacy player: what it does and omits

`app/composables/useAudioPlayer.ts`: one `Audio` element in Nuxt state; `nowPlaying {type: surah|ayah|name, surahNo, title, subtitle}`; `playbackRate`, `repeatOne`, `autoAdvance` persisted in `quran:audio-prefs:v1`; the resume record `quran:audio-resume:v1` = `{ url, position, nowPlaying }`; Media Session metadata and handlers `play`, `pause`, `seekto`; time labels; `playNextInQueue` (next surah, same reciter, when `autoAdvance` and the track is a surah); `endedAt` for callers that drive their own queue.

| Omits or is wrong | Notes |
| --- | --- |
| **The resume record is never used.** `hasResumable` and `resumeLast` exist but nothing in the legacy app calls them | So "resume" has never worked for a user; only the record is written |
| The position is saved only on `pause` (not while playing, not on closing the tab) | A tab closed mid-playback loses the position |
| `resumeLast` seeks right after `play()` | Before metadata has loaded the seek can be lost |
| `play()` has no error handling | A failed file leaves `loading` true and an unhandled rejection; no message |
| No Media Session `previoustrack`, `nexttrack`, `seekbackward`, `seekforward`, no `setPositionState` | Lock-screen scrubber cannot show position |
| No buffering state, no seek UI (the legacy mini player has none either), repeat and auto-next have no UI except in Settings | |
| The resume record stores a raw URL | The blueprint's rule is that reciter URLs resolve by **name** per surah; the URL is only valid for that surah |
| The per-ayah `type: "ayah"` exists but only Duas/Hifz callers use it with a single URL | |

## 3. What the revamp has today (Phase 3)

`stores/player.ts`: `playSurah({surahNo, title, reciter, rate})`, `pause`, `toggle`; one `Audio` element; `PLAY_ERROR` ("Couldn’t play. Audio needs a connection unless it was downloaded."); `MiniPlayer.vue`: a fixed bar with title, status and a play/pause button, shown once something has been started; reciter URL resolved by name (`lib/surahAudio.ts`); `playbackRate` (and `autoplay` = the legacy `autoAdvance`) are Settings values in `quran:audio-prefs:v1`.

## 4. Scope and the split (decided)

- **4B: the whole-surah player.** One full-surah file at a time: the sheet, seeking, speed, repeat, auto-next surah, resume, reciter switching, Media Session, states and errors.
- **4C: per-ayah audio.** The play button in the reader's tools row (per-ayah files, which exist), single-file clips such as the Asma-ul-Husna names, and the ayah queue that **Play page** (Per-page), **Listen to this chapter** (Stories) and Hifz need. It is also the per-ayah fallback if your test shows a browser refuses the big files.

## 5. 4B features

- **Seeking:** a labelled slider in the sheet (`aria-label` "Position", `aria-valuetext` "12:34 of 77:08", step 5 s, commits on release/key like the page slider), time labels, and 10-second back and forward buttons. A thin progress line in the mini player (no seeking there). Range requests are supported by the hosts, so seeking a 74 MB file does not download it; the slider is disabled until metadata has loaded.
- **Speed:** the same `playbackRate` value as Settings (clamped 0.5 to 3, as stored), chips 0.75, 1, 1.25, 1.5, 2 in the sheet; a stored value outside the chips shows as a selected "custom" chip. Writes `quran:audio-prefs:v1` keeping `repeatOne` and unknown fields.
- **Repeat:** "Repeat this recitation" (the legacy `repeatOne`, in the same key), loops the current track.
- **Auto-next:** the existing `autoplay` pref (legacy `autoAdvance`): when a full surah ends, the next surah by the same reciter starts (the legacy rule: `type: surah`, up to 114). The switch in the sheet is the same setting as in Settings. Off by default; **nothing ever starts on page load.**
- **Resume (new; the legacy never used its record):** `quran:audio-resume:v1` in the legacy shape (`url`, `position`, `nowPlaying`, plus an additive `nowPlaying.reciter`). Start small: written when playback is paused or stopped and on `pagehide`, and (optional, decision 8) every 5 seconds while playing. The sheet shows one line, **"Resume where you stopped · Al-Baqara · 12:34"**, with a button; pressing it plays from that point (by surah and reciter name, not the stored URL; the seek happens only after metadata has loaded). Nothing is automatic and nothing plays on page load. *Open question 3 below: the sheet needs an opener when nothing has been played in this visit.*
- **Previous and Next:** previous or next **surah** (disabled at 1 and 114). Per-ayah audio, the reader's per-ayah play button and the Asma names are **4C**.
- **Reciter switching:** the sheet's reciter menu (the five reciters); switching restarts the same surah (or ayah) with the new reciter **from the beginning**, because two reciters' files have different timing so a position does not carry over. It also sets the preferred reciter, as the reader's menu already does.
- **Player sheet:** the prototype's overlay as a bottom sheet on phones and a side panel on desktop (the same `Sheet` the other pages use): Now playing, title and reciter, position slider and times, Previous / Play-Pause / Next, 10 s back and forward, Speed, Reciter, Repeat, "Play the next surah automatically", and a Close button. Opened by tapping the mini player's title (the prototype's `player-open`).
- **Save audio to device:** the prototype's button is shown in the sheet as a visible, real button with `aria-disabled` and the reason "Saving audio arrives with Downloads" (Phase 11 owns it; the legacy helper fetches the whole file into memory as a blob, a bad idea for 90 MB files on a phone). The sheet and the app make **no claim that audio plays offline**.
- **Media Session:** metadata (title, artist = reciter, album "Quran App"), `playbackState`, handlers `play`, `pause`, `seekto`, `seekbackward`, `seekforward` (10 s), `previoustrack` and `nexttrack` where Previous and Next apply, and `setPositionState` at most once per second. Whether the lock screen shows them is a device check, not something I can test in a browser.

## 6. Placeholders and which stay disabled

| Placeholder today | 4B |
| --- | --- |
| Surah listing and reader "Play surah" (real since Phase 3) | Stay; they open the same player |
| Reader per-ayah play slot | Stays reserved until **4C** |
| Asma-ul-Husna "Play" (disabled, "Coming with the player") | Stays disabled until **4C** (a single-file clip, not a surah) |
| Per-Page "Play page" (disabled) | Stays disabled until **4C** (an ordered list of ayahs) |
| Stories "Listen to this chapter" (disabled) | Stays disabled until **4C** (passages across surahs) |
| Hifz | Not rebuilt yet (its own phase) |
| Sheet "Save audio" | New, visible and disabled with its reason until Phase 11 |

The four disabled Play buttons keep their existing wording ("Coming with the player"); once 4B ships that phrase is no longer true for the whole-surah player, so their reasons are updated to say what is actually missing ("Playing single ayahs arrives soon", wording of ours, flagged).

## 7. Offline

- The service worker already caches audio with `CacheFirst` in `quran-audio-cache` (**the name must stay identical**, 300 entries, 1 year), but only `200` responses are cached, and a media element asks with a `Range` header and gets `206`, which the Cache API cannot store. **So streamed audio is not available offline today, and nothing in 4B changes that.** Serving a cached full file to range requests needs the Workbox range-request plugin and a whole-file fetch: that belongs to Downloads (Phase 11), together with the large-file and storage decisions there.
- States when audio cannot play: **Loading** ("Loading…"), **Buffering** ("Buffering…", from `waiting`/`stalled`), **Needs a connection** (offline: "Audio needs a connection unless it was downloaded."), **Could not play** (the media element's own error; message plus Try again), **This device cannot play this recording** (only if your test shows a browser refuses the file type), **Not allowed** (a browser blocking `play()` that was not started by a tap, shown as "Tap Play to start").
- With no connection and a resume record, the mini player still shows the paused item; Play then shows the offline message instead of failing silently.

## 8. Keyboard, screen reader, touch

Native buttons and a native range input; Space and Enter on Play/Pause; arrow keys on the slider; no global or single-key shortcuts (as on the page reader); the sheet traps focus and returns it to the mini player's title; the mini player is a `region` "Audio player"; the status line is a polite live region ("Playing Al-Baqara", "Buffering…", errors); all controls at least 44px; `prefers-reduced-motion` has no animation here anyway. **No autoplay:** nothing plays until a tap or press; a resume only shows the paused item.

## 9. Storage (additive, legacy-compatible)

`quran:audio-prefs:v1` `{ playbackRate, repeatOne, autoAdvance }` (unknown fields kept; `repeatOne` is new to the revamp's UI but already in the legacy key) and `quran:audio-resume:v1` `{ url, position, nowPlaying }` (legacy shape, plus the additive `nowPlaying.reciter`). No new key, no new IndexedDB store, `quran-app-db` never opened.

## 10. Tests

- **Unit** (a fake audio element, no browser): the state machine (loading, playing, paused, buffering, ended, error), repeat, auto-next stopping at 114, the resume writer (throttled, on pause, on pagehide) and reader, resume by name not URL, seek only after metadata, speed and prefs writes keeping unknown fields, Previous/Next (surah) rules, the Media Session handler wiring against a stub, and legacy-shape fixtures through every write.
- **Browser** (the existing `stubAudio` recorder; no real audio): the mini player and sheet open and close, focus returns, slider and buttons call the element, speed/repeat/auto-next write the keys, the resume line and the opener (decision 3) play only on a tap (and never on load), reciter switch restarts from 0, the four disabled Play buttons and Save audio stay inert with their reasons, error and offline states, 375px, dark mode, 44px targets, no `quran-app-db`.
- **Real playback, lock-screen controls and the generic-type files can only be checked on a device.** That is your test; I cannot do it.

## 11. Screenshots

1280 and 375, light and dark: the mini player (playing, paused at a resume point, loading, error), the sheet (surah playing, the resume line, first and last surah with disabled Previous/Next, custom speed, Save audio disabled). The prototype overlay beside the revamp sheet.

## 12. Decisions: your answers applied, and my recommendations on the rest

Decided by you: (1) split 4B whole-surah / 4C per-ayah; (2) resume is new, a sheet line, never automatic, never autoplay on load; (3) Save audio disabled with a reason until Phase 11, no offline claim; (4) the audio cache names and `quran:audio-prefs:v1` / `quran:audio-resume:v1` keep their formats exactly.

Open, with my recommendation:

1. **Your phone audio test result.** Still missing. Until it arrives I add no workaround for the generic-type files, as you said; if it does not play somewhere, the plan above lists what to do for that case only.
2. **Asma-ul-Husna Play and the reader's per-ayah play stay disabled in 4B** (they are 4C), with their reason text updated. Recommended.
3. **How the sheet is reached after a reload (the one thing your resume answer leaves open).** The mini player exists only once something has played in this visit, so a "Resume where you stopped" line in the sheet has no door. Recommended: when a resume record exists, show the mini player **paused** on the next visit (title, "Paused at 12:34", a Play button), with the sheet behind it; nothing plays until a tap. The alternative is a "Continue listening" row on Home or the Library that opens the sheet. Say which.
4. **Previous / Next = previous / next surah** (disabled at the ends). Recommended.
5. **Reciter switch restarts the surah from the beginning** (reciters' files have different timing). Recommended.
6. **10-second back and forward buttons and the Media Session seek actions.** Recommended.
7. **The disabled Play buttons' new wording** ("Playing single ayahs arrives soon"): approve, or give your wording.
8. **Position written while playing (every 5 s)** as well as on pause and `pagehide`, or only on pause as the legacy. Recommended: both (a tab closed while playing otherwise loses the place).
