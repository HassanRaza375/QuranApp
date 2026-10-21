# Phase 8B: Events

- Branch: `revamp-design-logic`
- Date: 2026-10-21
- Status: Done, awaiting review
- Plan and decisions: `phase-08b-events-plan.md`

## Approved decisions (as built)

1. Dates via `gToHCalendar`, one request per Gregorian month; horizon 6 months plus one month each side; "Show later events" adds 6 more (to 24).
2. The Hijri adjustment moves displayed dates only; the saved months are untouched (a unit test and a browser test read the stored record).
3. Every date reads "Expected"; the basis line follows `SHOW_CALENDAR_BASIS` but "Expected" always shows. Offline, an unsaved month says "Dates for later months need a connection once."
4. The Both / Sunni / Ja'fari view appears only when events carry a tradition tag other than shared; the default is **Both when no fiqh has been set** (the raw `prayerFiqh` key is absent) and otherwise the Following fiqh; it is view-only here. A tradition with few events of its own gets "Only a few events are recorded for this tradition so far." Nothing is invented to fill it.
5. `app/data/events/reviewed-events.json` ships empty. Per-tradition wording must carry a source; an entry with the same id replaces a legacy one; a row without wording shows no placeholder.
6. The bell writes to `quran:reminders:v1` in the legacy shape with Undo. It says "Saved to your list" (no alert is sent) and the saved reminders are shown on this tab ("Your reminders").
7. Home is unchanged beyond the 8A banner.
8. The category labels, tradition tags, the "Expected" rule and the footer are wording of ours, kept minimal and listed in `CONTENT_TO_VERIFY.md`.
Also: a "Next event" line on the Today tab before Ramadan (plan question 5, accepted).

## What was built

