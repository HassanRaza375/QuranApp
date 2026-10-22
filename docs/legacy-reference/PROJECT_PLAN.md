# Quran App — Project Plan

_Living document, updated after each work pass. Last updated: 2026-08-20 (Pass 18)._

This document is the working plan for turning the app into an installable PWA, fixing first-load
performance, shipping a real Tasbeeh (dhikr counter) module, completing the Continue Reading /
Ayah of the Day features, and cleaning up bugs/design debt found during the audit.

**Status:** Pass 1 (PWA, perf, Tasbeeh) ✅ shipped. Pass 2 (Continue Reading, Ayah of the Day
refresh, wider bug sweep, Bookmarks completion) ✅ shipped — see §4. Pass 3 (prayer notification
scheduling) ✅ shipped — see §5. Pass 4 (Arabic + Urdu text on saved ayah bookmarks) ✅ shipped —
see §6. Pass 5 (PWA installability was actually broken since Pass 1 — fixed) ✅ shipped — see §7.
Pass 6 (Jafari/Shia calculation method + fiqh selector) ✅ shipped — see §8. Pass 7 (per-ayah
Tafsir on the Surah page) ✅ shipped — see §9. Pass 8 (tafsir-didn't-open bug fix + an unrelated
theme hydration-mismatch bug found along the way) ✅ shipped — see §10. Pass 9 (checked for a
Shia/Ja'fari tafsir source — none exists; labeled the tafsir picker accordingly) ✅ shipped — see §11.
Pass 10 (IndexedDB caching layer for surah text/tafsir) ✅ shipped — see §12. Pass 11 (inline
per-ayah translation, like tafsir; a critical SSR crash found and fixed; a real fixed-player
overlap bug found and partially mitigated) ✅ shipped — see §13. Pass 12 (Reading Goals & Khatmah
Planner — first module from the new feature roadmap doc) ✅ shipped — see §14. Pass 13 (Notes,
Collections & Study Library — §4.4, second module) ✅ shipped — see §15. Pass 14 (Offline &
Download Manager — §4.5, third module) ✅ shipped — see §16. Pass 15 (Advanced Search &
Discovery — §4.6, fourth module; also fixed a real pre-existing CORS bug affecting the Juz
feature) ✅ shipped — see §17. Pass 16 (Ramadan Mode — §4.7, fifth module) ✅ shipped — see §18. Pass 17 (all five remaining
modules that don't need a server — §4.9 Audio & Reciter Experience, §4.12 Settings/Accessibility,
§4.8 Hifz Mode, §4.10 Islamic Calendar Events & Personal Reminders, §4.11 Shareable Ayah Cards,
done together in one pass at the user's request) ✅ shipped — see §19. That leaves only
Account/Cloud Sync (§4.1) and True Background Push (§4.3) unbuilt — both explicitly deferred at the
user's direction, both need server-side infrastructure (a database for user data / push
subscriptions, in Push's case also a cron scheduler) that hasn't been committed to yet. Every other
module in the original roadmap doc is now shipped. Pass 18 (full Hifz Mode redesign into an
adaptive practice engine, driven by a separate, much more detailed spec —
`Hifz_Module_Specification.md`) ✅ shipped — see §20.

**Correction to Pass 12's record:** Pass 12 stated `.env` "already has real Supabase credentials
set." That was wrong — only checked that the *keys* `NUXT_PUBLIC_SUPABASE_URL`/`_ANON_KEY` were
present, never read the actual values. They're placeholders (`https://xxxxx.supabase.co`,
`public-anon-key`), not real credentials. Doesn't change anything given Account/Sync is deferred
anyway, but the record should be accurate: Supabase is *not* one step from working, it still needs
a real project.

**New source document as of Pass 12:** `Quran_WebApp_Feature_Roadmap_and_Module_Specification.md`
(repo root) — a 12-module, 8-phase roadmap (account sync, reading goals, true background push,
notes/collections, offline downloads, search, Ramadan mode, Hifz mode, audio experience, calendar,
share cards, settings consolidation) plus a homepage/navigation redesign and a full Supabase
schema. Modules are being built one at a time, confirmed with the user before each one, starting
with §4.2 Reading Goals. See §14 for what building it against this document surfaced.

---

## 1. PM Audit — What's already built

**Stack:** Nuxt 4, Vuetify 3 (manually registered, not tree-shaken), Pinia, Supabase client (auth,
not yet wired into UI), `@vite-pwa/nuxt` (installed but **not configured**), `@nuxt/image`,
`@vercel/analytics`.

**Working features:**
- Home dashboard: prayer times, countdown, Ramadan panel, Ayah of the Day, "continue reading" (now wired to real progress — see §4).
- Surah reader (`/surah/[id]`) with multi-translation tabs, per-ayah bookmarking, per-ayah audio, full-surah audio player with reciter picker.
- Surah listing, Juz index/detail, per-page read, search, Asma-ul-Husna, Sajda, bookmarks, calendar, prayer times, qibla direction, settings, about.
- Bookmarks composable with a generic key scheme (surah/ayah/name/sajda) backed by localStorage.
- Light/dark theme with system-preference sync.

**Gaps found:**
- ~~**PWA:** dependency present, zero config...~~ ✅ resolved in Pass 1.
- ~~**Tasbeeh module:** placeholder page, no logic, not linked from navigation...~~ ✅ resolved in Pass 1.
- **First load performance:**
  - Vuetify is imported in full (`import * as components/directives from "vuetify/components|directives"`) — every component in the library ships in the initial bundle regardless of usage.
  - `LayoutNavigationDrawer` (mounted on every page via the default layout) statically imports the 171 KB `surah.json` through `useSurahs()` just to build the "Audio" submenu, so that payload is parsed on first load of every page even if the drawer is never opened.
  - `LayoutAppBar` sets a random Unsplash photo as its background **on every page**, computed identically at module scope for SSR and client — this is both a perf hit (uncached hit to an external image host on every load, no `width`/quality params) and a hydration-mismatch bug (SSR and client `Math.random()` pick different images).
- **Dead / duplicate code:**
  - `app/utils/api.ts` (`useApi`) duplicates `app/plugins/api.js` (`$api`/`$api2`) — unused anywhere, only the plugin is actually consumed.
  - `app/app.config.ts` still has the `nuxi init` boilerplate ("Hello Nuxt", red primary) — nothing reads `useAppConfig()`, and it doesn't match the real Vuetify theme defined in `plugins/vuetify.js`, which is confusing for anyone touching theming later.
- **Incomplete feature, documented but not built out further:** Settings' "Enable Prayer Notifications" only requests permission and stores a flag — no actual scheduling/service-worker push exists. Left as-is (out of scope for this pass) but noted so it isn't mistaken for working.

---

## 2. Designer notes

The app already has a clear visual identity on the Home page: teal/deep-blue gradient cards,
`rounded="xl"`, glassmorphism (`backdrop-filter: blur`), gradient text accents, Amiri Quran for
Arabic, Sansation for UI. That system just isn't applied consistently yet.

Changes made in this pass:
- **App bar:** dropped the random remote photo (perf + hydration bug) for a themed gradient
  matching the rest of the app (`teal-darken-4` → deep blue), so it's consistent, deterministic,
  and free of an external network dependency on every page.
- **Tasbeeh module:** built using the same visual language as Home (gradient hero, glass stat
  cards, rounded-xl, big touch targets) so it doesn't feel like a bolted-on page — circular
  progress ring for the count, large tap area (44px+ touch target, thumb-reachable), haptic
  feedback on supported devices.
- **Theme config cleanup:** `app.config.ts` now mirrors the real teal palette instead of the
  leftover scaffold red, so future dark/light work has one source of truth to look at instead of two disagreeing ones.

Not in scope for this pass (flagged for a follow-up design pass): calendar, qibla-direction, sajda
and per-page-read screens still use default Vuetify styling and weren't touched, to keep this
change focused and reviewable.

---

## 3. Developer plan

1. **PWA** — configure `@vite-pwa/nuxt` in `nuxt.config.ts`: web app manifest (name, icons incl.
   maskable, theme/background color, standalone display), `registerType: autoUpdate`, Workbox
   runtime caching (`StaleWhileRevalidate` for the Quran API JSON, `CacheFirst` for reciter audio
   with an expiration cap), auto-injected register script.
2. **Perf:**
   - Add `vite-plugin-vuetify` for component/directive tree-shaking (drop the manual `import *`
     registration in `plugins/vuetify.js`).
   - Code-split `surah.json` in `useSurahs()`/nav drawer via dynamic `import()` instead of a
     static top-level import.
   - Fix `LayoutAppBar` (remove random remote image / hydration mismatch).
3. **Tasbeeh module** (`useTasbeeh` composable + `tasbeeh/index.vue` + `tasbeeh/[id].vue`):
   preset dhikr list (SubhanAllah, Alhamdulillah, Allahu Akbar, La ilaha illallah, Astaghfirullah)
   + custom counter, target cycles (33/99/100/∞), persisted counts/history via the existing
   `$storage` plugin, vibration feedback, reset with confirmation, and a link added to the nav
   drawer (currently missing entirely).
4. **Bug/dead-code cleanup:** remove `app/utils/api.ts`, align `app.config.ts` theme.
5. **Verify:** `npm run dev`, exercise the Tasbeeh flow and PWA installability in-browser.

---

## 4. Pass 2 — Continue Reading, Ayah of the Day, and a wider bug sweep

A second Explore pass was run across every remaining page (`juz`, `per-page-read`, `calender`,
`sajda`, `qibla-direction`, `prayerTime`, `search`, `bookmarks`, `asma-ul-husna`, `about`,
`surah-audios`, `surah-vedios`, plus the Supabase auth plugin) to find anything else stubbed or
broken, so it could be fixed in the same pass instead of trickling in one request at a time.

### 4.1 Continue Reading — ✅ shipped
Was fully hardcoded on Home ("Surah Al-Baqarah", "Ayah 153", "45%") — not connected to anything.
- New `useReadingProgress` composable: tracks `{ surahNo, ayahNo, surahName, totalAyah }`,
  persisted via the existing `$storage` plugin, plus an overall **% of the Quran completed**
  computed from cumulative ayah counts (`surah.json`, lazily imported so it doesn't bloat the
  bundle — same technique used for the nav drawer in Pass 1).
- `surah/[id].vue` now records progress: immediately on opening a surah (ayah 1), then keeps it
  updated as the reader scrolls (debounced scroll listener finds the last ayah past the
  35%-viewport line).
- Home's Resume card now reads real data, shows a "Start Reading" empty state for first-time
  users (defaults to Al-Fatihah), and its button deep-links to `/surah/{n}#ayah-{n}`.

### 4.2 Ayah of the Day refresh — ✅ shipped, was a real bug
`fetchAyahOfTheDay()` always checked "is there a cached ayah for today?" **before** deciding
whether to fetch — so the refresh button in `ayah-of-day.vue` called the exact same function with
no way to bypass the cache, meaning **refresh never did anything** if you'd already loaded the
page once that day. Fixed by giving the composable a `force` param (`fetchAyahOfTheDay(true)` on
refresh) that skips the cache read, fetches a new random ayah, and overwrites today's cached one.
Also switched it off a hardcoded `$fetch(https://quranapi.pages.dev/...)` and raw `localStorage`
onto the app's existing `$api` plugin and `$storage` plugin, matching every other service/composable.

### 4.3 Other bugs — ✅ shipped
- `calender.vue`: the dead `loading` ref (set `false` at the *start* of the fetch, and never
  actually read anywhere in the template — the skeleton correctly gated on `calendarDays.length`
  already) has been removed; the geolocation-polling `setInterval` is now stored and cleared on
  unmount instead of leaking if you navigate away before it resolves.
- `juz/[id].vue`: the "Surah Marker" was rendering `Object.keys(data.surahs)` as a raw
  comma-joined array dump; now formatted as `"Al-Fatihah · Al-Baqarah"` (verified in-browser for
  Juz 1, which spans both). Removed a leftover `console.log`.
- `surah-audios/[id].vue`: the page fetched the surah header and its reciter list as two separate
  hardcoded `$fetch` calls; switched to the existing `useChapters()`/`getChapter()` composable
  (one request instead of two, no more hardcoded API URL). The dead `toggle()` function is now
  wired to a real pause/play button next to the "Now Playing" indicator in the header, so you can
  stop playback without hunting for whichever reciter card is currently active among a long list.
- `prayerTime.vue`: re-enabled the "(Next)" text label next to the highlighted prayer — colour
  alone wasn't an accessible way to convey it.

### 4.4 Bookmarks — ✅ shipped
`bookmarks.vue` had Surah/Ayah working, but the Audios/Sajdas/Pages/Juz tabs literally rendered
*"...bookmarks will appear here once you implement them."* to end users. Now:
- `useBookmarks` extended with `juz`, `audio` (per-surah reciter page), and `page` (mushaf page)
  key types (`sajda` already existed but had no UI calling it).
- Added a bookmark toggle button to `sajda.vue` (per verse), `juz/index.vue` (per juz chip),
  `surah-audios/[id].vue` (in the header, next to the surah name), and `per-page-read.vue` (next
  to Prev/Next).
- `per-page-read.vue` now also accepts `?page=N` in the URL to jump straight to a page — needed so
  a saved page bookmark's "Open" button actually lands on the right page instead of always page 1.
- All four tabs in `bookmarks.vue` now render real, persisted, removable lists instead of the
  placeholder string.
- **Bonus bug found while wiring this up:** `bookmarks.vue` called `useSurahs().getAll` to resolve
  surah names for display — but `useSurahs()` has never exported a `getAll` method (it only
  exposes `surahs`/`rawSurahs`/`search`/`setSort`/`selectedSort`). That call was silently failing
  inside `useAsyncData` on every visit to the page, so every bookmark card fell back to showing
  "Surah 2" instead of the real Arabic/translated name. Fixed by reading `rawSurahs` directly
  (already synchronously available, no async fetch needed for local JSON).

All new/changed routes verified via `npm run build` (clean) and `npm run dev` (every touched route
returns 200, no hydration warnings, no console errors): `/`, `/surah/1`, `/bookmarks`, `/sajda`,
`/juz`, `/juz/1`, `/surah-audios/1`, `/per-page-read`, `/per-page-read?page=5`, `/tasbeeh`,
`/tasbeeh/subhanallah`, `/calender`, `/prayerTime`.

### 4.5 Explicitly not touched (documented, not fixed)
- **Supabase auth** (`plugins/supabase.client.ts` is fully commented out, `useAuth.ts` will throw
  if called): nothing in the UI currently calls `useAuth()`, so this is a dormant subsystem, not a
  user-facing bug. Wiring it up for real needs actual Supabase credentials, a login/signup UI, and
  a security pass — out of scope here.
- **`surah-vedios.vue`** ("Coming Soon" placeholder): honestly labeled, not deceptive, and there's
  no video data source/API to back it yet — left as-is rather than fabricating content.
- ~~**Settings → prayer notifications**: still only requests permission and stores a flag...~~
  ✅ resolved in Pass 3, see §5.

---

## 5. Pass 3 — Prayer notification scheduling

Turned out `stores/prayer.js` already had *some* notification logic (not "nothing exists" as
Pass 1 assumed) — it fired `registration.showNotification()` when a 1-second countdown poll hit
zero. The real question was scope: should this go further into true background push (works with
the app fully closed), which needs a server, a subscriber database, VAPID keys, and a scheduled
job to trigger sends — real infrastructure this project doesn't have yet (Supabase is installed
but disabled/uncredentialed, no cron is configured). Asked the user; the call was to make the
existing in-app path solid rather than stand up a push backend right now.

