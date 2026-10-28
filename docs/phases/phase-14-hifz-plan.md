# Phase 14: Hifz: legacy report and plan

- Branch: `phase-14-hifz` (from the merged `chore/standalone-repo`)
- Date: 2026-10-28
- Status: **plan, waiting for your approval. No code written.**
- Inputs: the legacy code (read-only, legacy commit `7120b6c`: `useHifz.ts`, `useHifzSession.ts`, `HifzPractice.vue`, `HifzTest.vue`, `HifzTargetWizard.vue`, `pages/hifz/index.vue`, `pages/hifz/session.vue`), `docs/legacy-reference/MODULE_BLUEPRINT.md` (Module 10), `PROJECT_PLAN.md` §19.3 and §20, `docs/design/prototype-hifz.html` (the agreed design), and the Hifz answers in `DECISIONS.md`. The legacy Hifz specification (`Hifz_Module_Specification.md`) is **not in either repository**; I worked from the code.

## 1. Summary

Rebuild Hifz as the simple mode you agreed: a home with one plan and one Start button, a session that is a queue of one-screen steps, a surah page, and an "Add a surah" sheet. **Grading comes from words you slip on**, not from Again / Good / Easy buttons. The legacy engine (spacing, strength, "tricky ayahs first", "new ayahs wait while 3 or more need work") and the legacy data stay exactly as they are, so a user keeps their targets and progress and can roll back to the legacy app.

The one new thing stored is `quran:hifz-words:v1` (which words were slipped on). The legacy keys `quran:hifz:v2`, `quran:hifz:v1` (read once, to migrate) and `quran:hifz-session:v1` are read and written in the legacy shape, and a **parity test runs the legacy composable itself** (as for Tasbeeh and the audio player) to prove the grading, strength, new-ayah budget and migration are identical.

Offline level **B**: it works offline for any surah whose text is already on the device (opened in the reader, or saved in Downloads); audio only if downloaded. Otherwise a clear message, never a blank page.

## 2. The legacy report

### 2.1 What the legacy does (from the code)

**Data (`quran:hifz:v2`, one record):** `targets[]` (surah, range, `dailyNewTarget`, `dailyTimeGoalMinutes`, status active / paused / completed, `lastPosition` = highest ayah introduced), `ayahStates[]` (one per introduced ayah: `strength`, `interval`, `ease`, `nextReviewAt`, `reviewCount`, `historicalMistakes`, `recentResults` (last 5), `hintsUsed`, `lastHintLevel`), `transitionStates[]` (one per adjacent pair: `strength`, `mistakes`, `recentResults`), `activity[]` (counts per local day). `quran:hifz:v1` (the older plan-only model) is expanded into v2 once, on first load, if v2 is absent. `quran:hifz-session:v1` holds the one session in progress (an item queue, `currentIndex`, status).

**Grading (SM-2-lite):** `again`: interval 1, ease minus 0.2 (floor 1.3), one more historical mistake. `good`: interval times ease. `easy`: interval times ease times 1.3, ease plus 0.1 (cap 2.8). Interval capped at 180 days; dates are local-calendar-day strings.

**Strength:** an ayah is `learning` until reviewed; `weak` when 2 or more of the last 5 results are `again`; `strong` at interval 21 or more; `memorized` at 3 or more. A transition is `weak` after any `again` in its last 5, `strong` after 3 results, else `memorized`.

**New ayahs wait:** the daily new-ayah budget is the target's pace, halved (at least 1) while any ayah or transition is weak, and **0 while 3 or more are weak**. A new ayah is introduced (`lastPosition` moves on) when it is graded, **whatever the grade**.

**Today's queue (`buildDailyItems`):** a warm-up (one strong ayah per target), then weak ayahs and weak transitions, then due or overdue revision (round-robin across targets), then new ayahs within the budget, then a "mixed final test" of up to 4 ayahs already covered today. 45 seconds per item for the time estimate.

**Home (legacy):** a "Today's Hifz" card appears on the legacy Home only when something is due: "N items to practice, about M minutes" (the same queue). **Other entry points:** Practise weak areas, Quick Test (2, 5 or 10 minutes), Free practice (ungraded: "never touches the schedule"), Full range test (every started ayah and every join; sets `lastAssessmentAt`).

**Screens:** a Vuetify dashboard (Today card, weak areas, targets with Strong / Memorized / Learning / Weak counts, a 0 to 100 "Hifz Health" score from coverage 20%, recall 50%, consistency 30%, a 28-day activity heatmap, a 5-step new-target wizard, a blocking delete confirm), and a session page: new ayahs get a practice screen (listen and repeat 1, 3, 5, 10 times) then a test, revisions get a test with modes (full, continue, previous, next, random, transition), a 4-level hint, and Again / Good / Easy with a "listen again and retry" step after Again.

