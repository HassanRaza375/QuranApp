# Roadmap

Kept in step with `STATUS_2026-10-22.md` and `PROGRESS.md` (which wins if they differ). This file lives in `docs/`; the copy in the context pack is no longer the source.

## Built (verified in automated tests; real-device checks pending)

Shell, Home, Settings, Search, Surah listing (Surah, Juz, Page), Surah reader, Prayer & Qibla, Library, Prophets & People (directory, timeline, person), Story reader and Stories directory, Ramadan (Today, Timetable, Events), Per page, Tasbeeh, Sajda, Asma-ul-Husna, and the player (whole surah, per ayah, queues).

## Prototyped (2026-10-22), to build

Two prototypes are agreed: `design/prototype-remaining-pages.html` and `design/prototype-hifz.html` (map: `design/PROTOTYPE_MAP.md`). Each phase starts with a short legacy report and a plan, waits for approval, then builds (workflow in `CLAUDE.md`). Every sample in the prototypes is listed in `CONTENT_TO_VERIFY.md`; real data wins over the prototypes everywhere.

| Phase | Page | Routes | Notes |
| --- | --- | --- | --- |
| 10 | Search | `/search` | **Built, awaiting review** (`phases/phase-10-search.md`): ayahs, surahs, people, stories, notes; every legacy filter behind one Filters control; history stays `string[]`. Ayah search is online only (level C) with a designed offline state |
| 11 | Downloads and offline manager | `/downloads` | Audio files go up to 91 MB; real offline audio needs a Cache Storage plan with range requests; the player's "Save audio" stays disabled until this ships. Wi-Fi-only preference (`quran:download-prefs:v1`). **Also decide `/surah-audios/[id]` here** |
| 12 | Knowledge modules | `/peoples`, `/places`, `/themes`, `/duas`, `/events`, `/signs`, `/commands`, each with `/[id]` (14 routes) | Reuse the Phase 7A layouts. Place and event chips in stories are inert until these exist; add "Referenced by" then. The themes, duas and signs data is not vendored yet. Search gains these groups here |
| 13 | Daily Fiqh (Wajibat) | `/fiqh`, `/fiqh/choose-marja`, `/fiqh/glossary`, `/fiqh/[category]`, `/fiqh/[category]/[topic]` | Ja'fari only for now; marja' choice already stored (`quran:fiqh-prefs:v1`). Use the legacy category and topic ids, not the prototype's. Search gains this group here |
| 14 | Hifz | `/hifz`, `/hifz/session`, a surah page | New simple mode (`design/prototype-hifz.html`); word-slip grading, new key `quran:hifz-words:v1`, legacy engine rules and data kept. Grading: 0 slips and no hints is `good`, any slip is `again`, `easy` only from an optional "This was easy" button. Read along highlights the whole ayah (no word timings exist). See `DECISIONS.md` |
| 15 | Reading goals, Calendar | `/goals`, `/calender` | Prototyped. Goals counts follow the 1.5 s rule, so pace targets need recalibrating. Khatmah creation lives here. Calendar may reuse the Events data and the `hijri-months` store |

## Not yet prototyped

| Page | Routes | Notes |
| --- | --- | --- |
| About, Sitemap, Surah videos | `/about`, `/sitemap`, `/surah-vedios` | Keep routes unchanged. Apply the design system; no prototype yet |
| Poets | `/poets`, `/poets/[slug]` | Behind the "Literary modules" setting. Deferred |
| Surah audios | `/surah-audios/[id]` | Open. Decide in Phase 11 |

Decided: `/juz/[id]` redirects to the reader at the juz's first ayah (`DECISIONS.md`).

## How to start the next page

1. Ask for a "legacy report" for the page (read-only access to the legacy repo).
2. Write the plan (the report, what the prototype adds and drops, the design, risks, decisions needed) in `phases/phase-NN-<name>-plan.md` and wait for approval.
3. Build, verify (`npm run verify`, browser pass at 1280 and 375 px, light and dark), then write the phase doc and the page doc and update `PROGRESS.md`.

## Standing work

- Device checks: `DEVICE_CHECKS.md`.
- Content review: `CONTENT_TO_VERIFY.md`.
- Cutover list: `DECISIONS.md`, section 5, and the checklist in `PLAN.md`.
