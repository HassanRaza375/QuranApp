# Phase 1: Home

- Branch: `revamp-design-logic`
- Date: 2026-10-15
- Status: Done, awaiting review
- Plan and decisions: `phase-01-home-plan.md` (approved with the decisions listed below)

## Goal

The real Home page (`/`), the prayer-times data layer it needs, and the shell gaps found in the Phase 0 comparison.

## Scope

- Pages and components built: `app/pages/index.vue` and `components/home/` (`AyahOfDay`, `ResumeCard`, `UtilStrip`, `HomeTile`, `PrayerSchedule`); shell: collapsible nav with "Continue reading", header with page title, search link, theme menu and gear, accent drawer close icon.
- Prototype sections used: `d-page-home` and `m-page-home` (Returning and New user), shell.
- Legacy code reused: `@legacy/utils/prayerFiqh.js` (method per fiqh), `@legacy/data/quranPersons` and `@legacy/utils/personStudy` (loaded only when a study state exists); the legacy storage keys are read as they are. Services copied in Phase 0 (`VerseService`).

## Approved decisions (from the plan review)

1. **Nav:** one row per real destination in the prototype's five groups (Read, Study including Library and Downloads, Knowledge base, Worship, optional Literary), collapsible, Read open by default; "Continue reading" at the top, only with progress. Lucide icons, 16px, ink-2, accent when active. **Recorded as an intentional change from the prototype** (DESIGN_SYSTEM.md). Shell gaps fixed: header page title, search field (links to `/search`), theme menu and gear, accent drawer close icon.
2. **Home scope:** no Islamic event card, Ramadan card, goal streak or pace, Hifz minutes, or quick-link grid. Today's goal is an ayah count only. A Ramadan banner returns in Phase 8.
3. **Hifz tile:** no pure due-count util exists in the legacy code (the queue is built by the `useHifzSession` composable, which needs Nuxt state), so the tile shows "Not started" without Hifz data and a neutral "Open Hifz" link, with no number, when there is data.
4. **Ayah of the day:** all ayahs inside a length range, picked deterministically from the local date; translation from `translationDefaultLang`, English as the fallback; the legacy invalid-ayah bug fixed and noted in LEGACY_INVENTORY.md.
5. **Location:** the legacy `last_location` is read read-only; otherwise "Set location" (device geolocation only on a tap). No default city. Manual city entry is Phase 5.
6. **Save** writes the legacy bookmark keys with a toast and Undo. **Share** uses `navigator.share` with a clipboard fallback; the image card waits for Phase 4.
7. **Update now:** Phase 5 and Settings only (the data layer has `refresh()` ready; Home has no button).
8. The legacy `prayer_*` cache is skipped.

## What was built

### Prayer-times data layer
- `app/lib/prayerMonth.ts`: cache key `prayer:v1:<lat2>:<lon2>:<method>:<school>:<YYYY-MM>`, the time parser, and `normalizeMonthResponse` (full validation).
- `app/db/revampDb.ts`: the new IndexedDB database **`quran-revamp-db`** (version 1, store `prayer-months`). `quran-app-db` is never opened (a test spies on `indexedDB.open`).
- `app/lib/prayerSync.ts`: fetch, validate, swap; one request per key at a time; the old month is kept on any failure. The swap is one `put` of the whole record in one `readwrite` transaction (a test poisons a write and checks the old record is untouched).
- `app/lib/prayerClock.ts`: time-zone arithmetic (in the location's zone, with daylight-saving handling), next prayer (tomorrow's real Fajr after Isha; "Fajr tomorrow" without a time when tomorrow is unknown), minute-precision countdown, last-updated text.
- `app/lib/location.ts`: saved place, legacy `last_location` read-only, the 10 km rule so GPS jitter never changes the cache key.
- `composables/usePrayerTimes.ts`, `useLocation.ts`; `services/prayer.service.ts` (10-second timeout).
- Next month is fetched in the background when fewer than 7 days are left; months older than two months are pruned.

### Home
- New versus returning from the legacy keys (`app/lib/userState.ts`); each resume row decides on its own data, so a user with reading progress but no study state sees the reading row and the Explore row.
- Ayah of the day (`app/lib/ayahOfDay.ts`): see "Ayah of the day" below.
- Save and Share on the ayah; four tiles; the schedule panel with the method name from the API response and the last-updated text.

