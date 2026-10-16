# Progress

Update this file at the end of every phase.

| # | Phase | Status | Phase doc | Page docs |
| --- | --- | --- | --- | --- |
| 0 | Foundation | Approved 2026-10-15; follow-ups done | [phase-00-foundation](phases/phase-00-foundation.md) | [app-shell](pages/app-shell.md), [foundation](pages/foundation.md), [placeholders](pages/placeholders.md) |
| 1 | Home | Approved 2026-10-15 | [phase-01-home](phases/phase-01-home.md), [plan](phases/phase-01-home-plan.md) | [home](pages/home.md) |
| 2 | Settings | Approved 2026-10-16 | [phase-02-settings](phases/phase-02-settings.md), [plan](phases/phase-02-settings-plan.md) | [settings](pages/settings.md) |
| 3 | Surah listing, Juz, Page | **Done, awaiting review** (2026-10-16) | [phase-03-surah-listing](phases/phase-03-surah-listing.md), [plan](phases/phase-03-surah-listing-plan.md) | [surah-listing](pages/surah-listing.md) |
| 4A | Surah reader | **Done, awaiting review** (2026-10-16) | [phase-04a-surah-reader](phases/phase-04a-surah-reader.md), [plan](phases/phase-04a-surah-reader-plan.md) | [surah-reader](pages/surah-reader.md) |
| 4B | Full player (seeking, resume, repeat, auto-next, per-ayah audio, player sheet) | Not started (split from Phase 4, see the 4A plan) | | |
| 5 | Prayer and Qibla | **Done, awaiting review** (2026-10-16) | [phase-05-prayer-qibla](phases/phase-05-prayer-qibla.md), [plan](phases/phase-05-prayer-qibla-plan.md) | [prayer-qibla](pages/prayer-qibla.md) |
| 6 | Library | Not started | | |
| 7 | Prophets & People and Stories | Not started | | |
| 8 | Ramadan and events | Not started | | |
| 9 | Utilities | Not started | | |
| 10 | Search | Needs prototype | | |
| 11 | Downloads and offline manager | Needs prototype | | |
| 12 | Knowledge modules | Needs prototype | | |
| 13 | Daily Fiqh (Wajibat) | Needs prototype | | |
| 14 | Hifz | Needs design | | |
| 15 | Reading goals, Calendar, About | Needs design | | |
| 16 | Cutover | Not started | | |

## Temporary pages and code (must be removed or replaced)

| Item | What it is | Removed or replaced in |
| --- | --- | --- |
| Page-reader notice and `READERS_READY.page` (`app/lib/readerLinks.ts`) | Page chips open `/per-page-read`, which shows "not rebuilt yet"; the Page tab says so (`surah` and `juz` were flipped in 4A) | Flip `page` in Phase 9; the notice then disappears |
| `/about` (`app/pages/about.vue`) | Placeholder | Phase 15 |
| `/foundation` (`app/pages/foundation.vue`, `docs/pages/foundation.md`, its tests in `e2e/foundation.spec.ts`) | Phase 0 check page. **Must be removed before cutover** (Phase 16 checklist). Keep it until the real Settings (Phase 2) and the shell tests no longer need it; move any test that still uses it to a real page first | Phase 16, at the latest |
| `[...slug].vue` ("This page is not rebuilt yet") | Catch-all for legacy routes not rebuilt yet | Phase 16, once every legacy route exists (`/surah-vedios` and `/sitemap` land in Phase 15) |
| `app/stores/player.ts` and the mini player | The small Phase 3 player (play and pause one surah) | Phase 4 extends it (seeking, resume, repeat, auto-next, per-ayah, full player); `playerShell.ts` is already deleted |
| `PUBLIC_META` entries in `app/lib/publicMeta.ts` | Titles for the three prerendered pages | Update with each of Phases 1, 3, 15 |
| `nav.ts` `phase` field | Which phase builds each link | Delete the field in Phase 16 |
| `PUBLIC_META` entry for `/` | Now matches the real Home's `useSeoMeta` | Keep in step if Home's text changes |

## Carried forward from earlier phases (do not lose)

