# Page: Sitemap

- Routes: `/sitemap` (legacy, kept)
- Phase: 15
- Prototype section: none. Designed from the existing tokens; checked at the screenshot checkpoint (`docs/design/phase15-small/`, accepted 2026-10-28).
- Offline level: **A.** Static; plain links (no prefetching of fifty routes).
- Indexable: yes (a plain `title` and description; not prerendered).

## Purpose

Every page of the app in one place, grouped as the sidebar groups them.

## Layout

A heading and one line, then the groups in columns (three on a wide screen, two on a medium one, one on a phone): **Read** (with Home), **Study**, **Knowledge base**, **Worship**, **The app** (Settings, About, Sitemap, Surah videos with the note "No videos yet. Every surah has audio."). Each link has a Lucide icon and is at least 44px tall.

## Data

Built from `lib/nav.ts` (`lib/sitemap.ts`), so a page added to the sidebar is here too. Poets is deferred and has no row. **No counts are shown**: the legacy page typed them in.

## Tests

`tests/sitemap.test.ts` (4: every link is a built page, every sidebar row is here, no duplicates and no typed counts, the videos note), `e2e/smallpages.spec.ts` (the groups, the links open their pages, phone targets, offline).

## Open questions

None.