### 2.2 Things I found in the legacy that affect the plan

1. **A "new" ayah graded `again` still counts as introduced** (`gradeCurrent` calls `introduceAyahs` after any grade). I keep this: an ayah you slipped on is started, comes back tomorrow, and is weak after two slips.
2. **The mixed final test grades an ayah a second time on the same day** (the same ayah can be graded as revision and again as final-mixed, compounding the interval twice). The simple mode has no final test, so this goes away; the engine itself is unchanged.
3. **Quick Test can queue the same ayah more than once** (weak, due and random pools are not de-duplicated). Quick Test is not in the agreed prototype (see decision 2).
4. The legacy offline message is "This passage isn't available offline yet. Connect once to load it." I keep the idea with the revamp's wording and a Try again.
5. **Hint levels** are stored per ayah (`hintsUsed`, `lastHintLevel`) and the legacy "why weak" text uses them. The new mode needs a definition of a hint (decision 1).

### 2.3 What exists here already

The Home Hifz tile (reads `quran:hifz:v2` / `v1` to say "Open Hifz" or "Not started"), the nav item `/hifz` (gated by `phase: 14`), `lib/userState.ts` (`hasHifz`), the reader's per-ayah text (`useQuranText().getChapter`, IndexedDB `chapters` in `quran-revamp-db`), per-ayah audio (`usePlayerStore().playAyah`, the reciter setting, saved audio from Downloads), `useUndoToast`, the responsive sheet, the storage wrapper, the `lib/` pure-code-plus-parity-test pattern (Tasbeeh: `scripts/lib/legacy-tasbeeh.mjs`). **Not here:** any Hifz page, the strength and "tricky" colour tokens (`--weak`, the four strength steps; gold exists and is allowed for mastery), the words store.

### 2.4 How the prototype differs from the legacy (intentional)

| Legacy | Prototype / this plan |
| --- | --- |
| Dashboard with stats, health score, heatmap | Home: today's plan (tricky, review, new) and one Start; "My surahs" rows with a strength strip |
| Again / Good / Easy buttons | Tap the words slipped on; the grade follows (decisions below); "This was easy" is optional |
| Test modes and a 4-level hint | Recite from memory with the previous ayah's last words as the prompt; tap a word to reveal it; Reveal all |
| New ayah: practice screen then test | Four stages: Listen (3 times), Read along, Fade, Recite; then Join (2, 3, 2 + 3, 1 + 2 + 3) |
| 5-step target wizard | An "Add a surah" sheet with a pace (Gentle 1 a day, Steady 2, Faster 3) and "about N weeks" |
| Blocking delete confirm | Remove with Undo |
| Word-by-word highlight (prototype timer) | **Whole-ayah highlight while it plays**: the app has per-ayah audio only (your decision) |

## 3. What the engine does with slips (the rules, as decided)

- **0 slips and no hints is `good`; any slip is `again`; `easy` only from an optional "This was easy" button** shown after a clean recitation (no slips, no hints).
- The grade goes through the unchanged legacy grading, so a slip behaves exactly like the legacy "Again" (interval 1, ease minus 0.2, one more mistake; weak after 2 of the last 5).
- Each slipped word is counted in `quran:hifz-words:v1`; a word slipped on **more than once** is a **tricky word** (shown on the surah page and used as the first cue the next time that ayah comes up).
- **Free practice never changes the schedule, and records nothing.**

## 4. Plan

### 4.1 Storage

| Key | Use | Notes |
| --- | --- | --- |
| `quran:hifz:v2` | read and write, **legacy shape, no new fields** | read-modify-write, unknown fields kept; a damaged value reads as empty |
| `quran:hifz:v1` | read once, only to migrate when v2 is absent | never written |
| `quran:hifz-session:v1` | read and write, **legacy shape** | so a session can resume in the legacy app and the other way round. Stage progress inside a new-ayah step is not stored: a resumed step starts again at Listen |
| `quran:hifz-words:v1` | **new, additive** (the legacy app ignores it) | `{ v: 1, ayahs: { "<surah>:<ayah>": { "<wordIndex>": { word, slips, clean, last } } } }`: the word as shown (so the surah page and "tricky words" read without loading text), total slips, clean recitations since the last slip, the last day. Keyed by surah and ayah, not by target, so removing and re-adding a surah keeps what you know about your tricky words |
| `quran-revamp-db` | not touched | `quran-app-db` is never opened (a test scans for it) |

