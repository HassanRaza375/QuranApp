# Phase 15: Reading goals, Calendar and the small pages: legacy report and plan

- Branch: `phase-15-goals-calendar` (from the merged `chore/standalone-repo`)
- Date: 2026-10-28
- Status: **Plan. Nothing built. Waiting for your approval.**
- Read for this: the legacy `goals/index.vue`, `useReadingGoals.ts`, `calender.vue`, `useReminders.ts`, `islamicEvents.js`, `about.vue`, `sitemap.vue`, `surah-vedios.vue`, `juz/[id].vue` (legacy commit 7120b6c), the prototype's `pgGoals`, `sheetGoal`, `pgCal`, `sheetRem`, `DECISIONS.md`, `CONTENT_TO_VERIFY.md` (Goals and Calendar), and what this repo already has for Hijri dates, events, reminders and the reading log.

## 1. Summary

- **Goals** and **Calendar** are mostly composition: the daily reading log (`lib/goalLog.ts`), the goals tile on Home (`lib/goalToday.ts`), the reminders list (`lib/reminders.ts`), the Hijri month data (`lib/hijriMonths.ts`, `gregorianMonths.ts`), the in-app Hijri adjustment (`hijriAdjust.ts`) and the 29 events (`lib/islamicEvents.ts`) all exist from Phases 1, 4, 5 and 8. New code is the goals rules and screen, the Hijri month grid and its screen, and the reminders sheet.
- **`/juz/[id]`** is not built (it shows "not rebuilt yet"). It becomes a redirect to the reader at the juz's first ayah, from the table the Juz tab already uses. Offline level A.
- **About, Sitemap, Surah videos** have no prototype. I will build them from the existing components and tokens and **stop at a screenshot checkpoint for those three** before the docs and the full verify (as you asked).
- **Poets** stays deferred. One thing to know, not to act on now: the cutover checklist says every legacy route must exist, so `/poets` needs a decision in Phase 16.
- **Removed from the legacy on purpose** (design rules): the streak card and its fire icon, the "Behind pace, today's target includes catch-up" message, and the blocking "Delete this goal?" dialog (Undo instead).
- I found **five things in the legacy** that change the build; they are in 2.2.

## 2. The legacy report

### 2.1 What the legacy does (from the code)

**Reading goals (`/goals`, `useReadingGoals.ts`)**
- One key, `quran:reading-goals:v1` = `{ goals[], activeGoalId, dailyLog }`. A goal: `id, type, label, startDate (local day), targetDate (finish-by-date only), dailyAyahTarget, startAbsoluteAyah, preferredDays (0 = Sunday), status (active | paused | completed | abandoned), createdAt`. `dailyLog` is `{ "YYYY-MM-DD": ["surah:ayah" | "manual:<time>:<i>"] }`. The reader (Phase 4A) already appends to `dailyLog` and keeps the rest untouched.
- Five types in the wizard: finish by date, ayahs a day, pages a day, juz a week, custom. Everything is turned into **ayahs a day at creation**: finish-by-date = ceil(ayahs left from where you are ÷ days left); pages = ceil(n × 6,236 ÷ 604); juz a week = ceil(n × 6,236 ÷ 30 ÷ 7); ayahs and custom = the number.
- **Progress is the reader's saved position** (`quran:reading-progress:v1`) minus the position when the goal began, not the log. "Read so far" is that difference; the circle is that over what was left at the start.
- "Today" is the number of entries in today's log. The page adds a **catch-up amount** when behind (`adjustedDailyTarget`) and says "Behind pace". A projected finish date comes from the average since the start.
- A **streak** (days in a row with any entry) is computed and shown with a fire icon.
- "Log reading manually" adds N `manual:` entries to today. Delete asks to confirm in a dialog ("This can't be undone"). Pause is in a menu on the active goal; Resume is on paused goals in "Other goals".
- Creating a goal makes it the main one; the previous goal keeps `status: "active"` and just stops being the main one.
- Reading goals are written only from this page and the reader; the Ramadan page creates "Ramadan Khatmah" as a plain finish-by-date goal.

