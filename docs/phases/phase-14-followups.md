# Phase 14 follow-ups: start-up cost of Hifz, and when a new ayah is graded

- Branch: `phase-14-followups` (from the merged head of `chore/standalone-repo`, 2d5e8ed)
- Date: 2026-10-28
- Asked by the owner when accepting Phase 14: (1) confirm Hifz code and surah text load only on Hifz routes and the Home tile reads only saved progress, and measure app start before and after Phase 14; (2) save a new ayah's grade when its Recite stage ends, and grade the joins separately.
- Status: both done and checked on the branch (see Verification). Not merged: waiting for the owner.

## 1. What loads, and what it costs

Tool: `scripts/measure/startup.mjs` (dev-only, not in verify; `startup-fixture.ts` makes a saved Hifz record, `summary.mjs` prints a result, `buildsize.mjs` sizes a build). It opens each route on the production build (`node .output/server/index.mjs`) in a fresh browser with the service worker blocked (so every request is seen), with and without saved Hifz progress, at normal speed and at 4x CPU slowdown, 5 runs each (medians), and waits 2.5 s after `load` so idle prefetching shows. Requests that leave the app are logged and aborted. "Before" is commit 3603e43 (the merged head before Phase 14), rebuilt in place; "after" is 2d5e8ed. Same machine, same Node 22.23.4, CPU about 20 to 60% from other programs, so differences of about 100 ms in a paint time are noise (the identical "before" rows alone differ by that much).

### The two claims

| Claim | Result |
| --- | --- |
| **The surah text loads only on Hifz routes** | **Confirmed.** No request for a surah's text on `/`, `/surah`, `/reader`, `/settings`, `/prayerTime` or `/hifz` (the text is asked for when a session step opens, not before). The only request that left the app on any route is the one that was already there: `/` asks for the ayah of the day (`quranapi.pages.dev/api/11/36.json`), in the "before" build too. Nothing in the Home path calls the reader's text (`useHomeState.ts` and `UtilStrip.vue` have no `getChapter`). |
| **The Home tile reads only saved progress** | **Confirmed.** `useHomeState.hifzDue()` is `practiceCount(loadHifz().data, todayKey())`: the saved record, today's date and the bundled ayah lengths (a bundled data chunk, not a request). Same list of outside requests before and after, with and without saved progress. A damaged record gives 0 (tested in Phase 14). |
| **Hifz code loads only on Hifz routes** | **Not exactly true.** See below. |

### Hifz code is not only on Hifz routes

Two chunks hold Hifz code. Neither is in the start set of the prerendered Home page (the scripts `index.html` names), so neither is needed to paint:

| Chunk | Size | Where it loads |
| --- | --- | --- |
| Engine, queue, store, words and timing (`lib/hifz/*`) | 13 KB | On **every** route measured (`/`, `/surah`, `/reader`, `/settings`, `/prayerTime`), 150 to 1,200 ms after navigation starts, i.e. after the page is up; on `/hifz` at about 130 to 190 ms |
| The Hifz screens (Home, session, surah page) | 15 KB | `/hifz` (as needed), and on `/` at 0.5 to 1.3 s |

