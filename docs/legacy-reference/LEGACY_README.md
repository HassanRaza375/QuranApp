# Quran App

A local-first Quran companion PWA: reading, translations, tafsir, audio recitation, prayer
times/Qibla, an Islamic calendar, reading goals, a memorization (Hifz) practice engine, Ramadan
mode, offline downloads, and a personal study library — all working without an account, and
installable as a native-feeling app on mobile/desktop.

For the pass-by-pass build history (what shipped when, bugs found, and why), see
[`PROJECT_PLAN.md`](./PROJECT_PLAN.md). For the original feature roadmap this was built from, see
[`Quran_WebApp_Feature_Roadmap_and_Module_Specification.md`](./Quran_WebApp_Feature_Roadmap_and_Module_Specification.md).
For the Hifz practice-engine spec, see [`Hifz_Module_Specification.md`](./Hifz_Module_Specification.md).

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Nuxt 4 (Vue 3, file-based routing, SSR) |
| UI | Vuetify 3 (tree-shaken via `vite-plugin-vuetify`) |
| State | Pinia (prayer store) + Nuxt `useState` (everything else) |
| Offline data | IndexedDB (`idb`) for Quran text/tafsir, `localStorage` for everything else |
| PWA | `@vite-pwa/nuxt` — Workbox runtime caching, installable manifest |
| Auth/Sync | Supabase JS client installed, **not wired into the UI** (deferred — see below) |
| Content APIs | `quranapi.pages.dev` (text/translations/tafsir/audio), `alquran.cloud` (search, per-page read), `api.aladhan.com` (prayer times/Hijri calendar) |
| Analytics | `@vercel/analytics` |

No backend of its own — the app talks directly to third-party Quran/prayer APIs and keeps all user
data (bookmarks, goals, Hifz progress, settings, etc.) on-device.

---

## Getting started

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # production build → .output/
npm run preview   # serve the production build locally
```

### Environment variables (`.env`)

```
QURAN_API_BASE=https://quranapi.pages.dev/api
QURAN_API_BASE2=https://api.alquran.cloud/v1   # must be https:// — see the CORS note below
NUXT_PUBLIC_SUPABASE_URL=...       # inert until Account/Sync is built (see Known gaps)
NUXT_PUBLIC_SUPABASE_ANON_KEY=...  # inert until Account/Sync is built
```

**Gotcha:** `QURAN_API_BASE2` must be `https://`, not `http://` — the API 301-redirects HTTP→HTTPS,
and the redirect response itself doesn't carry a usable CORS header, so a browser `fetch()` (not
`curl`, which doesn't enforce CORS) is silently rejected if this is set to `http://`.

---

## Features

**Core reading** — Surah reader with multi-translation tabs (Arabic/Urdu/English/Bengali/alt-Arabic
script), per-ayah bookmarking, per-ayah and full-surah audio, per-ayah inline Tafsir (3 Sunni
sources) and inline translation panels, Juz index/detail, per-page (mushaf) reader, Surah listing,
Search (Arabic/Urdu/English, Juz/edition/bookmarked filters, highlighting, history, URL-shareable).

