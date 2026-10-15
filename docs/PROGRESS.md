# Progress

Update this file at the end of every phase.

| # | Phase | Status | Phase doc | Page docs |
| --- | --- | --- | --- | --- |
| 0 | Foundation | Approved 2026-10-15; follow-ups done | [phase-00-foundation](phases/phase-00-foundation.md) | [app-shell](pages/app-shell.md), [foundation](pages/foundation.md), [placeholders](pages/placeholders.md) |
| 1 | Home | Not started | | |
| 2 | Settings | Not started | | |
| 3 | Surah listing, Juz, Page | Not started | | |
| 4 | Surah reader and full player | Not started | | |
| 5 | Prayer and Qibla | Not started | | |
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
| `/` (`app/pages/index.vue`) | Placeholder Home | Phase 1 |
| `/surah-listing` (`app/pages/surah-listing.vue`) | Placeholder | Phase 3 |
| `/about` (`app/pages/about.vue`) | Placeholder | Phase 15 |
| `/foundation` (`app/pages/foundation.vue`, `docs/pages/foundation.md`, its tests in `e2e/foundation.spec.ts`) | Phase 0 check page. **Must be removed before cutover** (Phase 16 checklist). Keep it until the real Settings (Phase 2) and the shell tests no longer need it; move any test that still uses it to a real page first | Phase 16, at the latest |
| `[...slug].vue` ("This page is not rebuilt yet") | Catch-all for legacy routes not rebuilt yet | Phase 16, once every legacy route exists (`/surah-vedios` and `/sitemap` land in Phase 15) |
| `app/stores/playerShell.ts` and `LayoutMiniPlayer` shell | Placeholder player state | Phase 4 (real player store) |
| `PUBLIC_META` entries in `app/lib/publicMeta.ts` | Titles for the three prerendered pages | Update with each of Phases 1, 3, 15 |
| `nav.ts` `phase` field | Which phase builds each link | Delete the field in Phase 16 |

## Open questions

From Phase 0 (details in `phases/phase-00-foundation.md`):

Decided in the Phase 0 review: `--ink-3` is non-text only (recorded in DESIGN_SYSTEM.md); keep the server proxies until cutover; Node 22 (`.nvmrc`, `engines`, workarounds removed); placeholders and `/foundation` stay (table above).

Still open:

1. The root `README.md` fiqh-key line was also corrected (not on the approved list). Keep?
2. Verify the probable root cause of the legacy offline-new-tab bug (missing `/` precache entry) against the deployed worker.
