# Phase 8A: Ramadan (Today and Timetable)

- Branch: `revamp-design-logic`
- Date: 2026-10-20
- Status: Done, awaiting review (8B, the Events tab, is next and needs its own plan review)
- Plan and decisions: `phase-08-ramadan-plan.md`

## Approved decisions (as built)

1. Split: 8A (Today and Timetable) built and stopped for review; 8B (Events) not started.
2. (8B) Ship only the 32 legacy events, dates for the next 6 months.
3. `/calender` stays for Phase 15.
4. The Qur'anic dua (2:201) from the cached surah text; hadith duas as references without Arabic.
5. The Khatmah card is read-only (a link to where you stopped reading; no goal creation).
6. Tracker labels Fasted, Didn't fast, Planned; no streaks, flame or guilt wording anywhere (a test scans the page's source and the rendered page).
7. Home gets a quiet Ramadan banner during Ramadan only; no event card.
8. Laylat al-Qadr: the legacy nights 21 to 29 for both fiqhs, labelled "From this app's data"; the Ja'fari 19, 21, 23 are not shown (deliberate gap, below).
9. No Sunni versus Ja'fari compare table.
10. Neutral labels "Suhoor ends" and "Iftar" from the monthly cache for the chosen method, with its name; no sentences about fiqh differences.
11. The `hijri-months` store, after recording a real calendar response and comparing it with the monthly cache.
Also: the Hijri adjustment applied in the app, never in a cache key; no invented dates ("Dates need a connection once."); "Expected" with the calculation basis; the legacy start-date override stands; offline states on every tab.

## What was built

- **Page** `/ramadan` (`RamadanPage`: the Following control, the two tabs) with `TodayPanel` (before, during, the dates-not-available states), `GetReady`, `FastingStrip`, `KhatmahCard`, `QadrCard`, `DuaCard`, `StartDateControl`, `TimetablePanel`.
- **Home:** `RamadanBanner` (only while Ramadan is under way) and a background load (`useRamadan().loadForHome()`): saved data only, except in Sha'ban (Hijri month 8), when it fetches Ramadan ahead (the calendar month and Ramadan's prayer months) so the page works offline later.
- **Logic:** `lib/hijriMonths.ts` (parser with strict checks, year estimate, `findRamadan`, the basis names), `lib/dayKeys.ts`, `lib/ramadan.ts` (the legacy record, the plan, timetable and tracker rows, prefetch rule), `lib/ramadanText.ts`, `services/hijri.service.ts` (saved first, network only when asked, a failure keeps what is saved), `composables/useRamadan.ts`.
- **Data:** `quran-revamp-db` version 4 adds the `hijri-months` store (key `<hijri year>-<month>`); the other stores are kept; `quran-app-db` is never opened.
- **Recorded real responses** (`tests/fixtures`): `aladhan-htog-1448-09.json` (Ramadan 1448), `aladhan-gtoh-2026-10.json`, `-2027-02.json`, `-2027-03.json` (the calendar by Gregorian month), and Lahore prayer months for Jan, Feb and Mar 2027, Sunni and Ja'fari.

## Findings

- **The calendar agrees with the prayer cache:** AlAdhan's calendar for October 2026 gives the same Hijri date as the Lahore monthly cache for all 31 overlapping days (both use `HJCoSA`, "Hijri Calendar of Saudi Arabia"), and Ramadan 1448 from the Hijri-month endpoint agrees with the calendar by Gregorian month for every one of its 29 days. A test pins both.
- **Ramadan 1448 is 29 days by this calendar: Monday 8 February to Monday 8 March 2027.** The legacy page assumed 30 days when it estimated the end ("estimated" labels); the timetable here has as many rows as the calendar gives.
- **The service marks Laylat al-Qadr on days 21, 23, 25, 27, 29 in its own `holidays` field**, the same set the legacy app has. That does not make the Ja'fari 19, 21, 23 set known to the data; it stays a gap until you supply a reviewed source.
- **Endpoint change from the plan:** the plan named `gToHCalendar` (a Gregorian month). I use **`hToGCalendar/9/<year>`** (a Hijri month) because one request gives all of Ramadan with each day's Gregorian date. `gToHCalendar` responses are recorded and used only to cross-check. The year to ask for is estimated and corrected from the response (a test covers a wrong guess either way).
- The Hijri adjustment moves the date a day shows, so day 1 falls `adjust` days earlier; the saved record is byte-for-byte unchanged (a test and a browser test read the stored record).
- The first version flashed "Dates need a connection once." while the calendar was still loading; the idle state now shows a skeleton.
- A manual start date more than 90 days ahead was silently ignored; the look-ahead is now a year (further ahead is still treated as a typo).

## Differences from the plan

- **Undo on a tracker tap** is replaced by the cycle itself (a tap cycles back to nothing) and a live-region announcement; a toast on every tap would be noise.
- **Imsak** is a quiet line ("Imsak, as the service gives it: 5:24 AM") rather than a card, so the two main cards use your neutral labels.
- **"Night N begins at sunset the evening before"** (question 11 of the plan) is left out.
- The **Ayah of the day** card (the legacy page had it) is the existing Home component.
- The **Events** tab does not exist yet (8B); the page has two tabs.

## Deliberate gaps (recorded in CONTENT_TO_VERIFY.md)

The Ja'fari Laylat al-Qadr nights (19, 21, 23); the Sunni versus Ja'fari "how it differs" table; any explanatory sentence about iftar or suhoor differences; the Arabic of the hadith duas; "expected by the Saudi calculation" and "South Asia one day later". Each needs wording and a source you review; each would become a data file.

## Verification

- `npm run verify` on Node 22: build, lint, **478 unit tests** and **335 browser tests** all pass (33 in `e2e/ramadan.spec.ts`; the existing Home, Prayer, Settings, Library, People and Stories specs still pass with the new mocks).
- Screenshots: `docs/design/ramadan-compare/` (42 images). I looked at three pairs (desktop light Day 12, mobile dark before, mobile dark Timetable); the README says which.
- `tests/ramadan.test.ts` (26 tests): the recorded real responses and their agreement, strict rejection of a bad response, the year estimate and its correction, the plan (before, during, over, unknown, the adjustment both ways, the override), the timetable and strip rows, the prefetch rule, the legacy record round trip, the service (saved first, network off, stale refresh, failure keeps saved), no streak or guilt wording, no banned claims.
- `e2e/ramadan.spec.ts` (33 tests, recorded real responses): before, the adjustment, the override, no connection, saved offline, a failed answer; Day 12 in both fiqhs, the countdown, the tracker (cycle, record, keyboard, no streak), the Khatmah card (read only), Laylat al-Qadr, the dua (and offline), the Timetable (rows, Friday, today, Ja'fari, on demand, not saved, partial, no location), Home (banner, no request before Ramadan, the Sha'ban prefetch then offline), Reset keeps and Clear all removes the record, dark mode, 375px and 44px targets.

## What is left for you

- Review the wording ("Dates need a connection once.", "Expected ...", the basis line, the Khatmah line, "Didn't fast"), the calendar basis name ("Hijri Calendar of Saudi Arabia (HJCoSA)", taken from the service's code) and the legacy Laylat al-Qadr note.
- Supply reviewed sources if you want the gaps above filled.
- Real-device checks, and the screenshots I did not look at.
- Then Phase 8B (Events): a plan review first (the horizon, the legacy 32 events, the reminders).
