# Phase 5: Prayer times and Qibla (plan, awaiting approval)

- Branch: `revamp-design-logic`
- Prototype: `d-page-prayer` and `m-page-prayer` (`timesHTML`, `qiblaHTML`, `compassSVG`, `dayRows`, `bellHTML`, `updateQibla`, `renderPrayer`).
- Routes (both legacy routes kept): `/prayerTime` (Prayer times tab) and `/qibla-direction` (Qibla tab).
- Offline level: **times B** (after the first month fetch), **Qibla A** once a location is saved (the bearing is calculated on the device; the compass needs no network).

No code is written until this plan is approved. Done before the plan: the goals-count decision was recorded (page doc, PROGRESS.md Phase 15 row, CONTENT_TO_VERIFY.md); the translator and tafsir attribution stays an open item.

## 1. What the legacy app does (read from `pages/prayerTime.vue`, `pages/qibla-direction.vue`, `stores/prayer.js`)

- **`/prayerTime`:** a header card (Hijri date and month name, the Gregorian date, "Next prayer in" `Xh Ym Zs`, the Qibla bearing), five cards (Fajr, Dhuhr, Asr, Maghrib, Isha; the next one highlighted) and a "Refresh Times" button. No Sunrise, no Jumu'ah, no "Now", no bell, no calculation or location rows, no cache information.
- **Data:** the daily endpoint `GET /v1/timings/<dd-mm-yyyy>?latitude&longitude&method...`, cached in `localStorage` under `prayer_<lat>_<lon>_<fiqh>_<day>` (one key per day, never cleaned).
- **Location:** device geolocation on **every page load** (`layouts/default.vue` calls `prayer.init()`), and **a silent fall back to Lahore** when it is refused, so a refused permission shows Lahore's times as if they were yours (Settings said so in one line).
- **Next prayer:** after Isha it shows "Fajr" with a countdown computed against today's Fajr time moved by one day (an approximation of tomorrow's Fajr).
- **Countdown:** a one-second timer. **Auto refresh** at the next prayer + 5 s.
- **`/qibla-direction`:** bearing from a spherical formula (same as the revamp's `lib/qibla.ts`), a dial with a needle that follows `deviceorientation`.
  - **Android bug (to fix, not copy):** it reads `event.alpha` from `deviceorientation`, which on Chrome for Android is relative to an arbitrary starting direction, not to north (north-referenced values come from `deviceorientationabsolute`), so the legacy needle is only right by accident on many Android phones. iPhone uses `webkitCompassHeading` correctly.
  - It also ignores the screen rotation, uses no tilt compensation, ignores magnetic declination, and vibrates `[60, 40, 60]` every 2 s while aligned (a threshold of 2°).
  - `removeEventListener("deviceorientation", handler)` is called without the `true` capture flag it was added with, so the listener is never removed (a leak while the page is closed).
  - A device with no sensor (desktop) shows a dial that never moves and no explanation. A refused permission gets no message.
  - Location: reads `last_location`, then calls geolocation again with no error handling.
- **`last_location`** `{ lat, lng }` is written by the Qibla page and read by the revamp already (Phase 1, read only).

## 2. Routes and the tab control

Both routes render one component, `components/prayer/PrayerPage.vue`, with a `tab` prop (`times` or `qibla`), the same pattern as the listing. The tabs are **two links** (`/prayerTime` and `/qibla-direction`, `aria-current="page"`), not a widget, so each tab has its own URL, back button and bookmark. Switching tabs is a client-side navigation: the location and the cached months live in shared state (`useLocation`, `usePrayerTimes`), so nothing is fetched again. One `h1` "Prayer & Qibla" (the prototype's page title), the header shows "Prayer times" or "Qibla" (the nav titles). The nav keeps its two rows (Prayer times, Qibla). Home's two tiles already link to the two routes.

## 3. Prayer times tab (on the Phase 1 data layer, no new fetching logic)

Everything reads `usePrayerTimes()` (cache first, background refresh, atomic swap, month roll-over, keyed by rounded place, method, Asr school and month in `quran-revamp-db`). **No new endpoint and no change to the cache.**

- **Next prayer card:** name, time (12-hour), "in 1h 34m", and the Hijri and Gregorian date of the location's day. The countdown is at **minute precision** (the Phase 1 decision: no per-second updates, no per-second screen-reader noise). After Isha it shows tomorrow's real Fajr time, or "Fajr, tomorrow" with no time when tomorrow is not cached (never guessed, as Home does). A thin progress bar between the last and the next prayer is drawn only when the earlier time is known (not after a cache gap).
- **Schedule list:** Fajr, **Sunrise** (information row, no bell), Dhuhr (with **Jumu'ah** under it on Fridays, judged on the location's calendar day), Asr, Maghrib, Isha. Past rows are dimmed, the **Next** tag is solid, the **Now** tag is outlined (definition in open question 3). Times come from the cache as "4:32 AM".
- **Bell per prayer** (a real button with `aria-pressed` and a name: "Notification for Asr: on"):
  - Notifications on in Settings and permission granted: tapping toggles that prayer in the legacy `prayerSettings.enabledPrayers` (the same record Settings writes, so both stay in step at once).
  - Notifications off or blocked: the bell is disabled in look and links to Settings, Notifications ("Turn on prayer notifications in Settings"), as in the prototype. No permission prompt is triggered here.
  - Beside the list: "Reminders only appear while Quran App is open." (the fixed Phase 2 sentence) when any bell is on.
- **Calculation row:** the method name the service returns, Asr school for Sunni, the fiqh name, and **Change** (a link to Settings, Prayer & location).
- **Location row:** the saved place, **Set location** / **Use my location** (device position, after a tap only), and **Enter a city** (section 5). No default city, ever.
- **Saved prayer times row:** which months are saved, "Last updated", **Update now** (the Phase 1 atomic swap: fetch first, replace only if it succeeds, keep the old times on failure), offline and failure messages. The same row component is used by Settings (one implementation, so the two pages cannot drift apart).

### States (every one has text, none is a blank or a spinner that never ends)
| State | Shows |
| --- | --- |
| No location | "Set your location to see prayer times." with Set location, Enter a city; no times |
| Asking for the device position | The button reads "Asking…" and is disabled |
| Position refused or unavailable | The reason in words and the other ways (Enter a city) |
| Loading, nothing cached | A skeleton of the card and six rows |
| Ready | The card, the list, the rows |
| Refreshing | Times stay; "Updating…" on the saved row |
| Refresh failed, times cached | The times stay; "Couldn’t update (<reason>). The saved times are still in use. Last updated <when>." |
| Offline, times cached | The times stay; "You’re offline, so the saved times are still in use. Last updated <when>." |
| Offline or failed, nothing cached | "Needs a connection once to load prayer times." with Try again |
| Day rolls over / month ends | The Phase 1 logic loads the next month; "Fajr, tomorrow" without a time until it arrives |
| A different school or method | See section 7 |

## 4. Hijri date and the adjustment

- **Source:** the monthly cache. Every cached day carries the service's own Hijri date (`day`, `month`, `monthNameEn`, `year`); nothing is calculated here.
- **Adjustment** (Settings, minus 2 to plus 2): the shown date is the cached day at `today + adjustment` (the method the Settings preview already uses), so the cache and its key do not change. At a month edge the neighbouring day comes from the next month's record, which is cached when fewer than 7 days remain. When it is not cached (first or last day, nothing in the cache for that month) the page shows the **unadjusted** date with "Adjustment shown when connected" rather than guessing the month length. A note under the date says "Adjusted by +1 day" whenever the setting is not 0.
- The Hijri month name is the service's English transliteration (data, not typed text).

## 5. Location, and the city entry (a finding that needs a decision)

- **What exists:** `useLocation` (saved place in `quran:location:v1`, legacy `last_location` read only, device position only after a tap, 10 km rule so jitter never changes the cache key).
- **Finding:** the plan assumed AlAdhan's "by city" endpoints could supply a manual place. I tested them (2026-10-16): `calendarByCity` returns the times and the time zone, but its `meta.latitude` and `meta.longitude` are the placeholder **8.8888888 and 7.7777777** for every city, an unknown city is an HTTP 400 ("Unable to geocode address"), and `/v1/cityInfo` returns 404. So a city typed into AlAdhan yields times but **no coordinates**, which the revamp needs for the Qibla bearing and for its place-keyed cache (and for the Phase 1 notification scheduling).
- **Proposal:** a small city search with **Open-Meteo's geocoding API** (`geocoding-api.open-meteo.com/v1/search?name=<city>&count=10`): free, no key, CORS open, returns latitude, longitude, time zone, country and region for each match (its data comes from GeoNames). **Its licence and terms of use are to be confirmed before shipping** (I believe the data needs an attribution and the free service is meant for non-commercial use; I have not read the terms). The page shows the matches ("Leicester, England, United Kingdom", "Leicester, Massachusetts, United States") and you pick one; a country typed in the second field filters the list on the client. The pick is saved in `quran:location:v1` as `{ lat, lon, source: "manual", label, updatedAt }` (additive: the legacy app and the existing reader ignore the extra fields; `source` gains one value). From then on it behaves exactly like a device position (same cache key rules, same Qibla, same reminders).
- **Cost and privacy:** it is a **new third-party service**; what is sent is the typed city name (nothing else), only when you press Search, and the result list needs a connection. The attribution line ("Place search by Open-Meteo.com, data from GeoNames") is shown under the field, and it is added to Settings, Data & privacy. Offline, the search says so; a saved place keeps working offline.
- **States:** empty, searching, no match ("No place found for “xyz”. Check the spelling, or add the country."), offline, service error with Try again, and the saved place with a clear label ("Leicester, England, United Kingdom") instead of raw coordinates.
- **Alternatives:** entering latitude and longitude by hand (no service, poor to use), or AlAdhan's city endpoint for the times only (no Qibla, a second cache key space). Open question 1.
- The same entry is added to Settings' Location row (the shared component).

## 6. Qibla tab

### The bearing (no network)
`lib/qibla.ts` (the Phase 1 function, unchanged). **Checked against an independent source:** AlAdhan's own `/v1/qibla/<lat>/<lon>` for Lahore (260.3658 here, 260.36586 there), Leicester (118.9196, 118.9197) and Sydney (277.4996, 277.4996): they agree to better than 0.001°. A unit test records those three responses. The bearing is shown to one decimal and as a cardinal name ("West-southwest, measured from true north") from a 16-point table.

### The compass
- **Sources, in this order:** `webkitCompassHeading` (iPhone and iPad Safari), then `deviceorientationabsolute` (Chrome for Android: `alpha` measured from north, heading = 360 minus alpha), then `deviceorientation` **only when `event.absolute` is true**. A plain relative `alpha` (the legacy behaviour) is never used as a heading. If none produces a value within about 2 seconds the page switches to the no-sensor mode.
- **Tilt and rotation:** the heading is computed from `alpha`, `beta` and `gamma` (the standard compass-heading formula), so it is right when the phone is not perfectly flat, and the screen rotation angle is subtracted, so landscape works.
- **Magnetic declination:** both the iPhone and the Android sources are expected to report a heading from **magnetic** north (to be confirmed on devices), while the bearing is from **true** north; the difference (declination) is a few degrees in Pakistan and the UK, about 12° in the western United States and more in parts of Canada. Without a correction the needle points that far off. Proposal: a small World Magnetic Model calculation (`lib/declination.ts`, the NOAA model, public domain; the coefficients are numbers) tested against **NOAA's own published test values**, so no dependency and a verifiable result. Open question 2. (To confirm on a device: whether the iPhone value is already true heading when location is allowed.)
- **Smoothing:** a low-pass filter on the circular angle (no jump across 359 to 0); no animation under Reduce motion (the dial turns directly).
- **Aligned** within **5°** (the prototype; the legacy app used 2°, finer than phone compasses can deliver): the ring turns the accent colour, the text reads "Facing the Qibla" with a check icon (never colour alone), and a **single** short vibration where the browser supports it (not every 2 seconds as legacy did). Open question 4.
- **Status text** is a polite live region that changes only when the wording changes (at most about once a second: "Turn right 40°", "Turn left 12°", "Facing the Qibla"), so a screen reader is not flooded.
- **Accuracy messaging:** iPhone reports `webkitCompassAccuracy` (degrees; negative = invalid): "Compass accuracy about ±15°. Move your phone in a figure of eight to improve it." Android reports none, so the general line is shown: "Phone compasses can be off by 10° or more. Hold the phone flat and keep it away from metal and magnets." A calibration note appears whenever accuracy is worse than 20° or invalid.
- **Permission (iPhone, iPad):** `DeviceOrientationEvent.requestPermission` exists, so the page shows **Enable compass** (it must be called from a tap) with a line saying why. Granted: the dial starts. Denied: "Compass access was declined. To allow it, ..." with the steps for Safari (to be verified on a device before the wording is final). Android: no prompt (a sensor that does not answer falls to the no-sensor mode).
- **Needs HTTPS** for the sensors (the preview and production are HTTPS; `localhost` works in development).
- **No sensor (desktop, some tablets):** a **static dial** with north at the top and the Qibla marker at the bearing, the bearing and cardinal name, and "This device has no compass. Face <bearing>° (<name>) from north, or open this page on a phone for a live compass." The prototype's "turn your phone" slider is a prototype control and is **not** built.
- **No location:** the same Set location and Enter a city actions; the dial is not drawn without a bearing.
- **Prototype colour:** the Kaaba marker is gold in the prototype; gold is reserved for verse markers, so it is the accent colour with a distinct shape (Open question 5).
- **Cleanup:** every listener is removed with the same arguments it was added with (a test checks no `deviceorientation` listener remains after leaving the page; the legacy page leaked).

## 7. Fiqh, calculation and offline

- Both traditions work from the cache: the key holds the place, the **method**, the **Asr school** and the month; Ja'fari always sends `school=0` and `midnightMode=1` (Phase 1). Switching fiqh, method or school (in Settings) makes `usePrayerTimes` clear the in-memory record that no longer matches and load the one for the new key: **cached** gives the new list instantly; **not cached** shows the skeleton and "Loading Ja’fari times…"; **offline and not cached** shows "Ja’fari times need a connection once. Your Sunni times are still saved." with Try again (and the previous combination is still in the cache, so switching back is instant). The Calculation row always names what is on screen.
- **Offline:** times work from the saved month (and the next month once cached); a new month or place needs a connection once; **Qibla works offline** with a saved place (calculation and sensors are local). Entering a city needs a connection (the search).

## 8. Files, tests, screenshots

- **Files:** `pages/prayerTime.vue`, `pages/qibla-direction.vue` (one line each); `components/prayer/` (`PrayerPage`, `NextPrayerCard`, `ScheduleList`, `PrayerInfoRows`, `SavedTimesRow` (shared with Settings), `CityEntry` (shared with Settings), `QiblaCompass`, `QiblaPanel`); `lib/` (pure and unit-tested): `prayerRows.ts` (statuses, Jumu'ah, sunrise), `hijriAdjust.ts`, `geocode.ts` (the search, parsing and filtering), `compass.ts` (heading from the sensor values, smoothing, shortest turn, alignment, cardinal names), `declination.ts`; `composables/useCompass.ts`; `useLocation` gains manual entry; Settings' Location row and Saved row use the shared components.
- **Unit tests:** the bearing against the three recorded AlAdhan responses; the row statuses and Now and Next for every moment of a day, Fajr to Isha and after midnight; Jumu'ah only on a Friday in the location's zone (a UTC and a Karachi case); Hijri with each adjustment including a month edge and a missing neighbour; the geocoder response parsing and the country filter with recorded Open-Meteo responses; the location record round trip with the legacy `last_location` untouched; the heading formula for known orientations (flat, tilted, landscape); the circular smoothing and shortest turn across 0/360; the declination against NOAA's test values; the bell writing the exact legacy `prayerSettings` shape.
- **Browser tests** (mocked AlAdhan with the real recorded fixtures from Phase 1, mocked Open-Meteo, fixed clock, `forbidRealApis`): both routes and the tab links; no-location state; Set location (stubbed geolocation: granted, refused, timeout); the city search (results, pick, no match, offline, error); times for Sunni and Ja'fari; the Now, Next and Sunrise rows and Jumu'ah on a Friday; the bell (on, off, the Settings link, the exact keys); Update now (success, failure keeps the old times, offline); Hijri adjustment shown; offline after one fetch; switching fiqh (cached, not cached, offline); the Qibla page with **synthetic orientation events**: `deviceorientationabsolute` (Android), `webkitCompassHeading` (iPhone) and the permission flow (granted and denied) with a stubbed `requestPermission`; aligned and not aligned; the no-sensor static dial; no listener left after navigating away; the live region text; Reduce motion; keyboard; 44px at 375; one `h1`; light and dark.
- **Screenshots (prototype next to revamp):** both tabs at **1280 and 375, light and dark** = 8 pairs, plus revamp-only state shots: no location, city search with results, no match, loading skeleton, refresh failed, offline, Ja'fari with Jumu'ah on a Friday, a bell on and off, notifications-off bell, the Hijri adjustment note, the compass **aligned and not aligned**, the iPhone permission prompt state and its denied state, the no-sensor static dial, the accuracy note. I look at every one and say which I only generated.
- **Docs:** phase doc, `docs/pages/prayer-qibla.md`, PROGRESS.md, CONTENT_TO_VERIFY.md, the Settings page doc (the new Location entry).

## 9. Real-device checks you must do (listed now so nothing is claimed that was not tried)

1. **GPS** on a phone: Set location (allow, then deny) and that the saved place is not replaced by jitter (10 km rule).
2. **Compass on an iPhone** (Safari and the installed app) and **on Android** (Chrome): the Enable compass prompt, the needle direction against a known direction, tilt, landscape, the accuracy note, the aligned state and vibration. Compare with another compass app; this decides whether the declination correction is right in your city.
3. **Notification permission and a reminder** on a phone (turning a bell on, a reminder firing while the app is open).
4. The **Hijri date** against a calendar you trust, and the adjustment at a month edge.
5. The **Ja'fari times** against an independent source (the existing pre-cutover item, CONTENT_TO_VERIFY.md).

## Open questions

1. **City entry service.** Add Open-Meteo's geocoding (a new third-party service; only the typed city name is sent, on Search; attribution shown), or enter latitude and longitude by hand only, or both? (AlAdhan's city endpoint cannot be the only source: it returns no coordinates.)
2. **Magnetic declination.** Include the World Magnetic Model correction (our own small implementation, tested against NOAA's published values), or leave the compass relative to magnetic north and say so on the page?
3. **What "Now" means.** The tag marks the prayer whose time has started and not yet ended: Fajr until sunrise; every other prayer until the next listed time; Isha until Fajr. For Ja'fari the Dhuhr and Asr (and Maghrib and Isha) windows overlap in practice, so the tag is the **latest start** and makes no ruling. Same tagging for both fiqhs, with this definition in CONTENT_TO_VERIFY.md. OK, or a neutral label ("Latest") instead of "Now"?
4. **Alignment and vibration.** 5° (prototype) rather than 2° (legacy), and one short vibration on entering alignment (none on iPhone: not supported). OK?
5. **Marker colour.** The Kaaba marker in the accent colour with a distinct shape instead of the prototype's gold. OK?
6. **Arabic prayer names.** The prototype shows الفجر, الشروق and so on beside each row. The service returns English names only and nothing in the legacy data has them; I would leave them out rather than type them. Or supply a verified list.
7. **Countdown precision.** Minutes (the Phase 1 rule) instead of the prototype's seconds. OK?
8. **Settings.** The same city entry and saved-times component also go into Settings' Location and Saved rows (one implementation). OK?

## Risks

- **Compass accuracy** varies by phone and place; the page says so and shows what the sensor reports. The correction (question 2) cannot be verified without devices.
- **The geocoder** is outside the existing services, and its terms are not yet read (question 1).
- **iOS permission wording** for a refusal must be checked on a device.
- **Time zones:** every "today", Friday and Now is judged in the **location's** zone from the cache, never the device's (a test fixes the device zone far from the place).
- **Ja'fari data** is still only compared with AlAdhan's own two endpoints (pre-cutover item).

## Not part of Phase 5

Ramadan and events (Phase 8), Tasbeeh and the other utilities (Phase 9), push notifications while the app is closed (not possible without a backend), local calculation without the service (a later fallback in `docs/PLAN.md`), the Daily Fiqh pages (Phase 13).