**Shipped:**
- Replaced the 1-second `setInterval` poll that decided whether to fire a notification with
  precise per-prayer `setTimeout`s (`scheduleNotifications()` in `stores/prayer.js`). Every
  enabled prayer gets its own timer for its next occurrence (today if still upcoming, tomorrow if
  already passed), and each timer reschedules itself forward after firing — so the whole day's
  notifications are queued up front instead of only ever tracking a single "next prayer".
- Fixed the notification text: with a reminder offset set (e.g. "10 minutes before"), it used to
  say *"It's time for Fajr prayer"* at a moment that wasn't actually Fajr time — now says *"Fajr
  begins in 10 minutes."*
- **Real bug found in the process:** the cache key / API date used for the daily prayer-times
  refetch was computed **once** when the store was created (`const today = ...`) and never
  updated. Since it's a Pinia store that lives for the whole SPA session, any session left open
  past midnight would keep re-fetching (or worse, re-using a stale cache for) *yesterday's* prayer
  times forever, silently breaking both the displayed times and any notification scheduled off
  them. Changed `today` from a frozen constant to a function that reads the real date on every call.
- `settings.vue` now actually calls `prayer.refreshNotificationSchedule()` whenever the
  enable-toggle, per-prayer toggles, or reminder offset change (previously these only wrote to
  `localStorage`, the schedule wouldn't pick up the change until state happened to be
  recomputed elsewhere) — and after permission is freshly granted.
- Added a "Send Test Notification" button and an inline note in Settings clarifying the real
  constraint: *"Notifications fire while the app is open (foreground or a background tab) — they
  won't arrive if the app or browser is fully closed."* — stated plainly instead of implying it's
  a full background-push feature.
- Removed `app/utils/canNotify.js`, an unused duplicate of the (now-removed) permission-check
  logic that lived only in the store.

Verified via `npm run build` (clean) and `npm run dev` (`/`, `/settings`, `/prayerTime`,
`/calender` all 200, no hydration warnings, no console errors).

**Still not built (would need real infrastructure, flagged for later):** true background push —
notifications while the app/browser is fully closed. Needs VAPID keys, a server endpoint to store
each user's push subscription + location, and a scheduled job (Vercel Cron or similar) to send at
the right minute. Revisit once there's a data store and cron actually provisioned.

---

## 6. Pass 4 — Arabic + Urdu text on saved ayah bookmarks

Ayah bookmarks (`bookmarks.vue`, Ayahs tab) only ever stored/showed a key (`ayah:surahNo:ayahNo`)
resolved to a title like *"Al-Baqarah • Ayah 255"* — no verse content, so you couldn't tell what
you'd actually bookmarked without opening it.

**Shipped:** each ayah bookmark card now fetches and displays the verse's Arabic text and Urdu
translation (via the existing `useVerse()`/`VerseService` composable — same `/api/{surah}/{ayah}.json`
endpoint already used elsewhere, confirmed it returns `arabic1` and `urdu` fields). Fetched lazily
per-card into a local cache (`verseTexts`) keyed by `surahNo:ayahNo` when the Ayahs tab's bookmark
list changes, with a skeleton shown while loading. Text is right-to-left styled for both fields
(Urdu uses Arabic script, so it needs `direction: rtl` too, not just the Arabic verse).

Deliberately kept as a fetch-on-view rather than storing the verse text in the bookmark itself —
`useBookmarks` stores bookmarks as plain keys with no metadata for any type, and duplicating verse
text into local storage would only save a network round-trip that Pass 1's PWA runtime caching
(`StaleWhileRevalidate` on `quranapi.pages.dev`) already makes cheap after the first view.

Verified via `npm run build` (clean), `npm run dev` (`/bookmarks`, `/surah/2` both 200, no console
errors), and a direct check of the quranapi endpoint confirming the `arabic1`/`urdu` field shape.

---

## 7. Pass 5 — The PWA from Pass 1 wasn't actually installable

Asked to confirm the PWA setup was real, so it got checked properly this time instead of taking
the Pass-1 config at face value. First attempt used `curl`/headless-Chrome-dump-dom against
`http://localhost:3000` and found **no `<link rel="manifest">` anywhere** — worrying, since Pass 1
had confirmed `manifest.webmanifest` and `sw.js` were being generated and served. (First check was
also briefly confused by a leftover dev-mode server still bound to `[::1]:3000` from an earlier
session — Windows resolves `localhost` to `::1` first, so `curl localhost:3000` was silently
hitting the stale dev process, which has PWA disabled by design via `devOptions.enabled: false`.
Killed it and confirmed the same result against the real rebuilt production server.)

**Root cause:** `@vite-pwa/nuxt` does not auto-inject the manifest `<link>` tag. It ships a
`<VitePwaManifest />` component that has to be placed somewhere in the app (typically `app.vue`)
— its whole job is calling `useHead()` to add that link. Pass 1 wrote the `pwa: {...}` config in
`nuxt.config.ts` but never added the component, so the manifest was generated and servable but
literally undiscoverable by a browser. Fixed by adding `<VitePwaManifest />` to `app.vue`.

**What was and wasn't actually broken**, confirmed with a real headless-Chrome session (Puppeteer
driving the installed Chrome) rather than static HTML inspection, since service worker
registration is a JS side effect with no DOM footprint `curl`/`--dump-dom` could ever see:
- Manifest link: broken → now `/manifest.webmanifest`, present after the fix.
- Service worker: was actually fine already — confirmed active and controlling the page even
  before this fix (`navigator.serviceWorker.controller` set, registration active). Pass 1's
  Workbox/SW setup itself was correct; only the manifest discovery was missing.
- After the fix, Chrome's own `beforeinstallprompt` event fires on load (intercepted on purpose,
  since `pwa.client.installPrompt: true` defers it for a custom install button rather than the
  native mini-infobar) — that event only fires when Chrome's installability criteria are actually
  met, which is the real confirmation this is now a genuinely installable PWA, not just "files
  exist on disk."

Lighthouse was tried first but Lighthouse 12.x dropped the scored PWA category entirely, so it
produced nothing usable here — verification had to be done directly against the manifest/service
worker APIs instead.

Verified via `npm run build` (clean) + a full production `node .output/server/index.mjs` session
driven by Puppeteer/Chrome, checking `document.querySelector('link[rel="manifest"]')`,
`navigator.serviceWorker.getRegistrations()`, and `navigator.serviceWorker.controller` directly —
not just that the files 200'd. Puppeteer was installed with `--no-save` for this check only and
removed afterward; no dependency changes were left behind.

---

## 8. Pass 6 — Jafari/Shia calculation method + fiqh selector

Requested: add AlAdhan's Fiqh Ja'fari (Shia Ithna-Ashari) calculation method (`method=0`,
`school=0`, `midnightMode=1`), Lahore coordinates (`31.5204`, `74.3587`), no manual buffer on the
returned times, exposed in Settings so the user can pick either fiqh.