| Phase | Item |
| --- | --- |
| 2 (done) | Settings supplies the calculation method, Asr school, Hijri adjustment, verse layout, Wi-Fi-only (new keys, see the phase doc) |
| 3 (done) | The listing uses the reciter preference (by name), the playback speed, the legacy bookmark keys and the reading-progress record; see the phase doc |
| 4B | The image share card is its own later phase (no prototype screen; plain share is in the reader and on Home); extend `usePlayerStore` (seeking, `quran:audio-resume:v1`, repeat, auto-next from `prefs.autoplay`, per-ayah audio, Media Session); (the surah and juz flags were flipped in 4A; the reader now writes `quran:read-surahs:v1`, which the listing draws); per-ayah play and download go into the tools row of `components/reader/AyahList.vue`; **check the 210 generic-type audio files on real phones first** (`docs/audio-url-check.md`); the reader uses `verseLayout`, `effectiveTranslationLang` (explicit choice, else the legacy reader's text tab) and the tafsir default; playback speed and auto-play are in `prefs` |
| 15 | Reading goals reads the `dailyLog` the reader writes: since 4A an ayah counts after about 1.5 s on screen (the legacy reader logged only the ayah a pause landed on). **Approved:** goal counts read higher than in the legacy app (about 60% higher for a careful reader in the simulation), so **pace targets may need recalibrating** here. Counts recorded before and after cutover use different rules and are **not merged or converted**; the new rule applies from cutover |
| 9 | Flip `READERS_READY.page` when `/per-page-read` is rebuilt |
| 5 (done) | The Prayer and Qibla pages, the city entry and the saved-times row (shared with Settings) are built; the Hijri adjustment is applied on the Prayer page (reading the neighbouring cached day) and is still to be consumed by the Ramadan and Calendar pages. **WMM2025 (the declination model) is valid to 2030: replace the coefficients (`scripts/gen-wmm.mjs`, NOAA's next model) before then** |
| 7 | Home's second resume row switches from the persons-study state to story chapters, with a new key (for example `quran:stories-progress:v1`); one adapter, `useHomeState` |
| 8 | Ramadan banner on Home; the Sha'ban prefetch of the Ramadan month in the prayer cache |
| 6 | The Library shows `quran:pins:v1` ("Where I stopped") and can read `quran:read-surahs:v1`; saved ayahs use the same bookmark keys the reader writes |
| 11 | Audio files are up to 91 MB each (`docs/audio-url-check.md`): plan downloads and storage around that. `wajibat-data-cache` and `quran-downloads-audio-cache` names return with their features; the Downloads manager enforces Wi-Fi-only (`quran:download-prefs:v1`) where the connection type is reported |
| 13 | Daily Fiqh keeps `quran:fiqh-prefs:v1`; Settings already holds the marja' picker (Ja'fari only) on the same key |
| 14 | The Hifz tile's due count ("N to practice"): the legacy queue lives in a composable that needs Nuxt state, so it is rebuilt there |
| 16 | **Before cutover: compare the Ja'fari prayer times (Leva, Tehran) with an independent source** (CONTENT_TO_VERIFY.md). Remove `/foundation`; verify the legacy offline-new-tab root cause against the deployed worker |

## Open questions

From Phase 0 (details in `phases/phase-00-foundation.md`):

Decided in the Phase 0 review: `--ink-3` is non-text only (recorded in DESIGN_SYSTEM.md); keep the server proxies until cutover; Node 22 (`.nvmrc`, `engines`, workarounds removed); placeholders and `/foundation` stay (table above).

Decided in the Phase 1 review: the nav (icons kept, one row per destination, collapsible groups, "Continue reading" only with progress) and the shell gaps (fixed in Phase 1).

Decided in the Phase 2 review: Clear all (strict legacy parity plus deleting `quran-revamp-db`), marja' under Prayer & location, default translation "Not set", ISNA and Leva defaults, Wi-Fi row greyed where unsupported, Reset with Undo, late reminders up to 5 minutes, inline messages.

Still open:

0. Phase 1 review: the 15-character floor is kept; no topic-based exclusions (recorded in CONTENT_TO_VERIFY.md). The real-device check of Phase 1 is the owner's, on the Vercel preview. A screen-reader pass is still not done.
1. The root `README.md` fiqh-key line was also corrected (not on the approved list). Keep?
2. Verify the probable root cause of the legacy offline-new-tab bug (missing `/` precache entry) against the deployed worker.
