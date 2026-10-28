# Page: Hifz

- Routes: `/hifz` (legacy, kept), `/hifz/session` (legacy, kept; `?mode=check`, `?mode=full&target=<id>`, `?mode=free&surah=&from=&to=`, `?resume=1`), `/hifz/surah/[n]` (new: the legacy has no such page)
- Phase: 14
- Prototype section: `docs/design/prototype-hifz.html` (`#/`, `#/session`, `#/surah/<n>`, the Add sheet)
- Offline level: **B.** The app, the plan, the progress and every grade work with no connection. A step needs the surah's text: it comes from the reader's store on the device (a surah opened in the reader, saved in Downloads, or read in an earlier session). A surah whose text is not on the device shows a plain message with Try again and Skip. Audio (Listen, Read along) needs a connection unless the surah's audio is downloaded; the step says so and can be skipped.
- Indexable: no (`robots: noindex`, as the legacy pages).

## Purpose

Learn a surah a little at a time and keep it. One plan a day with one Start button; each step is one simple screen. A step is graded from the words you slipped on, not from buttons. Everything stays on this device.

## Layout

- **Home (`/hifz`)**: the plan card (Today, "About N minutes", up to three lines: **Fix N tricky ayahs**, **Review N ayahs**, **Learn N new ayahs**, a Start button, "Tricky ayahs come first. New ayahs wait while 3 or more need work."); **My surahs** (a row per surah: name, "N of M ayahs started", a strength strip, a link to its page) with Add; one key for the strip; **Recite to someone** and **Practise anything, no grading**. With no surah: an empty state with Add a surah and Practise anything. With nothing due: "You're caught up". With a session in progress: "In progress, N of M done, Resume, Start over" instead of the plan.
- **Session (`/hifz/session`)**: a leave button, the title ("3 of 8", "Recite to someone", "Check the whole surah", "Free practice"), Skip, a progress bar, a tag (Tricky, Review, New, Join) with the place ("Al-Mulk 67:3"), then one step: the **recite** screen, **learn** (four stages, then joins) or a **join** screen. When the queue ends: **Done**.
- **Surah page (`/hifz/surah/[n]`)**: back, the name, "N of M ayahs started" (and the range when it is part of a surah, and "Paused"), the strength strip and its key, **Check the whole surah** and **Recite to someone**, a row per ayah (state, "Slipped on <word> on 2 days", "The join from ayah n needs work", Practise), **Tricky words**, **New ayahs a day** (Gentle 1, Steady 2, Faster 3, or "N a day (set earlier)" for a pace set in the legacy app), Pause or Resume, Remove from My surahs.
- **Add a surah** (a bottom sheet on a phone, a side panel on a computer: it is a form): the surah, "Choose ayahs" (From and To), the pace, "At 2 a day, all 30 ayahs of Al-Mulk are started in about 2 weeks. You can change this any time.", Add. A surah already in My surahs cannot be added again.
- **Practise anything** (the same kind of sheet): any surah and range, "Start practising".

## The rules (owner decisions of 2026-10-28, on top of the Hifz answers in `DECISIONS.md`)

- **Slips to a grade** (`lib/hifz/grading.ts`): no slips and no hints is `good`; any slip is `again`; `easy` only from the optional "This was easy" button, shown after a clean recitation only. **Revealing a hidden word is a slip on that word** (you needed it). **"First word" is a cue, not a slip:** it grades `good`, is stored as hint level 1 (the legacy hint fields) and takes the "This was easy" button away. "Reveal all" is for checking and is not a slip. The grade goes through the legacy engine unchanged.
- **Tricky words** (`lib/hifz/slips.ts`, `quran:hifz-words:v1`): a word slipped on **on 2 different days** is tricky; it stops being tricky after **3 different days** on which its ayah was recited without a slip on that word. A slip starts the clean count again. A tricky word is shown before you recite its ayah ("You slipped on these before"), and listed on the surah page.
- **Free practice records nothing at all:** not the schedule, not tricky words, not the stored session, not the timing. It is kept in memory only. "Practise" on a row of the surah page is free practice of that ayah.
- **Recite to someone** (`?mode=check`): today's queue without new ayahs, nothing hidden, a note to hand over the phone, the listener taps the words slipped on; graded like a review. On a surah's page it is limited to that surah.
- **Check the whole surah** (`?mode=full`): the legacy full range test: every started ayah in order, then each join. **Both are graded**: ayahs by their slips, a join by "I said it" (`good`) or "Not yet" (`again`; the join is weak after one miss, as in the legacy). A finished check records the legacy `lastAssessmentAt` and the assessment count.
- **A new ayah** (Learn): Listen (3 plays to the end; "Skip ahead" until then), Read along (**the whole ayah is lit while it plays**: the app has one recording per ayah, so there are no word timings), Fade (a slider hides more words), Recite; then, where there is an ayah before it in the plan, joins (n-1, n, n-1 + n, and from the first ayah to n). The joins are practice. The ayah is graded when the whole step ends, and counts as introduced **whatever the grade** (the legacy behaviour, kept for parity). A resumed step starts again at Listen.
- **Time estimate** (`lib/hifz/timing.ts`): about 1.5 s a word plus about 10 s an item, a new ayah four times that; after 10 finished daily sessions, **your own median time per item**, kept in `quran:hifz-timing:v1`. Shown as "About N minutes". The word count of an ayah is estimated from its bundled length (about 9.2 characters a word).
- **Dropped from the legacy UI** (the stored data is untouched and still read and written in the legacy shape, so a rollback keeps working): the warm-up item, the mixed final test, Quick Test, the Hifz Health score, the activity heatmap, the daily time goal (new surahs keep 15 in the data), the five-step wizard, and the blocking delete confirm. A legacy session that still holds warm-up or final-mixed items resumes with them as ordinary reviews.
- **No streaks, badges, points, scores or "you missed" anywhere** (a browser test checks the visible text).

