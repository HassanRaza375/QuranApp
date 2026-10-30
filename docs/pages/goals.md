# Page: Reading goals

- Routes: `/goals` (legacy, kept)
- Phase: 15
- Prototype section: `docs/design/prototype-remaining-pages.html`, `#/goals` (`pgGoals`, `sheetGoal`, the log sheet)
- Offline level: **A.** Everything is read from this device: the saved record, where you stopped reading, the juz table. The "Before Ramadan" date for a new goal comes from the calendar service when it is saved or reachable; without it that chip is not offered and nothing else changes. The page never shows a spinner for ever and never needs the network to work.
- Indexable: no (`robots: noindex, follow`, a personal page).

## Purpose

Plan your reading by a daily amount or a day to finish by, and see where you are in the Qur'an. A day you read less is simply a day. Everything stays on this device.

## Layout

- **Header:** "Reading goals", the main goal's label and, for a finish-by-date goal, "finish by Sun 7 Feb"; **New goal**.
- **No main goal:** "Plan your reading" with **Start a goal** and **Continue reading** (from your saved place, or the first surah). The count read today still shows when there is one.
- **Today:** the ayahs counted today, "of N ayahs" and a thin bar when the goal has an amount today, **Next up** (the ayah after your saved place, a link into the reader), **Continue reading**, **Log reading from a mushaf**, the note "Ayahs count once they have been on screen for about a second and a half.", and the text buttons **Pause this goal** and **Remove this goal**. After a finish-by-date goal's date: "Your date has passed. Choose a new date or keep reading." and **Choose a new date**.
- **Through the Qur'an:** the 30 juz as one line (done filled, the current one filled as far as your place), "2,150 of 6,236 ayahs · 14 juz complete", for a finish-by-date goal "N ayahs a day from here keeps your date.", and after a week "Your last 7 days: N ayahs a day on average."
- **This week:** seven bars from the log, each with its number under it; days that are not one of the goal's reading days are hatched; a dashed line for today's amount.
- **Other goals:** every goal that is not the main one, newest first, with its status (Paused, Complete, Stopped, or "Not your main goal"), **Resume** or **Make main**, and Remove. A complete goal has no Resume.
- **New goal** (a side panel on a computer, a bottom sheet on a phone: it is a form): four kinds (Finish by a date, Ayahs a day, Pages a day, Juz a week), the amount (a stepper) or the day (chips "Before Ramadan", "End of year", "In 30 days", and a date field), a live line "N ayahs a day" with when you would finish, and **Start this goal** with the note that the current goal is paused, not deleted.
- **Log reading from a mushaf** (the same kind of sheet): how many ayahs, **Add to today**.

## The rules (owner decisions of 2026-10-28, `DECISIONS.md`, Phase 15)

- **Amounts** (`lib/goals/model.ts`): everything is turned into ayahs a day when the goal is made, exactly as the legacy does: finish by a date is ceil(ayahs left from your place ÷ days left), pages are ceil(n × 6,236 ÷ 604), juz a week ceil(n × 6,236 ÷ 30 ÷ 7), ayahs a day the number. `tests/goalsParity.test.ts` runs the legacy composable beside this on random inputs.
- **Today's amount for a finish-by-date goal** is worked out each day from the ayahs left and the days left, shown plainly (3,000 ayahs in two days is 1,500, said as it is). **On the date, or after it, there is no amount**: the sentence above. Never "behind", no catch-up, no streak. Other goals keep the amount they were made with. **Home's tile and the Ramadan Khatmah card use the same function** (`todayFor`), so they never disagree.
- **A new goal pauses the main goal, with Undo** ("Goal started. Your previous goal is paused."). **Resume and Make main do the same**, with Undo. Pause and Remove offer Undo too; nothing asks to confirm.
- **Complete** is only for finish-by-date goals (a Ramadan Khatmah is one), set when you open the page with your place at the last ayah. A pace goal never completes.
- **Progress is the saved place minus where the goal began** (the legacy meaning), so a goal made in the old app reads the same. Going back never takes it below zero.
- **Counting:** the reader writes the daily log (an ayah counts after about 1.5 s on screen, Phase 4A); "Log reading from a mushaf" adds `manual:<time>:<n>` entries the legacy app also reads, and Undo takes exactly those back.
- **Stored targets are never rewritten.** A goal made in the old app keeps its amount. The legacy `custom` kind is shown and kept (as "Custom").
- **The Ramadan page** has "Plan a Ramadan Khatmah": a finish-by-date goal labelled "Ramadan Khatmah" ending on the last day of Ramadan as that page shows it (the Hijri adjustment applied), the same goal the legacy app made.