**Calendar (`/calender`, `calender.vue`, `useReminders.ts`)**
- A **Gregorian month** grid, each cell with the Hijri day, from AlAdhan `/v1/calendar` for the saved location, fiqh method and month. It waits (a 100 ms timer, forever) until a location exists; with none it never loads. Results are cached in `localStorage` under `calendar_v2_<lat>_<lon>_<fiqh>_<month>_<year>` (never expires, one key per month).
- Events come from `islamicEvents.js` by Hijri month and day, filtered by the fiqh setting; Ramadan days are tinted. A selected day shows "Suhoor ends" (Fajr) and "Iftar" (Maghrib) for **every** day, then "Add reminder for this day".
- The Hijri date adjustment setting is **not applied** in the legacy calendar.
- Reminders: `quran:reminders:v1` = `[{ id, title, date, note, recurringYearly, done, createdAt }]`. Add dialog (title, date, note), a checkbox for done, an overdue list, delete with no confirm and no undo. **`recurringYearly` is never set by the UI and never read by the lists.**

**Small pages**
- `/surah-vedios`: 18 lines, "Surah Videos, Coming Soon...", `noindex`. No data exists.
- `/sitemap`: five sections of links with counts typed into the page (59 people, 14 peoples, 16 places and so on), icons from the old icon set.
- `/about`: a long card: what the app is, nine knowledge modules with typed counts, a four-level source scheme (Qur'an-explicit, Qur'anic context, Traditional, Disputed), the data sources (names two services), prayer times, qibla, local-first privacy, limitations, "Built with Nuxt 4, Vuetify".
- `/juz/[id]`: a full-juz reader (all of a juz's text on one page, from `alquran.cloud`), not a redirect. The decision to redirect instead is already recorded (`DECISIONS.md`).
- `/poets`, `/poets/[slug]`: behind the Literary modules setting. Deferred.

### 2.2 Things I found in the legacy that affect the plan

1. **The streak and the catch-up message are against the design rules** (no streaks, no guilt). They are dropped; the stored data is untouched.
2. **The legacy wizard's date limit is UTC.** `new Date().toISOString().slice(0, 10)` is the earliest date offered; in UTC+5 after 19:00 local it is a day behind. The file's own header comment warns about this exact bug. The build uses local day keys (`lib/dates.ts`).
3. **`recurringYearly` is dead in the legacy.** The prototype has a "Repeat every year" switch, so it needs a real meaning (decision 5).
4. **No goal is ever marked `completed`** by the legacy; reaching 100% just shows 100%. The prototype shows "Completed · Mar 2026" in Other goals, so something has to set it (decision 3).
5. **The calendar never loads without a saved place** and needs the prayer-times service for something that does not need a place at all (Hijri dates). The Hijri month service used by Ramadan has no location in it.

### 2.3 What exists here already

| Need | Already built |
| --- | --- |
| Today's reading log, written by the reader | `lib/goalLog.ts` (`recordAyahsRead`, 1.5 s rule) |
| Home goal tile | `lib/goalToday.ts`, `UtilStrip.vue` |
| Where you stopped reading | `lib/readingProgress.ts`, `quran:reading-progress:v1` |
| Totals (6,236 ayahs, 604 pages, 30 juz), juz starts | `lib/quranCounts.ts`, `lib/quranMeta.ts` (`juzOfAyah`, start of each juz), `lib/readerLinks.ts` (`juzHref`) |
| Hijri month with each day's Gregorian date | `lib/hijriMonths.ts` (service `hToGCalendar`, cached in `quran-revamp-db`, used by Ramadan) |
| Gregorian month with each day's Hijri date | `lib/gregorianMonths.ts` (used by Events) |
| The Settings Hijri adjustment, shown dates only | `lib/hijriAdjust.ts`, `displayedDate` |
| The 29 events, per-tradition filter, placing on days | `lib/islamicEvents.ts` (`legacyEvents`, `placeEvents`) |
| Reminders list in the legacy shape (add, remove, restore, done) | `lib/reminders.ts`, used by the Events page |
| Ramadan Khatmah card (read-only) | `components/ramadan/KhatmahCard.vue` ("No goal can be created here yet") |
| Sheet / popover primitives, Undo toast, segmented control | shadcn-vue `Sheet`, `useUndoToast`, `SettingsSegmentedControl` |
| Nav rows for Reading goals and About | `lib/nav.ts` (`phase: 15`); **no row for Calendar** |

### 2.4 How the prototype differs from the legacy (intentional)

- **Goals:** a "Today" block with a large count, the next ayah to read and "Continue reading"; "Log reading from a mushaf"; **Through the Qur'an**, the 30 juz drawn as one line with the current one part-filled; **This week** as seven bars; **Other goals** (completed, paused); a **New goal** sheet with four types (no "custom") and a live preview ("N ayahs a day"). The catch-up text becomes "Days you read less are simply days; the daily amount adjusts to keep your date." A new goal **pauses** the current one.
- **Calendar:** a **Hijri month** grid (not Gregorian), a Hijri / Gregorian toggle for which number is large, a side panel for the selected day (events and reminders, Add reminder), "Coming up", month arrows and Today. No Suhoor or Iftar times.
- Both use sheets (bottom on a phone, side on a computer), no cards around scripture (there is none here), borders not shadows.

## 3. Plan

### 3.1 Storage and data

| Data | Key / source | Notes |
| --- | --- | --- |
| Goals, active goal, daily log | `quran:reading-goals:v1`, **legacy shape, read and written**, unknown fields kept, every change reads the stored record fresh (the reader writes the same key) | A goal gets every legacy field. `custom` goals already stored are shown and kept (as "ayahs a day"); new goals offer the four prototype types. `completed` status is the only new value used (decision 3) |
| Where you stopped reading | `quran:reading-progress:v1`, **read only** | |
| Reminders | `quran:reminders:v1`, legacy shape | `recurringYearly` gets a meaning (decision 5) |
| Hijri months / events | `quran-revamp-db` (existing store), `lib/hijriMonths.ts`, `lib/islamicEvents.ts` | No schema change planned; if one turns out to be needed it is a version bump of `quran-revamp-db` only, never `quran-app-db` |
| Calendar "Hijri first or Gregorian first" | one small additive key, `quran:calendar-prefs:v1` | The legacy app ignores it. Or not persisted at all (decision 7) |

Never written: `calendar_v2_*` and `prayer_*` (the legacy day-keyed caches), `quran:cal-rem-proto` (prototype only).

### 3.2 Code

- `lib/goals/` (pure, tested): the amounts (the same arithmetic as the legacy, see the parity test below), today's amount, progress against the saved position, the Through-the-Qur'an line (juz done, current juz part-filled), week bars from `dailyLog`, create / pause / resume / complete / remove / restore on the stored record, manual log with Undo. One function gives "today's amount", used by both the Goals page and the Home tile so they never disagree (decision 1).
- `lib/calendar/` (pure, tested): the Hijri month grid from a `HijriMonthRecord` (leading blanks from the weekday of day 1, events and reminders on each day, the adjustment applied for display only), "Coming up" over the next months, yearly reminders on a day.
- Screens: `pages/goals.vue` + `components/goals/*`; `pages/calender.vue` + `components/calendar/*`; `pages/juz/[id].vue`; `pages/about.vue`, `pages/sitemap.vue`, `pages/surah-vedios.vue`.
- `lib/nav.ts`: a **Calendar** row in Worship (`/calender`); the Ramadan page links to it; the Khatmah card gets the missing action, "Plan a Ramadan Khatmah" (creates the same goal the legacy created: label "Ramadan Khatmah", finish by date, target = the last day of Ramadan from the Hijri service with the adjustment).
- **Parity test** (as for Hifz and Tasbeeh): the vendored `useReadingGoals.ts` and `useReminders.ts` run in memory beside the pure functions on random inputs; `scripts/sync-legacy.mjs` brings the two composables in; the one dynamic import in the legacy counts file is stubbed by the loader. If that proves impractical for goals I will say so and compare against recorded legacy outputs instead.

### 3.3 Behaviour

**Goals**
- Page: Reading goals; **Today** (count of ayahs counted today, "of N ayahs", a thin bar, **Next up** = the ayah after your saved position, **Continue reading**, **Log reading from a mushaf**); **Through the Qur'an** (the 30-juz line, "N of 6,236 ayahs · M juz complete", a pace sentence only when it can be computed from the real log, else none); **This week** (seven bars from the log; days off the preferred days are shown lighter; "Days you read less are simply days."); **Other goals**; **New goal**.
- New goal sheet: four types, a stepper or a date (with "Before Ramadan" from the Hijri service, "End of year", "In 30 days" chips), a live preview of **ayahs a day** and the finish date; the preview has **no "about N minutes"** (the prototype's was invented; see `CONTENT_TO_VERIFY.md`). "Start this goal" pauses the current goal and says so.
- Pause, Resume, Remove from the goal's menu; **Remove offers Undo**, no confirm. Manual log: ayahs read, adds to today, **Undo**.
- Empty (first run): "Plan your reading" with the New goal sheet; Continue reading still works from your saved place.
- No streak, no "behind", no points, no guilt wording anywhere; a browser test scans the visible text.

**Calendar**
- Hijri month grid with the Gregorian date in each cell (or the other way round with the toggle), today marked, an accent dot for an Islamic event, a ring for a reminder; arrows and Today; the month's Arabic name (from the service, never typed) and its Gregorian range; the calendar's own basis ("Hijri Calendar of Saudi Arabia (HJCoSA)") and "Adjusted by +1 day" as Ramadan and Prayer already show them.
- Side panel for the selected day: the Hijri date, the Gregorian date, events (tradition tag from the fiqh setting, wording only from the data), reminders (remove with Undo), **Add reminder** (sheet: title, date, repeat every year). "Coming up": the next five events and reminders.
- Offline (level B): a month seen before comes from the device; a month never loaded says so ("Needs a connection once"), Try again, never a blank page.

**Small pages**
- **`/juz/[id]`**: `1` to `30` replaces the URL with the reader at the juz's first ayah; anything else goes to `/juz` (the Juz tab). No network.
- **About**: a calm text page from the existing type scale, written from facts: what the app is, where the text, translations, tafsir, audio, prayer times, Hijri dates and place search come from (the real hosts), what stays on the device and what is sent (matches Settings, Data & privacy; linked, not duplicated), the source labels the knowledge pages actually show, a limitations paragraph in our words, a link to Sitemap. Prerendered (it is one of the three public pages); no stored-data reading at render.
- **Sitemap**: grouped links built from `lib/nav.ts` (the one list of destinations) plus the pages not in the nav (Juz, Search, Calendar), counts only from the real data, none typed.
- **Surah videos**: an honest page: "Surah videos aren't available yet", what to use today (Surah listing, the audio of each surah, Downloads), no invented content.

### 3.4 Tests

- Unit: goal amounts (all types, edge days, local-day boundaries), today's amount against Home's tile, progress and the juz line, week bars, status changes and Undo, unknown fields kept, a `custom` goal shown; parity with the vendored legacy composables; calendar grid for 29 and 30 day months and each weekday start, events per tradition, yearly reminders, the adjustment; the juz table (all 30 and the invalid ids); sitemap links against the real routes.
- Browser (production build, fixed clock, mocked services): goals first run, each type with its preview, pause and resume, Undo on Remove, manual log with Undo, legacy data with a streak and a catch-up amount present (neither shown), the Home tile and the page agree, the reader's log updates the page; calendar month and Today, toggle, an event on its day for each fiqh, reminder add / remove with Undo / yearly, adjustment, offline cached and uncached; `/juz/7` lands in the reader at its first ayah, `/juz/31` on `/juz`; About prerendered text present with JS off; every Sitemap link opens a built page; 1280 and 375 px, light and dark; the keyboard; no console errors.

### 3.5 Stages (one stop for you)

1. `/juz/[id]`, `lib/goals`, `lib/calendar`, sync of the two legacy composables, unit and parity tests.
2. Goals page, the Khatmah action, the Home tile on the shared function.
3. Calendar page and the Worship nav row.
4. About, Sitemap, Surah videos. **Stop: screenshots of the three (light and dark, 1280 and 375 px) for your look.** The docs and the full verify wait until you accept those.
5. Docs (phase doc, page docs, `PROGRESS.md`, `CONTENT_TO_VERIFY.md`, `LEGACY_INVENTORY.md`, `DEVICE_CHECKS.md`), screenshots against the prototype, full `npm run verify`, stop for acceptance.

### 3.6 Not in this phase

Poets and `/poets/[slug]`; notifications for reminders (a reminder is a list item, "no alert is sent", as in Phase 8); a Gregorian-month calendar view; Suhoor and Iftar times on the calendar (the Ramadan page has the timetable); a streak, points or any "behind" message; reading-speed estimates; changing the reader's 1.5 s rule; a sitemap.xml and the SEO pass (Phase 16).

## 4. Risks

- **Progress from a saved position.** The legacy measures a goal by how far the saved place moved. Jumping ahead (or opening a late surah) fills the circle; going back never lowers a goal below zero. I keep that meaning so existing goals do not change, and say it on the page ("counts from where you started").
- **The two reading counts differ.** The legacy logged only the one ayah at the reading line each time scrolling paused for 400 ms (so fast scrolling skipped ayahs); ours logs every ayah that stays on screen for 1.5 s, which gives higher numbers (recorded in Phase 4A: do not merge counts at cutover). Existing goals keep their stored targets; I do not rewrite them (decision 4).
- **Two writers on one key.** The reader appends to `dailyLog` while the goals page edits `goals`. Every write reads the stored record fresh and keeps unknown fields (the pattern from Hifz); a test runs both.
- **Month navigation fetches.** Each new Hijri month is one request to the Hijri service. Months are cached; I will measure requests per page and not prefetch more than the neighbouring month.
- **Adjustment at a month edge.** With +1 or −1 the visible month's first and last cells move. `displayedDate` is applied per cell, never to the cache, and a test covers month edges.
- **Yearly reminders.** Gregorian and Hijri repeats give different dates; decision 5.
- **About says what is true.** It will name the hosts the app really calls; if a service changes, the page is wrong. The hosts are read from one list in code (so a test fails if a service is added without it), not typed twice.
- **Prerendered About.** Its title and description are duplicated in `lib/publicMeta.ts` today; the prerender test must still pass.
- **Cutover:** `/poets` has no page yet (decision 8).

## 5. Decisions I need from you (my default in bold; I will use it unless you say otherwise)

1. **Today's amount for a finish-by-date goal.** The legacy stores the amount when the goal is made and adds catch-up. **Recompute it each day from the ayahs left and the days left ("N a day from here keeps your date"), shown plainly, never as "behind"; pace goals keep their stored amount.** Home's tile uses the same function, so both always agree. (The stored `dailyAyahTarget` is left as it is.)
2. **A new goal pauses the current one** (prototype). The legacy left it active but not main.
3. **Completed goals:** when your saved place reaches the end of the Qur'an, the goal shows "Complete" and moves to Other goals with `status: "completed"` (the legacy status value that was never used). **No new field.**
4. **"Recalibrate pace"** (the Phase 4A note): **leave every stored target as it is; the New goal preview suggests nothing invented; once a goal has a week of log, "Your last 7 days" shows your real daily average beside the target.**
5. **"Repeat every year":** **the same Gregorian day each year** (the stored `date` is a Gregorian day, so the legacy field keeps its meaning). A Hijri-date repeat (for Ashura and the like) would need one additive field; say if you want it.
6. **Reminders on Home.** The prototype says reminders show on Home. **Not in this phase:** Home would need a new row. The line is dropped from the page.
7. **Calendar view choice:** **persist Hijri-first or Gregorian-first in one small additive key.**
8. **Poets and cutover:** **stays deferred; I add it to the Phase 16 checklist** (a real page, or a redirect to an honest "not in this version" page, before the domain moves).
9. **Surah videos:** **an honest "not available yet" page**, listed in the Sitemap with that note, no row in the sidebar.
10. **About:** **rewritten from facts, in our words**, not the legacy text (it names a UI library we no longer use and lists only two data services).
11. **Calendar route:** **`/calender` (the legacy spelling) stays the one route**; `/calendar` is not added.