**Shipped:**
- New shared `app/utils/prayerFiqh.js` (`FIQH_PARAMS`, `FIQH_OPTIONS`) — one source of truth for
  the AlAdhan params per method, used by both `stores/prayer.js` (daily timings) and
  `calender.vue` (monthly calendar), so they can't drift out of sync with each other.
- `sunni` (unchanged default, `method: 2` / ISNA) vs `jafari` (`method: 0, school: 0,
  midnightMode: 1`), persisted to `localStorage` (`prayerFiqh`), selectable in Settings via a
  segmented `v-btn-toggle` that shows both options side by side rather than hidden in a dropdown
  ("show both fiqhs, user can select one"). Switching refetches prayer times immediately.
- API responses are used exactly as returned — no client-side buffer/offset applied to
  Fajr/Dhuhr/Asr/Maghrib/Isha (the existing "reminder offset" setting only affects *when the
  notification fires*, never the displayed/stored time itself — confirmed this wasn't already
  happening anywhere before wiring the new method in).
- Cache keys (`stores/prayer.js` prayer-times cache, `calender.vue` monthly calendar cache) now
  include the fiqh, so switching methods can't silently keep serving a cached result computed with
  the other one.
- Home, Prayer Times, and the Islamic Calendar's Ramadan Suhoor/Iftar all read from the same
  `usePrayerStore` data, so they update automatically with no page-specific changes needed —
  only the calendar page's own separate API call (for its day-by-day grid) needed touching directly.

