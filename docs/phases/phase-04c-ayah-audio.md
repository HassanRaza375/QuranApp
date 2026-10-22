# Phase 4C: per-ayah audio and queues

- Branch: `revamp-design-logic`
- Date: 2026-10-22
- Status: Done, awaiting review. **Real-device checks are still yours** (new rows A17 to A25 in `docs/DEVICE_CHECKS.md`).
- Plan and decisions: `phase-04c-plan.md`

## Approved decisions (as built)

1. The reader's per-ayah performance budget became **relative to the control run** (the app's own start-up, timed in the same throttled page); the old absolute figures are recorded in the report, not gated on. Figures: see "The performance gate" below.
2. `CLAUDE.md` now says: do not run network sweeps or other heavy work while `npm run verify` runs, and never remove a git worktree whose `node_modules` is a junction or symlink without unlinking it first.
3. **Asma Play** is a single-file clip for the 96 names that have a recording; #53, #93 and #97 show "No recording for this name" with no fallback; the Asma page doc records that these three ids return 404 from the audio source today (checked 2026-10-22).
4. No offline-play claim anywhere; "needs a connection unless it was downloaded" kept.
5. Reader: a play button per ayah, a playing-ayah highlight, and a **Follow audio** switch, off by default and never on while Reduce motion is on.
6. Queues (Play page, Stories Listen) advance ayah by ayah, preload exactly one ayah ahead, have no pause between ayahs; a failed ayah retries once automatically, then stops with a message plus Try again and Skip; never a silent skip.
7. Queue resume uses a new additive key, `quran:audio-queue:v1` (shape in `docs/pages/player.md`); `quran:audio-resume:v1` is untouched. **Repeat applies to a single ayah (in the reader) and to a surah; a queue and a clip have no Repeat.**
8. Whole-surah, ayah, queue and clip playback share the single player store; only one thing plays at a time.
9. Bismillah on page queues: no claim in the UI; rows A19 and A20 in DEVICE_CHECKS.md ask you to listen to the first ayah of a surah on two reciters.
Also: no autoplay anywhere; Media Session metadata for ayahs; keyboard and screen-reader behaviour; 44px targets; screenshots at 1280 and 375, light and dark.

## What was built

- **`lib/audioEngine.ts`** generalised: a `Track` is a **surah**, an **ayah**, a **queue** or a **clip**; `playAyah`, `playQueue`, `playClip`, `skipAyah`; per-kind Previous/Next, repeat and saved place; the queue preloads one ayah ahead, retries a failed ayah once and then stops with Try again and Skip; the snapshot carries a `view` (title, line, Media Session title/artist/album) so the mini player, sheet and lock screen show the same words.
- **`lib/ayahAudio.ts`** (the url is taken from the per-ayah answer by reciter name, never built from a pattern), **`lib/audioQueue.ts`** (a page's ayahs from the page starts; a story chapter's from its passages), **`lib/audioState.ts`** (the queue record `quran:audio-queue:v1` with its validator, `quran:player-prefs:v1` for Follow audio), **`lib/audioText.ts`** (the words, with no imports), **`composables/useFollowAudio.ts`**.
- **`stores/player.ts`:** `playAyah`, `playQueue`, `playClip`, `skipAyah`, `playingAyah`/`playingKey`, `ayahActive`, `queueIs`/`queueActive`, `clipIs`/`clipActive`, `setFollow`, and a `restore()` that rebuilds a saved queue from the data.
- **UI:** the reader row's **Play ayah N** and the highlight (`AyahList.vue`); **Play page / Pause page** and the highlighted ayah in the Per-page frame; **Listen to this chapter** and the highlight in the Stories reader; the Asma-ul-Husna name sheet's **Play** (a clip); the mini player (kind-aware title and line, **Skip this ayah**) and the sheet (kind-aware Previous/Next names, repeat label, reciter note, **Follow audio**, "ayah 3 of 13").
- The three "arrives soon" placeholders are gone: `PLAY_SOON` and the Per-page `PLAY_REASON` were deleted, and a test checks no file still says it (or "Coming with the player").

## Findings

