# Phase 7B: Story reader, Stories directory, story progress

- Branch: `revamp-design-logic`
- Date: 2026-10-20
- Status: Done, awaiting review
- Plan and decisions: `phase-07b-story-plan.md`

## Approved decisions (as built)

1. A lean `/stories` directory (list, search, status chip, chapter count, your progress, Saved).
2. Chapter text from the cached surah through the reader's loader (one request per surah), not per ayah.
3. An Order line only where the data supports it (single-surah stories whose chapters ascend); otherwise none.
4. The "Arranged for study" sentence: "This story is assembled from passages in several surahs, in an order chosen for reading." (flagged in CONTENT_TO_VERIFY.md).
5. Episode summaries (and flat-chapter descriptions) are labelled "Summary (written for this app)".
6. Home's second row and the Library's Story slot show whichever is newer, `quran:story-progress:v1` or `quran:persons-study:v1` (tie: the story; tested, and each absent).
7. A chapter is read when its end is reached (after the text is on screen) or Next is pressed, never by time.
8. Long chapters show the first 8 ayahs, then a "Show all N ayahs" button that expands in place and keeps focus.
Holds: Compare tellings lists only references, ayah counts and the data's descriptions ("No description recorded yet." otherwise); the Phase 6 doc's "reserved" wording is corrected (the legacy app already writes `story:<id>`); place, people-group and event chips stay inert or link-less and labelled, with a no-dead-links test; the Listen button is a visible real `button` with `aria-disabled` and "Coming with the player".

## What was built

- **Pages:** `/stories` and `/stories/[id]` (`?chapter=n` or `end`).
- **Components** `app/components/stories/`: `StoriesDirectory`, `StoryRow`, `StoryReader`, `ChapterText`, `CompareSheet`, `EntitySheet`.
- **Logic:** `app/lib/stories.ts` (chapters from the data, labels, derived Order, arranged rule, tellings, entities, directory filters, URL helpers, long-chapter slicing) and `app/lib/storyProgress.ts` (the new key, resume, clear and restore, `latestProgress`, `newerOf`).
- **Home and Library:** `useHomeState` builds row 2 from whichever is newer; the Library's Story slot reads the same row (one line, `study.line`) and has a **Clear the story progress** button with Undo (a person's study is not cleared there). `OPENS_TODAY.story` is true (the not-rebuilt notice no longer names Stories); `STORIES_READY.reader` is true (the person page's Story tab shows each story's progress and links to where you left off, and the 7A "not rebuilt" notice no longer shows).
- **New key:** `quran:story-progress:v1` (additive; the legacy app ignores it). No other new keys. Settings Export and Clear all already cover it; Reset settings leaves it (tested).

## What Home and the Library changed

- Home row 2: unchanged text for a person study ("You were reading: <section>", the person's name). For story progress: "You were reading: <story title>" with "Chapter 3 of 4" (or "Finished") and a Continue link to that chapter; the icon is the scroll for a story.
- Library Story slot: "<story title>: Chapter 3 of 4" (or the person line as before), with a clear button for a story only.
- `quran:persons-study:v1` is read and written exactly as before.

## Findings

- Of the 8 stories not fully told, all list passages in more than one surah (including supporting ones), so the notice's "several surahs" is true of each; a test checks it. `nuhflood` is "fully told" yet its chapters jump between surahs 71 and 11: it gets no notice and no Order line (the data's status is the rule).
- Every id a story names (people, peoples, places) resolves in the data (a test checks it; the page shows only what resolves).
- None of the 51 episode and supporting passages has a description, so Compare tellings shows "No description recorded yet." for all 13 supporting passages.
- Playwright treats `aria-disabled` buttons as not enabled; the Listen test forces the click to prove it does nothing.
- The reader's text depends on a surah being cached: a chapter in a surah not opened before shows the offline message when offline (tested), the rest of the page works.

## Verification

- `npm run verify` on Node 22: build, lint, unit tests (**451 pass**), dev smoke and **302 browser tests pass** (25 in `e2e/stories.spec.ts`). Two earlier runs failed on lint errors in the screenshot scripts I added (an unused variable); both fixed.
- `tests/stories.test.ts` (22 tests): the 21 stories and their 49 chapters (every range inside the real ayah counts), Order, the arranged rule, tellings, the chapter in the URL, long chapters, entities, the directory, the progress key (read, clear, restore, damaged values, legacy keys untouched), and Home's newer-of rule (newer, tie, each absent).
- The source scan still proves no hard-coded Arabic in `app/` (the chapter text is the synthetic mock in tests).

## What is left for you

- Review the "Arranged for study" sentence and the "Summary (written for this app)" label (CONTENT_TO_VERIFY.md).
- Real-device checks (the reader on a phone, a long chapter, offline), and the earlier open items.
- The 7A items still waiting: the status chips and the three relationship entries (decision recorded: leave until cutover).
- Phase 4B (the player) and the phone audio test; Phase 12 for place, people-group and event pages and Referenced By.