- **Events tab** on `/ramadan?tab=events` (the page now has three tabs: Today, Timetable, Events): the 29 legacy events placed on the days the calendar service gives, grouped by month, "Next" on the first (and "Today" on the day), the date block, the name, the tradition tag, the category chip, "Expected Tuesday 5 January 2027 · 27 Rajab 1448 · in 82 days", the data's own note verbatim, the bell, the basis line, the few-events line, "Show later events", and the footer "Dates and this list follow this app's data. They are not a ruling."
- **Your reminders** (the legacy list): upcoming first, then past; a done checkbox (the reminder leaves the list, as in the legacy list); delete with Undo; "Saved to your list. No alert is sent. The date is the one shown when you saved it."
- **Today:** a "Next event" card before Ramadan (the first visible event for the view), linking to the Events tab; none during Ramadan.
- **Logic:** `lib/gregorianMonths.ts` (the parser with strict checks, key and URL, month helpers), `lib/islamicEvents.ts` (the adapter: stable ids, the legacy events, the reviewed-file validator and merge, placement on the service's days with the adjustment, the tradition rules, grouping and wording of dates), `lib/reminders.ts` (the legacy list), `services/hijri.service.ts` (`getGregorianMonth`, sharing one loader with the Ramadan month), `composables/useEvents.ts` (months in the background 3 at a time, horizon, reminders).
- **Data:** the same `hijri-months` store (no version bump), key space `g:YYYY-MM`. `quran-app-db` is never opened.
- **Recorded real responses** (`tests/fixtures`): `aladhan-gtoh-2026-09` to `2027-09` (13 months).

## Findings

- **18 events, not about 21, fall in the first six months from 15 Oct 2026** (the plan's estimate was loose): the first is Isra and Mi'raj and Mab'ath on 5 January 2027 (82 days away), so October to December have no events and no month heading is shown for them. With 6 more months (to September 2027) the list covers Arafah, both Eids and the first Muharram events.
- The recorded months agree with the prayer cache (all 31 days of October 2026) and with the Ramadan month (its 29 days are exactly the Hijri-month-9 days of Feb and Mar 2027); a test pins both. Each of the 18 placed events is checked against the service's own days independently of the code that placed it.
- With the adjustment at +1 every event moves a day earlier (and -1 a day later); events near a month edge move across it because one month on each side is loaded. A test covers the edge and the window end.
- The Hijri month names are the service's own, so the diacritics are inconsistent in the way the service writes them ("Rajab", "Shaʿbān", "Ramaḍān"). They are shown as given; flagged in CONTENT_TO_VERIFY.md.
- The legacy data is Ja'fari-weighted (13 events of its own against 2 Sunni): a Sunni view lists 10 of the 18 (9 shared and 1 Sunni) with the few-events line; a Ja'fari view lists 17.
- Toasts (bottom centre) can sit over the lower rows for about six seconds; Playwright's pointer actions were blocked by them, so the tests click through (a real user can wait or swipe the toast away).
- The Ramadan page loads the Ramadan month on every tab (it is saved after the first time), so an Events visit makes one extra request on the first load only.

## Differences from the plan

- The Today "Next event" card loads the same eight months as the Events tab (a first draft loaded four, which does not reach January, and was wrong).
- "Dates for the coming months." is the one sentence under the Events tab title (ours, flagged).
- Plan question 3 (the five Laylat al-Qadr rows) stays as five rows, as the data has them.

## Deliberate gaps (recorded in CONTENT_TO_VERIFY.md)

The events the prototype lists beyond the data (the Fatimiyya days, Rajab and Sha'ban beginnings, the births and martyrdoms of Imams Ali, Musa al-Kadhim and others, Fatima's birth); any description beyond the 9 notes; per-tradition wording. A reviewed file adds each of them without code changes (shape below), and the file ships empty.

## The reviewed-events file shape

`app/data/events/reviewed-events.json`: `{ "version": 1, "events": [ { id, month (1-12), day (1-30), name, tradition (shared|sunni|jafari), category, note?, text?: { shared?, sunni?, jafari? }, source?: { type, citation } } ] }`. `text` requires a `source` (type and citation). An id equal to a legacy id (`legacy:<month>-<day>-<name>`, e.g. `legacy:7-27-isra-and-mi-raj`) replaces that entry; a new id adds a row. Entries that fail validation are left out (the issues are available from `useEvents().issues`); a test loads a sample file and checks nothing else changes.

## Verification

- `npm run verify` on Node 22 (lint, 511 unit tests, production build, 360 e2e tests): **passed, exit 0**. The Settings picker test did not fail this run. An earlier run failed only on lint (unused names in the screenshot script), fixed.
- `tests/events.test.ts` (31 tests): the recorded months and their agreement with the prayer cache and the Ramadan month, strict rejection of a bad response, the 29 events as the data has them (counts, notes, ids), placement on the service's own days (checked independently), the adjustment both ways and at edges, a 30th day in a 29-day month, nothing guessed beyond the saved months, the tradition rules and the few-events line, the reviewed-file validator and merge (with a sample file), grouping and wording, the reminders list in its legacy shape, the month service (saved first, network off, stale refresh, failure keeps saved), no invented text.
- `e2e/events.spec.ts` (25 tests, recorded real months): the list, grouping, Next and Today, the two rows on 27 Rajab, notes verbatim, the five Qadr rows, Both and Following and Sunni and Ja'fari (counts 18, 10, 17), the Following control, the first load's requests and the saved reload, the adjustment both ways, no connection, a service error, a missing month, Show later events, the bell (aria, toast, legacy shape, kept across a visit, Undo, keyboard), the reminders list (legacy reminders, done, delete and Undo), Today's next event, no event card on Home, Reset keeps and Clear all removes the list, dark mode, 375px and 44px targets.

## What is left for you

- Review the wording of ours (labels, tags, the "Expected" rule, the footer, the few-events line, "Dates for the coming months.").
- Supply reviewed events and wording if you want more than the 29 (the file is ready).
- Phone checks; the screenshots I did not look at (I viewed the desktop light pair, the mobile dark reminder-set state and the sunni-after-eid state; the rest were only generated); then Phase 9 (Utilities) needs a plan review.
