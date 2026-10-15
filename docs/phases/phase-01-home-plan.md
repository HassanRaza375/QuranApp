# Phase 1: Home (plan, awaiting approval)

- Branch: `revamp-design-logic`
- Prototype: `d-page-home` and `m-page-home` (states: Returning user, New user). Render functions: `renderResume`, `renderUtil`, the quote block, `toggleSchedule`.
- Route: `/` (replaces the Phase 0 placeholder). Prerendered public page (title and description stay in `app/lib/publicMeta.ts`).
- Offline level: **A for the page, B for the ayah and the prayer times** (details below).

No code is written until this plan is approved.

## What the page contains (from the prototype)

1. **Ayah of the day**: label, Arabic, translation, reference, Share and Save icons.
2. **Resume card**: Returning user "Pick up where you left off" (two rows) or New user "Get started" (two rows).
3. **Four tiles**: Next prayer (name and countdown), Qibla (degrees), Today's goal, Hifz.
4. **"View today's prayer schedule"** toggle with five prayer chips; the next one highlighted.

What the legacy Home shows that the prototype does not (Hifz minutes estimate, today's Islamic event, Ramadan card, goal streak and pace, quick-link grid): see Open question 1.

## 1. Prayer-times data layer

### What the real API returns (checked on 2026-10-15)

- Endpoint: `GET https://api.aladhan.com/v1/calendar/{year}/{month}?latitude=&longitude=&method=&school=&midnightMode=`. The legacy `calendar?month=&year=` form answers with a 302 to this one, so the revamp calls it directly. CORS is open (`Access-Control-Allow-Origin: *`); rate limit about 12 requests per second.
- One response is a whole month: `data[]` with `timings` (Fajr, Sunrise, Dhuhr, Asr, Sunset, Maghrib, Isha, Imsak, Midnight, Firstthird, Lastthird), `date.gregorian`, `date.hijri` (day, month number and names, year), and `meta` (`timezone`, `method`, `school`, `midnightMode`).
- **Monthly times carry a suffix**: `"04:59 (PKT)"`. The daily endpoint the legacy app used returns plain `"04:59"`. The legacy parser (`split(":").map(Number)`) turns the minutes of the monthly format into `NaN`. The revamp parses with `^(\d{1,2}):(\d{2})` and accepts both.
- **Monthly equals daily**: 120 comparisons (Lahore, London, Qum, Toronto; Sunni and Ja'fari; days 1, 15, 31; five prayers) gave 0 differences. Ja'fari uses method 0 (Leva Institute, Qum; Fajr 16, Isha 14, Maghrib 4, midnight Jafari), as in the legacy `FIQH_PARAMS`.
- Times are local to the **location's** time zone (`meta.timezone`), not the device's. The next-prayer logic uses that zone.

### Storage: a new database, never the legacy one

- New IndexedDB database **`quran-revamp-db`**, version 1, object store `prayer-months` (key = string). `quran-app-db` is not opened, changed or version-bumped (rule recorded in CLAUDE.md and PLAN.md in this review round).
- **Key** (as in PLAN.md): `prayer:v1:<lat2>:<lon2>:<method>:<school>:<YYYY-MM>`, latitude and longitude rounded to 2 decimals. School is `0` (Standard) or `1` (Hanafi). `midnightMode` follows the method (Ja'fari is 1, Sunni 0) and is not in the key; if Phase 2 makes it a separate setting, the key version becomes `v2`.
- **Record**: `{ key, lat, lon, method, school, midnightMode, month, fetchedAt, timezone, label, days: [{ date: "YYYY-MM-DD", timings: { Fajr, Sunrise, Dhuhr, Asr, Sunset, Maghrib, Isha, Imsak, Midnight }, hijri: { day, month, year, monthNameEn } }] }`. Times are stored already parsed to `"HH:mm"`. The raw response is not stored.
- **Sticky location**: the stored location (new key `quran:location:v1`, `{lat, lon, label?, source, updatedAt}`) only changes when a new fix is more than about 10 km away, so GPS jitter never changes the cache key. This implements "moving more than about 10 km invalidates the key" from PLAN.md.
- **Never written**: the legacy day-keyed `prayer_<lat>_<lon>_<fiqh>_<DD-MM-YYYY>` and `calendar_v2_...` localStorage keys. They may be **read** (read-only) as a warm start: if there is no month cached yet and a `prayer_*` entry for today with the same rounded coordinates and fiqh exists, Home shows those five times labelled "from the saved copy". A unit test asserts that no legacy key is written (a fake storage that throws on any `prayer_` write).
- Legacy `last_location` (`{lat, lng}`, written by the Qibla page) may be read once to seed the location. It is never written.

### Fetch, validate, swap

1. Single flight per key (a second request for the same key waits for the first).
2. Fetch the month. **Validate before touching the cache**: HTTP 200 and `code: 200`; `data.length` equals the days in that month; each day has the five prayers parseable as `HH:mm`, in increasing order Fajr < Dhuhr < Asr < Maghrib < Isha; a `timezone`; the echoed `method.id` equals the requested one.
3. **Atomic swap**: one IndexedDB `readwrite` transaction does a single `put` of the complete record under the key (replaces the old month in one step; a failed transaction leaves the old record). Only after the transaction commits does the in-memory state change.
4. On any failure (offline, non-200, invalid data, rate limit, aborted write): the old record stays, nothing is partly written, and the UI shows the error text with a retry. Never an empty table.
5. A fetch timeout of 10 seconds.

### When it fetches

- On Home load: read the current month from the cache first and show it at once. If there is none, fetch it. If the record is older than 30 days, refresh quietly.
- **Next month in the background** when fewer than 7 days are left in the current month (PLAN.md).
- **Update now** (button in the schedule panel, below): fetches the current month (and the next one if inside the 7-day window), then swaps as above.
- Changing fiqh, method or school, or a location change of more than about 10 km, changes the key, so the new key is fetched; old keys stay (cheap) and are removed when older than 2 months.
- The "from 1 Sha'ban also fetch Ramadan" rule is **deferred to Phase 8** (Ramadan timetable); the cache and keys already support it.

### What the UI shows

- Last updated: "Last updated today at 9:14 AM", or "Last updated 12 Oct" for older, from `fetchedAt`.
- Method line under the schedule: "Sunni (ISNA)" or "Ja'fari (Leva Institute, Qum)", from the fiqh setting (`prayerFiqh`). Method and Asr school come from the legacy `FIQH_PARAMS` until Phase 2 adds the settings under new `quran:<feature>:v1` keys; the data layer already takes `{method, school, midnightMode}` as input, so Phase 2 only supplies them.
- States: *Fresh*, *Updating* ("the saved times stay in use until the new ones arrive"), *Offline* ("You're offline, so the saved times are still in use. Last updated ..."), *No data yet and offline* ("Needs a connection once to load prayer times", Retry), *Error* (same, with the reason), *No location* (below). Text matches the prototype's `ptNote` wording.

### Location (decision needed, Open question 4)

The legacy app silently falls back to Lahore when geolocation is unavailable or refused, which gives wrong times to everyone else. Plan: **no silent fallback**. Order: stored `quran:location:v1`, then legacy `last_location`, then (only on a tap of "Set location" in the tile) `navigator.geolocation`. If none, the Next prayer and Qibla tiles show "Set location" as a button. Nothing prompts for permission on page load.

### Next-prayer logic (pure, tested)

- Inputs: today's record, tomorrow's record, current instant, `timezone`.
- Prayer instants are built from the wall-clock time in the location's zone (a small `zonedTime` helper using `Intl.DateTimeFormat`; tests cover a DST change and a device zone different from the location zone).
- Next = first of Fajr, Dhuhr, Asr, Maghrib, Isha after now; after Isha it is **tomorrow's real Fajr** (the legacy app reused today's Fajr time). If tomorrow is not cached (month end, offline), the tile shows "Fajr · tomorrow" without a countdown rather than a guess.
- Countdown at minute precision ("1h 34m"), updated every 30 seconds, paused while the tab is hidden; `aria-live="off"` (no per-minute announcements).
- Qibla degrees: the legacy great-circle formula, copied into a pure `app/lib/qibla.ts` with tests against reference values (for example London is about 119 degrees).

## 2. Resume rows

Row 1, reading: legacy key `quran:reading-progress:v1` (`{surahNo, ayahNo, surahName, surahNameArabic, totalAyah, updatedAt}`), read only. Shows "Al-Baqarah · ayah 285 of 286" and "5% of the Qur'an completed" (position over 6236 ayahs, from the legacy `@legacy/utils/quranAyahCounts`). Link: legacy route `/surah/<n>#ayah-<a>`. The card is quiet: no streak, no badge.

Row 2, **persons-study** until Phase 7: legacy key `quran:persons-study:v1` (a record `personId -> {lastSection, passageView, lastSurahNo?, lastAyahNo?, updatedAt}`). The most recently updated entry with something worth resuming (the legacy rule: not just `overview` with no passage) gives:

- Title: "You were reading: **Key Lessons**" with the person's name (and Arabic name) from `@legacy/data/quranPersons`; meta line "Yusuf" style name plus section label from the legacy `SECTION_LABELS`.
- Link: `/persons/<id>` (the legacy page restores the section itself).
- Source of the pure logic: `@legacy/utils/personStudy` (no copy).

**Phase 7 switches this row to story chapters** with a new key (for example `quran:stories-progress:v1`, additive, versioned). The row component reads from one small adapter (`useResumeRows`), so the switch is one file. This is noted in PROGRESS.md for Phase 7.

New user rows: "Start with Al-Fatihah" (link `/surah/1`) and "Explore Prophets & People" (link `/persons`).

## 3. Ayah of the day

### The legacy bug

`useAyahOfTheDay` stores `ayah-of-day = { date: new Date().toISOString().slice(0,10), data }`. That date is **UTC**. East of UTC, local midnight to the UTC midnight is still "yesterday" in UTC terms: in Pakistan (UTC+5) the ayah does not change until 05:00, and between 00:00 and 05:00 it is the previous day's. West of UTC it changes too early (in the evening). It also picks at random each time (`ayah 1 to 7 of a random surah`), which for a surah shorter than the chosen ayah number (for example surah 108 has 3 ayahs) asks for an ayah that does not exist.

### The fix (the legacy app can still read it)

- **Same key** `ayah-of-day`, **same shape** `{ date, data }`, with `data` having the same fields the legacy component reads (`arabic`, `translation`, `surah_name`, `ayah_number`, `surah_number`, `urdu`), plus **one additive field `localDate`** (`"YYYY-MM-DD"` from the device's local calendar fields, never `toISOString`). Extra fields are ignored by the legacy code.
- The revamp treats the entry as today's when `localDate === localToday`. If `localDate` is missing (written by the legacy app) it falls back to `date === localToday`, which can only err toward fetching a new ayah, never toward showing a stale one.
- When the revamp writes, `date` is set to the UTC date of "now", exactly what the legacy code compares against, so the legacy app keeps showing the same ayah the revamp chose for the rest of that UTC day. Worst case when both apps are used on one device: each may replace the entry once, a different ayah appears; nothing breaks.
- **Deterministic choice**: the ayah is derived from the local date (a seeded pick), not `Math.random()`, so a reload, a second tab and a second device show the same ayah, and no network call is needed to decide. The pick uses only valid surah and ayah pairs (legacy `quranAyahCounts`). Which pool (Open question 3): the legacy rule (any surah, ayah 1 to min(7, count)) or any of the 6,236 ayahs.
- **Text** comes only from the existing verse service (`/<surah>/<ayah>.json`). Translation: the user's `translationDefaultLang` if set, else English (the legacy card showed Urdu). The Arabic is `arabic1`.
- Fetch once per day; the `quran-api-cache` service-worker rule and the stored entry make later loads offline.

### Save and Share

- **Save** toggles the bookmark key `ayah:<s>:<a>` in `quran:bookmarks:v1` and `quran:bookmarks:added-at:v1`, same formats as `useBookmarks` (read, change, write back; unknown keys kept). Removing shows an **Undo toast** (no confirm).
- **Share**: the Web Share API with the reference and text where available, else copy to the clipboard with a toast. The designed share card is Phase 4.

## 4. New versus returning user

Pure function `detectUserState(readLegacyKeys)`, tested with seeded values. The page shows the **Returning** layout when **any** of these holds, each checked defensively (missing, empty and corrupt values count as "no"):

- `quran:reading-progress:v1` is an object with `surahNo`
- `quran:persons-study:v1` has at least one entry
- `quran:bookmarks:v1` is a non-empty array
- `quran:reading-goals:v1` has a goal
- `quran:hifz:v2` (or `v1`) has at least one target
- `quran:library:v1` has a collection or a note
- `quran:downloads:v1` is non-empty
- `ayah-of-day` alone does **not** count (it is written by simply opening the app)

Per card: the card title is "Pick up where you left off" if either row has history, else "Get started". Each row uses its own data: a user with reading progress but no study state gets the reading row and the "Explore Prophets & People" row. Tiles: "Today's goal" is "Not set" without an active goal; Hifz is "Not started" without targets. The prototype's New user state is therefore a combination the real data can produce, and e2e tests seed both extremes and a mixed case.

## 5. The tiles

| Tile | Value | Source |
| --- | --- | --- |
| Next prayer | "Maghrib · 1h 34m" | the data layer above |
| Qibla | "260°" | `qibla.ts` from the location |
| Today's goal | "0 / 494 ayahs" or "Not set" | `quran:reading-goals:v1`: today's unique ayah count over the active goal's `dailyAyahTarget`, using the local-day key like the legacy code. **No streak and no "behind pace" message** (design rule: no streaks or guilt) |
| Hifz | "Not started" or "In progress" | `quran:hifz:v2` has targets. The prototype's "14 to practice" needs the legacy session-queue engine; it arrives with Phase 14 (Open question 2) |

Tiles are links: Next prayer and Qibla to `/prayerTime` and `/qibla-direction`, Goal to `/goals`, Hifz to `/hifz` (legacy routes; until their phases land they show the "not rebuilt yet" page).

## 6. Offline levels and states

| Part | Level | Offline behaviour |
| --- | --- | --- |
| Page shell, resume rows, goal and Hifz tiles, Qibla (with a stored location), Save | A | Fully works (all local) |
| Ayah of the day | B | Today's ayah if it was fetched; else the last saved ayah with "Saved ayah from 12 Oct. Connect to get today's"; else "Today's ayah needs a connection once" with Retry. Never a blank card or an endless spinner |
| Prayer times | B | Cached month: times, countdown and schedule work; text "You're offline, so the saved times are still in use. Last updated ..." (after the first load of the month). No cache: "Needs a connection once to load prayer times" with Retry |
| Update now | C | Disabled with an offline note |

Home itself is in the precached shell, so a cold offline start renders. The e2e suite runs Home offline in both warm and never-cached cases.

## 7. Components, files, tests

Files (all inside `revamp-quran/`):

- Page: `app/pages/index.vue` (replaces the placeholder).
- Components: `components/home/AyahOfDay.vue`, `ResumeCard.vue`, `UtilStrip.vue`, `PrayerSchedule.vue`; shadcn-vue `Skeleton` and `Button` added as needed; `Sonner` toasts.
- Pure logic in `app/lib/`: `prayerMonth.ts` (key, parse, validate), `prayerClock.ts` (zoned times, next prayer, countdown), `qibla.ts`, `ayahOfDay.ts` (local date, pick, entry compatibility), `userState.ts`, `resume.ts`, `goalToday.ts`.
- Data: `app/db/revampDb.ts` (the single `quran-revamp-db` opener, versioned stores), `app/services/prayer.service.ts` (AlAdhan monthly), composables `usePrayerTimes`, `useLocation`, `useAyahOfDay`, `useHomeState`.
- Tests: unit tests for every pure module (month validation incl. a corrupt and a short month, atomic swap with a failing transaction, key rounding, next prayer across midnight, month end and a DST change, qibla references, ayah-of-day local date at UTC+5 and UTC-8, legacy-readable entry, user-state detection, no `prayer_*` write, no `quran-app-db` opened); Playwright e2e with the network mocked (`page.route`) for AlAdhan and the verse API: returning, new and mixed states, Update now success, Update now failing keeps the old times, offline warm and cold, Ja'fari times differ from Sunni for the same location, legacy `ayah-of-day` entry is readable and a revamp-written entry is accepted by the legacy comparison, Save and Undo write the legacy bookmark format, keyboard order, 375px and 1280px, light and dark, no console errors.
- A manual script `scripts/compare-aladhan.mjs` (the comparison above) so the Ja'fari check from `CONTENT_TO_VERIFY.md` can be repeated before cutover.

## 8. Design notes

- Scripture is not in a card: the ayah sits on the page with a hairline divider; the resume card and tiles are the bordered widgets. Gold is not used on Home (no verse-end marker here).
- Labels and the reference line use `--ink-2` (the prototype uses `--ink-3` for these; not copied, per the contrast decision).
- All Arabic follows the Arabic size setting and is never letter-spaced or truncated.
- 44px targets on mobile for the tiles, rows, toggle and icons; the two icons get labels ("Share this ayah", "Save this ayah").
- "sample text for layout only" and every sample string in the prototype are not copied.

## Open questions

1. **Scope of Home.** The prototype Home is leaner than the legacy Home. Dropped unless you say otherwise: today's Islamic event, the Ramadan card, goal streak and pace, the Hifz minutes estimate, the quick-link grid. Ramadan returns in Phase 8 as its own page and the nav keeps every page reachable. OK?
2. **Hifz tile count.** "In progress" in Phase 1, the real "N to practice" in Phase 14. OK, or should I port the session-queue count now?
3. **Ayah-of-the-day pool and language.** Keep the legacy pool (ayah 1 to 7 of any surah, now only valid ones) or use all 6,236 ayahs, or a curated list that you provide? Translation: your saved language or English?
4. **Location.** No silent Lahore fallback and no prompt on load; a "Set location" button instead. OK? (The old behaviour gave wrong times to non-Lahore users who declined or lacked GPS.)
5. **Share and Save on the ayah.** Include now (plain share, bookmark write) or only the icons wired to the designed card in Phase 4?
6. **Update now on Home.** PLAN.md puts it on the Prayer page and Settings. The plan puts a small one in the schedule panel because the data layer is built here. Keep or leave to Phase 5?
7. **Warm start from the legacy `prayer_*` cache** (read only, same coordinates and fiqh). Worth the extra code, or skip and show "Set up" after the first fetch?

## Risks

- AlAdhan is a third-party service with no uptime promise; the design depends on the cache, validation and the error states, not on the service.
- Time-zone arithmetic is the most error-prone part; it is isolated in one tested module.
- A browser can evict IndexedDB under storage pressure; the page works without it (it just refetches), and `navigator.storage.persist()` is requested as in the legacy app.
- Two apps (legacy and revamp) writing `ayah-of-day` and `quran:bookmarks:v1` on one device: both formats are kept identical so neither breaks the other.

## Not part of Phase 1

Settings UI for method and school (Phase 2), the Prayer and Qibla pages (Phase 5), Ramadan timetable and the Sha'ban prefetch (Phase 8), the share card (Phase 4), story chapters (Phase 7), Hifz counts (Phase 14).