The Settings export already writes every localStorage key, so the new key is exported with no change; Reset does not touch Hifz (as now). Recorded in `docs/LEGACY_INVENTORY.md`'s key list.

### 4.2 Code

- `app/lib/hifz/` (pure, tested): `engine.ts` (grade, strength, new-ayah budget, migration from v1, local-day helpers: the legacy rules, ported); `queue.ts` (today's plan: tricky, review, new; estimate); `words.ts` (split an ayah into words with the reader's text, drop standalone pause marks, built from code points so no Arabic script is in `app/`; slips store; tricky rule); `grading.ts` (slips and hints to a grade); `session.ts` (build and advance a session in the legacy item shape); `store.ts` (read and write the keys).
- Legacy parity: add `useHifz.ts` and `useHifzSession.ts` to `scripts/lib/legacy-files.mjs` (vendored unmodified by `scripts/sync-legacy.mjs`), a loader `scripts/lib/legacy-hifz.mjs` like `legacy-tasbeeh.mjs`, and `tests/hifzParity.test.ts`: thousands of random grade histories, strength, budget, v1 migration and the queue's weak, due and new parts compared between the legacy composable and `lib/hifz`.
- Components (`app/components/hifz/`): `HifzHome`, `HifzPlan`, `HifzSurahRow` + strength strip, `HifzAddSheet`, `HifzSession`, `HifzReview` (the recite screen), `HifzLearn` (the four stages), `HifzJoin`, `HifzDone`, `HifzSurah`, `HifzWord`.
- Routes: `/hifz`, `/hifz/session` (`?mode=check` and `?mode=free`), and a new `/hifz/surah/[n]` (the legacy has no surah page, so no conflict).
- Home: the Hifz tile shows "N to practice" from the same queue (`useHomeState`, as `PROGRESS.md` already says); nav `phase: 14` is switched on; the Library, Search and Settings are untouched.
- Design: strength strip in four steps plus an outlined "needs work" cell (new tokens `--weak` and `--s1` to `--s4` in the light and dark themes; **gold only for "strong", which is Hifz mastery**, allowed by the design rules); ayah words are inline text, never boxed, and scale with the user's Arabic size; every control 44 px on a phone; no streaks, no points, no health score, no heatmap, no "you missed yesterday".

### 4.3 Behaviour (each from the prototype, with the decisions applied)

- **Home:** "Today: about N minutes" with up to three lines (Fix N tricky, Review N, Learn 1 new) and a Start button; "Tricky ayahs come first. New ayahs wait while 3 or more need work." My surahs (name, "N of M ayahs started", the strength strip); Add; Recite to someone; Practise anything, no grading. No surah yet: an empty state with Add a surah. Plan empty: "You're caught up" with Practise and Recite to someone.
- **Review step:** the previous ayah's last words as the prompt ("Start of the surah" for ayah 1), the ayah hidden word by word; tap a word to reveal it, "First word", "Reveal all"; then tap the words slipped on; a verdict line ("Clean. This ayah waits longer before coming back." or "N slips. This ayah comes back tomorrow, starting with that word."); Skip.
- **Learn step (a new ayah):** Listen (3 plays), Read along (**the whole ayah is highlighted while it plays**), Fade (a slider hides more words), Recite (the review screen); then Join where there is an earlier ayah: "n-1", "n", "n-1 + n", "from ayah 1 to n", each "I said it" or "Not yet, repeat".
- **Done for today:** counts, the slipped words (tricky words listed), Back to Hifz.
- **Recite to someone** (`?mode=check`): nothing is hidden, a note to hand over the phone, the listener taps the words slipped on; graded like a review.
- **Surah page:** a row per ayah (Strong, Memorized, Learning, Needs work, Not started; "Slipped on <word> twice"; Practise), Tricky words, Check the whole surah (the legacy full range test: every started ayah, then each join), Pause or Resume, Remove with Undo.
- **Add a surah:** a sheet (a bottom sheet on a phone, a dialog on a computer, since it is a form and not a menu): surah, pace, "At 2 a day, all N ayahs of X are started in about W weeks."
- **Resume:** a session in progress shows "Resume" on Home, as the legacy does; a legacy session with warm-up or mixed-test items resumes as ordinary review items.
- **Offline:** text from the device or a message with Try again; audio only if saved, with the revamp's existing "needs a connection unless downloaded" sentence; the Listen and Read along stages can be skipped when there is no audio.

### 4.4 Tests