**Prayer & calendar** — Prayer times with Sunni/Jaʿfari (Shia) calculation-method toggle, Qibla
direction, in-app notification scheduling (foreground/background-tab only — no server push),
Islamic (Hijri) calendar with month navigation, a 29-event Islamic-events dataset (fiqh-aware —
filtered by whichever calculation method you've selected), and personal reminders.

**Personal study** — Reading Goals/Khatmah planner (5 goal types, streaks, catch-up pacing), Notes
& Collections (tag/organize bookmarks into folders with notes), Bookmarks across Surah/Ayah/Audio/
Sajda/Page/Juz.

**Hifz (memorization)** — A full local-first adaptive practice engine (`/hifz`): ayah-level and
transition-level SRS tracking (not just per-plan), Practice vs. Test modes, 6 test types,
progressive hints, weak-ayah/transition recovery, a daily session runner with resume, Quick Test,
full-range assessments, per-target Mastery/Health scoring, and an activity heatmap. See
`Hifz_Module_Specification.md` for the full design.

**Ramadan mode** (`/ramadan`) — day counter with a start-date override (for local moon-sighting
differences), Suhoor/Imsak/Iftar times, a fasting tracker, a Ramadan Khatmah goal (reuses the
Reading Goals system), a daily Dua/Ayah card, and Laylat al-Qadr reminders.

**Audio** — A persistent global mini-player (survives navigation across the whole app, not just the
page that started it), playback speed, repeat-one, auto-advance to the next surah, Media Session
API support (lock-screen/hardware controls), and resume-on-reload.

**Offline & PWA** — Installable manifest, Workbox caching (immutable Quran text/tafsir/audio,
`CacheFirst`), a separate explicit Download Manager (`/downloads`) with its own storage distinct
from opportunistic browsing cache, and an offline-status indicator.

**Sharing** — Themed, customizable ayah share cards (8 preset themes + custom colors/patterns/photo
backgrounds + text controls), Copy Text, Download Image, and native Share (Web Share API).

**Other tools** — Tasbeeh (dhikr counter), Asma-ul-Husna, Sajda list, Settings (reading/audio
defaults, accessibility — reduced motion/high contrast/larger touch targets/Arabic text size, data
export/clear).

**Literary modules** (`/poets`, opt-in) — source-verified study modules on Urdu/Islamic poets,
starting with Mir Anis (`/poets/mir-anis`, currently a Phase 1 seed dataset — see
`mir_anis_module_research_extraction_plan.md` and `Mir_Anis_Module_Research.md`). Hidden from the
sidebar by default; enable via Settings → Additional Modules, since more modules get added here
over time.

---

## Project structure

```
app/
├── pages/            File-based routes (see `app/pages/**/*.vue`)
├── layouts/           default.vue (nav drawer + mini-player), reader.vue (distraction-light Surah/Hifz reader)
├── components/
│   ├── audio/          Global AudioMiniPlayer
│   ├── ayah/            AyahShareCard + image-generation composable pairing
│   ├── hifz/            Practice/Test/Wizard components for Hifz sessions
│   ├── layout/           App bar, nav drawer
│   └── services/         Reusable content-display components (ayah-of-day, reciter cards, ...)
├── composables/        One composable per data domain — see table below
├── stores/              usePrayerStore (the one Pinia store; everything else uses useState)
├── services/             Thin fetch wrappers around the external content APIs
├── utils/                Pure helpers (ayah-count math, Islamic events data, markdown-lite renderer, ...)
└── plugins/               $storage (localStorage wrapper), $api/$api2 (API clients), theme, Supabase (disabled)
```

### Key composables

| Composable | Owns |
|---|---|
| `useReadingProgress` / `useReadingGoals` | Continue-reading position; Khatmah/goal CRUD + SRS-free pacing |
| `useBookmarks` / `useLibrary` | Bookmark keys across all content types; notes/tags/collections layered on top |
| `useHifz` / `useHifzSession` | Ayah/transition-level memorization state; session-queue building and running |
| `useRamadan` | Ramadan detection + override, fasting log, Suhoor/Iftar |
| `useReminders` | Personal calendar reminders |
| `useAudioPlayer` / `useReciter(s)` | The one shared global player; reciter selection |
| `useChapters` / `useTafsir` / `useVerse` / `useSurahs` / `useJuz` / `usePage` | Content fetch + IndexedDB cache-through (`useQuranDB`) |
| `useAccessibilityPrefs` | Reduced motion / high contrast / large touch targets / Arabic text scale |
| `useDownloads` / `useOnlineStatus` | Explicit offline downloads; connectivity state |
| `useAyahCardImage` | Canvas-based share-card image renderer |
| `usePoetModules` | Literary/poet module registry + Settings-gated sidebar visibility |

---

## Architecture notes (things that will bite you if you don't know them)

- **`localStorage` via `$storage`, not directly.** Every stateful composable follows the same
  shape: `useState` for reactive in-memory state, a `load()`/`persist()` pair guarded by
  `import.meta.client`, reading/writing through `useNuxtApp().$storage` (a thin JSON-safe wrapper).
  Follow this pattern for any new local-first feature.
- **Local-calendar-day keys, not `toISOString()`.** "Today" is computed via
  `getFullYear()/getMonth()/getDate()`, never `toISOString().slice(0,10)` — the latter shifts the
  date for any timezone ahead of UTC (this broke prayer-time caching and goal pacing early on; see
  Pass 6/12 in `PROJECT_PLAN.md`).
- **Never `await` before a `useNuxtApp()`-dependent call during SSR.** `useChapters`/`useTafsir`
  gate their IndexedDB pre-check behind `import.meta.client` specifically because crossing even one
  microtask boundary before calling into Nuxt's composables loses the synchronous per-request SSR
  context and crashes the whole page (`"[nuxt] instance unavailable"`). IndexedDB doesn't exist
  server-side anyway, so this is correct, not just a workaround.
- **Theme/accessibility prefs apply after mount, not during SSR.** The server can't know a client's
  saved theme/accessibility preference; applying it before hydration causes a class mismatch. Both
  are applied in `app:mounted`/`onMounted` instead, trading a brief flash for a clean hydration.
- **Audio metadata is global.** `useAudioPlayer`'s `nowPlaying` ref is shared app-wide so the mini
  player (mounted once per layout) can show the right title regardless of which page started
  playback — always pass `{type, surahNo, title, subtitle}` into `play()`.
- **Reciter selection is resolved by name, not URL.** A picked reciter's audio URL only makes sense
  for the surah it was picked on; every consumer re-resolves the correct URL for the *current* surah
  by matching the reciter's name against that surah's own audio list.
- **Fiqh-aware content, not fiqh-primary.** Sunni/Jaʿfari is a user setting (`prayerFiqh`, a raw string), not a
  build-time app identity — prayer calculation, the Islamic-events dataset, and (eventually) tafsir
  selection all filter/tag by it rather than hard-coding one tradition as default.

---

## Known gaps (deferred, not forgotten)

- **Account & Cloud Sync** — Supabase client is installed but disabled; needs a real Supabase
  project (the `.env` keys are currently placeholders) and RLS-backed sync of bookmarks/goals/
  Hifz progress across devices.
- **True background push** — prayer/reminder notifications currently only fire while the app is
  open (foreground or a backgrounded tab). Real push (works fully closed) needs VAPID keys, a
  server-side subscription store, and a cron scheduler.
- **Twelve Imams' calendar** — the Islamic-events dataset intentionally excludes several contested
  martyrdom dates pending proper sourcing (see the design discussion in `PROJECT_PLAN.md`).

Everything else in the original feature roadmap doc is shipped.