### Shell
- `lib/nav.ts` (single source for nav and header titles), `lib/navState.ts` and `composables/useNavOpen.ts` (open groups remembered in the new key `quran:nav-open:v1`), `NavList.vue`, `AppHeader.vue`, `SheetContent.vue` (accent close icon, 44px).

### Ayah of the day
- **The pool.** `scripts/gen-ayah-lengths.mjs` writes `app/data/ayahLengths.generated.ts`: the length of each ayah's Arabic text (numbers only; no Qur'an text). It fails if any surah's count differs from the legacy `surah.json`. Measured: median 93 characters, 90th percentile 221, longest 1,208. **Cap 250 characters: 5,817 of 6,236 ayahs (93.3%)**; I added a floor of 15 characters to leave out the isolated-letter openings (my addition; see Open questions). The table is lazy-loaded (21.8 KB).
- **The pick.** FNV-1a of the local date string, then a seeded generator; no `Math.random`. The same date gives the same ayah on every device and time zone (tested). Ten years of dates all give a real ayah inside the range.
- **The legacy bug** (also in LEGACY_INVENTORY.md): the legacy `date` is the UTC date (wrong for 5 hours a day in UTC+5, for example local midnight to 05:00), and the pick ("ayah 1 to 7 of a random surah") can ask for an ayah that does not exist (ayah 4 to 7 of surah 108, which has 3 ayahs).
- **Compatibility.** Same key `ayah-of-day`, same shape `{ date, data }`; `date` is still the UTC date so the legacy comparison works; one additive field `localDate`; `data` has the legacy fields plus additive ones. The revamp decides "today" from `localDate` (or, for an entry the legacy app wrote, from `date`, which can only cause a refetch).

## Decisions and why (working decisions)

| Decision | Alternatives considered | Reason |
| --- | --- | --- |
| Per-surah ayah counts and the percent come from the generated table | The legacy `getAyahPrefixSums` (loads the 171 KB `surah.json`) | Smaller Home; a test checks the same numbers as the legacy file and constant |
| People data (148 KB) and section names are imported only when a study state exists | Always import | Keeps Home light; verified not preloaded by `index.html` |
| Floor of 15 characters in the ayah pool | No floor | A one-word ayah as "ayah of the day" reads poorly |
| `console.debug` in the ayah's catch | Silent | A missing import was hidden by that catch during development; the debug line keeps failures visible in dev tools without tripping the console-error tests |
| Tile for Next prayer says "Unavailable" or "Needs a connection" | Spinner | Never an endless spinner |
| The bridge plugin now handles the alias form `<revamp>/app/x` as well as `~/x` and finds files by extension | `this.resolve` | The Nuxt alias step rewrites `~` before the plugin runs, and Vite 8's resolver does not add extensions. It had never been exercised by the Nuxt build (the Phase 0 imports were type-only) |
| Tests mock every upstream (AlAdhan with REAL recorded responses, verses with fake text) and fix the clock | Hit the real services | Deterministic, no internet needed |

## Files

- Added: `app/lib/{dates,prayerMonth,prayerClock,prayerSync,qibla,location,ayahOfDay,userState,resume,goalToday,bookmarks,quranCounts,navState}.ts`, `app/db/revampDb.ts`, `app/data/ayahLengths.generated.ts`, `app/composables/{useLocation,usePrayerTimes,useAyahOfDay,useHomeState,useNavOpen}.ts`, `app/services/prayer.service.ts`, `app/components/home/*`, `app/components/ui/{collapsible,skeleton}`, `scripts/gen-ayah-lengths.mjs`, tests and fixtures (below), `docs/design/home-compare/`.
- Changed: `app/pages/index.vue`, `lib/nav.ts`, `NavList.vue`, `AppHeader.vue`, `SheetContent.vue`, the legacy bridge, existing e2e files and `scripts/dev-smoke.mjs` (heading and no real network), docs.
- Changes outside `revamp-quran/`: **none**.

## Data and storage