Unit: the engine against the legacy (parity), words (split, pause marks, NFC), the slips store (tricky rule, the clean-count reset), grade mapping, queue (order, budget, estimate), session build and advance, the storage shapes (a record written here is read by the legacy composable and gives the same state). Browser (production build, fixed clock, `forbidRealApis`, `mockQuranText`, no real audio): every state above, light and dark, 1280 and 375 px, the legacy data cases (a seeded v2 record, a v1 record migrating, a legacy session resuming), Undo on remove, offline with the real service worker, free practice writes nothing, `quran-app-db` never opened, no console errors. `npm run verify` clean before I stop.

### 4.5 Stages (one stop for you)

1. **Engine and storage** (no UI): `lib/hifz`, the vendored legacy composables, the parity tests. Commit.
2. **Home, Add a surah, Surah page, the tile and nav.** Commit.
3. **Session:** review, learn, join, check, free, done, resume. Commit.
4. Docs (`docs/phases/phase-14-hifz.md`, `docs/pages/hifz.md`, `DECISIONS.md`, `PROGRESS.md`, `CONTENT_TO_VERIFY.md`, `DEVICE_CHECKS.md`, `CLAUDE.md` gotchas), screenshots looked at one by one, a full `npm run verify`. **Stop for your acceptance**, then merge into `chore/standalone-repo` with `--no-ff`, verify the merged head, push.

### 4.6 Not in this phase

Word-by-word highlighting (no word timings exist: whole-ayah highlight, your decision); speech recognition (the app never listens: slips are tapped by you or your listener); Hifz reminders (the legacy Hifz code has none; the shared reminders list is the Calendar's, Phase 15); a sync across devices; Goals and Calendar (Phase 15).

## 5. Risks

1. **Word splitting must be stable.** A word's index depends on the text the app shows. If the text source ever changes, stored indices could point at the wrong word. Each stored word keeps its text, and a mismatch drops that word's count instead of showing the wrong word. I will measure the real text (waqf and other marks, the first ayah of each surah) on all 114 surahs before building the splitter.
2. **Writing a legacy key.** `quran:hifz:v2` is one record that holds everything; a bug could damage a user's progress. Mitigation: read-modify-write that keeps unknown fields, the parity test, a test that the legacy composable reads our output, and "damaged reads as empty without overwriting until the user acts" (as the other modules).
3. **Day changes.** The legacy uses local-calendar-day strings; tests fix the clock. A session that crosses midnight keeps the day it started on.
4. **Audio.** The Listen and Read along stages depend on per-ayah audio; without a connection or a saved file they must still let the user continue.
5. **A different grade for the same performance.** Because the grade now follows slips, the user's intervals will differ from what Again / Good / Easy would have given; the decision rules are written down in section 3 so that this is a known choice, not a surprise.

## 6. Decisions I need from you

I recommend the first option in each.

1. **What counts as a hint, and what grade a hint gets.** Your rule covers 0 slips with no hints (`good`) and any slip (`again`), not "no slips but a hint". **Recommendation:** tapping a hidden word to reveal it counts as a slip on that word (you needed it), so it grades `again`; "First word" is a cue, not a slip: it is recorded as hint level 1 (it feeds the legacy hint fields), still grades `good`, but removes the "This was easy" button. "Reveal all" to check is not a hint. *Alternative:* any hint makes the ayah `again`.
2. **What is dropped from the legacy dashboard.** Recommendation: drop the warm-up item, the mixed final test, Quick Test, the Hifz Health score, the activity heatmap, the daily time goal (kept at 15 in the data for the legacy app) and the five-step wizard. Activity counts are still recorded in the legacy shape (so a rollback sees them) but not shown. *Alternative:* keep Quick Test as a small "Practise for 2, 5 or 10 minutes" under Home.
3. **Add a surah: a whole surah or a range.** Recommendation: the whole surah by default (as the prototype), with "Only part of it" for a start and end ayah (the legacy wizard allowed ranges, and existing targets may be partial). *Alternative:* whole surah only (existing partial targets still display and work).
4. **"Recite to someone" and "Check the whole surah".** Recommendation: the same engine, both graded: Check the whole surah is the legacy full range test (the words hidden, every started ayah then each join); Recite to someone is the same queue with nothing hidden, for a surah you choose. *Alternative:* Recite to someone is ungraded.
5. **Free practice.** Recommendation: any surah and range (not only your targets), words hidden to recite, slips shown, **nothing recorded at all** (not the schedule, not tricky words). *Alternative:* record tricky words but not the schedule.
6. **Tricky words.** Recommendation: a word is tricky once it has been slipped on **twice**, and stops being tricky after **two clean recitations in a row** of that ayah. *Alternative:* never clear.
7. **Time estimate.** Recommendation: a tricky or review ayah is about 45 seconds (the legacy figure), a new ayah about 3 minutes, shown as "About N minutes". It is the app's estimate and says so ("About").

If you answer "as recommended", I build exactly the plan above.
