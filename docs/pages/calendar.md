# Page: Calendar

- Routes: `/calender` (the legacy spelling, kept as the one route)
- Phase: 15
- Prototype section: `docs/design/prototype-remaining-pages.html`, `#/calender` (`pgCal`, `sheetRem`)
- Offline level: **B.** A month seen before is on this device. A month never loaded says "It needs a connection once" (or "could not be loaded just now"), with Try again, and the page stays where it was: never a blank page, never a spinner for ever. No location is needed (the legacy page waited for one without end).
- Indexable: no (`robots: noindex, follow`).

## Purpose

See a Hijri month with its Gregorian dates, the Islamic events of your fiqh view on their days, and your reminders; add a reminder for a day. The dates are the calendar service's own.

## Layout

- **Header:** the month's name from the service and its Hijri year ("Jumādá al-ūlá 1448"), previous month, **Today**, next month.
- **Under it:** the month's Arabic name from the service (when the saved month has it), the Gregorian range ("12 Oct – 10 Nov 2026"), the calendar's own name ("Hijri Calendar of Saudi Arabia (HJCoSA)") and, if you set one, "Adjusted by +1 day"; a **Hijri / Gregorian** choice for which number is large in a cell.
- **The grid:** a month of day cells starting on Sunday. Each shows its two dates, a dot for an Islamic event, a ring for a reminder; today has an outline, the chosen day is tinted. A key and "Dates follow the calendar named above. Local moon sighting can differ by a day: Settings has a Hijri date adjustment."
- **The chosen day** (beside the grid on a computer, under it on a phone): "Today" or the weekday, its Hijri date, its Gregorian date, its events (name, a tradition tag when it is not shared, the category, the data's own note, any reviewed wording), your reminders (with Remove), "Nothing on this day.", and **Add reminder**.
- **Coming up:** the next five events and reminders, nearest first, each with its Hijri date and "in N days".
- **Add reminder** (a side panel on a computer, a bottom sheet on a phone: it is a form): a title, a date (the chosen day), **Repeat every year** and, when on, **By Hijri date** (the default) or **By Gregorian date**.

## The rules

- **Dates and names are the service's.** A Hijri month is read from the Gregorian months (`gToHCalendar`) the Events page already saves, each day with its own Hijri date, so a month of 29 or 30 days is never guessed (`lib/calendar/month.ts`). A month is shown only when all of it is saved. The Hijri adjustment moves each Gregorian date shown (`+1` shows every Hijri day a day earlier); it never touches a saved month or a cache key.
- **Events** are the 29 of the legacy data (the Ramadan page's list), filtered by the fiqh view as the Events page does: following your fiqh, or Both when none is chosen. A tradition-specific event is tagged; nothing else is claimed about a date.
- **Reminders are your list** (`quran:reminders:v1`, the legacy shape): "Saved to your list: <title>. No alert is sent." with Undo; Remove has Undo. They are not shown on Home in this phase.
- **Repeat every year** (owner decision 2026-10-28): by Hijri date means the same Hijri month and day each year, wherever it falls; by Gregorian date means the same month and day. It is stored in a **new additive field**, `repeat: { by: "gregorian" }` or `{ by: "hijri", month, day }`; the legacy `recurringYearly` is never touched (it stays false). A repeat starts on the reminder's own day. When the Hijri date of the chosen day is not among the saved days, only the Gregorian choice is offered and says why.
- **Stepping** from month to month fetches at most the two Gregorian months it needs (the day after the month, and a month beyond it), up to 60 months either way from this month.
- **The first open** loads three Gregorian months (last, this and next) and paints; the rest of an eight-month window loads after, for Coming up. These are the same saved months the Events page uses.
- No Suhoor or Iftar times here (the Ramadan page has the timetable).

## Components

| Component | Source | Notes |
| --- | --- | --- |
| `CalendarPage` | custom | the screen; `app/pages/calender.vue` only mounts it |
| `CalendarReminderSheet` | shadcn-vue `Sheet`, `Switch` | native radio inputs for the repeat choice |
| `SettingsSegmentedControl` | existing | the Hijri / Gregorian choice (a real radio group) |
| `useCalendar` (`composables/useCalendar.ts`) | custom | the month, the chosen day, stepping, the reminders; reuses `useEvents` for the saved months and the placed events |
| `lib/calendar/month.ts` | custom, pure | the pool of saved days, the month grid, events and reminders on a day, Coming up |

## Data

| Data | Service / composable | Storage |
| --- | --- | --- |
| Gregorian months with each day's Hijri date (and the month names) | `getGregorianMonth` (saved first; one request per month at a time) | `quran-revamp-db` store `hijri-months`, key `g:YYYY-MM` (saved 30 days; a month saved before this phase has English names only) |
| Events | `ALL_EVENTS` (legacy data, `lib/islamicEvents.ts`) | none |
| Reminders | `lib/reminders.ts` | `quran:reminders:v1` |
| Hijri first or Gregorian first | `lib/calendar/prefs.ts` | `quran:calendar-prefs:v1` (new, additive) |
| Hijri adjustment, fiqh | Settings | `quran:hijri-adjust:v1`, `prayerFiqh` |

## States

- Loading: skeleton.
- Needs a connection once / could not be loaded: message and Try again (first open); on a step, the month stays and the message says so with Try again.
- Empty day: "Nothing on this day." No events soon: "Nothing coming up in the months saved on this device."
- Dark mode: designed.

## Accessibility

- Each day is a button labelled with its Hijri date, its Gregorian date and what is on it ("21 Ramaḍān, Sunday 28 February 2027, Martyrdom of Imam Ali, Laylat al-Qadr (possible night)"); the chosen day is `aria-pressed` and the only tab stop; arrow keys, Home and End move between days.
- The Arabic month name is service data, never letter-spaced or cut off, and scales with the Arabic size setting.
- Every control is at least 44px on a phone (a browser test measures them); dots are not the only signal (the panel lists what is on the day).

## Known differences from the prototype

- The month names, the year and the month's length are the service's. The prototype's month table was a sample (and its method label, "Umm al-Qura", was typed): the service says 22 Oct 2026 is 11 Jumādá al-ūlá 1448 and the month runs 12 Oct to 10 Nov, 30 days, by the Hijri Calendar of Saudi Arabia.
- Coming up shows the real events (the prototype had three samples) and your reminders, five at most.
- "Reminders show here and on Home while the app is open." is gone (they are not on Home yet); a line about the calendar's basis and the Settings adjustment replaces it.
- Reminders can repeat by Hijri or Gregorian date (the prototype had one "Repeat every year" switch).
- The Hijri / Gregorian choice uses the app's own segmented control.

## Tests

`tests/calendarMonth.test.ts` (18, on the real recorded months, Sep 2026 to Sep 2027), `e2e/calendar.spec.ts` (18: today's month and day, the adjustment, the keyboard, the choice kept, stepping and a month that cannot be had, no connection with nothing saved, saved and unsaved months, events for Both, Sunni and Ja'fari, Coming up, adding, Undo and Remove, both repeats, a day with no saved Hijri date, old reminders and their fields kept, 1280 and 375 px light and dark, the Arabic size).

## Open questions

See `docs/phases/phase-15-goals-calendar.md`.