**Requested improvements, added alongside:**
- **Fallback location changed from Mecca to Lahore** (`31.5204, 74.3587`) — the old fallback
  (`21.4225, 39.8262`, the Kaaba's coordinates) wasn't a meaningful "nearest guess" for prayer
  times, it was just the qibla-calculation constant reused as a location placeholder. Lahore fits
  this app's evident audience (Urdu translations shown throughout) far better as a default when
  geolocation is denied or unavailable. The Kaaba coordinates used for the actual qibla-bearing
  math (`calculateQibla()`, both in the store and `qibla-direction.vue`) were **not** touched —
  those are correct on their own terms and unrelated to location fallback.
- **Real bug found and fixed in the process:** `calculateQibla()` was only ever called after a
  successful GPS fix — if geolocation was denied, `qibla.value` stayed `null` forever and the
  Qibla Direction page silently never worked, even though a fallback location already existed.
  `fallbackLocation()` now also computes qibla, so it degrades to "approximate, from Lahore"
  instead of "broken."
- Added a location line + "Use My Location" button in Settings so it's visible whether the app is
  using real device location or the fallback, instead of silently guessing with no way to retry
  after granting permission later.

Verified via `npm run build` (clean), `npm run dev` (`/`, `/settings`, `/prayerTime`, `/calender`,
`/qibla-direction` all 200, no console errors), and a direct AlAdhan API call with the exact
requested params confirming the response: `meta.method.name: "Shia Ithna-Ashari, Leva Institute,
Qum"`, `meta.midnightMode: "JAFARI"`, full Fajr–Isha timings returned for Lahore.

---

## 9. Pass 7 — Per-ayah Tafsir on the Surah page

Asked to check whether either API this app already talks to has tafsir (commentary/exegesis), and
if so wire it into the surah reader per ayah.

**API check:**
- `quranapi.pages.dev` (the app's primary source) has a real per-ayah tafsir endpoint —
  `/tafsir/{surah}_{ayah}.json` — returning **3 English tafsirs**: Ibn Kathir (the classical
  standard, longest), Maarif-ul-Quran (Mufti Shafi Usmani — fits this app's Urdu-heavy audience),
  and Tazkirul Quran (shorter). Content is markdown-formatted; some entries (mainly Tazkirul Quran)
  cover a *range* of consecutive ayahs and the API flags this via a `groupVerse` string.
- `alquran.cloud` (used elsewhere for search/per-page-read) also has 6 tafsir editions, but all
  Arabic-only with no translation — skipped rather than bolting on a second, inconsistent tafsir
  source that doesn't fit this app's English/Urdu presentation.

Asked the user two UX questions before building rather than guessing: (1) can multiple ayahs have
their tafsir open simultaneously, or should opening one close any other — went with **multiple open
at once**, matching the existing per-ayah bookmark/audio buttons; (2) should the author choice be
remembered as a default for the next ayah — went with **yes, remember last pick**, with the
author-picker menu still available any time to change it.

**Shipped**, scoped to `surah/[id].vue` per the request:
- `app/services/tafsir.service.ts` + `app/composables/useTafsir.ts` — fetch by `surah_ayah`, with
  a module-scope in-memory cache so re-opening a panel never refetches (on top of the PWA's
  existing `StaleWhileRevalidate` caching on this API from Pass 1).
- `app/utils/renderTafsirMarkdown.js` — a small dependency-free markdown-lite renderer (headings,
  bold, italic, paragraphs) instead of pulling in a markdown library. Escapes the raw API text
  *first*, then only ever inserts a fixed set of known-safe tags via regex — the tafsir content is
  third-party and rendered with `v-html`, so unescaped injection would have been a real XSS hole.
- Per-ayah "Tafsir" button below each verse → tapping it for the first time ever opens a menu of
  the 3 authors; picking one fetches and expands a panel at the bottom of that ayah
  (`v-expand-transition`) showing the rendered content, the `groupVerse` note when present, and a
  close (×) button. Tapping the button on any *other* ayah afterward opens directly with the
  remembered author — no menu needed — and a small author chip inside each open panel lets you
  swap tafsir source for that specific ayah without affecting others.
- Panels reset when navigating to a different surah (`watch(chapterNo, ...)` clears the panel map).

Verified interactively with a real headless-Chrome/Puppeteer session against the production build
(curl/static-HTML checks can't exercise a fetch-and-expand interaction) — confirmed: menu opens on
first tap with all 3 authors listed; selecting one fetches and renders content (~51K chars for
Ibn Kathir on 1:1, matching the direct API check); a second ayah's tafsir button opens directly
with the remembered author (no menu shown) while the first ayah's panel stays open; closing one
panel leaves the other open. `npm run build` clean. Puppeteer was installed with `--no-save` for
this check only and removed afterward.

**Not done (flagged, not requested this pass):** tafsir on `juz/[id].vue` or
`per-page-read.vue` — the ask was specifically the surah page; the same service/composable would
extend to those pages fairly directly if wanted later.

---

## 10. Pass 8 — Tafsir button didn't open (bug report + fix)

Reported: the tafsir icon didn't open anything. Root cause was in the Pass 7 implementation, and
finding it surfaced a second, unrelated pre-existing bug along the way.

**Bug 1 — the actual report:** the per-ayah author picker used a `v-menu` with
`activator="parent"`, which auto-wires Vuetify's *own* click-to-open handling onto the button's
parent element, running independently of (and racing against) the custom `@click` handler on the
button that was also trying to control the same open state. My Pass 7 "interactive test" used
`element.click()` (a synthetic DOM call), which doesn't dispatch the same pointer-event sequence a
real mouse click does — so it happened to pass without ever exercising the actual conflict. Fixed
by dropping the floating `v-menu` entirely: the author picker is now inline — a `v-chip` group
that expands in the same `v-expand-transition` panel used for the tafsir content itself, no
overlay/activator machinery at all. Simpler code, and there's no longer a class of bug where two
independent click handlers can fight over the same state.

**Bug 2 — found while debugging, unrelated to tafsir:** re-testing with Puppeteer using *real*
mouse-dispatched clicks (not `element.click()`) surfaced a genuine hydration mismatch on every
page: `plugins/vuetify.js` detects the OS/localStorage theme and applies it **synchronously**
during plugin setup, before the app mounts. The server has no way to know the client's theme
preference and always renders the `light` default, so if a visitor's system is in dark mode, the
client's first reactive render already says `dark` while the just-received server HTML says
`light` — a hydration class mismatch on every single themed element on the page (buttons, icons,
the app bar, all of it). This class of mismatch doesn't usually break click handlers (Vue still
attaches listeners to the existing DOM nodes; only structural mismatches — different tag/child
counts — force a node replacement that could lose them), so it's very unlikely to have been the
actual reported bug, but it's a real correctness issue and pure upside to fix: theme application
now happens in the `app:mounted` hook (after hydration finishes) instead of before, trading a
hydration-mismatch warning for a much more standard brief flash-to-correct-theme on first load for
dark-mode users — the usual trade-off apps without a cookie-based SSR theme make.

Verified with `npm run build` (clean) and a Puppeteer session using **real** `ElementHandle.click()`
mouse dispatch (not synthetic DOM clicks, to avoid repeating Pass 7's blind spot) against the
production build: tafsir button → picker opens → selecting an author fetches and shows content
(50,947 chars for Ibn Kathir on 1:1, matching the direct API check) → a second ayah's button opens
directly with the remembered author, no picker → hydration-mismatch console error is gone, only
the expected local-only Vercel Analytics 404 remains. `/`, `/settings`, `/surah/2`, `/tasbeeh`,
`/bookmarks` all still 200. Puppeteer installed with `--no-save` for this check only and removed
afterward.

---

## 11. Pass 9 — Is there a Shia/Ja'fari tafsir source?

Asked directly, so checked properly rather than assuming. Queried all three tafsir-capable APIs
available (the app's two existing sources, plus `quran.com`'s — the largest catalog of the three,
checked for completeness even though the app doesn't otherwise use it):

| API | Tafsirs | Shia/Ja'fari? |
|---|---|---|
| `quranapi.pages.dev` (used by the app) | Ibn Kathir, Ma'arif-ul-Quran, Tazkirul Quran | No |
| `alquran.cloud` | 6 Arabic-only (Muyassar, Jalalayn, Qurtubi, Tanwir al-Miqbas, Waseet, Baghawi) | No |
| `quran.com` (checked, not used by the app) | 20 across languages (Ibn Kathir, Tabari, Qurtubi, Sa'di, Baghawi, Fi Zilal al-Quran, Bayan-ul-Quran, etc.) | No |

**Every single tafsir across all three is classical Sunni scholarship.** No Al-Mizan
(Tabatabai), Majma al-Bayan (Tabarsi), Tafsir Nemooneh (Makarem Shirazi), or any other Ja'fari
commentary in any of them, and none expose a school/madhab filter. Shia tafsir text does exist
online (Al-Mizan is fully translated) but lives on sites like al-islam.org as rendered HTML with
no documented public API — pulling from it would mean scraping/parsing pages that can change
without notice, a materially different and more fragile undertaking than calling a stable JSON
endpoint. Flagged to the user rather than attempted, since this app's tafsir feature (and its
Pass 6 fiqh selector) shouldn't imply Shia coverage it doesn't have.

**Shipped:** since a Ja'fari-fiqh user (from the Pass 6 prayer-calculation setting) might
reasonably expect the tafsir picker to include something aligned with their fiqh, and it silently
didn't, the picker in `surah/[id].vue` now labels the three options explicitly: *"Choose a tafsir
(Sunni sources — no Shia/Ja'fari tafsir is available from this app's data provider)."* Quick,
low-risk, no new data source — the fix the user asked for over investigating a scraping-based
integration.

Verified with `npm run build` (clean).

---

## 12. Pass 10 — IndexedDB caching (surah text and tafsir never change)

Asked for a plan first, given the architectural nature of the change; presented a two-tier design
and asked two scoping questions before building — both went with the lighter-weight recommended
option: **progressive/cache-as-you-go** (only cache a surah once actually opened, no background
pre-fetch of the whole Quran) and **no new "download for offline" UI** for audio (leave it lazy,
just relax the existing limits).

**The two tiers:**
1. **Service worker HTTP cache (tuned, not new)** — `quranapi.pages.dev` (text/tafsir) switched
   from `StaleWhileRevalidate` to `CacheFirst`: the old setting re-fetched in the background on
   every single visit purely to "refresh" a cache that never needed refreshing, since this content
   is immutable. Expiration relaxed from 30 days/300 entries to 1 year/1000 entries. Audio's
   `CacheFirst` limits relaxed similarly (14 days → 1 year, 60 → 300 entries) — still only ever
   caches what's actually played, just stops evicting it needlessly soon.
2. **New: IndexedDB structured cache (`useQuranDB.ts`)** — two object stores, `chapters` (keyed by
   surah number) and `tafsirs` (keyed by `surah_ayah`), wrapped with the `idb` library. `useChapters`
   and `useTafsir` now check IndexedDB *before* any network call and write through after a network
   fetch. This is a meaningfully different (and faster) layer than the SW cache: no `fetch()`/
   `Response` overhead, survives independently of Cache Storage eviction, and — the actual point of
   asking for this — persists across full reloads, unlike Pass 7's tafsir cache which was only an
   in-memory `Map` that reset on every page load.
3. **Also added:** `navigator.storage.persist()` requested on client init (`storage.client.js`) —
   without it, a browser under disk pressure can silently evict this cache with no warning, which
   would defeat the entire point of building it.

Every read still has the network as a fallback — IndexedDB failures (private browsing, quota,
unsupported) are swallowed and just result in a normal network fetch, never a broken page.

Verified with a real Puppeteer session against the production build, using **client-side (SPA)
navigation** specifically (not full page reloads, since SSR always re-fetches server-side and
can't touch IndexedDB — that distinction matters here): first visit to Surah 1 makes exactly one
API call and populates IndexedDB (confirmed by reading the object store directly); navigating away
to Surah 2 and back to Surah 1 makes **zero** further API calls while still rendering the correct
content from cache. `npm run build` clean. Puppeteer installed with `--no-save` for this check
only and removed afterward.

---

## 13. Pass 11 — Inline per-ayah translation (like Tafsir), plus two real bugs found along the way

Requested: an inline per-ayah translation toggle mirroring the Tafsir UX from Pass 7/8. Simpler
than tafsir in one respect — the translation text (`arabic1/arabic2/english/bengali/urdu`) is
already part of the chapter payload `useChapters` fetches, so no separate endpoint or fetch state
was needed, just per-ayah panel state.

**Shipped:**
- A "Translation" button next to "Tafsir" under each ayah, same interaction pattern as tafsir:
  tap opens an inline language picker (English / Urdu / Bengali / Arabic-Alt — `arabic1` excluded
  since that's always the main displayed verse text already), picking one shows it in an
  `v-expand-transition` panel, the choice is remembered as the default for the next ayah, and
  multiple ayahs' panels can be open at once (all matching the precedents already established for
  tafsir). Styled with a `secondary`-color accent so the two panel types are visually distinct at
  a glance. Urdu and the alternate Arabic script get `direction: rtl` styling; English/Bengali stay
  LTR — plain text, no markdown, so no `v-html`/XSS concern here at all.

**Bug found — critical, unrelated to the new feature, introduced by Pass 10:** verifying this with
a *direct* fresh visit to `/surah/1` (not client-side navigation, which is what Pass 10's own
verification used) returned a full page crash — `"[nuxt] instance unavailable"`, HTTP 500, no ayah
content, no `<ayah-N>` sections rendered at all. Root cause: Pass 10's `useChapters`/`useTafsir`
added `await getCachedChapter(id)` (an IndexedDB check) *before* the network call, which itself
reads `useNuxtApp()` internally. Any `await` at all before a `useNuxtApp()`-dependent call loses
Nuxt's synchronous per-request SSR context — even an already-resolved promise crosses a microtask
boundary, which is enough to break it. This meant **every direct visit, refresh, or shared link to
any `/surah/[id]` page was silently broken** since Pass 10 shipped; Pass 10's own verification
only ever used SPA (client-side) navigation to `/surah/N`, which doesn't touch SSR at all, so it
never exercised this path. Fixed by gating the whole IndexedDB pre-check behind
`import.meta.client` in both composables — IndexedDB doesn't exist server-side anyway, so this is
correct on its own terms, not just a workaround. Verified with a *direct* `curl`/SSR fetch of
`/surah/1`, `/surah/2` (286 ayahs), `/surah/36` (83 ayahs), `/surah/112` (4 ayahs) — all render
the correct ayah count now, no error markers.

**Bug found — real, pre-existing, unrelated to Pass 10 or 11:** while testing the new translation
buttons with real mouse clicks (per the Pass 8 lesson — synthetic `element.click()` isn't
representative), a click on ayah 2's translation button landed on the fixed bottom audio player
bar instead (`document.elementFromPoint` confirmed the player bar, not the button, was
actually at that screen position). The reader's audio player (`.reader-player`) auto-appears as
soon as a reciter is auto-selected — which happens as soon as any chapter loads, regardless of
whether audio is playing — and is `position: fixed` with `z-index: 999999`. Any ayah whose
controls scroll into that bottom viewport band gets visually and interactively covered, on *any*
surah, not just short ones — this isn't a corner case, it's inherent to how the bar is positioned
today. **Partially mitigated, not fully fixed:** normalized the arbitrary `z-index: 999999` down
to `1000` (no reason for it to outrank dialogs/menus) and increased `.reader-container`'s
bottom padding from 80px to 120px for extra clearance at the end of a surah. Confirmed via
`document.elementFromPoint` this does **not** fully solve the underlying issue — a proper fix
needs the scrollable content to reserve real space for the player's actual height at all scroll
positions (not just the end), which is a bigger layout change than this pass's scope. Logged here
rather than silently claimed as fixed.

Verified with `npm run build` (clean) and a real-mouse-click Puppeteer session against the
production build: language picker opens, English/Urdu render correctly (Urdu right-to-left
confirmed via class check), switching an already-open panel's language works, multiple panels
open simultaneously (confirmed both via a native-click path, working around the player-bar issue
above, and via a taller test viewport where the real click didn't hit the overlay). Tafsir panels
confirmed unaffected. Puppeteer installed with `--no-save` for this check only and removed
afterward.

**Not done (flagged for later, out of this pass's scope):** a real fix for the fixed player bar
covering ayah content at arbitrary scroll positions — would need the player's actual rendered
height reserved in the scrollable layout continuously, not just as end-of-page padding.

---

## 14. Pass 12 — Reading Goals & Khatmah Planner (§4.2 of the new roadmap doc)

A large new planning document landed
(`Quran_WebApp_Feature_Roadmap_and_Module_Specification.md`) proposing 12 modules across 8 phases.
Before touching any code, checked what infrastructure actually exists: `.env` turns out to already
have `NUXT_PUBLIC_SUPABASE_URL`/`NUXT_PUBLIC_SUPABASE_ANON_KEY` set (earlier passes had assumed
Supabase was fully uncredentialed) — but the plugin is still fully commented out and those two
keys aren't even declared in `nuxt.config.ts`'s `runtimeConfig`, so they're currently inert. Given
the size of the roadmap, asked the user which module to start with rather than assuming the
document's own Phase-1-is-Account-Sync ordering — they picked §4.2 Reading Goals & Khatmah
Planner: fully local-first, no new infrastructure decisions needed, builds directly on the
existing `useReadingProgress` tracker.

**Shipped:**
- `app/utils/quranAyahCounts.js` — pulled the cumulative-ayah-position math out of
  `useReadingProgress.ts` into a shared util (`getAbsoluteAyahPosition`, `TOTAL_QURAN_AYAHS`,
  page/juz conversion constants) so the new goals module and the existing progress tracker can't
  drift apart on how "how far through the Quran" is computed. `useReadingProgress.ts` now uses it
  too instead of its own private copy.
- `app/composables/useReadingGoals.ts` — goal CRUD (5 types: finish-by-date, ayahs/day, pages/day,
  Juz/week, custom), a daily reading log keyed by unique `surah:ayah` pairs (deduped via the key
  itself, so re-scrolling past the same ayah doesn't inflate the count), streak calculation,
  pace/catch-up math, and a manual "log reading" fallback for offline/physical-mushaf reading —
  matching the spec's "should use actual reading progress where possible, not only a manual
  checkbox" (manual entry exists as a supplement, not the primary mechanism).
- `app/pages/goals/index.vue` — the Khatmah creation wizard (goal type, daily amount or target
  date, preferred reading days) plus the active goal's progress ring, today's target/streak, and a
  list of other paused/completed goals.
- Hooked into the *existing* scroll-based ayah tracking in `surah/[id].vue` (from Pass 2's
  Continue Reading work) — opening/scrolling through a surah now also feeds the goals daily log,
  with no new tracking mechanism needed.
- A compact "Today's Quran Goal" card on Home, positioned above Continue Reading per the roadmap
  doc's suggested hierarchy — but only rendered once a goal actually exists, per the doc's own
  "do not show empty analytics" principle for first-time users.

**Two real bugs found and fixed during verification** (both caught by actually testing, not by
inspection):
- **Data-loss risk, would have shipped broken:** `recordAyahRead()` (called from the surah
  reader's *existing* immediate-on-load progress watcher) can fire before the goals composable's
  own `load()` has read prior state from `localStorage` back into memory. Since `persist()` writes
  the *entire* `{goals, activeGoalId, dailyLog}` blob, an unloaded `goals.value` (empty on a fresh
  page setup) being persisted would have **silently wiped any previously created goals** the first
  time a user opened a surah page in a new session. Fixed by calling `load()` synchronously before
  the existing immediate watcher can run, not inside `onMounted` (which fires too late — after
  Vue's immediate watch already executed during setup).
- **Wrong pacing on day one:** a goal created *today*, before any time has elapsed, immediately
  showed "behind pace — catching up" with an inflated target. Root cause: `countPreferredDays()`
  floored its result to a minimum of 1 "to be safe", but it feeds "expected progress by now" — a
  same-day goal has had zero elapsed days to fall behind on, so flooring to 1 fabricated an
  artificial deficit for every single new goal. Fixed by removing the floor (0 elapsed days → 0
  expected progress, correctly no catch-up shown); the *actually* divide-by-zero-prone call sites
  elsewhere in the file (`daysUntilTarget`, `projectedFinishDate`'s pace calc) already have their
  own separate `Math.max(1, ...)` guards and were unaffected.
- **Also fixed in passing, same root cause as Pass 6's prayer-time bug:** used a
  `toISOString().slice(0,10)`-based "today" key initially, which shifts the calendar date for any
  non-UTC timezone — wrong in the *opposite* direction for this app's likely Pakistan-based
  audience (UTC+5) than the AlAdhan cache-key bug from Pass 6 was. Written correctly from the
  start once caught in review, using local `getFullYear()/getMonth()/getDate()` instead, with a
  matching `parseDateKey()` that avoids `new Date(dateOnlyString)` (which itself parses as UTC
  midnight, reintroducing the same class of skew from the other direction).

Verified with `npm run build` (clean), direct SSR `curl` checks of `/goals`, `/surah/1`, `/surah/2`
(the exact failure mode from Pass 11 — confirmed not reintroduced), and a full Puppeteer session
against the production build: create a goal via the wizard → confirmed correct shape in
`localStorage` → Home page card renders with the right numbers → reading a surah with real
scrolling increases the daily count (0 → 2) *and* leaves the goal itself intact in storage
afterward (confirming the load-before-persist fix holds under real use, not just in theory).
Puppeteer installed with `--no-save` for this check only and removed afterward.

**Not done (deferred, later modules in the roadmap doc, not this pass):** sharing a goal as a
progress image/link (doc explicitly marks this "later"); the doc's full homepage hierarchy
redesign (Next Prayer Hero / Today's Goal / Continue Reading / Ayah of Day / contextual card /
Quick Actions / Recent Saves, in that exact order with a bottom nav on mobile) — only the Today's
Goal card was added to the existing Home layout, not a full restructure.

---

## 15. Pass 13 — Notes, Collections & Study Library (§4.4 of the roadmap doc)

Told to skip §4.1 (Account/Sync) and move to the next module. §4.3 (True Background Push) was
also skipped without being asked, for the same reason as §4.1 — it needs a subscription-storage
database and a cron scheduler, the same category of infrastructure commitment the user just said
to leave. Went to §4.4 Notes/Collections instead: upgrades the existing Bookmarks page (Surah,
Ayah, Audio, Sajda, Page, Juz tabs) into a real study library, fully local-first like Reading
Goals.

**Shipped:**
- `app/composables/useLibrary.ts` — collections (folders) and per-item metadata (note, tags,
  collection assignments), keyed by the *same* stable bookmark key strings `useBookmarks` already
  uses (`surah:2`, `ayah:2:255`, etc.) — a purely additive metadata layer, not a replacement for
  the existing bookmark storage.
- `app/components/library/BookmarkMetaChips.vue` — one reusable component (note editor with
  debounced autosave + explicit "Saving…"/"Saved" state, a tag combobox, collection-assignment
  chips) dropped into all three bookmark card templates (bespoke Surah, bespoke Ayah, and the
  shared Audio/Sajda/Page/Juz block) instead of tripling the dialog logic across each.
- `bookmarks.vue` gained: a search box (matches title/subtitle/note/tags), a sort dropdown (Surah
  order / Recently saved / Tag / Collection), and a collections filter chip row — all three
  compose together (e.g. searching *within* a selected collection).
- Extended `useBookmarks.js` with a parallel `addedAt` timestamp map (when each key was first
  bookmarked) so "Recently saved" sorting is based on real bookmark-creation order — additive
  only, doesn't touch the existing `Set`-based storage or any of the 8+ files that already call
  its `add`/`remove`/`toggle` helpers, so nothing that already depended on that composable's
  behavior could regress.
- Deleting a bookmark now also cleans up its library metadata (`removeItemMeta`) so notes/tags
  don't orphan themselves under a key nothing points to anymore.

Scoped down from the full spec for a local-only pass: tags/collections are stored denormalized per
item rather than as separate normalized tables (no benefit to that without a real database yet;
the Postgres schema in the roadmap doc is still the target once Account/Sync happens), and search
is scoped to the current tab rather than a global cross-tab search — both reasonable simplifications
for a `localStorage`-backed implementation, not different from what a synced version would need
architecturally later.

Verified with `npm run build` (clean), direct SSR `curl` checks of `/bookmarks`, `/surah/2`,
`/sajda` (no regressions from the Pass 11/12 SSR-crash class of bug), and a full Puppeteer session
against the production build: created a collection, opened the note/tag editor on a seeded
bookmark, typed a note (confirmed the debounced "Saved" state fires), added a tag, assigned it to
the collection, confirmed the resulting `localStorage` shape exactly matches what was entered, and
confirmed "Recently saved" sort correctly orders a bookmark added a few seconds later ahead of an
older one. Puppeteer installed with `--no-save` for this check only and removed afterward.

**Not done (out of scope for a local-only pass, matches the doc's own note that "Collections sync
across devices" is an acceptance criterion tied to §4.1):** cross-device sync of collections/notes
— inherently blocked on Account/Cloud Sync, which is deferred.

---

## 16. Pass 14 — Offline & Download Manager (§4.5 of the roadmap doc)

Told to keep going after Notes/Collections; picked §4.5 next in document order (§4.1/§4.3 already
skipped for infra reasons). Builds directly on Pass 1's PWA/Workbox setup and Pass 10's IndexedDB
caching — this module makes that existing, opportunistic caching *visible and controllable*
instead of hidden behind implementation details, per the doc's own framing.

**Shipped:**
- `useQuranDB.ts` extended with `deleteChapter`/`deleteTafsirsForSurah` — Pass 10 only ever added
  to the IndexedDB cache, this module needed real removal for "users can see and remove downloaded
  content."
- `useDownloads.ts` — a download manifest (`localStorage`, small metadata only — the actual
  content still lives in Pass 10's IndexedDB stores) tracking what's been *explicitly* downloaded,
  distinct from Pass 10's opportunistic "whatever you happened to browse" caching. `downloadSurah`
  fetches chapter text (all translations come back in one API response already), optionally loops
  through every ayah fetching tafsir with limited concurrency (6 at a time — sequential would be
  slow for long surahs, unlimited-parallel risks hammering the API) with progress reporting, and
  optionally caches one reciter's full-surah audio file. Every step is wrapped so a failure in one
  (e.g. audio) never blocks or aborts the rest — matches the doc's "never block reading if a
  download fails."
- `useOnlineStatus.ts` + a small offline badge in the app bar (only visible when actually offline)
  — the doc is explicit that the homepage should get "an offline badge, not a download dashboard."
- `/downloads` page: storage usage meter (`navigator.storage.estimate()`), the download form
  (surah picker, tafsir toggle with a warning about request volume, optional reciter), the list of
  downloaded surahs with size/contents and per-item removal, and a separate "clear temporary
  cache" action.
- **The temporary-vs-downloaded cache distinction the spec asks for** ("separate 'clear temporary
  cache' and 'delete downloads' controls") needed a real design decision: downloaded audio is
  cached into its own `quran-downloads-audio-cache` (`Cache Storage` API, opened directly), kept
  separate from Pass 1/10's opportunistic `quran-audio-cache`. "Clear temporary cache" only ever
  deletes the SW's opportunistic caches — it cannot touch anything a user explicitly downloaded,
  which was the actual point of asking for the distinction.

**Two real bugs found during verification, both through actually driving the download end-to-end,
not by inspection:**
- **CORS bug, would have silently produced empty "downloads":** the chapter-audio URL scheme is
  `github.com/.../raw/...`, which 302-redirects to `raw.githubusercontent.com`. The *redirect
  response itself* sends a malformed empty `Access-Control-Allow-Origin` header — even though the
  final destination is properly CORS-enabled, a browser fetch in default `cors` mode is rejected
  outright by the broken intermediate header, so `cache.add(audioUrl)` failed for every single
  audio download. Fixed by fetching with `{ mode: "no-cors" }` instead: the resulting opaque
  response can still be cached and played back via `<audio>` (which doesn't need CORS-readable
  bytes, unlike `fetch()`-then-read use cases), which is exactly what this needs.
- **Silent lie in the manifest:** the original code recorded `reciterName`/`audioUrl` in the
  downloaded-surah entry *unconditionally* whenever a reciter was selected — including when the
  `cache.add()` call above was failing (caught by a defensive try/catch that swallowed the error,
  so the download "succeeded" from the manifest's point of view while the audio silently wasn't
  actually cached). Fixed alongside the CORS fix: those fields are now only set after the cache
  write genuinely succeeds, so the UI can't claim audio is available offline when it isn't.

Verified with `npm run build` (clean), direct SSR `curl` checks of `/downloads`, `/surah/1`, `/`
(no regression of the Pass 11 SSR-crash class), and a full Puppeteer session against the
production build: downloaded Surah 1 with tafsir and audio both enabled, confirmed via direct
IndexedDB/Cache Storage inspection that the chapter, all 7 ayahs of tafsir, and the audio file
(post-fix: cache entry count 1, ~9.4MB, matching a real audio file — pre-fix it was ~230KB with
zero cache entries, i.e. the CORS failure) were genuinely present; confirmed the storage meter
reflected real usage; removed the download and confirmed all three (manifest, IndexedDB, Cache
Storage) were fully and correctly cleaned up. Puppeteer installed with `--no-save` for this check
only and removed afterward.

**Not done (flagged, not required by this pass):** a UI for browsing/selecting *which* Tafsir
authors to download (currently always downloads all 3, since a single tafsir fetch already returns
all of them together — matches Pass 7's endpoint shape); download cancellation mid-progress.

---

## 17. Pass 15 — Advanced Search & Discovery (§4.6), and a real CORS bug found along the way

Continued through the roadmap doc in order. Unlike the last three modules, this one already had a
real, working page (`search.vue`) from before this whole roadmap started — debounced search
against `alquran.cloud`, but English-only ("Search Quran (translations only)"), 3 hardcoded
editions, no Juz/tafsir/bookmarked filters, no highlighting, no history, no URL persistence, and
the raw provider response shape (`ayah.surah.englishName`, `ayah.edition.name`) used directly in
the template. This pass upgraded it in place rather than building something parallel.

**Checked directly, not assumed:** whether `alquran.cloud`'s search endpoint actually supports
Arabic/Urdu, since the old UI's "(translations only)" label implied it might not. It does — a
plain `curl` test without proper URL-encoding of the Arabic/Urdu query 404'd and briefly looked
like a real API limitation, but with correct percent-encoding, Urdu (`ur.jalandhry`, `ur.maududi`)
and Arabic Quran text (`quran-simple`) both return real matches. Also confirmed the API has no
real "exact vs. loose phrase" distinction (it's inherently substring matching — a quoted phrase
just fails to match anything, since quote characters aren't literally in the text) — so no fake
toggle was built for that; it would have been UI that didn't actually do anything different.

**Shipped:**
- `useSearch.ts` — normalizes the provider response into a clean `SearchResult` shape so no
  `alquran.cloud`-specific field names leak past this composable, with an editions catalog spanning
  English (3), Urdu (2), Arabic Quran text (1), and Arabic Tafsir (4 of Pass 9's 6 known editions)
  — grouped so the UI can offer "Search in: English / Urdu / Arabic / Arabic Tafsir" instead of a
  flat list of unfamiliar identifiers.
- `useSearchHistory.ts` — persisted recent searches (deduped, capped, clear-all).
- `app/utils/searchHighlight.js` — same escape-first-then-insert-safe-markup pattern as Pass 7's
  tafsir renderer, used to `<mark>` the matched substring in results.
- `search.vue` rewritten: Juz filter (client-side, using the *existing* `useJuz()` — the API has no
  server-side Juz scope, so this fetches the juz's ayah membership once and filters results
  against it), a "bookmarked ayahs only" toggle (reusing `useBookmarks`), suggested-search chips,
  recent-search chips, results reordered so Surah+ayah number leads the excerpt (not the other way
  around, matching the doc's explicit ask), and the whole filter state (query, edition
  group/edition, surah, juz, bookmarked-only) synced to the URL so results are shareable/bookmarkable.

**Real bug found and fixed, unrelated to this module's own code:** verifying the new Juz filter
surfaced that `useJuz()` — used by `juz/[id].vue` since Pass 2 — throws a CORS error for *any*
client-side-only invocation. Root cause: `.env`'s `QURAN_API_BASE2` was set to `http://` instead of
`https://`; the API 301-redirects HTTP to HTTPS, and the redirect response itself doesn't carry a
usable CORS header, so a browser fetch is rejected outright even though the final HTTPS destination
is fully CORS-enabled — the same *class* of bug as Pass 14's GitHub-audio-redirect CORS issue, just
via a different mechanism (a misconfigured env var instead of a third-party host quirk). This had
been invisible for the entire project because every prior check of `useJuz()`/the Juz page was only
ever verified via SSR `curl` (Node's fetch doesn't enforce CORS at all — only browsers do), so a
bug that only manifests client-side never got caught. Fixed by correcting the `.env` value to
`https://`.

Verified with `npm run build` (clean), direct SSR `curl` checks, and a real Puppeteer session
against the production build — including working around several of my *own* test-script timing
issues along the way (results legitimately take 1–2s to arrive over the real network; a couple of
runs also chased what looked like failures but were actually correct behavior, e.g. searching the
English word "patience" against an Urdu edition correctly returns zero matches). Final clean runs
confirmed: English search returns real highlighted results; switching to Urdu with an actual Urdu
query term returns 60 real RTL-styled highlighted results; the Juz filter correctly narrows results
to only ayahs within that juz on a fresh, direct URL load (the real "shared link" scenario); search
history persists. Puppeteer installed with `--no-save` for this check only and removed afterward.

**Not done (flagged, not required by this pass):** cloud-indexed search across personal notes
(doc's own note: "if cloud search is implemented" — blocked on the deferred Account/Sync module).

---

## 18. Pass 16 — Ramadan Mode (§4.7), the fifth roadmap module

Continued through the roadmap doc in document order (§4.1/§4.3 already skipped for infra reasons).
The app already had a bare-bones "Ramadan panel" on Home since Pass 1 (day counter, Suhoor/Iftar,
Iftar countdown, gated on `prayer.isRamadan`) — this pass upgraded that into the full module the
spec describes: fasting tracker, a Ramadan Khatmah goal, daily Dua/Ayah reflection, a Laylat
al-Qadr reminder area, and a manual start-date override, while keeping Home itself lightweight per
the doc's "contextual hero card, not a dashboard" rule.

**Investigated first, not assumed:** how Hijri/Ramadan detection already worked. `prayer.js`'s
`isRamadan`/`ramadanDay` computeds (from the AlAdhan API's `date.hijri.month.number === 9`) already
correctly detect Ramadan — no new detection logic was needed. Suhoor/Iftar were already just Fajr/
Maghrib read off the same timings object the main prayer schedule uses (no duplicate fetch);
`Imsak` was available in the same API response but never read, so that was added as its own field
rather than continuing to imply Suhoor-end and Imsak are the same instant. `useReadingGoals`'s
existing `"finish-by-date"` goal type needed no special-casing for a Khatmah — creating one with
`targetDate` = estimated end of Ramadan and a `"Ramadan Khatmah"` label reuses the whole
CRUD/streak/pace system as-is.

**Shipped:**
- `app/composables/useRamadan.ts` — new composable, `$storage`-backed (`quran:ramadan:v1`,
  following the same `load()`/`persist()` pattern as `useReadingGoals`/`useBookmarks`/`useLibrary`):
  - **Start-date override**: `isRamadan` from the prayer store is calculated, not locally
    announced — some users' mosque/authority will differ by a day. `setStartOverride(dateKey)` lets
    a user say "Ramadan actually started on X for me," active for a 30-day window so it doesn't
    expire a day early on a 30-day month. `isRamadanActive`/`ramadanDay` prefer the override when
    set, falling back to the AlAdhan-calculated values otherwise — used everywhere instead of
    reading `prayer.isRamadan`/`prayer.ramadanDay` directly, so both Home and the new hub page stay
    in sync with whichever source is authoritative.
  - **Fasting tracker**: per-day status (`fasted`/`missed`/`planned`) keyed by local date (not
    UTC — same `toDateKey`/`parseDateKey` convention as `useReadingGoals`, avoiding the exact class
    of timezone bug fixed in Pass 6/12), a streak computed the same way as the reading streak, and
    stats (fasted/missed/planned counts for the current Ramadan). Deliberately local-only with no
    server sync — matches the spec's "optional and private."
  - `createRamadanKhatmah()` — thin wrapper around `useReadingGoals().createGoal()` with
    `type: "finish-by-date"`, target date = estimated end of Ramadan (assumes a 30-day month since
    the real length isn't knowable in advance; labeled "estimated" everywhere it's shown in the UI).
- `app/utils/ramadanContent.js` — a small static, non-authoritative content set: 5 short duas
  (Arabic + translation + hadith/Qur'an reference) rotated one-per-day by Ramadan day number, and
  the 5 odd-numbered last-ten-nights dates for Laylat al-Qadr with an explicit disclaimer that the
  exact night isn't specified and the shown day is calculated, not locally announced — matching the
  doc's "do not present religious/legal rulings as authoritative app-generated advice" principle.
- `app/pages/ramadan/index.vue` — new module hub: day-counter hero (Imsak/Suhoor/Iftar), the
  fasting tracker (tap-to-cycle 7-day strip + "plan tomorrow" action), the Khatmah card (create, or
  show live progress via the same `useGoalStats` the Goals page uses), today's Dua card, the
  existing `<LazyServicesAyahOfDay>` component reused for the "daily Ayah" half of the spec's
  "Daily Dua/Ayah card" requirement, a Laylat al-Qadr card that highlights itself on a matching
  night, a link to the full Islamic Calendar, and the start-date-override control (always visible,
  not just during Ramadan, so it can be set in advance). Shows an honest "It isn't Ramadan right
  now" state (with the override control still available) outside the month, instead of an empty
  page.
- `prayer.js` gained `imsakTime` (was fetched but unused); nav drawer gained a "Ramadan Mode" entry.
- **Home**: the existing Ramadan panel was enriched in place (same conditional slot, per the doc's
  "contextual card, don't add a permanent new row") rather than replaced — added the Imsak card
  alongside Suhoor/Iftar, switched its `v-if` from `prayer.isRamadan` to `useRamadan()`'s
  override-aware `isRamadanActive`/`ramadanDay`, and made the whole card clickable through to
  `/ramadan` for the fuller experience (fasting tracker, Khatmah, Dua, Laylat al-Qadr) — kept
  deliberately compact on Home itself, per the spec's explicit "do not put a giant calendar on the
  homepage."

**Real bug found in verification, environment-specific (not app code):** this sandbox's outbound
network cannot reach `api.aladhan.com` (confirmed directly with `curl --max-time 8`, connection
timeout) — so in every Puppeteer session run here, `prayer.pending` never resolves, and Home's
Ramadan card (gated on `!prayer.pending`, the same pre-existing gate the original Pass-1 panel
already had) never renders even once `isRamadanActive` correctly flips true from a manually-set
override. Confirmed this is a network artifact and not a regression by checking the `/ramadan` hub
page, which has no such gate — it rendered `isRamadanActive`-driven content correctly and
immediately. In a normal deployment with real network access, `prayer.pending` resolves in a
second or two as it always has.

Verified with `npm run build` (clean), direct SSR `curl` checks of `/`, `/ramadan`, `/goals`,
`/surah/1`, `/calender`, `/bookmarks`, `/downloads`, `/search` (all 200, no regression of the Pass
11 SSR-crash class), and a real Puppeteer/Chrome session against the production build: confirmed
the honest "not Ramadan right now" state before any override; set a start-date override via the
native date input (dispatching real `input`/`change` events, not synthetic value assignment on a
Vue-bound element) and confirmed the hub page immediately showed the correct day count, fasting
tracker, and Khatmah card; tapped a fasting-day cell through a full fasted → missed → clear cycle,
confirmed via the rendered icon class at each step; created a Ramadan Khatmah and confirmed via
direct `localStorage` inspection that it landed in `useReadingGoals`' own store under the
`"Ramadan Khatmah"` label (i.e. genuinely reusing that system, not a parallel one); reloaded the
page and confirmed the override and fasting log both survive a real navigation, not just SPA state.
Puppeteer's full Chromium download failed in this sandbox (network-restricted), so verification
used `puppeteer-core` driving the machine's already-installed Chrome instead — installed with
`--no-save` and removed afterward, same as every prior pass's Puppeteer usage.

**Not done (flagged, not required by this pass):** exporting fasting/Khatmah history anywhere
outside this device (blocked on the deferred Account/Sync module, same as Notes/Collections in
Pass 13); a full "sharing a Khatmah as a progress image" per the roadmap doc's own "later" note on
that feature.

---

## 19. Pass 17 — every remaining local-first module, done together (§4.8, §4.9, §4.10, §4.11, §4.12)

Asked to check what was left, then "do the ones which don't need backend." That's five modules:
§4.9 Audio & Reciter Experience, §4.12 Settings/Personalization/Accessibility, §4.8 Hifz
(Memorization) Mode, §4.10 Islamic Calendar Events & Personal Reminders, and §4.11 Shareable Ayah
Cards. Account/Cloud Sync (§4.1) and True Background Push (§4.3) remain the only two modules in
the whole roadmap doc still unbuilt, both still blocked on server infrastructure that hasn't been
committed to. Built as one pass instead of five separate ones at the user's explicit request, but
each module below is scoped and verified independently.

### 19.1 §4.9 Audio & Reciter Experience — ✅ shipped

The core gap: `useAudioPlayer.ts`'s `audio`/`playing`/`currentUrl` state was already global
(`useState`), but every page that *used* it stopped playback on navigation —
`surah/[id].vue` had an `onBeforeRouteLeave(() => reset())` specifically to kill it, and no other
page rendered any player UI at all, so audio was invisible and dead the moment you left whichever
page started it.

**Shipped:**
- `useAudioPlayer.ts` extended with: a shared `nowPlaying` metadata ref (`{type, surahNo, title,
  subtitle}`) so a player UI can show *what's* playing regardless of which page started it;
  persisted `playbackRate`/`repeatOne`/`autoAdvance` preferences (`quran:audio-prefs:v1`); a
  `resumeInfo` snapshot written on every `pause` (`quran:audio-resume:v1`) so a full reload doesn't
  lose the position (in-memory `useState` doesn't survive a real page reload, only client-side
  route changes — same distinction Pass 10/11 already ran into with IndexedDB/SSR); Media Session
  API wiring (`navigator.mediaSession.metadata`/`playbackState`, play/pause/seek handlers) so lock
  screens and hardware media keys work; `playNextInQueue()` for auto-advancing into the next surah
  when a full-surah track ends and `autoAdvance` is on.
- New `app/components/audio/AudioMiniPlayer.vue` — a global fixed-bottom mini-player (title,
  scrubber, time, speed menu, repeat-one, auto-advance, play/pause, close), mounted once in both
  `default.vue` and `reader.vue` layouts so it's present on every page, not just the surah reader.
- **Removed** `surah/[id].vue`'s `onBeforeRouteLeave` reset — that was the actual bug; audio now
  survives client-side navigation like the rest of the app's state does, and the mini-player is
  what lets you see and control it away from the page that started it. Its old bottom-of-page
  player bar (the one Pass 11 already knew covered ayah content at some scroll positions) is gone
  entirely, replaced by the global one.
- Every existing playback entry point — `surah/[id].vue`'s full-surah toggle, `surah-audios/[id].vue`,
  `ReciterAudioCard.vue`, `surah-listing.vue`'s per-row play button — now passes `nowPlaying` metadata
  into `play()` so the mini-player always has a real title, not just a URL.
- `useReciter().loadSaved()` is now called from both layouts' `onMounted`, so the picked reciter
  survives across the whole session instead of only within whichever single page called it before.

**Real, pre-existing bug found and fixed in the process:** `surah/[id].vue`'s reciter-list watcher
only auto-picked a reciter *if none was already selected* (`if (!selected.value) setReciter(list[0])`).
Combined with `loadSaved()` now restoring a previously-picked reciter *before* this watcher runs, the
restored `selected.value` — whose `.url` only ever belonged to whatever surah it was picked on
originally — was being reused as-is on an unrelated surah, meaning the play button would have
silently tried to play the *wrong surah's* audio file under the right reciter's name. Fixed by
always re-resolving the reciter by *name* against the current surah's own audio list
(`list.find(r => r.reciter === selected.value?.reciter) ?? list[0]`) every time the surah changes —
the name is the durable "preference," the URL is only ever meaningful per-surah. This also made the
Settings module's "preferred reciter" picker (§19.2) correct by construction, since it only ever
needs to store the name.

Verified with `npm run build` (clean), SSR `curl` checks of every touched route, and a Puppeteer
session against the production build: started playback from `/surah-audios/1` (confirmed mini-player
appears there immediately with correct title/reciter), then triggered a **real Vue Router SPA
navigation** (clicked the nav-drawer's Home link, not `page.goto` — a full reload would trivially and
uninterestingly reset in-memory state, same distinction noted in Pass 11/16) and confirmed the
mini-player persisted on Home with the same metadata. Puppeteer installed with `--no-save` for this
check only and removed afterward.

### 19.2 §4.12 Settings, Personalization & Accessibility — ✅ shipped

Scoped to genuinely new, additive controls rather than a full migration of every existing
`localStorage` key into one schema (the spec's "central preferences schema" — real churn risk across
many files for no functional gain, since every existing key already works correctly where it's read).

**Shipped, all in `settings.vue`, all following the app's existing `localStorage`-per-composable
conventions:**
- **Reading Preferences**: a "default verse display" picker was net-new — `selectedType` in
  `surah/[id].vue` (which of arabic1/arabic2/english/urdu/bengali shows as the main verse text) was
  never persisted at all before this pass, silently resetting to `arabic1` on every visit even
  though the *inline per-ayah* translation/tafsir pickers (Pass 7/11) already remembered their last
  pick. Now persisted under `preferredVerseDisplay`, read on mount, written on every tab change. The
  default tafsir author picker exposes the same `tafsirDefaultAuthor` key Pass 7 already reads/writes
  from the surah page, just without requiring a visit there first.
- **Audio Defaults**: preferred reciter (name-only, per the §19.1 fix above), default playback speed,
  and an auto-advance-next-surah toggle — all backed directly by `useAudioPlayer`'s own persisted
  prefs and `useReciter`, so Settings and the mini-player can never disagree about the current state.
- **Accessibility** (new `useAccessibilityPrefs.ts`, `quran:accessibility:v1`): reduced motion, high
  contrast, larger touch targets, and an Arabic-text size slider. Applied via `data-*` attributes on
  `<html>` set client-side *after mount* — the same pattern Pass 8 already established for theme,
  for the same reason (the server can't know a client's saved preference, so rendering with a guess
  would just trade one hydration mismatch for another). The reduced-motion toggle also respects the
  OS-level `prefers-reduced-motion` media query even if the user never touched the in-app switch.
  Global CSS rules live in `app/assets/css/main.css`; the Arabic font-size control is intentionally
  scoped to the Surah reader's `.verse-text` (via a `--arabic-font-scale` CSS custom property) rather
  than attempting to resize every Arabic-script element app-wide, which would have meant touching
  many unrelated hardcoded font sizes for a much larger, riskier diff.
- **Data & Privacy**: "Export my data" dumps every `localStorage` key as a downloadable JSON file
  (client-side `Blob`/`<a download>`, nothing uploaded anywhere); "Clear all local data" wipes
  `localStorage` after an explicit confirmation dialog and reloads. Both scoped to local-only,
  matching every other module in this app — there's no account to delete server-side.

Verified with `npm run build` (clean), SSR `curl` of `/settings`, and a Puppeteer session: toggled
"Reduce motion," confirmed `document.documentElement.dataset.reducedMotion` and the persisted
`quran:accessibility:v1` blob both updated correctly.

### 19.3 §4.8 Memorization / Hifz Mode — ✅ shipped, new module

Entirely new — no prior Hifz-related code existed anywhere in the repo.

**Shipped:**
- `useHifz.ts` (`quran:hifz:v1`) — a memorization plan is a Surah + ayah range with its own
  lightweight SM-2-style spaced-repetition state (`interval`, `ease`, `nextReviewAt`,
  `lastReviewedAt`, `reviewCount`) flattened onto the plan itself, rather than a separate
  plans/ranges/review-events table split — reasonable for a `localStorage`-backed local-only
  implementation, matching the same simplification call Pass 13 made for Notes/Collections. Grading
  a review "Again" drops the interval back to 1 day and lowers the ease factor (capped); "Good"/"Easy"
  grow it, and a plan graduates from `learning` to `memorized` once its interval crosses 21 days — a
  manual "Mark memorized" / "Needs review" override is also available, matching the spec's literal
  three states.
- `app/pages/hifz/index.vue` — stats row (due today / memorized / total), a Review Queue (overdue
  sorted first) where each plan expands to show its ayah range fetched via the *existing*
  `useChapters()` (so it benefits from Pass 10's IndexedDB cache like everywhere else), with
  independent show/hide toggles for Arabic and translation (for self-testing recall), a per-ayah
  "repeat audio" button via `useVerse()` + the shared `useAudioPlayer`, an optional "loop range"
  toggle that auto-advances through the range's ayahs on natural playback completion (detected via
  `progress ≈ duration`, not just "playback stopped," so a manual pause doesn't trigger the
  auto-advance), a debounced mistake-notes field, and the three grading buttons; a plan wizard
  (Surah picker from `surah.json`, start/end ayah with range validation against that Surah's real
  ayah count); and an all-plans list with pause/resume/delete.
- Home gets a "Next review: {plan title}" contextual card, shown only when something is actually
  due — matching the doc's own suggested homepage copy and its "don't show empty analytics"
  principle, same conditional pattern as the Goals and Ramadan cards.

Verified with `npm run build` (clean), SSR `curl` checks, and a Puppeteer session against the
production build: created a plan with the wizard (Surah 1, ayahs 1–5), confirmed it appeared in both
the Review Queue and All Plans with the correct default state; expanded it and confirmed the Arabic
and English text rendered from the real chapter fetch; graded it "Good" and confirmed via direct
`localStorage` inspection that `interval` grew 1→2, `nextReviewAt` advanced by two real days,
`reviewCount` incremented, and `lastReviewedAt` was set — the SRS math runs correctly end-to-end, not
just in isolation.

### 19.4 §4.10 Islamic Calendar, Events & Personal Reminders — ✅ shipped

Built on the existing `calender.vue` (Hijri/Gregorian month grid, AlAdhan-backed) rather than a
parallel page.

**Shipped:**
- `app/utils/islamicEvents.js` — a static lookup of widely-observed Hijri-calendar dates (Islamic New
  Year, Ashura, Mawlid, Isra and Mi'raj, the five commonly-cited Laylat al-Qadr nights, start of
  Ramadan, Eid al-Fitr, start of Hajj, Day of Arafah, Eid al-Adha), matched against each day's
  already-fetched Hijri month/day — explicitly documented as a calculated reference, not a ruling,
  since exact observance can differ by local moon-sighting authority (the same caveat Pass 16 already
  built a real override mechanism for on the Ramadan-start case specifically).
- `useReminders.ts` (`quran:reminders:v1`) — plain local CRUD for personal reminders (title, date,
  note, optional yearly recurrence, done flag), following the same `$storage`/`useState` pattern as
  every other module.
- `calender.vue` gained: month prev/next navigation (there was previously no way to view any month
  but the current one at all — a real, if minor, missing feature, not a bug in existing code); an
  event marker dot on matching day cells plus an "Events This Month" list; a "Personal Reminders"
  section (add/toggle-done/delete) with a dialog pre-filled from a selected day's date; an
  "Add reminder for this day" shortcut in the day-detail card.
- Home shows a small event chip next to the Hijri date **only on a day that actually matches** a
  known event (e.g. "Day of Ashura") — deliberately not a forward-looking "N days until X" countdown,
  since accurately projecting a future Hijri date across month boundaries (months alternate 29/30
  days unpredictably) would need real Hijri calendar data for months not yet fetched, not just
  arithmetic on today's date; this keeps the homepage claim honest rather than approximating.

**Two real, pre-existing bugs found and fixed while touching this page:** (1) `calendarDays` items
never had a `date` field at all, yet the template used `:key="day.date"` for the `v-for` and compared
`selectedDay?.date === day.date` for the "active" highlight — every day silently keyed as `undefined`,
so Vue could not reliably track day identity and the "selected" highlight was comparing `undefined ===
undefined` for every cell rather than the clicked one specifically. (2) the `today` CSS class was
bound to `day.isToday`, a field the mapping function never actually set — today's cell never got its
outline highlight, ever. Both fixed by adding a real per-day `date` (the Gregorian date string AlAdhan
already returns) and computing `isToday` by comparing each day's Gregorian date to the real current
date.

Verified with `npm run build` (clean) and SSR `curl` checks of `/`, `/calender`. The calendar grid
itself and its month-by-month AlAdhan fetch could not be exercised live in this sandbox (`api.aladhan.com`
is unreachable from here, the same environment-specific gap noted in Pass 16 — confirmed via direct
`curl --max-time 8` timeout, not a code issue). The **Personal Reminders** feature has no such
dependency (it's local-only) and was verified live end-to-end with Puppeteer: added a reminder via
the dialog, confirmed it rendered in the list and landed correctly in `quran:reminders:v1`.

### 19.5 §4.11 Shareable Ayah / Quote Cards — ✅ shipped

**Shipped:**
- `useAyahCardImage.ts` — a dependency-free Canvas renderer (1080×1350, four gradient themes matching
  the app's existing visual language — teal, night-gold, Ramadan purple, light) that draws the Arabic
  verse (RTL, word-wrapped against measured text width), the translation, and a Surah:ayah reference
  with attribution. Waits on `document.fonts.ready` first so the custom Amiri Quran/Sansation fonts
  are actually loaded before text is measured and drawn — skipping that would silently wrap text
  against fallback-font metrics and mismeasure every line.
- `app/components/ayah/AyahShareCard.vue` — a dialog with a live canvas preview, theme picker chips,
  and three actions: Copy Text (verse + translation + reference + a deep link to
  `/surah/{n}#ayah-{n}`, the same stable link format Pass 4/16 already established), Download Image,
  and Share — which uses the Web Share API with a real image file when `navigator.canShare({files})`
  supports it, falls back to a text-only `navigator.share`, and falls back to copy if neither exists.
  No generated image is ever stored unless the user explicitly downloads/shares it, per the spec.
- Wired into two places: the Ayah of the Day card's existing share icon (previously copy-text-only,
  now opens the real card) and every per-ayah share button on the Surah reader (previously also
  copy-text-only, and — a small correctness fix alongside — used to copy whatever `selectedType`
  happened to be showing, meaning "share" could silently copy the *English* translation as if it were
  the Arabic verse if that tab was selected; now always pulls real `arabic1` + `english` regardless of
  which tab is currently displayed).

**Real bug found and fixed in verification:** the dialog's canvas-drawing `watch()` had no
`{ immediate: true }`. Because `AyahShareCard` is mounted fresh (`v-if`) each time it's opened, its
`open` prop starts at `true` from the very first render — a non-immediate watcher never fires on that
initial state since nothing "changed" from the watcher's point of view, so the canvas was silently
never drawn on first open (confirmed via `getImageData`: a blank default 300×150 canvas, zero
non-transparent sampled pixels). Fixed by adding `{ immediate: true }`; confirmed via the same pixel
check afterward: a real 1080×1350 canvas with drawn content.

Verified with `npm run build` (clean) and a Puppeteer session against the production build: opened
the share dialog from a Surah-page ayah, confirmed the canvas rendered real (non-blank) pixel data at
the correct dimensions after the fix.

---

All five modules' `npm run build`s are clean individually and as a final combined build. Every route
touched across this pass — `/`, `/hifz`, `/calender`, `/settings`, `/surah/1`, `/surah/2`,
`/surah-audios/1`, `/surah-listing`, plus every previously-existing route — returns 200 via SSR
`curl` with no `[nuxt] instance unavailable`/hydration-crash markers (the Pass 11 SSR-crash class
checked for every pass since). Puppeteer (`puppeteer-core`, driving the machine's installed Chrome)
was installed with `--no-save` for this pass's verification and removed afterward, same as every
prior pass.

**Not done (out of scope for this pass, both still genuinely blocked on infrastructure, not
forgotten):** §4.1 Account/Cloud Sync and §4.3 True Background Prayer Push — both need a real
Supabase project and, for Push specifically, a server-side subscription store, VAPID keys, and a
cron scheduler. These are now the *only* two unbuilt modules in the entire roadmap document.

---

## 20. Pass 18 — Hifz Mode redesign into an adaptive practice engine (`Hifz_Module_Specification.md`)

A second, much more detailed spec document landed specifically for Hifz — not part of the original
12-module roadmap doc, and substantially deeper than what Pass 17 shipped. Pass 17's Hifz Mode
tracked state per **plan** (a whole Surah/ayah range shared one SRS interval); this spec asks for
state per **individual ayah** and per **ayah-to-ayah transition**, a real Practice/Test distinction,
progressive hints, weak-item recovery, adaptive daily sessions with resume, and Mastery/Health/
Activity reporting — effectively a full local-first spaced-repetition practice app for memorization,
built on top of (not replacing) the shipped foundation.

**Data model (`useHifz.ts`, `quran:hifz:v2`) — rewritten:**
- `HifzTarget` (Surah + range + daily new-ayah target + daily time goal + `lastPosition`, the
  progression cursor) replaces the old flat `HifzPlan`.
- `HifzAyahState` — one record per introduced ayah: `strength` (`not-started → learning → memorized
  → strong`, with `strong → memorized → weak` regression on retention loss), its own SM-2-lite
  `interval`/`ease`/`nextReviewAt`, `historicalMistakes` (never decremented — the spec is explicit
  that history isn't rewritten) alongside a `recentResults` rolling window that drives *current*
  weakness independently, plus `hintsUsed`/`lastHintLevel` (hint-assisted recall is recorded as
  weaker evidence than a clean one).
- `HifzTransitionState` — the same idea one level up: "the user knows ayah 10 and ayah 11
  individually but can't connect them" is a distinct, separately-tracked failure mode from either
  ayah's own strength.
- `HifzActivityDay` — new/revision/recovered-ayah/recovered-transition/assessment counts per day,
  feeding both the Activity list and the heatmap.
- **Migration from Pass 17's `quran:hifz:v1`**: runs once, expands each old plan into a target plus
  per-ayah state across its whole range (seeded from the plan's own interval/ease/`nextReviewAt`,
  since v1 only tracked at plan granularity — an approximation, not a lossless upgrade, but a
  reasonable one). **Bug caught in verification and fixed:** the first version derived the migrated
  `surahName` by regex-stripping the plan's stored title (`"Surah 67: 1-10"` → strip `"Surah 67: "`
  → whatever's left) — except the *default* title Pass 17 generated for every plan without a custom
  name was exactly that numbers-only format, so the "surah name" for nearly every real migrated plan
  would have come out as garbage like `"1-10"` instead of an actual name. Fixed by looking the name
  up from `surah.json` by `surahNo` instead of parsing the title string at all; confirmed via a
  seeded-localStorage migration test that it now correctly renders as e.g. "The Sovereignty" for a
  migrated Surah 67 plan.
- **Revision-first backoff**, per the spec's §28: new-ayah introduction pressure for a target
  automatically drops (half rate at 1-2 weak items, zero at 3+) rather than always introducing the
  full daily quota regardless of how much existing material is already struggling.

**Session engine (`useHifzSession.ts`, `quran:hifz-session:v1`) — new:** one item-queue builder per
entry point (`buildDailyItems`, `buildWeakItems`, `buildQuickTestItems`, `buildFreePracticeItems`,
`buildAssessmentItems`), all producing the same `SessionItem[]` shape consumed by one runner — so
"Practice Weak Ayahs," "Full Range Test," and "Today's Hifz" are all just different queues through
the identical practice/test/grade/resume machinery instead of parallel implementations. The daily
queue follows the spec's order (warm-up → weak ayahs/transitions → due/overdue revision,
round-robined across active targets → new memorization → a final mixed-mode retest of a random
sample of what was just covered). The active session is persisted after every single grade/skip, so
a real interruption (closing the tab mid-session) resumes exactly where it left off — confirmed via
a full page reload between grading one item and returning to `/hifz`, which correctly showed "Resume
Session, 1/6" rather than losing progress or restarting.

**Practice vs. Test, per the spec's core distinction:**
- `HifzPractice.vue` — the learning environment: progressive prefix practice for new ayahs (ayah 1,
  then 1→2, then 1→2→3, explicitly drilling the connections, not just isolated recall), show/hide
  Arabic and translation, a lightweight Mushaf-context strip (nearby ayahs, tap to preview), repeat
  controls (1×/3×/5×/10×/"until confident") driving Listen→Recite→Listen through the shared
  `useAudioPlayer`, and an "I'm Ready" button that hands off to testing without touching SRS itself.
- `HifzTest.vue` — the measurement environment: Arabic/translation hidden by default across all six
  modes (Full Ayah, Continue, Previous, Next, Random, Transition), a 4-level progressive hint ladder
  (first word → first few words → beginning portion → full reveal, with hint usage recorded against
  the ayah), and Again/Good/Easy grading. **Mistake recovery** (spec §19): tapping "Again" doesn't
  immediately grade-and-advance — it opens an inline "listen again, retry, then continue" affordance
  first, and only calls back into `useHifzSession`'s grading once the user explicitly continues,
  matching the "record → replay → retry → continue" flow rather than just recording a miss and
  moving on.
- Both reuse the app's *existing* global audio system (`useAudioPlayer`, the persistent mini-player
  from Pass 17) rather than a second Hifz-specific player, per the spec's explicit instruction not
  to duplicate that infrastructure.

**Daily dashboard and reporting (`app/pages/hifz/index.vue`):** a "Today's Hifz" card showing one
workload number and a time estimate (not a priority breakdown) with a single "Start Today's Hifz"
action, or "Resume Session" when one's in progress, or "You're caught up" + Quick Test when nothing's
due; a Weak Areas section with one-tap "Practice All"; per-target Mastery cards (coverage, strength
breakdown, a transparent Hifz Health score shown *with* its three underlying signals — coverage/
recall/consistency — never as a bare unexplained number, per the spec's explicit instruction — plus
"weakest ayah" with its own explained reason, and Full Range Test); a Quick Test dialog (duration →
adaptive weak/overdue/random mix sized to roughly fit the time budget); and an Activity section
(28-day heatmap, this-month stats broken into new/revision/recovered/assessment counts, and a recent
daily log) — all computed from the `activity[]`/`ayahStates[]`/`transitionStates[]` arrays already
being maintained by grading, not a separate tracked metric.

**Explicitly consolidated from the spec's suggested component list**, for a real, working v1 rather
than fourteen thin files: `HifzTestPrompt`/`HifzHint` live inside `HifzTest.vue`;
`HifzSessionSummary`/`HifzWeakAyahs`/`HifzWeakTransitions`/`HifzMastery`/`HifzProgressMap`/
`HifzQuickTest`/`HifzActivity` are sections of `app/pages/hifz/index.vue` and
`app/pages/hifz/session.vue` rather than separate component files, since each is a small, mostly
read-only view with a couple of buttons — splitting them further would have meant prop-plumbing
overhead without a real reuse benefit. `HifzTargetWizard.vue`, `HifzPractice.vue`, and
`HifzTest.vue` are kept as real standalone components since those *are* independently substantial
and reused across entry points.

Home's existing Hifz card (from Pass 17) was updated to match the new model — it now shows the
daily session's real item count and time estimate rather than a single "next plan" title, since a
"plan" is no longer the right unit.

Verified with `npm run build` (clean), SSR `curl` checks of `/`, `/hifz`, `/hifz/session` and every
other existing route (no regressions), and a full Puppeteer session against the production build
covering the acceptance-criteria core loop end-to-end: seeded a fake Pass-17 `quran:hifz:v1` plan
and confirmed it migrated into a real named target with per-ayah state (10 ayah states from a
10-ayah plan); created a fresh target through all five wizard steps; started Today's Hifz; completed
a new-ayah item's progressive Practice phase via "I'm Ready," landed in Test phase, revealed, and
graded "Good" — confirmed via direct `localStorage` inspection that the per-ayah SRS state updated
correctly (`interval` 1→2, `reviewCount` 0→1, `nextReviewAt` advanced, `recentResults: ["good"]`);
confirmed the session's `currentIndex` advanced and persisted; reloaded the app fully and confirmed
the hub correctly offered "Resume Session" instead of losing the in-progress queue. Puppeteer
(`puppeteer-core`, driving the machine's installed Chrome) installed with `--no-save` for this
pass's verification and removed afterward, same as every prior pass.

**Not done (flagged, matches the spec's own explicit non-goals in §51):** voice-recognition/
speech-to-text recitation grading, teacher/parent collaboration, backend sync, Juz/Hizb/page-level
target creation, and any XP/points/badges/leaderboards — all deliberately out of scope for this
version, per the spec itself.
