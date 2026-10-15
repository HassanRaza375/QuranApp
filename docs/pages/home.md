# Page: Home

- Route(s): `/`
- Phase: 1
- Prototype section: `d-page-home` / `m-page-home` (Returning user and New user)
- Offline level: A for the page; B for the ayah of the day and the prayer times. Offline states are listed below.
- Indexable: yes (prerendered with its own title, description and Open Graph tags from `app/lib/publicMeta.ts`)

## Purpose

The first screen: today's ayah, where to continue, and the day's prayer information at a glance. Everything is read from this device; the only network use is the ayah and the monthly prayer times, both cached.

## Layout

One column, in this order: a visually hidden `h1` "Home" (the visible title is in the header); Ayah of the day (on the page, not in a card; a hairline above the Share and Save row); the resume card; four tiles (four across at 768px and up, two by two below); "View today's prayer schedule" and its panel.

## Components

| Component | Source | Notes |
| --- | --- | --- |
| `HomeAyahOfDay` | custom | Arabic uses the `.ar` class (legacy Qur'an font, Arabic size setting, never letter-spaced) |
| `HomeResumeCard` | custom | Two rows; each row decides from its own data |
| `HomeUtilStrip` and `HomeTile` | custom | A tile is a link, or a button when it needs a location |
| `HomePrayerSchedule` | custom | Five chips, method and last-updated lines |
| `Skeleton`, `Button`, Sonner toasts | shadcn-vue | |

## Data

| Data | Service / composable | Cache or storage key |
| --- | --- | --- |
| Ayah of the day | `useAyahOfDay`, `VerseService` | `ayah-of-day` (legacy shape plus `localDate`) |
| Translation language | preferences store | `translationDefaultLang` (raw) |
| Save | `lib/bookmarks.ts` | `quran:bookmarks:v1`, `quran:bookmarks:added-at:v1` |
| Reading, study, goal, Hifz, new or returning | `useHomeState` (read only) | `quran:reading-progress:v1`, `quran:persons-study:v1`, `quran:reading-goals:v1`, `quran:hifz:v2` / `v1`, `quran:library:v1`, `quran:downloads:v1`, `quran:bookmarks:v1` |
| Place | `useLocation` | `quran:location:v1` (new); `last_location` (legacy, read only) |
| Prayer times | `usePrayerTimes`, AlAdhan monthly calendar | IndexedDB `quran-revamp-db` store `prayer-months`, key `prayer:v1:<lat2>:<lon2>:<method>:<school>:<YYYY-MM>` |
| Fiqh | preferences store | `prayerFiqh` (raw) |

## States

- **Loading:** skeletons with reserved height (no layout shift); no spinner stays after loading ends.
- **New user:** "Get started": "Start reading" (to `/surah/1`) and "Explore Prophets & People"; goal "Not set"; Hifz "Not started".
- **Returning:** "Pick up where you left off": reading row ("<surah> · ayah n of N", "p% of the Qur'an completed", to `/surah/<n>#ayah-<a>`) and study row ("You were reading: <section>", the person's name, to `/persons/<id>`). Each row falls back to its new-user row when it has no data. Phase 7 replaces the study row with story chapters.
- **Ayah:** ready; stale (last saved ayah, marked); unavailable ("Today's ayah needs a connection once", Try again).
- **Prayer tile:** "Dhuhr · 2h 34m" (minute precision, refreshed every 30 seconds while the tab is visible); "Fajr · tomorrow" when tomorrow's times are not available; "Unavailable" or "Needs a connection" on failure; "Set location" without a place.
- **Schedule panel:** five times with the next prayer highlighted (none highlighted after Isha); "Times follow: <method name from the service>"; the note: Last updated; Updating; offline; or the refresh failure. No Update now on this page.
- **Empty/first-run:** covered by the new-user state; no place means "Set location" on both Next prayer and Qibla, and a "Set your location" message in the panel.
- **Error:** location refused: a plain message under the tiles and the button stays; service failure: message and Try again.
- **Fiqh variants:** Sunni uses method 2 (ISNA); Ja'fari uses method 0 (Leva Institute, Qum) with the Ja'fari midnight. The times differ (for example Maghrib 5:31 PM vs 5:46 PM in Lahore on 15 Oct 2026).
- **Dark mode and high contrast:** tokens only; labels use `ink-2`.

## Interactions

- **Share** (button): `navigator.share` with the Arabic, the translation, the reference and a link; copies to the clipboard with a toast where sharing is not available.
- **Save** (toggle button, `aria-pressed`): writes or removes the legacy bookmark keys, toast "Saved to your Library" or "Removed from your Library" with **Undo**.
- **Reference:** links to the ayah in the reader.
- **Tiles:** Next prayer to `/prayerTime`, Qibla to `/qibla-direction`, goal to `/goals`, Hifz to `/hifz`. With no place, the first two are buttons that ask for the device location (only on that tap).
- **View today's prayer schedule:** a disclosure button (`aria-expanded`, `aria-controls`).
- Keyboard order follows the page order; every control has a visible focus ring.

## Accessibility

One `h1`; the resume card is headed by an `h2`; the ayah has `lang` and `dir` for the Arabic and the translation; icon buttons have labels; touch targets are at least 44px at 375px (asserted); no live region announces the countdown; contrast uses `ink` and `ink-2` only.

## Cross-links

Links to the surah reader, Prophets & People (legacy routes, shown as "not rebuilt yet" until their phases), prayer, Qibla, goals, Hifz. Linked from the sidebar, the header title and the logo.

## Known differences from the prototype

See `docs/design/home-compare/README.md`.

## Tests

`e2e/home.spec.ts` (40 checks), unit tests listed in `phase-01-home.md`.
