# Phase 15: Reading goals, Calendar and the small pages

- Branch: `phase-15-goals-calendar` (from the merged `chore/standalone-repo`, d32183e)
- Date: 2026-10-28 to 2026-10-29
- Status: **Built; full verify: see Verification.** Plan approved by the owner on 2026-10-28 with changes (`DECISIONS.md`, Phase 15; plan in `phase-15-goals-calendar-plan.md`); the checkpoint for About, Sitemap and Surah videos was approved the same day. Waiting for the owner's acceptance; then merge into `chore/standalone-repo` with `--no-ff`, verify the merged head, push.

## Goal

Reading goals and the Calendar from `prototype-remaining-pages.html`, with real Hijri data and real events only; `/juz/[id]` redirecting to the reader; and About, Sitemap and Surah videos, which have no prototype, designed from the existing components and tokens. Poets stays deferred.

## Scope

- Pages built: `app/pages/goals.vue` and `app/components/goals/*` (6), `app/pages/calender.vue` and `app/components/calendar/*` (2), `app/pages/juz/[id].vue`, `about.vue`, `sitemap.vue`, `surah-vedios.vue`; `app/stores/goals.ts`; `app/composables/useCalendar.ts`; the Ramadan page's Khatmah card (now plans one); Home's goal tile (on the shared amount function); a Worship nav row "Calendar".
- Prototype section used: `docs/design/prototype-remaining-pages.html`, `#/goals` and `#/calender`. About, Sitemap and Surah videos: none.
- Legacy code reused: `useReadingGoals.ts` and `useReminders.ts` are vendored unmodified by `scripts/sync-legacy.mjs` (89 other files unchanged, legacy commit still `7120b6c`) and **run by the parity test** (`scripts/lib/legacy-goals.mjs`, in memory, with the legacy counts file loaded as it is). The rules are ported, not copied: `lib/goals/*` is the same arithmetic as pure functions.

## What was built

