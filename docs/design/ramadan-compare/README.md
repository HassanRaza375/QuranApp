# Ramadan next to the prototype (Phase 8A)

`<device>-<theme>-<state>.jpg` puts the prototype (left) next to the revamp (right): desktop 1280px, mobile 375px, light and dark, for the three states the prototype's control bar sets: `before` (Ramadan not yet begun), `during` (Day 12) and `last10` (the last ten nights; the revamp is on Day 21) = **12 pairs** of the Today tab, plus `<device>-<theme>-timetable.jpg` (1280 light and 375 dark) = **2 pairs**. `state-<name>-<device>-<theme>.jpg` are revamp-only state shots at 1280 light and 375 dark: jafari-day12, tracker-marked, khatmah-goal, qadr-night, dua-and-references, dua-offline, start-date-set, hijri-adjusted, dates-need-connection, timetable-before, timetable-not-saved, timetable-jafari, no-location, home-banner (14 states x 2 = **28**). 42 images in all. Regenerate with `node scripts/screenshots/phase-08a-ramadan.mjs` (production build, Node 22).

The revamp uses **recorded real AlAdhan responses** (Ramadan 1448 from the Hijri-month endpoint; Lahore prayer months for Jan to Mar 2027, Sunni and Ja'fari), the clock fixed (15 Oct 2026, 19 Feb 2027, 28 Feb 2027), and the 2:201 text answered with **synthetic text**. The prototype's times, dates and text are its own samples and are not used.

## Differences

| # | Prototype | Revamp | Kind |
| --- | --- | --- | --- |
| 1 | Sample times from a formula ("Sample times") | Real cached prayer times for the chosen method, with the method's name | Real data |
| 2 | "Expected Mon 8 Feb by the Saudi calculation. South Asia is expected one day later, and the final date depends on the crescent." | "Expected Monday 8 February 2027" and "Dates follow the Hijri Calendar of Saudi Arabia (HJCoSA). Local sighting can differ by a day." The date is the calendar service's (116 days from the fixed clock) | Approved |
| 3 | "Ramadan 1448 begins in 118 days", a big countdown ticking in seconds | "Ramadan begins in 116 days" and "Iftar in 8h 38m" (minutes; seconds only in the last minute) | Intentional |
| 4 | Imsak for Ja'fari, "Suhoor ends (Fajr)" for Sunni, with sentences ("Eat until Fajr begins", "Ja'fari iftar waits until the eastern redness has passed") | Two neutral cards "Suhoor ends" (Fajr) and "Iftar" (Maghrib) for either fiqh, a line with the method and Imsak as the service gives it; no sentence about fiqh differences | Approved |
| 5 | "Both fiqhs today. Sunni: ... Ja'fari: ... Sample times." | Not shown; Following switches the times | Approved |
| 6 | Laylat al-Qadr per fiqh (Sunni 21 to 29, Ja'fari 19, 21, 23), a night strip 19 to 29, "Next: night 21, in 8 days" | The legacy nights 21, 23, 25, 27, 29 and the legacy note for both fiqhs, "From this app's data", today marked on a night. No Ja'fari set, no "next" line | Approved |
| 7 | "How the month differs" table | Left out | Approved |
| 8 | Fasting strip of day numbers with "Missed", pre-filled sample statuses | The legacy tracker with real dates; labels Fasted, Didn't fast, Planned; counts; no streak or flame | Intentional |
| 9 | Ramadan Khatmah: "Plan a Khatmah" (one juz a day) | Read-only: an existing "Ramadan Khatmah" goal's count and target, and "Continue reading"; planning arrives with Reading goals | Approved |
| 10 | Dua for iftar (Arabic, typed, "Sample dua for layout") | A dua from the Qur'an (2:201) read from the surah text, and the hadith duas as references only | Approved |
| 11 | "Get ready" checklist with ticks | The real settings (method, Hijri adjustment, alerts) with their current values and links | Intentional |
| 12 | Timetable of 30 sample rows | The calendar's own 29 rows for 1448, Friday labelled, today highlighted, "Not saved" for days whose times are not saved | Real data |
| 13 | A third tab, Events | Not yet (Phase 8B) | Approved |
| 14 | Mini player bar always shown | Hidden until something plays | Intentional for now |
| 15 | The tab is named "Get ready" before Ramadan | The tab stays "Today" in every state | Intentional |

The sidebar and header differences are the Phase 1 ones (`docs/design/home-compare/README.md`).

**Looked at individually:** the desktop light Day 12 pair, the mobile dark "before" pair, and the mobile dark Timetable pair. **Generated but not examined one by one:** the other eleven Today pairs, the desktop Timetable pair and all 28 state shots (the states are exercised by the browser tests, which check their text, values, links and sizes).
