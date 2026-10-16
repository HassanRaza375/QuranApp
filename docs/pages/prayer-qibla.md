# Page: Prayer & Qibla

- Route(s): `/prayerTime` (Prayer times tab) and `/qibla-direction` (Qibla tab). Both legacy routes are kept; one component renders both.
- Phase: 5
- Prototype section: `d-page-prayer` / `m-page-prayer`
- Offline level: **Prayer times B** (after the first month fetch); **Qibla A** (once a place is saved: the bearing and the compass are local).
- Indexable: no.

## Purpose

When the next prayer is and what today's times are for your place and calculation, which way the Qibla is, and a compass to face it. Your place stays on this device.

## Layout

- One `h1` ("Prayer & Qibla") and the sentence "Times and direction for your location." Two tab links: Prayer times and Qibla (`aria-current`). The header shows "Prayer times" or "Qibla".
- **Prayer times:** the next-prayer card (name, time, "in 2h 34m", a thin progress bar when both ends are known, the Hijri and Gregorian date); the schedule (Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha: a "Latest" tag on the most recent start that has passed, a "Next" tag on the upcoming one, "Jumu’ah" under Dhuhr on a Friday, a bell per prayer); then a bordered group with **Calculation**, **Location** and **Saved prayer times**.
- **Qibla:** the dial and the bearing ("260.4°", "West, measured from true north"), the facing status, a card for the compass state (permission, denied, no compass), the accuracy and declination notes, the standing interference sentence, and the Location row.
- Mobile: the same, one column; the dial is at most 320px wide; every control is at least 44px.

## States

| State | What shows |
| --- | --- |
| No location | "Set your location to see prayer times" (or "to find the Qibla") with Set location and Enter a city; no times, no dial |
| Asking for the position | The button reads "Asking…" |
| Position refused or unavailable | The reason, and "enter a city"; nothing is saved |
| Loading, nothing cached | A skeleton of the card and six rows |
| Ready | The card and the schedule |
| Refreshing | "Updating… the saved times stay in use until the new ones arrive." |
| Refresh failed | "Couldn’t refresh the times (<reason>). The saved times are still in use." |
| Offline, times saved | "You’re offline, so the saved times are still in use." Update now is disabled with a note |
| Nothing saved, offline or failed | "Sunni prayer times need a connection once." with Try again (Ja'fari adds that Sunni times may still be saved) |
| City search | "Sent to the place search: “<what you typed>”", results with place, region, country and coordinates; no match; offline; service error |
| Hijri adjustment | "Adjusted by +1 day", or "... is shown when the neighbouring day is saved" |
| Compass: iPhone, before the tap | A short explanation and "Enable compass"; nothing is read |
| Compass: denied | The steps to allow it, the bearing to face, a fixed dial, Try again |
| Compass: no sensor | "This device has no compass ... Face 260° (West) from north"; a static dial |
| Compass: live | The dial turns; "Turn right 40°" or "Facing the Qibla"; the accuracy and declination notes |

## Data and storage

- Reads: the monthly prayer cache in `quran-revamp-db` (AlAdhan, fetched by `usePrayerTimes`), the saved place (`quran:location:v1`, then the legacy `last_location`), `prayerFiqh`, `quran:prayer-calc:v1`, `quran:hijri-adjust:v1`, `prayerSettings`, `quran:accessibility:v1` (Reduce motion).
- Writes: `quran:location:v1` (when you set a place), `prayerSettings.enabledPrayers` (a bell). Never `last_location`.
- Network: AlAdhan monthly times (Phase 1); **Open-Meteo place search** only when you press Search (the typed city only). Nothing else. The compass reads the device's sensors and sends nothing.

## Accessibility

- Tabs are links with `aria-current`. Each bell is a button with `aria-pressed` and a name ("Notification for Asr: on"). The dial is an image with a label that states the bearing (and the heading when live). The facing status is a polite live region that changes at most about once a second. Denied, no-compass and error states use `role="status"`.
- Alignment is never colour alone: the ring, the check icon and the words "Facing the Qibla".
- Reduce motion: the dial follows at once, no smoothing. One vibration on entering alignment, never repeated.
- 44px targets on mobile; one `h1`; light and dark.

## Not on this page (yet)

Arabic prayer names (until a verified list is supplied), push notifications while the app is closed, a local calculation fallback, the Ramadan timetable (Phase 8).