## Components

| Component | Source | Notes |
| --- | --- | --- |
| `GoalsPage` | custom | the screen; `app/pages/goals.vue` only mounts it |
| `GoalsJuzLine`, `GoalsWeekBars` | custom | the 30-juz line (an image with a sentence for its label) and the seven bars (each a list item with its own label) |
| `GoalsNewGoalSheet`, `GoalsLogSheet` | shadcn-vue `Sheet` | native radio inputs for the kind; steppers are 44px on a phone |
| `useGoalsStore` (`stores/goals.ts`) | custom | the record, your place, and the changes; each change reads the stored record fresh and hands back an `undo` |
| `lib/goals/model.ts`, `lib/goals/store.ts` | custom, pure | the rules and the record |

## Data

| Data | Service / composable | Storage key |
| --- | --- | --- |
| Goals, the main goal, the daily log | `lib/goals/store.ts` (legacy shape, unknown fields kept, a damaged value reads as empty and is not written over until you act; the reader appends to the same key) | `quran:reading-goals:v1` |
| Where you stopped reading | `lib/readingProgress.ts` | `quran:reading-progress:v1` (read only) |
| Ramadan's start, for "Before Ramadan" | `getHijriMonth` (saved first) | `quran-revamp-db` store `hijri-months` |

## States

- Loading: two skeletons.
- Empty / first run: "Plan your reading".
- Error: a damaged record shows the empty start and is left alone until you act.
- Offline: as the level above.
- Dark mode: designed (the accent is the dark accent; the hatch and the bars use the sunken and accent tokens).

## Accessibility

- The 30-juz line is an image labelled "14 of 30 juz complete, juz 15 in progress"; the bars are a list, each item labelled "Thursday (today): 9 ayahs"; colour is never the only signal (numbers are printed).
- The kind of goal is a real radio group (arrow keys); the sheets trap focus and close with Escape; every control is at least 44px on a phone (a browser test measures them).

## Known differences from the prototype

- "At your pace, you'll finish around 12 Mar 2027" is gone: it divided by an assumed 21 days. In its place: "N ayahs a day from here keeps your date." and, after a week of log, your own average.
- "About N minutes" in the New goal preview is gone (an invented reading speed).
- "Pause this goal" and "Remove this goal" are text buttons under Today (the prototype had no way to pause the main goal; the legacy had a menu).
- Other goals are newest first and include goals the old app left "active" (shown as "Not your main goal" with **Make main**).
- "Before Ramadan" is offered only when the calendar service answers or has answered; "End of year" and "In 30 days" are computed from today.
- The dashed line for today's amount is drawn; the prototype only mentioned it.

## Tests

`tests/goals.test.ts` (23), `tests/goalsParity.test.ts` (7: the legacy `useReadingGoals` and `useReminders` against `lib/goals`, in memory), `tests/homeState.test.ts` (the tile), and `e2e/goals.spec.ts` (20: first run and every kind's preview, the Ramadan chip, the local-evening date limit, pause and Undo, today's amount, a passed date, Home agreeing, the manual log, the juz line and the week, Pause/Resume/Remove with Undo, legacy data, completion, a damaged record, 1280 and 375 px light and dark, the keyboard, no connection), plus the Khatmah test in `e2e/ramadan.spec.ts`.

## Open questions

See `docs/phases/phase-15-goals-calendar.md`.