- **Per-ayah audio is complete** (measured before building, `phase-04c-plan.md` section 1): all 6,236 ayahs have all five reciters with the same url shape; a 1,500-file sample is all `audio/mp3` with CORS and range support, 14 KB to 3.47 MB.
- **A real bug the tests caught:** describing a *clip* asked the surah list for the title of "surah 0" and crashed the click (found by a browser test; the unit fake did not throw like the real list, so the fake now does). Fixed; a unit test covers it.
- **An error event from the previous try can arrive while the retry is still looking for its file.** It would flash the failure message for a moment (the engine then recovers by itself). The engine now ignores an error event while no file is set for the current try; a deterministic unit test fails without the guard and passes with it.
- **Chromium's own `error` event comes after the failed `play()`,** so a stand-in that only rejected `play()` would not have shown the double report; the browser spec's stand-in emits both.
- **The reader's tools row gained a button:** the tab order is now Tafsir, Play, Save, Pin, Share (the existing keyboard test was updated), and every tool is still 44px at 375px.
- **A page highlight needs a wrapper:** the Per-page frame's ayah text now sits in its own inline span per ayah (with `data-surah`/`data-ayah`), still reading as one flowing text; the earlier tests and the sajda-sign tests are unaffected.
- **The reciter switch in the listing and the reader now goes through the engine** for any kind, so changing reciter while an ayah or a queue plays carries on by the new reciter instead of doing nothing.
- **Asma recordings:** 96 of 99 reachable; #53, #93 and #97 are 404 at the source today (a test pins the three ids and that the other 96 have an address; it cannot check the network, so a change at the host needs a re-run of the check).
- **The stand-in element can now tick, end, stall, fail, refuse and report a length;** the verse mock serves a per-ayah `audio` object and a test audio host that records what a queue preloads.

## The performance gate (decision 1)

The reader's 4x-CPU test failed about one run in six on this machine with or without 4B (pre-4B build and 4B build both passed 5 of 6 under the same conditions; the failures were 4189 and 4047 ms first render against a 4000 ms budget, and 828 to 876 ms tafsir against 800). Its timing budgets now gate **relative to the control run**: cold and warm render must stay under 4 x the control start-up + 1,500 ms, and a tafsir (the faster of two opens) under 1.5 x the control + 500 ms; the longest task (already relative) and the layout shift keep their budgets. The old absolute figures stay in `test-results/reader-perf.json` and below. Recent figures on this machine at 4x CPU (cold / warm / tafsir): 1.3 to 2.2 s / 1.3 to 3.7 s / 0.4 to 0.85 s; control start-up 0.6 to 1.6 s. It passed 8 of 8 repeated runs after the change.

## Differences from the plan

- Repeat is for surahs and single ayahs only (your decision 7): the sheet hides it for a queue and a clip.
- The "Follow audio" switch lives in the sheet only (not on the pages), and works on the reader, Per page and Stories alike.
- `QUEUE_GAP_MS` does not exist: with no pause there is nothing to configure; if a device check wants one, it is a small addition.

## Deliberate gaps (CONTENT_TO_VERIFY.md)

A separate Bismillah file at a surah's first ayah on a page queue; any offline-play claim; a download of a page or chapter for offline (Phase 11); a pause between ayahs; queues for anything but a page and a story chapter (Hifz will reuse the queue later).

## Verification

`npm run verify` on Node 22 with nothing else running: result recorded in the last section.

- `tests/audioQueue.test.ts` (27: an ayah, a queue, a clip, saved places, failures, restore), `tests/audioEngine.test.ts` (33), `tests/audioState.test.ts` (13), `tests/audioLegacy.test.ts` (5, the legacy composable beside the revamp: unchanged and still passing), `tests/player.test.ts` (7).
- `e2e/ayahaudio.spec.ts` (18: the reader's button, highlight, reciter, whole-surah vs ayah highlight, no saved place for an ayah, a failed ayah, the sheet's ayah controls, Media Session, Follow audio on/off/Reduce motion, the Asma clip and the three missing names, dark, 375px), `e2e/queue.spec.ts` (19: Play page, advance, one ayah preloaded ahead, the end, a page that crosses a surah, the sheet's queue line, Media Session, navigating away, a failed ayah with Try again and Skip, the saved place and reload, Listen to this chapter, dark, 375px), `e2e/player.spec.ts` (33, one test rewritten).

## What is left for you

- The real-device rows A1 to A25 in `docs/DEVICE_CHECKS.md` (the audio matrix A1 to A8 is still the one that decides most).
- Review the wording of ours (CONTENT_TO_VERIFY.md).
- Next candidates: Search (needs a prototype first), or Downloads (depends on the player and on your device results).
