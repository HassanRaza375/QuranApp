# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A local-first Quran companion PWA (Nuxt 4 / Vue 3 / Vuetify 3): reading, translations, tafsir,
audio recitation, prayer times/Qibla, Islamic calendar, reading goals, a memorization (Hifz)
practice engine, Ramadan mode, offline downloads, and a personal study library — all working
without an account. No backend of its own: the app talks directly to third-party Quran/prayer
APIs and keeps all user data (bookmarks, goals, Hifz progress, settings) on-device (IndexedDB +
localStorage).

Full feature list, tech-stack table, and architecture gotchas are in [`README.md`](./README.md) —
read it first, this file only adds what the README doesn't cover. For build history / decisions,
see `PROJECT_PLAN.md`; for the Hifz engine's design, see `Hifz_Module_Specification.md`; for the
Prophets & Qur'anic Persons feature, see `prophets-quran-feature.md`; for the original feature
roadmap, see `Quran_WebApp_Feature_Roadmap_and_Module_Specification.md`. For a tech-agnostic,
module-by-module rebuild spec of the whole app, see `MODULE_BLUEPRINT.md`. For the literary/poet
study modules (Mir Anis and, over time, others) — their research process, anti-hallucination rules
and source-verification levels — see `mir_anis_module_research_extraction_plan.md` and
`Mir_Anis_Module_Research.md`. For the Wajibat / Daily Fiqh module (Module 18, `/fiqh`, Fiqh Ja'fari,
per-marja' sourced rulings), see `wajibat-fiqh-jafari-module.md` (spec), `wajibat_decisions.md`
(decisions + official sources — wins over the spec) and `wajibat_progress_log.md` (phase reports). Its ruling data is **generated** by `scripts/wajibat/` (see its README) — never hand-edit
`app/data/wajibat/rulings/*.ts`, `procedures/*.ts` or `glossary.ts`; change the generator and rebuild.

## Commands

```bash
npm install
npm run dev       # dev server, http://localhost:3000
npm run build     # production build → .output/
npm run generate  # static generation
npm run preview   # serve the production build locally
npx eslint .       # lint (uses @nuxt/eslint's generated flat config, .nuxt/eslint.config.mjs)
npm test           # vitest run — unit tests for dependency-free logic in app/utils/*.ts (tests/**/*.test.ts)
```

Vitest covers pure, Nuxt-free logic only (currently: the Prophets & Qur'anic Persons search/filter/
validation/resume-state/timeline/chronology helpers in `app/utils/persons*.ts` — see
`MODULE_BLUEPRINT.md` Module 17). There is no component/e2e test setup — composables and `.vue`
files that rely on Nuxt auto-imports or SSR context aren't unit-tested; verify those by running the
dev server and driving the feature in a real browser instead.

`postinstall` runs `nuxt prepare` automatically after `npm install` (regenerates `.nuxt/`).

## Architecture

- **Nuxt 4 file-based routing** — routes live in `app/pages/**/*.vue`; dynamic segments use
  `[id].vue`. Two layouts: `default.vue` (nav drawer + persistent mini-player) and `reader.vue`
  (distraction-light, used by the Surah/Hifz readers).
- **State**: one Pinia store (`usePrayerStore`, prayer times/calc-method); every other domain uses
  Nuxt `useState` inside a dedicated composable (`app/composables/use*.ts`) — see the composable
  table in README.md for what each one owns.
- **Persistence**: stateful composables persist through `useNuxtApp().$storage`
  (`app/plugins/storage.client.js`, a JSON-safe localStorage wrapper) — never call
  `localStorage` directly in new code. Quran text/translations/tafsir are additionally
  cache-through'd into IndexedDB via `useQuranDB` for instant offline reads, with the PWA's
  Workbox `CacheFirst` runtime caching (configured in `nuxt.config.ts`) as the fallback layer.
- **Content services** (`app/services/*.service.ts`) are thin fetch wrappers around three external
  APIs, exposed through `app/plugins/api.js` (`$api`/`$api2`) and configured via
  `runtimeConfig.public.quranApiBase(2)` (`.env`: `QURAN_API_BASE`, `QURAN_API_BASE2`):
  - `quranapi.pages.dev` — text/translations/tafsir/audio (immutable content, cached forever)
  - `alquran.cloud` — search, per-page (mushaf) reads (**must be `https://`**, see README's CORS
    gotcha)
  - `api.aladhan.com` — prayer times / Hijri calendar
  - A few of these are also proxied through `server/api/*.get.js` (Nuxt server routes) rather than
    called client-side directly — check there before assuming a composable hits the API raw.
- **Auth/Sync**: `@supabase/supabase-js` and `app/plugins/supabase.client.ts` are installed but
  **not wired into the UI** — this is intentional (see README's "Known gaps"), not a bug to fix
  incidentally.
- **Global audio player**: `useAudioPlayer`'s `nowPlaying` state is shared app-wide (the mini
  player is mounted once, in the layout). Always pass `{type, surahNo, title, subtitle}` into
  `play()`. Reciter URLs are resolved by matching reciter *name* against the current surah's own
  audio list, not stored/reused directly — a reciter's URL from one surah doesn't apply to another.
- **Fiqh-awareness**: Sunni/Jaʿfari (localStorage key `prayerFiqh`, a raw string `sunni` | `jafari`, not JSON) is a user setting, not a build-time identity.
  Prayer calculation and the Islamic-events dataset (`app/utils/`) both filter by it — new
  fiqh-sensitive content should follow the same filter-by-setting pattern, not hard-code one
  tradition.

### SSR/hydration hazards specific to this codebase

- **Don't `await` before a `useNuxtApp()`-dependent call during SSR.** `useChapters`/`useTafsir`
  gate their IndexedDB pre-check behind `import.meta.client` because crossing a microtask boundary
  before calling a Nuxt composable loses the synchronous per-request SSR context and crashes the
  page. Follow this pattern in any new composable that touches both fetched content and IndexedDB.
- **Use local-calendar-day keys, not `toISOString()`.** "Today" must be computed via
  `getFullYear()/getMonth()/getDate()` — `toISOString().slice(0,10)` shifts the date in any
  timezone ahead of UTC (this previously broke prayer-time caching and goal pacing).
- **Theme/accessibility prefs apply post-mount, not during SSR** (`app:mounted`/`onMounted`) to
  avoid a hydration class mismatch, at the cost of a brief unstyled flash — this is deliberate.

## Key directories

`app/composables/` (one file per data domain), `app/stores/` (the one Pinia store),
`app/services/` (API wrappers), `app/utils/` (pure helpers: ayah-count math, Islamic events data,
markdown-lite renderer), `app/plugins/` (`$storage`, `$api`/`$api2`, theme, Supabase),
`server/api/` (a handful of proxied endpoints), `app/components/hifz/` (Hifz practice/test/wizard
UI — pairs with `useHifz`/`useHifzSession`).
