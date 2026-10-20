# Page: Ramadan (Today and Timetable)

- Route (legacy, kept): `/ramadan` and `/ramadan?tab=timetable`. The Events tab arrives with Phase 8B; `/calender` stays for Phase 15.
- Phase: 8A
- Prototype section: `d-page-ramadan` / `m-page-ramadan` (three states: before, Day 12, last ten nights)
- Offline level: B. Ramadan's dates come from the calendar service once and are saved; the times come from the cached prayer months. Everything on the device (tracker, start date, Laylat al-Qadr nights, the references) works offline.
- Indexable: no.

## Purpose

See when Ramadan begins, which day it is, and the suhoor and iftar times for the chosen calculation method, keep a private fasting tracker, and see the nights traditionally sought for Laylat al-Qadr.

## Layout

- One `h1` "Ramadan" and a sentence. **Following** (a radio group Sunni or Ja'fari): the **global fiqh setting** (the legacy raw key `prayerFiqh`, the same control as Settings), so changing it here changes it everywhere and switches the times to that fiqh's method.
- Two tabs as buttons with `aria-current` (`?tab=timetable`): **Today** and **Timetable**.
- **Today, before Ramadan:** "Ramadan 1448 begins in 116 days", "Expected Monday 8 February 2027", the basis ("Dates follow the Hijri Calendar of Saudi Arabia (HJCoSA). Local sighting can differ by a day." plus "Adjusted by +1 day" when a Hijri adjustment is set, or "The start date was set by you."), and **Get ready**: the fiqh and method, the Hijri adjustment, and prayer alerts, each from the real setting with a link to change it.
- **Today, during Ramadan:** "Day 12 of 29", the date, "Iftar in 2h 34m" (minutes; seconds only in the last minute; "Iftar time has passed" afterwards) with a thin bar, **Suhoor ends** (the Fajr time) and **Iftar** (the Maghrib time) for the chosen method, a line with the method's name and Imsak as the service gives it, the **fasting tracker**, the **Ramadan Khatmah** card, **Laylat al-Qadr**, **a dua from the Qur'an (2:201)**, the Ayah of the day, and the start-date control.
- **Timetable:** a table of Day, Date, Suhoor ends and Iftar for each Ramadan day (29 or 30 rows, as the calendar gives), Friday labelled, today highlighted (`aria-current="date"`), the method's name above it.
- **Home:** a quiet banner during Ramadan only ("Ramadan · Day 12 · Iftar 5:52 PM", linking here). Nothing else on Home changes and there is no event card.

## What is shown and what is deliberately not

| Shown (from data) | Not shown (until you supply a reviewed source) |
| --- | --- |
| Suhoor ends = Fajr, Iftar = Maghrib, Imsak as the service gives it, for the chosen method, with its name | Any sentence about when a fast begins or ends in a tradition's terms ("waits until the eastern redness passes", "as a precaution") |
| Laylat al-Qadr: the legacy nights 21, 23, 25, 27, 29 and the legacy note, for both fiqhs, labelled "From this app's data" | The Ja'fari nights 19, 21, 23 |
| The Qur'anic dua 2:201 from the cached surah text | The Arabic of any hadith dua (references only: "Abu Dawud — said at Iftar", ...) |
| Ramadan's dates from the calendar service, with its basis | "Expected by the Saudi calculation", "South Asia one day later" |
| The legacy tracker (fasted, didn't fast, planned) | Any streak, flame, or guilt wording |
| (nothing) | A Sunni versus Ja'fari "how it differs" table |

## Dates

- **Source:** the calendar service's Hijri month 9 for the year (`/v1/hToGCalendar/9/<year>`), saved in the new `hijri-months` store of `quran-revamp-db` (version 4; `quran-app-db` is never opened). Which year to ask for is estimated from the date and corrected from the answer; no date is computed by a formula. Refreshed when older than 30 days and online; a failed refresh keeps the saved month.
- **The Hijri adjustment** (Settings, minus 2 to plus 2) is applied in the app: it moves the date the app shows for a day, so Ramadan's day 1 falls that many days earlier (+1) or later (-1). It is never part of a cache key and the saved month is never changed.
- **The start-date override** (the legacy `quran:ramadan:v1.startOverride`) stands: active for 30 days from the date, it wins over the calendar ("Set by you"); a date within the next year before Ramadan is also used; one further ahead is ignored.
- **During Ramadan** the day comes from the cached prayer days' Hijri dates (with the adjustment), so Home and this page work with no calendar request.
- **If nothing is saved and there is no connection:** "Dates need a connection once." with Try again. Never an estimate.

## The times

Ramadan's prayer months are fetched through the same cache and atomic swap as Phase 1: on demand when the Timetable is opened online, when Ramadan is within 31 days (about 1 Sha'ban) on this page, and from **Home during Sha'ban** (Hijri month 8, so a user who only opens Home still has Ramadan saved ahead). A month not saved shows "Not saved" for its days with "Connect once to get them."; nothing is estimated.

## Tracker, Khatmah, start date

- **Tracker:** the last 7 Ramadan days; a tap cycles nothing, Fasted, Didn't fast, nothing (the legacy cycle; the stored value stays `missed`); "Plan tomorrow's fast" toggles Planned; counts; a polite live region announces each change. Private, on this device. **No streak and no flame.**
- **Khatmah:** read-only. It shows an existing goal labelled "Ramadan Khatmah" (today's ayahs against its daily target, the date it aims to finish by) and links to where you stopped reading; with none it says planning arrives with Reading goals (Phase 15). It never writes a goal.
- **Start date:** the legacy control ("Ramadan started on", "Use calculated date") in a collapsed section.

## States

| State | What shows |
| --- | --- |
| Loading | A skeleton |
| Dates not saved, offline or failed | "Dates need a connection once." / "Couldn’t load the calendar. Try again in a moment." and Try again |
| No location | "Set your location to see today's times." (Timetable: "Set your location to see Ramadan’s times.") |
| Times not saved | "Today’s times are not saved on this device yet. Connect once to get them." / "Ramadan’s times are not saved on this device yet. Connect once to get them." and Try again |
| Part of the month saved | The rows that are, "Not saved" on the others, and a line saying how many |
| After Ramadan | The next Ramadan (the calendar for the next year), or the dates state |

## Data and storage

Reads: the prayer cache (`prayer-months`), `hijri-months` (new), `quran:ramadan:v1`, `quran:hijri-adjust:v1`, `prayerFiqh`, the calculation settings, `quran:reading-goals:v1` and `quran:reading-progress:v1` (read only). Writes: `quran:ramadan:v1` (its legacy shape; unknown fields kept), `prayerFiqh` (through Following, as Settings does), the prayer and Hijri caches.

## Tests

`tests/ramadan.test.ts` (unit) and `e2e/ramadan.spec.ts` (browser, recorded real responses); see `docs/phases/phase-08a-ramadan.md`.
