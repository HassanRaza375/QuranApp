# Revamp plan

Branch: `revamp-design-logic`. Folder: `revamp-quran/`. The legacy app stays in the repo root.

## Goals

- A calmer, more readable UI built on shadcn-vue, with proper text rendering (Arabic, Urdu, Bengali, English) and consistent spacing.
- Light by default, with a fully designed dark mode and mobile-first layouts.
- Pages that do not need an API work offline, and the app installs as a web app on mobile.
- Nothing is lost for existing users: same storage keys, same data.

## Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Nuxt 4, Vue 3, strict TypeScript | Same as the legacy app, so logic transfers |
| Rendering | SPA (`ssr: false`) by default | See "Rendering" below |
| UI | shadcn-vue via the `shadcn-nuxt` module | Reka UI underneath |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` | Install steps: follow the current shadcn-vue Nuxt docs, not memory |
| Theme | Tokens in CSS variables, class-based dark mode, light default | Inline script to avoid a theme flash |
| Icons | `@nuxt/icon` with `@iconify-json/lucide` bundled | No CDN |
| Fonts | `@nuxt/fonts` or Fontsource, self-hosted | Newsreader, Instrument Sans, Noto Naskh Arabic, Noto Nastaliq Urdu, a Bengali serif; keep the legacy Qur'an script font |
| State | Pinia for shared state (preferences, player, library, prayer); composables for features | |
| Storage | IndexedDB (`idb`) and localStorage through one wrapper | Legacy localStorage keys unchanged. **New IndexedDB data goes in a separate database, `quran-revamp-db`; `quran-app-db` is never changed or version-bumped, so rolling back to the legacy app stays safe** |
| PWA | `@vite-pwa/nuxt` (Workbox) | `generateSW` first; `injectManifest` if audio range requests need custom handling |
| Tests | Vitest (pure logic), Playwright (offline and flows) | |
| Package manager | npm | Matches the legacy lockfile |
| Hosting | A second Vercel project with root directory `revamp-quran` | Preview URLs, installable PWA on a phone, no service-worker clash with the legacy app |

Not included for now: Supabase (not wired in the legacy app), the Vercel analytics package can be added at cutover.

## Rendering and basic SEO

This is a personal project, so SEO is basic.

- Default to client-side rendering (SPA). This makes offline simple: every route renders from one precached app shell.
- Prerender only a few public pages so link previews work: Home, About, Surah listing. Phase 0 must prove the mechanism (global SPA with per-route prerender overrides). If that does not work cleanly, fall back to SPA everywhere plus static meta tags on the shell.
- Basic SEO checklist, done in the final phase: unique title and description per page (`useSeoMeta`), default Open Graph image, canonical tag, `robots.txt` with noindex on personal pages (Library, Settings, Tasbeeh, Downloads, Hifz, Goals), a small sitemap, manifest and icons.
- The legacy `seo.md` (about 540 URLs) belongs to the legacy app and is not a goal here.

## Offline model

| Level | Meaning | Examples |
| --- | --- | --- |
| A | Works offline by nature | Tasbeeh, Sajda, Asma-ul-Husna, Settings, Library, Ramadan timetable and events, Prophets & People (bundled JSON) |
| B | Works offline after first use or an explicit download | Qur'an text, translations, tafsir (IndexedDB, as in the legacy app); audio (Cache Storage, with range-request support so seeking works); prayer times |
| C | Online only | Full-text search, audio that was never downloaded, live corrections from external APIs. These need a friendly offline state |

Technical notes:
- Offline cannot be tested in dev mode. Use `npm run build` and `npm run preview`.
- API calls and server routes must be excluded from the navigation fallback.
- Each page doc states its level and its offline empty state.

### Prayer times and Hijri dates

- Source: AlAdhan monthly calendar endpoint (by coordinates or city) with the user's method and Asr school. The response holds every day of the month and the Hijri date for each day.
- Cache in IndexedDB (in `quran-revamp-db`, never in the legacy `quran-app-db`), keyed by rounded latitude and longitude, method, school and month, for example `prayer:v1:<lat2>:<lon2>:<method>:<school>:<YYYY-MM>`. Record the fetch time, timezone and location label.
- Keep the current and next month. When fewer than about 7 days remain, fetch the next month in the background. From 1 Sha'ban, also fetch Ramadan so its timetable is offline.
- Show the cache first and update quietly. Offline, show cached times with "Last updated".
- A manual **Update now** action (Prayer page and Settings, Prayer & location). Fetch first; replace the cache only if the fetch succeeds; keep the old data on failure.
- The fiqh setting is the legacy key `prayerFiqh` (raw string `sunni` | `jafari`). The prototype's internal `shia` is never stored.
- Changing fiqh, method, school or moving more than about 10 km invalidates the key. The Hijri date adjustment is applied in the app and does not change the key.
- Local calculation (an Adhan-style library) is a later fallback only. It must be compared against AlAdhan for several cities first, because AlAdhan's Ja'fari method is the Leva Institute, Qum.

## Routes

Keep the legacy routes so existing links and bookmarks keep working. Phase 0 confirms the list from `app/pages/`. Known mapping:

| Prototype page | Legacy route |
| --- | --- |
| Home | `/` |
| Surah listing (Surah, Juz, Page tabs) | `/surah-listing`, `/juz`, `/juz/[id]` |
| Surah reader | `/surah/[id]` |
| Per page | `/per-page-read` |
| Settings | `/settings` |
| Prayer and Qibla | `/prayerTime` and `/qibla-direction` (one page component with two tabs, both routes kept) |
| Library | `/bookmarks` (title "Library") |
| Prophets & People | `/persons`, `/persons/[id]`, `/persons/timeline` |
| Story reader | `/stories/[id]` (chapter in a query parameter) |
| Ramadan and events | `/ramadan`, with `/calender` kept |
| Tasbeeh | `/tasbeeh`, `/tasbeeh/[id]` |
| Sajda | `/sajda` |
| Asma-ul-Husna | `/asma-ul-husna` |

## Phases

Every phase ends with a phase doc, a page doc per page, a PROGRESS update, and a commit. See `docs/templates/`.

| # | Phase | Prototype | Notes |
| --- | --- | --- | --- |
| 0 | Foundation | Shell (header, grouped sidebar, mobile drawer, mini player) | Toolchain, SPA and prerender spike, PWA and offline-shell spike, tokens, fonts, icons, theme, storage wrapper and key inventory, legacy bridge, preferences store, responsive menu and sheet, toast with undo, root tooling ignores |
| 1 | Home | `d-page-home` | Includes the prayer-times data layer (monthly cache, Update now) because Home needs the next-prayer tile |
| 2 | Settings | `d-page-settings` | Eight sections; the preferences it edits already exist from Phase 0 |
| 3 | Surah listing, Juz, Page | `d-page-surah` | Working filter, sort, reciter, playing state |
| 4 | Surah reader and full player | `d-page-reader`, player overlay | Translation and tafsir menus, per-ayah tools, global player |
| 5 | Prayer and Qibla | `d-page-prayer` | UI on the Phase 1 data layer; compass with device orientation |
| 6 | Library | `d-page-library` | Migrate the legacy bookmarks, notes and collections without changing keys |
| 7 | Prophets & People and Stories | `d-page-people`, `-person`, `-story` | Story Mode rules in the design doc |
| 8 | Ramadan and events | `d-page-ramadan` | Both-fiqh events list, timetable, tracker |
| 9 | Utilities | `d-page-tasbeeh`, `-sajda`, `-asma`, `-mushaf` | |
| 10 | Search | prototype is made in chat when this phase is reached | |
| 11 | Downloads and offline manager | prototype pending | |
| 12 | Knowledge modules (Peoples, Places, Themes, Duas, Events, Signs, Commands) | prototype pending | Reuse the Phase 7 layouts |
| 13 | Daily Fiqh (Wajibat) | prototype pending | Ja'fari only for now; see the `wajibat_*` docs |
| 14 | Hifz | not designed | Apply the design system; behaviour from the legacy spec |
| 15 | Reading goals, Calendar, About | not designed | Same |
| 16 | Cutover | | PWA audit, accessibility, performance, basic SEO, Vercel project, switch the main domain |

Pages without a prototype are designed first (in chat or by applying `DESIGN_SYSTEM.md`) and approved before building.

## Cutover checklist (Phase 16; collected from the phase reviews, PROGRESS.md has the details)

- [ ] **Open-Meteo city search is non-commercial only.** Its free API may not be used by an app with subscriptions or advertising. Revisit the place search (a commercial key, or remove it and keep the coordinates entry) if the app gains either. The attribution link must stay beside the results and in Settings, Data & privacy.
- [ ] Compare the Ja'fari prayer times (Leva, Tehran) with an independent source.
- [ ] Remove `/foundation`; verify the legacy offline-new-tab root cause against the deployed worker.
- [ ] Replace the World Magnetic Model coefficients before 2030 (`scripts/gen-wmm.mjs`).
- [ ] **Normalise the persons relationship data to one convention** (the data mixes two: 17 parent/child entries say "this person is the X of the related one", three say the opposite, and the spec reads the type as the related person's role). Do it once, when the legacy page is retired, as one reviewed commit to `app/data/quranPersons.ts`, then delete `REVERSED_ENTRIES` in `app/lib/people.ts` and update `tests/people.test.ts` (see `docs/phases/phase-07a-people.md`, "Finding").
- [ ] Real-device checks recorded as done: audio (including the 210 generic-type files), the compass, notifications, share.

## Definition of done (every page)

- Matches the prototype in light and dark, at 1280px and 375px, including empty, first-run and offline states.
- Uses real data from the legacy services; no placeholder content.
- Keyboard and screen-reader pass; 44px touch targets on mobile; no layout shift.
- Offline level documented and tested.
- Build, lint and tests clean; no console errors.
- Phase doc and page doc written; PROGRESS updated.
