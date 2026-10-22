# Phase 4B: the whole-surah player

- Branch: `revamp-design-logic`
- Date: 2026-10-21
- Status: Done, awaiting review. **The real-device audio check is still yours** (see "What is left for you").
- Plan and decisions: `phase-04b-plan.md` (your answers and the six open questions were all approved)

## Approved decisions (as built)

1. After a reload the mini player shows a saved place **paused**; nothing plays until a tap. No Home or Library row.
2. The reader's per-ayah play, Asma-ul-Husna Play, "Play page" and Stories "Listen" stay disabled with one reason: **"Playing single ayahs arrives soon"**; a test checks nothing still says "Coming with the player".
3. Previous and Next are previous and next surah, disabled at 1 and 114 (real buttons with `aria-disabled`).
4. Switching reciter restarts the surah from the beginning, and the sheet says so before it happens ("Switching reciter restarts this surah.").
5. 10-second back and forward buttons, and the Media Session seek actions.
6. The position is saved every 5 seconds while playing, on pause and on `pagehide` (and when the page is hidden, and reset to 0 at the end of a surah); the legacy resume record shape is kept exactly.
Holds: no autoplay anywhere (load, reload, resume); Media Session metadata and controls with a test where the API exists; the seek bar is a real slider with a readable value; Space toggles play when the sheet has focus; errors show a clear message and a retry, never an endless spinner; no offline-play claim; the legacy key shapes are tested against the legacy parser; the cache names are untouched. 4B = the whole-surah player, 4C = per-ayah audio (Save audio stays a visible, disabled button until Phase 11).
**Phone audio test: "not yet"** (the placeholder in the approval prompt was empty, which I took as "build now with no workaround and run your test against the finished player").

## What was built

- **`lib/audioEngine.ts`** (no Vue, no browser: the element, storage, timers and the file lookup are passed in): the state machine (idle, restored, loading, playing, buffering, paused, error), `playSurah`, `toggle`, `pause`, `retry`, `seek`/`skip`, `next`/`previous`, `setRate`, `setRepeat`, `switchReciter`, `restore`, `flush`, the 5-second saver, the 30-second load timeout, repeat, auto-next (stops after 114), error kinds (failed, timeout, blocked).
- **`lib/audioState.ts`** (the two legacy keys, the resume record and its validation, time and spoken-time wording, speeds) and **`lib/audioText.ts`** (the words of ours, with no imports); **`lib/mediaSession.ts`** (metadata, state, actions, throttled position).
- **`stores/player.ts`** (rewritten): a thin Pinia mirror of the engine with the Phase 3 names kept (`nowPlaying`, `playing`, `loading`, `error`, `playSurah`, `pause`, `toggle`), real element, storage and Media Session wired in, `pagehide` and `visibilitychange` flush.
- **`components/layout/MiniPlayer.vue`** (progress line, status, Try again, opens the sheet) and **`components/player/Sheet.vue`** (the sheet), mounted in `layouts/default.vue`, which also calls `restore()` after mount.
- The three disabled Play controls (Asma-ul-Husna sheet, Stories reader, Per page) use the one shared reason. The reader has no per-ayah play control at all today (4A only reserved the slot), so there was nothing to disable there; it arrives in 4C.
- **Test support:** `e2e/mocks.ts` `stubAudio` can tick, end, stall, fail, refuse and report a length; `scripts/lib/legacy-audio-player.mjs` loads the legacy composable in memory (never edited); `tests/player.test.ts` mocks the preferences store (it relies on Nuxt auto-imports).

## Findings

