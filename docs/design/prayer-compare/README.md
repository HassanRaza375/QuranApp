# Prayer & Qibla next to the prototype (Phase 5)

`<device>-<theme>-<tab>.jpg` puts the prototype (left) next to the revamp (right): desktop is 1280px, mobile is 375px, tabs are `times` and `qibla` (8 pairs). The prototype is driven through its own buttons and its full frame is captured (the revamp side is the first screen only). `state-<name>-<device>-<theme>.jpg` are revamp-only state shots: 17 states at 1280 light and 375 dark = 34 images. The revamp is the production build with a **recorded real AlAdhan month** (Lahore, Oct 2026) and recorded real Open-Meteo answers, the clock fixed at Thursday 15 Oct 2026 09:14 in Karachi (Friday 16 Oct where a state needs it), and stand-ins for the sensors; **no real compass was used**.

## Differences

| # | Prototype | Revamp | Kind |
| --- | --- | --- | --- |
| 1 | The tag "Now" on the current prayer | **"Latest"**: the most recent start time that has passed. No ruling on when a prayer time ends | Approved |
| 2 | Arabic prayer names beside each row (typed) | Left out until a verified list is supplied | Approved |
| 3 | Countdown ticking every second ("in 1h 34m 57s") | Minutes ("in 2h 34m"); seconds only in the final minute | Approved |
| 4 | A bar under the countdown, always | Drawn only when the latest and the next times are both known | Intentional |
| 5 | A typed Hijri sample ("29 Rabīʿ al-awwal 1448"), wrong for its own sample date | The service's own date for the location's day ("4 Jumādá al-ūlá 1448" for 15 Oct 2026), with the Settings adjustment and a note | Real data |
| 6 | Sample times, and "Times are sample values for this prototype" | Real times from the cache; the note is gone | Real data |
| 7 | The bell is a plain outline bell on every row | Where notifications are off or blocked each bell is a crossed bell that links to Settings, with the reason; on and allowed it toggles that prayer | Intentional |
| 8 | Location row: "Use my location", and a default location when refused | **No default city**: Set location or Use my location, plus **Enter a city** (a search, with name and country shown) and a coordinates entry | Approved |
| 9 | The Kaaba marker is gold | The accent colour, with a square-in-circle shape (gold is only for verse markers) | Approved |
| 10 | "West-southwest, measured from true north" for 260.4 | **"West"**: the nearest of 16 points (270 is 9.6° away, west-southwest at 247.5 is 12.9°) | Fixed (the prototype was wrong) |
| 11 | A "turn your phone" slider to simulate the heading | Not built; on a device without a compass the dial is static, with the bearing and cardinal point and no "turn" text | Approved |
| 12 | The dial's centre reads "your heading" | "you are facing" (live) or "Qibla" (static) | Intentional |
| 13 | A "Turn right 60°" pill under the bearing | A status line (a live region), with a check icon and the words when aligned | Intentional |
| 14 | No compass permission, accuracy, declination or interference messages | An explanation before the iPhone tap; a denied state; the accuracy note; "Corrected for your location (2.2° east) using the World Magnetic Model, valid to 2030."; the interference sentence | Added (approved) |
| 15 | Segmented tabs, one page | Underlined tab links, one URL each (`/prayerTime`, `/qibla-direction`) | Intentional |
| 16 | A mini player bar always at the bottom | Hidden until something plays | Intentional for now |
| 17 | Header title "Prayer & Qibla" on both tabs | The shell title: "Prayer times" or "Qibla" (the page `h1` is "Prayer & Qibla") | Shell decision (Phase 1) |

The sidebar and header differences are the Phase 1 ones (`docs/design/home-compare/README.md`).

**Looked at individually:** the desktop light Prayer times pair; the mobile dark Qibla pair; states: Qibla aligned (mobile dark), city search with results (desktop light), iPhone compass denied (mobile dark), Friday with Ja'fari and Jumu'ah (desktop light). **Generated but not examined one by one:** the other six pairs and the other 30 state shots (no location, loading, after Isha, Hijri adjusted, nothing saved and offline, Update now failed, city with no match, bells on, Qibla with no location, no sensor, live and not aligned, iPhone permission and accuracy, at both sizes).
