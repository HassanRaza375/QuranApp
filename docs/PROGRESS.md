# Progress

Update this file at the end of every phase.

| # | Phase | Status | Phase doc | Page docs |
| --- | --- | --- | --- | --- |
| 0 | Foundation | Done, awaiting review (2026-10-15) | [phase-00-foundation](phases/phase-00-foundation.md) | [app-shell](pages/app-shell.md), [foundation](pages/foundation.md), [placeholders](pages/placeholders.md) |
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

## Open questions

From Phase 0 (details in `phases/phase-00-foundation.md`):

1. `--ink-3` fails WCAG AA for text (2.58:1 light, 3.76:1 dark). Accept it as non-text only, or change the design token?
2. The four `server/api` proxies are unused by the legacy app and not needed for CORS. Keep or drop at cutover?
3. Move the machine to Node 22 LTS to remove two workarounds (shadcn-vue CLI, ESLint)?
4. The root `README.md` fiqh-key line was also corrected (not on the approved list). Keep?
5. Verify the probable root cause of the legacy offline-new-tab bug (missing `/` precache entry) against the deployed worker.