- **The legacy resume record was never used.** `hasResumable` and `resumeLast` exist but nothing in the legacy app calls them, and the position was saved only on `pause`. Resume is therefore a new feature, not parity (it is flagged in CONTENT_TO_VERIFY.md as new user-visible behaviour). Nothing is automatic.
- **The legacy composable is the oracle for the two keys.** `tests/audioLegacy.test.ts` runs the real `useAudioPlayer.ts` beside the revamp's code: the same six preference changes leave identical stored records; a record the legacy code wrote is read by the revamp (reciter taken from the legacy `subtitle`); a record the revamp's engine wrote loads in the legacy code as `resumeInfo`, is "resumable", and `resumeLast()` plays its url from its position.
- **A browser fires `pause` before `ended`** (and a new `src` resets the time to 0); the engine relies on both and the tests' fake element copies them. A finished surah is saved with position 0.
- **A saved URL is never reused.** The file is found again by surah and reciter name (the blueprint's rule); the stored `url` is only there for the legacy record. A legacy record without `reciter` uses the legacy `subtitle` when it is a known reciter, else the default.
- **Streamed audio is not cached offline, and the plan's claim stands:** the service worker caches only `200` responses and a media element's Range requests get `206`, so 4B makes no offline claim. Serving a cached whole file to Range requests needs Workbox's range plugin and a whole-file fetch: Downloads (Phase 11). The cache name `quran-audio-cache` is unchanged.
- **Checked from this machine only:** the hosts answer Range with `206` and CORS `*` (both the 74 MB generic-type files and the small per-ayah `audio/mp3` files), and per-ayah audio exists (`quranapi.pages.dev/api/<surah>/<ayah>.json` has a `url` per reciter), which is what 4C will use.
- **The Settings speed control already writes 0.5 to 3 (clamped)**; the sheet's five chips cover the prototype's values and a stored value outside them is shown, selected, as a custom chip rather than hidden.
- A test-only lesson: Playwright cannot click an `aria-disabled` button without `force`, and a stub installed before navigation is replaced by the init script, so hooks are set after the page loads.

## Differences from the plan

- Previous and Next move by surah only (as decided); the plan's per-ayah moves are 4C.
- Save audio is shown disabled with a reason (your decision 3) instead of being left out.
- The reader's per-ayah play control does not exist yet, so only three controls changed wording (not four).

## Deliberate gaps (CONTENT_TO_VERIFY.md)

Per-ayah audio, name clips, Play page and Stories Listen (4C); Save audio (Phase 11); any offline-play claim; a workaround for the large generic-type files (none, pending your device test).

## Verification

`npm run verify` on Node 22 (build, lint, 617 unit tests, dev smoke, 461 e2e tests): **passed, exit 0**. The Settings picker test did not fail. Failures on the way were all in my new tests or test support (hooks set before the page loaded, an `aria-disabled` click needing `force`, a missing record in a test that checked it before any save) and an import-free file for the shared wording so Playwright's own Node can load pages that need it; none was a defect in the player.

- `tests/audioState.test.ts` (13), `tests/audioEngine.test.ts` (33), `tests/audioLegacy.test.ts` (5), `tests/player.test.ts` (7, unchanged and still passing).
- `e2e/player.spec.ts` (32): nothing plays by itself (load, reload, other pages), a damaged or non-surah record is ignored, Play on a restored item (by name, from the saved place), the sheet and focus return, progress line, buffering, the resume line, Save audio, the slider and its spoken value, skips, the stalled load, speed chips and the custom chip, Repeat and auto-next (including the stop), Previous/Next and their disabled ends, the reciter note and switch (playing and paused), Space, Tab order, the saved place (5 s timer, pause, pagehide, the end), reload, the three error states with Try again, Media Session on the real API, the other Play controls and the shared reason, dark mode, no `quran-app-db`, 375px and 44px targets.

## What is left for you

- **The phone audio check** (it decides whether the 210 large files need anything): Surah listing, play surah 1 (control), 3 and 18, two reciters each, iPhone Safari and Chrome on Android (and Firefox); note plays or fails, the exact message, and whether seeking works in the sheet. Also the lock screen's controls, and the sheet at 375px dark.
- Review the wording of ours and the new resume behaviour (CONTENT_TO_VERIFY.md).
- Then 4C (per-ayah audio and the queue) needs a plan review.

## After review (2026-10-22)

- **The mini player's error now wraps onto two lines at 375px** (the text is never clipped) and **Try again sits under it**, so it cannot be pushed off the row; a browser test measures the lines, the clipping and the button's position and size. Screenshot regenerated (`player-compare/state-mini-error-*`).
- `npm run verify` on Node 22 after the change: 617 unit tests, 462 e2e tests, **passed, exit 0**. (The first baseline run that morning had one failure in the reader's 4x-CPU performance budget; a retry pass on the pre-4B and 4B builds gave 5 of 6 each, so it is a timing test at its limit on this machine, not a 4B regression: see `phase-04c-plan.md`, section 0.)
- `docs/DEVICE_CHECKS.md` was added (every real-device and manual review item so far).
