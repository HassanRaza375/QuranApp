# Page: Surah videos

- Routes: `/surah-vedios` (the legacy spelling, kept)
- Phase: 15
- Prototype section: none. Designed from the existing tokens; checked at the screenshot checkpoint (`docs/design/phase15-small/`, accepted 2026-10-28).
- Offline level: **A.** Bundled data only (the 114 surah names).
- Indexable: no (`robots: noindex, follow`, as the legacy page).

## Purpose

There are no surah videos in the app or in its data, and the legacy page only said "Coming Soon...". This page says plainly that there are none and sends you to what every surah has: audio by five reciters (owner decision, 2026-10-28).

## Layout

"There are no videos in the app yet." and one sentence about the audio; the 114 surahs as a numbered list in four columns on a wide screen, two on a phone, each opening `/surah-audios/<n>` (play by any of the five reciters, or save it to listen with no connection); a link to the Surah listing. The list is plain links without prefetching (114 observers for one route would be waste).

## Not done

No promise of videos, no "coming soon", no sidebar row. It is listed in the Sitemap with its note.

## Tests

`e2e/smallpages.spec.ts` (the statement, 114 links to `/surah-audios/<n>`, a click opens that surah's page, no "coming soon", phone targets of 44px, offline).
