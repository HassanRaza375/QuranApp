# Phase 5: Prayer times and Qibla

- Branch: `revamp-design-logic`
- Date: 2026-10-16
- Status: Done, awaiting review
- Plan and decisions: `phase-05-prayer-qibla-plan.md` (including the Open-Meteo terms record)

## Goal

The real Prayer & Qibla page for `/prayerTime` and `/qibla-direction` (prototype `d-page-prayer` and `m-page-prayer`): the next-prayer card and schedule on the Phase 1 monthly cache, the Hijri date with the Settings adjustment, a location you can set by GPS, by city search or by coordinates, and a Qibla compass that corrects for magnetic declination.

## Scope

- Routes (both kept): `/prayerTime` and `/qibla-direction` each render one component, `components/prayer/PrayerPage.vue`, with two **links** as tabs (`aria-current`); switching is an in-app navigation and fetches nothing.
- Components (`app/components/prayer/`): `PrayerPage`, `TimesPanel`, `ScheduleList`, `QiblaPanel`, `QiblaCompass`, `LocationRow`, `SavedRow`, `CityEntry`. **`LocationRow` and `SavedRow` are the same components Settings, Prayer & location now uses** (one implementation; Settings' own copies were removed).
- Logic (`app/lib/`, pure and unit-tested): `compass.ts`, `declination.ts` (+ `app/data/wmm2025.generated.ts` from `scripts/gen-wmm.mjs`), `prayerRows.ts`, `hijriAdjust.ts`, `geocode.ts`; additions to `prayerClock.ts` (`countdownLabel`, `fractionBetween`) and `location.ts` (`source: "manual"`, `label`). Composables: `useCompass`, `usePlaceSearch`; `useLocation` gained `setManual`.
- Settings: Prayer & location uses the shared rows (so it also has "Enter a city"); Data & privacy has a "Place search" row with the attribution.
- No new fetching logic for prayer times: `usePrayerTimes` (cache first, background refresh, atomic swap, month roll-over) is unchanged.

## Approved decisions (from the plan review)

1. City search: Open-Meteo plus a latitude and longitude entry; terms read first (below); only the typed text is sent, only on Search, and it is shown; the returned name and country are shown; `source: "manual"` is additive.
2. The declination correction is built and tested against NOAA's published values; it ships only because every value passed.
3. The tag is **"Latest"** (the most recent start that has passed); "Next" for the upcoming one; **no ruling** on when a prayer time ends.
4. Alignment within 5 degrees; one short vibration on entering it, never repeated while aligned; Reduce motion respected.
5. The Kaaba marker is the accent colour (and a distinct shape).
6. No Arabic prayer names until a verified list is supplied.
7. Countdown in minutes; seconds only in the final minute.
8. The city entry and the saved-times row are shared with Settings.
Holds: the saved-location record stays additive; on iPhone the compass permission comes from a tap after a short explanation, with tests for the denied and no-sensor states; the desktop shows a static dial with no fake rotation; Qibla is offline level A once a place is saved; the Hijri adjustment is applied in the app and never in the cache key.

## Open-Meteo terms (read 2026-10-16)

The free API is for **non-commercial use** ("operating websites or apps that have subscriptions or display advertisements" is commercial); the data is **CC BY 4.0** and a link must be shown next to location data; GeoNames asks for credit with a link; free limits are far above this use (one request per press of Search). The app shows "Place search by Open-Meteo.com, with location data from GeoNames" (a link to open-meteo.com) and a link to the CC BY 4.0 licence next to the results, and again in Settings, Data & privacy. **If the app ever gains subscriptions or advertising the place search needs a commercial key or must go (the coordinates entry stays).** The terms do not define "non-commercial"; the reading is mine and the owner should confirm it (CONTENT_TO_VERIFY.md).

## What was built

### Prayer times tab
- **Next prayer card:** name, time, "in 2h 34m" (minutes; "42s" only in the final minute, and the page ticks every second only then), the location's Hijri and Gregorian date, and a thin bar between the latest prayer and the next, drawn only when both times are known. After Isha it shows tomorrow's real Fajr, or "Fajr, tomorrow" with no time when tomorrow is not cached (never guessed).
- **Schedule:** Fajr, Sunrise (information: no tag, no bell), Dhuhr (**Jumu'ah** under it on a Friday, judged from the location's day key, not the device), Asr, Maghrib, Isha. Tags: **Latest** and **Next**. The word "Now" appears nowhere (a test checks the page text). 56px rows.
- **Bell per prayer:** a button with `aria-pressed` and a name ("Notification for Asr: on"). With notifications on in Settings and allowed in the browser it toggles that prayer in `prayerSettings.enabledPrayers` (the same record Settings writes; unknown fields are kept; no permission prompt is ever triggered here). Otherwise it is a link to Settings, Notifications with the reason ("Turn on prayer notifications in Settings"). "Reminders only appear while Quran App is open." shows when any bell is on.
- **Rows under the list:** Calculation (the method name the service returned, Asr for Sunni, the fiqh, and a Change link to Settings), Location, Saved prayer times (months saved, last updated, Update now with the Phase 1 atomic swap, offline and failure messages).
- **States:** no location (Set location, Enter a city; no times, no request, no position prompt); loading skeleton; failed with nothing cached ("Sunni prayer times need a connection once." with Try again; for Ja'fari it adds "Your Sunni times, if saved, are still on this device."); refreshing; refresh failed or offline with the saved times kept and a note; today's day missing from the month.
- **Time zones:** "today", Friday and Next are all judged in the **location's** zone (a test uses a device eleven hours behind and still shows 15 Oct).

### Hijri date
From the cached day's own Hijri date (the service's, not calculated here). The Settings adjustment (minus 2 to plus 2) reads the cached day at today plus the adjustment (the next month's record for the edge), shows "Adjusted by +1 day", and when that day is not cached shows the **unadjusted** date with "Your +1 day adjustment is shown when the neighbouring day is saved." A browser test checks the request URLs carry no adjustment and the IndexedDB keys are identical with and without it.

### Location
- **No default city.** Set location (device position, only after a tap; refusal and timeout each say why and point to Enter a city; nothing is saved) and **Enter a city**.
- **The finding behind it:** AlAdhan's city endpoints return times but placeholder coordinates (8.8888888, 7.7777777) for every city, an unknown city is HTTP 400, and `/v1/cityInfo` is 404, so a city typed to AlAdhan gives no coordinates for the Qibla or the place-keyed cache.
- **City search:** one GET to Open-Meteo's geocoding API with only `name`, `count`, `language` and `format`; a "Sent to the place search: “Leicester”" line; up to 10 results each with place, region, country and coordinates ("Leicester, England, United Kingdom" and "Leicester, Massachusetts, United States" are different results, which is why the name and country are shown); an optional country filter; no match, offline (no request is attempted) and service-error states. A pick is saved as `quran:location:v1` `{ lat, lon, source: "manual", label, updatedAt }`.
- **Coordinates:** "31.5204, 74.3587", "31.52 N, 74.36 E" and similar are parsed and range-checked; anything else is refused with an example.
- **Legacy compatibility (tested):** the saved place lives in the **new** key, which the legacy app never reads; the legacy `last_location` is left **exactly** as it was, so the legacy Qibla page still reads its own record; a record with an unknown `source` reads as `device` and extra fields are ignored. (The plan and Phase 1 rule "saving writes only the new key" is unchanged.)

### Qibla tab
- **Bearing:** the Phase 1 formula, now checked against AlAdhan's own `/v1/qibla/<lat>/<lon>` for **eight cities** (Lahore, Leicester, Sydney, New York, Jakarta, Cape Town, Tehran, Toronto; recorded responses): all agree to better than 0.001 degrees. Shown to one decimal with the nearest of 16 points. **The prototype's "West-southwest" for 260.4 was wrong: the nearest point is West** (270 is 9.6 degrees away; west-southwest at 247.5 is 12.9).
- **Sources, in order:** iPhone `webkitCompassHeading` (with `webkitCompassAccuracy`), Android `deviceorientationabsolute`, any other browser's `deviceorientation` only when `absolute: true`. **A relative `alpha` is never used** (the legacy page used it, which is not referenced to north on Chrome for Android); a test sends one and the page stays in the no-compass state.
- **Tilt and rotation:** the heading is computed from `alpha`, `beta` and `gamma` (a flat phone gives its top edge, an upright one its back) and the screen's rotation angle is added in landscape.
- **Declination:** a phone reports a heading from magnetic north; the bearing is from true north. `lib/declination.ts` is a self-contained implementation of NOAA's World Magnetic Model 2025 (degree 12) on NOAA's own coefficient file (`scripts/gen-wmm.mjs` generates `app/data/wmm2025.generated.ts`; a test compares it with the file). **Verified against NOAA's published values: all 12 lines of `WMM2025_TEST_VALUES.txt` (X, Y, Z within 0.05 nT, declination within 0.005 degrees; the test allows 0.1 nT and 0.01 degrees) and all 100 lines of the test file in NOAA's coefficient zip (declination within 0.01 degrees, components within 0.5 nT).** Valid 2025.0 to 2030.0 per NOAA; outside that (or at a pole) it returns a reason, and the page then says "Not corrected for magnetic declination ... the compass points to magnetic north" instead of guessing. Typical values at the cited date: Lahore about +2.2 degrees, Leicester about +0.8, New York about -12.5, San Francisco about +12.8. The page says "Corrected for your location (2.2° east) using the World Magnetic Model, valid to 2030."
- **Smoothing:** a circular low-pass (no jump across 359 and 0); under Reduce motion the heading follows at once. Reduce motion is read from the setting or the OS flag.
- **Aligned** within 5 degrees (stays aligned until 7, so it does not flicker at the edge): the ring turns the accent colour, the text reads "Facing the Qibla" with a check icon, and **one** vibration on entering alignment where the browser supports it (none on iPhone), never repeated while aligned (a test counts: one per entry).
- **Status text:** a polite live region that changes at most about once a second ("Turn right 40°", "Turn left 12°", "Facing the Qibla"). The timer uses `performance.now()`, not `Date` (the page's clock may be fixed or changed).
- **Accuracy:** an iPhone that reports an accuracy shows it ("Compass accuracy about ±8°"); one that is unsure (worse than 20, or invalid) asks for a figure of eight. The standing sentence stays on the page: "The compass may be a few degrees off, especially near metal, magnets or electronics. Hold the phone flat and away from them. Phone compasses can be off by 10° or more."
- **iPhone permission:** shown only on an iPhone or iPad (user agent, or an iPad in desktop mode), because desktop Chrome also defines `requestPermission` (and answers at once) and must not be treated as an iPhone. Before the tap the page shows a short explanation ("... asks for permission to read the phone’s motion and orientation sensors ... nothing is sent anywhere") and **nothing is requested or listened to** (a test counts zero calls and sends an event that is ignored). **Denied** (or a request that throws) shows the steps, the bearing to face, a fixed dial and Try again. The wording of the iPhone steps is not yet checked on a device.
- **No sensor (desktop):** after about 2 seconds without a usable reading the dial is static: north at the top, the marker at the bearing, no rotation, no "turn" text anywhere (tests check the dial's transform and the page text). The prototype's "turn your phone" slider is not built.
- **Cleanup:** every listener is removed with the arguments it was added with; a test tracks listeners by type, function and capture flag and sees 2 while the page is open and 0 after leaving (the legacy page leaked its listener).
- **Offline level A:** with a saved place the bearing and the compass need no network (a test goes offline with the AlAdhan mock refusing and the bearing still shows).

## Differences from the prototype

See `docs/design/prayer-compare/README.md`.

## Verification

- [x] `npm run verify` on Node 22.23.3: build, lint clean, **360 unit tests** (64 new: 19 for the declination, 45 for the compass maths, rows, Hijri, city search and the location record), dev-server smoke test, **235 browser checks** (37 new). An earlier full run had two failures, both fixed and the whole suite re-run: a compass test that miscounted vibrations (the dial sweeps through the Qibla on its way, so only the vibrations after settling are counted) and a layout-shift measurement in the Phase 4A reader test that included a scripted 4,000 px scroll (the budget now applies to the shift while the page loads, 0.014; the scroll figure is recorded only).
- [x] **Declination against NOAA's published test values: every value passes** (12 of 12 in `WMM2025_TEST_VALUES.txt`, 100 of 100 in the test file inside NOAA's coefficient zip), and the generated coefficients equal NOAA's `WMM.COF`.
- [x] **Qibla bearing against AlAdhan's `/v1/qibla`:** eight cities, all within 0.001 degrees.
- [x] Browser tests (`e2e/prayer.spec.ts`): both routes and the tab links, no reload and no new request on a tab switch; Home's tiles; no location (no times, no request, no position prompt); Set location granted and refused; the city search (what is sent, the results with place and country, the pick saved as `manual`, a country filter, no match, a failing service, offline with no request attempted, coordinates, bad coordinates, the legacy `last_location` untouched); the card, Latest and Next tags and no "Now", the Sunrise row, the dates; Jumu'ah on Friday only; the location's day on a device eleven hours behind; Ja'fari; the Hijri adjustment (note, no adjustment in any request, identical IndexedDB keys); the bell (Settings link and no prompt when off; the exact `prayerSettings` shape when on; the keyboard); Update now (failure keeps the times, success, offline); nothing saved and offline, then Try again; offline reading and the Qibla tab; switching to Ja'fari offline; 375px (rows 55px or more, 44px targets, no horizontal scroll); the Qibla bearing offline; no location; no sensor (static dial, no rotation, no turn text); Android sensor events (corrected heading, "Facing the Qibla", one vibration per entry, "Turn right 60°" and "Turn left 40°", a relative event ignored, Reduce motion, no listener left behind); the iPhone flow (nothing before the tap, an event before the tap ignored, granted with the accuracy notes, denied, Try again, a throwing request treated as denied); light and dark; Settings with the shared rows and the privacy row.
- [x] Screenshots: `docs/design/prayer-compare/` (see its README for what was looked at one by one).
- [ ] **Real devices:** none was used. The compass was tested only with synthetic orientation events.
- [ ] Screen-reader pass (not done).

## Open issues and risks

1. **Real devices are untested** (yours, below). Three things in the compass are derived rather than observed: the **sign of the screen-rotation correction in landscape** (the top-edge heading plus the screen angle), whether the **iPhone value is already true or magnetic** heading, and the exact **iPhone permission wording after a refusal**.
2. **The Open-Meteo reading of "non-commercial"** is mine; if the app gains subscriptions or advertising the place search must change.
3. **WMM2025 expires in 2030** (NOAA: valid to late 2029, input range to 2030.0). After that the page honestly says it is not corrected; the coefficients need replacing (`scripts/gen-wmm.mjs`), tracked in PROGRESS.md.
4. **"Latest" is only a start time**; it can be Fajr well after sunrise. It is deliberately not "Now".
5. **No Arabic prayer names** until a verified list is supplied.
6. The compass hysteresis (aligned within 5, kept until 7) and the one-vibration rule are decisions, not facts about devices.
7. A place found by name is only as good as the geocoder's answer; the page shows what was returned so you can confirm it.
8. **Ja'fari times** are still only compared with AlAdhan's own two endpoints (pre-cutover item).

## Your real-device checks

- GPS and Set location: allow, deny, and enter a city; the saved place is not replaced by GPS jitter (10 km rule).
- The compass on an iPhone (Safari and the installed app) and on Android Chrome: the Enable compass prompt, the needle against a real compass or a trusted app **in your city** (this decides whether the declination correction is right), tilt, landscape, the accuracy note, the aligned state and the vibration.
- A notification reminder (a bell on, a reminder firing while the app is open) and Update now on a real network.
- The Hijri date against a calendar you trust (15 Oct 2026 shows 4 Jumādá al-ūlá 1448 from the service), and the adjustment at a month edge.
- The Ja'fari times against a source you trust.

## Next phase needs

Phase 8 (Ramadan and events) reads the same monthly cache (and the Hijri date from it). Phase 13 (Daily Fiqh) keeps `quran:fiqh-prefs:v1`. Phase 16: the pre-cutover Ja'fari comparison; replace the WMM coefficients before 2030.