Why, **not proven**: the Home route has a visible link on every page (the sidebar's "/"), and Home imports the engine for its tile; the Hifz tile on Home links to `/hifz`. The browser's request initiator is `about:client` (a module preload or dynamic import), which does not say more. The pattern fits Nuxt prefetching the routes behind visible links when the browser is idle. If the owner wants the claim to be strictly true, the options are: prefetch off on the Hifz tile link (the 15 KB screens chunk then loads only when opened), and Home's route chunk not prefetched from other pages (a policy change that also affects how fast Home opens). I have not changed either; 13 KB loaded in idle time is small.

### Before and after

JS loaded by 2.5 s after `load` (uncompressed bytes, one run's file list; files seen in at least half the runs):

| Route | Before | After | Change |
| --- | --- | --- | --- |
| `/` | 83 files, 1,241 KB | 90 files, 1,279 KB | +7 files, +38 KB |
| `/surah`, `/reader` | 73 files, 986 KB | 77 files, 1,002 KB | +4, +16 KB |
| `/settings` | 72 files, 986 KB | 76 files, 1,001 KB | +4, +15 KB |
| `/prayerTime` | 85 files, 1,101 KB | 89 files, 1,116 KB | +4, +15 KB |
| `/hifz` | 76 files, 1,041 KB | 84 files, 1,101 KB (86, 1,131 KB with saved progress) | +8, +60 KB (+10, +90 KB) |

Build: the Home start set (every script `index.html` names) went from **41 files, 812 KB to 44 files, 814 KB** (+2 KB). All app JS except the Fiqh data chunks went from 162 files, 1,807 KB to 171 files, 1,875 KB (+68 KB, almost all of it the lazy Hifz chunks).

First contentful paint, medians of 5 runs (ms), before then after (none = no saved Hifz progress, saved = with it):

| Route | Normal speed | 4x CPU slowdown |
| --- | --- | --- |
| `/` | 392 then 412 (none); 392 then 428 (saved) | 1,028 then 952 (none); 1,008 then 996 (saved) |
| `/surah` | 336 then 408 (none); 336 then 336 (saved) | 824 then 820 (none); 872 then 832 (saved) |
| `/settings` | 380 then 372 (none); 400 then 416 (saved) | 1,024 then 964 (none); 1,044 then 1,040 (saved) |
| `/prayerTime` | 404 then 424 (none); 396 then 420 (saved) | 1,112 then 924 (none); 1,148 then 988 (saved) |
| `/hifz` | 424 then 380 (none); 340 then 388 (saved) | 844 then 932 (none); 892 then 924 (saved) |

The `load` event time is 95 to 165 ms in every row of both builds. **Reading:** app start is not measurably different (the changes are in both directions and inside the run-to-run spread), the start set grew by 2 KB, and 15 to 38 KB more JS is fetched in the idle time after the page is up. This says nothing about a real phone on a real network; there is no such measurement.

## 2. A new ayah is graded when Recite ends

Before: the ayah, its tricky words and its introduction were saved when the whole step ended (after the joins), so leaving during the joins lost the grade and offered the ayah as new again.

Now (owner's instruction, 2026-10-28):

- **Recite ends** → the ayah is graded from its slips, its tricky words are recorded and it counts as introduced (whatever the grade, as before), all saved at once. The session stays on that step, with the grade stored on the item (`result`, `hintLevel`: the legacy item fields).
- **The joins** → the join of the ayah before with this one is graded **on its own** when the joins end: `good` when the "n-1 + n" step was said at the first try, `again` after any "Not yet" on that step (one miss makes a join weak, as in the legacy), so it comes back. The other join steps (n-1, n, and from the first ayah to n) stay practice. Before this change the joins of a new ayah graded nothing.
- **Leaving during the joins** keeps the ayah's grade. **Resume** goes straight to the joins (the item has its result), so the ayah is never graded twice. **Skip** during the joins keeps the grade and only moves on.
- A new ayah with no ayah before it (the first of the plan) has no joins and is graded and moves on in one call, as before.

Code: `lib/hifz/session.ts` (`applyGrade`, `finishJoins`, `isGraded`; `gradeCurrent` is `applyGrade` then move on, `skipCurrent` keeps an existing grade), `stores/hifz.ts` (`finishRecite`, `finishJoins`), `components/hifz/Learn.vue` (emits `recited` and `joined`; starts at the joins when `graded`), `HifzSession.vue`. The engine is unchanged, so `tests/hifzParity.test.ts` still compares it with the legacy composables (green).

**Risks and differences, written down:**
- A rollback to the legacy app while a session sits in the joins of a new ayah: the legacy app resumes that item and grades the ayah once more (the item carries a result, which the legacy runner does not look at). It would count one extra review of that ayah. This only matters for a session left open across a rollback.
- The graded join of a new ayah is new behaviour compared with the legacy and with Phase 14 as accepted; a "Not yet" there makes the join weak, so the next day's plan can include a tricky join and, with it, fewer new ayahs (the legacy rule for weak joins, unchanged).
- The Done screen's "to try again" count counts ayahs, not joins.

## Verification

- `npx eslint` on `app`, `e2e`, `tests` and `scripts/measure`: clean.
- Unit: `tests/hifz.test.ts` +5 tests (graded at Recite and the session stays; the join graded on its own, good and again/weak; the summary; skip keeps the grade; `gradeCurrent` unchanged for steps without joins), `tests/hifzParity.test.ts` unchanged and green: 56 of 56 in those two files.
- Browser: `e2e/hifz.spec.ts` 34 of 34 on a fresh production build (+2: grade at Recite then leave and Resume straight to the joins without grading twice; "Not yet" on the pair step makes it weak and leaves the ayah's grade alone, a "Not yet" on another step is practice; the whole-day test now checks the grade at Recite and the join after).
- **The full `npm run verify` has not been run on this branch.** It must run before a merge.