- **Rules and storage** (`lib/goals/`): `model.ts` (the amounts, today's amount, progress, the 30-juz line, the week, labels), `store.ts` (the legacy record `quran:reading-goals:v1` with unknown fields kept; create, pause, make main, remove, restore, log by hand, complete).
- **Calendar** (`lib/calendar/`): `month.ts` (the pool of saved service days, a Hijri month from them, events and reminders on a day, Coming up, yearly repeats), `prefs.ts` (`quran:calendar-prefs:v1`).
- **Reminders** (`lib/reminders.ts`): an additive `repeat` field (`by: "hijri"` with month and day, or `by: "gregorian"`); `recurringYearly` never touched.
- **Saved Gregorian months** (`lib/gregorianMonths.ts`): keep the service's Arabic Hijri month names (optional, additive).
- **Screens** as in `docs/pages/goals.md`, `calendar.md`, `about.md`, `sitemap.md`, `surah-videos.md`, `juz-redirect.md`.
- **Scripts:** `scripts/lib/legacy-goals.mjs`, `scripts/screenshots/phase-15-small-pages.mjs`, `scripts/screenshots/phase-15-goals-calendar.mjs`.

## Decisions and why

The owner's decisions are in `DECISIONS.md` (Phase 15). Choices made while building:

| Decision | Alternatives considered | Reason |
| --- | --- | --- |
| The Calendar's Hijri month is **assembled from the saved Gregorian months** (`gToHCalendar`) | The Hijri-month endpoint (`hToGCalendar`) per month | The Events page already saves the Gregorian months (30 days) and they carry each day's Hijri date and the month names, so no new request kind, no new store, and the existing recorded fixtures are the test data. A month is shown only when all of it is saved |
| **Today's Hijri month is found from the service day `adjust` days later** | Compute it | Nothing here computes a Hijri date; the adjustment is applied to what is shown |
| The goals record is **read fresh and written back whole with unknown fields kept**, by every change | A Pinia copy written on change | The reader appends to the same key; a stale copy would drop its log (a unit test and a browser test cover it) |
| **Resume pauses the main goal**, like a new goal | Leave the older goal "active" as the legacy did | One main goal and the rest paused or complete is the model the page shows; both changes have Undo |
| The yearly repeat is **one additive field**, `repeat` | Reuse `recurringYearly` | The owner asked for it to stay untouched, so the legacy app reads exactly what it did |
| **No counts on the Sitemap**; no typed counts on About | Count from each module's data | The legacy typed them in (and they drift); a count would mean loading every module's data for a static page |
| The services on About are **one list in code, tested against the hosts the code calls** | Type them in the page | The page says what is sent; it must stay true when a service is added |
| The 114 links on Surah videos are **plain links without prefetch** | A component per row | One route, 114 observers would be waste (the Surah tab's lesson) |

## Files

- Added: `app/lib/goals/*`, `app/lib/calendar/*`, `app/lib/about.ts`, `sitemap.ts`, `juzRedirect.ts`, `app/stores/goals.ts`, `app/composables/useCalendar.ts`, `app/components/goals/*` (6), `app/components/calendar/*` (2), `app/pages/goals.vue`, `calender.vue`, `sitemap.vue`, `surah-vedios.vue`, `juz/[id].vue`, `scripts/lib/legacy-goals.mjs`, two screenshot scripts, `tests/goals.test.ts`, `goalsParity.test.ts`, `calendarMonth.test.ts`, `juzRedirect.test.ts`, `about.test.ts`, `sitemap.test.ts`, `e2e/goals.spec.ts`, `calendar.spec.ts`, `smallpages.spec.ts`, five page docs, `docs/design/goals-calendar-compare/` and `phase15-small/` (screenshots).
- Changed: `app/lib/goalToday.ts`, `useHomeState.ts`, `UtilStrip.vue` (the tile), `KhatmahCard.vue`, `lib/reminders.ts`, `lib/gregorianMonths.ts`, `lib/nav.ts`, `about.vue`, `lib/publicMeta.ts`, `e2e/ramadan.spec.ts`, `tests/bridge.test.ts`, `scripts/lib/legacy-files.mjs`.
- Changes to `legacy/`: only through `scripts/sync-legacy.mjs`: added `app/composables/useReadingGoals.ts` and `useReminders.ts`, manifest and README updated; nothing hand-edited.

## Data and storage

- Keys, as the legacy app uses them: `quran:reading-goals:v1` (read and written, legacy shape, unknown fields kept), `quran:reminders:v1` (legacy shape; **each reminder may now carry `repeat`**, which the legacy app ignores and keeps when it edits the list: a parity test does exactly that), `quran:reading-progress:v1` (read only).
- **New, additive:** `quran:calendar-prefs:v1` (`{ first: "hijri" | "gregorian" }`). The reminder `repeat` field. The saved Gregorian months may carry `hijriNamesAr`.
- Never written: `calendar_v2_*` and `prayer_*` (the legacy caches), `quran:cal-rem-proto` (prototype only).
- IndexedDB: nothing new; the existing `hijri-months` store in `quran-revamp-db`. `quran-app-db` is never opened.
- Export already writes every key; Reset leaves goals, reminders and the calendar choice alone (as before); Clear all removes them with everything else.

## Offline

Goals, About, Sitemap, Surah videos and `/juz/[id]`: level A. Calendar: level B (see `docs/pages/calendar.md`). Browser tests: goals with the connection off; the Calendar with nothing saved and offline (message, Try again, then it loads); a saved month and an unsaved one while offline; About, Sitemap and Surah videos from the app shell with the real service worker.

## Verification

Filled in after the full verify (see the end of this section).

**Parity, and that it bites (2026-10-29).** `tests/goalsParity.test.ts` (7) runs the legacy `useReadingGoals` and `useReminders` beside `lib/goals` and `lib/reminders`. Ten deliberate breaks were made one at a time, the unit tests run, and the file restored from git:

| Break | Caught by |
| --- | --- |
| pages a day rounds instead of rounding up | `goalsParity` |
| juz a week divides by 6 | `goalsParity`, `goals` |
| finish by date counts one day too many | `goalsParity`, `goals` (two tests) |
| a Gregorian yearly repeat matches any day of the month | `calendarMonth` |
| a Hijri yearly repeat ignores the day | `calendarMonth` |
| a repeat also matches before its first day | `calendarMonth` (two tests) |
| 29 February is not waited for | `calendarMonth` |
| the `repeat` field is dropped when saved | `goalsParity` |
| the `repeat` field is dropped when read | `goalsParity` |
| `recurringYearly` is set by the new repeat | `goalsParity` |

All ten failed a test and the tree was restored (`git status` clean, 60 of 60 passing again). **The yearly-repeat date logic has no legacy twin** (the legacy `recurringYearly` is never set or read), so the parity test does not cover it; the four calendar unit tests and the browser tests do. The parity test covers the storage of `repeat` and that `recurringYearly` stays untouched. One thing found on the way: the first baseline run of the four unit files failed one parity test (the random one, 1.7 s alone, probably the 5 s default under a cold four-file run; the message was not captured). It passed in all nine runs after, and the test now loads the legacy modules once and has a 30 s limit.

## Differences from the prototype

Listed in `docs/pages/goals.md` and `calendar.md`. The ones that matter: no invented "At your pace, you'll finish around ..." or "About N minutes"; the Calendar's months, names, year length and method are the service's (the prototype's table was a sample); a way to pause the main goal; real events in Coming up; Hijri or Gregorian repeat.

## Content placeholders replaced

`CONTENT_TO_VERIFY.md`, sections Reading goals, Calendar and About: the sample goal, week and other goals, the typed pages-per-ayah figure, the invented minutes and projection, the month table and its method label, the three sample events and the prototype-only reminders key are all replaced by real or computed data. Wording of ours is listed there.

## Open issues and risks

- **Real device and real eyes:** `DEVICE_CHECKS.md` (Phase 15, G1 to G6): a phone for the sheets and the grid, the Hijri date against a calendar you trust (and at a month edge with an adjustment), a real week of reading against the Goals page, an installed app offline, legacy goals and reminders.
- **Progress is the saved place.** Jumping ahead (opening a late surah) fills a goal's progress; going back never lowers it below zero. The page says "counted from where you are".
- **The two reading counts differ** (Phase 4A): the reader's 1.5 s rule counts higher than the legacy's. Stored targets are never rewritten; counts are not merged.
- **A goal completes only when you open the Goals page** at the last ayah (Home's tile still shows it as the main goal until then).
- **Months saved before this phase** have English Hijri month names only; the Arabic name appears after the 30-day refresh (or never, offline). It is decoration.
- **Stepping the Calendar** fetches up to two months per step from the service; each is saved for 30 days. Beyond five years either way the arrows stop.
- **A reminder repeated by Hijri date** is placed on the days the service gives; "Coming up" only looks as far as the saved window (eight months).
- **Reminders are not on Home** (decided); the prototype's line about it was dropped.
- **Poets** is deferred; `/poets` has no page and the cutover checklist says every legacy route must exist (`PLAN.md`).
- Wording of ours on About, the Sitemap and Surah videos needs your reading (`CONTENT_TO_VERIFY.md`).

## Next phase needs

Phase 16 (Cutover): the PWA audit, accessibility, performance, SEO, the Vercel project and the domain, and the cutover checklist (now with `/poets`). Hifz and goal reminders as notifications would need the shared reminders list; nothing here sends one.