## Components

| Component | Source | Notes |
| --- | --- | --- |
| `HifzHome`, `HifzSurah`, `HifzSession` | custom | the three screens; `app/pages/hifz/index.vue`, `session.vue`, `surah/[n].vue` only mount them |
| `HifzReview` | custom | the recite screen: prompt, hidden words, First word, Reveal all, Done, the verdict, This was easy, Continue |
| `HifzLearn`, `HifzJoin`, `HifzDone` | custom | the four stages and the joins; a graded join; the end screen |
| `HifzWords` | custom | an ayah as words: inline Arabic, never boxed, never letter-spaced or cut off, scaled by the Arabic size setting; every word a button of at least 44px when interactive |
| `HifzStrip`, `HifzKey` | custom | one cell per ayah (not started, learning, memorized, **strong = gold**, outlined needs work, a mark for a weak join); read out as a sentence; the key names every colour |
| `HifzAddSheet`, `HifzPracticeSheet` | shadcn-vue `Sheet` | bottom on a phone, right on a computer |
| `useHifzStore` (`stores/hifz.ts`), `useAyahPlays` | custom | the plan, the surahs and the running session; one ayah's plays |

## Data

| Data | Service / composable | Storage key |
| --- | --- | --- |
| Targets, ayah states, join states, activity | `lib/hifz/store.ts` (the legacy shape, unknown fields kept, a damaged value reads as empty and is not written over until you act) | `quran:hifz:v2` (reads `quran:hifz:v1` once to migrate; never writes it) |
| The session in progress | the same | `quran:hifz-session:v1` (legacy shape; one extra optional field, `mode: "check"`, which the legacy app ignores) |
| Slipped words | `lib/hifz/slips.ts` | `quran:hifz-words:v1` (new, additive) |
| Your time per item | `lib/hifz/timing.ts` | `quran:hifz-timing:v1` (new, additive) |
| An ayah's text | the reader's `useQuranText().getChapter` (cache first, then the network) | `quran-revamp-db` store `chapters` |
| An ayah's audio | the shared player, the Settings reciter, saved audio from Downloads | none |

The engine (`lib/hifz/engine.ts`) is the legacy `useHifz.ts` ported to pure functions; `tests/hifzParity.test.ts` runs the legacy composable itself (vendored unmodified) beside it on random histories.

## States

- Loading: skeletons on Home; "Loading the text…" in a step.
- Empty / first run: "Pick a surah and a pace" with Add a surah; a surah page for something not in My surahs says so.
- Error: a damaged stored record shows as empty with a note and is left alone until you act; a surah whose text cannot be loaded shows a message with Try again and Skip.
- Offline: see the level above.
- Dark mode: fully designed (the strength steps have their own dark values).

## Accessibility

- Every word is a button (`aria-pressed` for a slip). A hidden word keeps its width but is not read out: its name is "Word 3, hidden. Reveal it (counts as a slip)".
- The strength strip is an image with the sentence "4 of 4 ayahs started: 3 learning, 1 needs work" and the key names every colour: colour is never the only signal.
- Touch targets are at least 44px on a phone (checked in a browser test for Home, the buttons and every word). The whole session works from the keyboard (Start, Space on a word, Reveal all).
- Progress is a `progressbar`; the stages are a labelled list with `aria-current="step"`; a verdict is a polite status.

## Known differences from the prototype

- Progress is one bar, not one segment per step (a whole-surah check can have 500+ steps).
- The Done tick is the accent colour, not gold: gold is reserved for verse-end markers and Hifz mastery (the "strong" step), which a finished day is not.
- The prototype's verdict says "starting with that word"; the real one says "comes back tomorrow" (what the engine does), and a tricky word is shown before the ayah comes up.
- "First word" reveals the first word of the ayah (the prototype revealed the next hidden one).
- The sample times and counts in the prototype are samples; the plan is the legacy queue.

## Tests

`tests/hifzParity.test.ts` (12: the legacy composable against `lib/hifz`), `tests/hifz.test.ts` (39: words, slips, grading, timing, the plan, sessions, storage, the strip), `tests/tokens.test.ts` (the new colours), and `e2e/hifz.spec.ts` (32, on the production build with synthetic Arabic-letter text, a recorded audio element and a fixed clock: first run, add, range, the plan, the whole day, the stages and audio, free practice writes nothing, Recite to someone, the whole-surah check, the surah page, Undo on Remove, legacy data, 1280 and 375 px in light and dark, the keyboard, the Arabic size setting, offline with the real service worker).

## Open questions

See `docs/phases/phase-14-hifz.md`.