- Read (never written): `quran:reading-progress:v1`, `quran:persons-study:v1`, `quran:reading-goals:v1`, `quran:hifz:v2` and `v1`, `quran:library:v1`, `quran:downloads:v1`, `last_location`, `translationDefaultLang`, `prayerFiqh`, `quran:accessibility:v1`.
- Written, same format as the legacy app: `quran:bookmarks:v1` and `quran:bookmarks:added-at:v1` (Save), `ayah-of-day` (plus the additive `localDate` and extra `data` fields).
- Written, new and additive: `quran:location:v1` (`{lat, lon, source, updatedAt}`), `quran:nav-open:v1`; IndexedDB `quran-revamp-db` store `prayer-months`.
- Never written: any `prayer_*` or `calendar_v2_*` key, `last_location`, anything in `quran-app-db`.
- Migrations: none.

## Offline

Level A for the page; level B for the ayah and the prayer times.

| Part | Offline behaviour (tested) |
| --- | --- |
| Shell, resume rows, goal, Hifz, Qibla (with a saved place), Save | Fully work |
| Ayah | Today's stored ayah; else the last saved one, marked "last saved ayah (date). Today's ayah needs a connection."; else "Today's ayah needs a connection once." with Try again |
| Prayer times | Warm: times, countdown, chips, "You're offline, so the saved times are still in use. Last updated ..." Cold: tile "Needs a connection", schedule "Needs a connection once to load prayer times." with Try again |
| Spinners | None remain once loading ends (asserted) |

## Verification

- [x] `npm run verify` on Node 22.23.3: build, lint clean, **177 unit tests**, dev-server smoke test, **76 browser checks**, all pass.
- [x] 1280px and 375px, light and dark, returning and new user, compared with the prototype (`docs/design/home-compare/`; I looked at 3 of the 8 pairs closely).
- [x] Offline (build and preview, Playwright offline mode), warm and cold.
- [x] Keyboard order test (Share, Save, resume links, tiles, schedule toggle); 44px targets at 375px; one `h1`; no console error or warning; only the allowed hosts are contacted (asserted).
- [ ] Screen-reader pass (not done).
- [ ] A real phone, and a real GPS fix (the geolocation tests use Playwright's mock).

### Tests added
- Unit: monthly time parser with real and synthetic suffixes (`prayerMonth`), validation against real recorded responses (Sunni and Ja'fari), the cache key, time zones and daylight saving, next prayer, the local-date logic in five zones (`dates`), ayah pool, pick and entry compatibility (`ayahOfDay`), user state, resume rows, goal, bookmarks, location, Qibla, nav state (`homeState`), sync and atomic swap with fake IndexedDB (`prayerSync`), services (`services`), CSS has no remote resources (`tokens`).
- Browser: `e2e/home.spec.ts` (40 checks).

## Differences from the prototype

See `docs/design/home-compare/README.md`. Summary: icons in the nav and collapsible groups (approved, intentional); the translation has no gold left bar (gold is for verse markers only); labels use ink-2; the second resume row shows the study state (approved); "Open Hifz" instead of a count (approved); no mini player until something plays (Phase 4); the Arabic follows the design size (32px desktop) instead of the prototype's smaller stand-in; sample text and numbers are replaced by real data.

## Content placeholders replaced

Ticked in `docs/CONTENT_TO_VERIFY.md` (Home items added there). The prototype's Arabic words used as row icons were not copied; Lucide icons are used.

## Open issues and risks

1. **Ayah range:** the floor of 15 characters is my addition. The cap of 250 and the "every ayah is eligible" rule follow your decision. Say if you want a different cap, or a review of which ayahs suit "of the day".
2. **Real device checks** (GPS, install, share sheet) are not done.
3. **The legacy bookmark `Save`** and `ayah-of-day` entries are shared with the legacy app on one origin only after cutover; until then the revamp preview origin has its own storage.
4. A known benign Nitro build warning about `cache-driver.mjs` appears in every build since the Nuxt upgrade; it comes from the server part, which is only the four proxies.
5. `npx shadcn-vue add` re-adds a Google Fonts `@import` and a duplicate base layer to `tailwind.css` (found when adding two components); a unit test now fails if either returns.
6. A service file that forgets to import `useQuranApi` failed silently behind the ayah's error handling; a unit test now exercises every service.
7. Asr school (Hanafi) and the calculation method choice come with Phase 2; until then Home uses the method per fiqh and the standard school.

## Next phase needs

Phase 2 (Settings): the keys for calculation method, Asr school and Wi-Fi-only downloads (`quran:<feature>:v1`); the prayer data layer already takes `{method, school, midnightMode}`, so Phase 2 supplies them. Phase 5 reuses `usePrayerTimes().refresh()` for Update now and adds manual city entry.
