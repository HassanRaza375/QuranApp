# Phase 9A: Per-page reader

- Branch: `revamp-design-logic`
- Date: 2026-10-21
- Status: Done, awaiting review
- Plan and decisions: `phase-09-plan.md` (the 7 decisions and the holds below were approved)

## Approved decisions (as built)

1. The page text is built from the surah reader's cache and tested against recorded real `page/N` responses; any disagreement would have stopped the phase with a list. **No page disagreed** (all 604 checked).
2. Flowing text with a plain note on the page: "Text flows in the order and page breaks of the standard 604-page Madani mushaf. It is not a line-for-line copy of the printed page." The page is never called a mushaf layout.
3. A− / A+ stay and write the global Arabic size (`quran:accessibility:v1` `arabicFontScale`, other fields kept); the Settings slider and the control stay in step (a browser test goes both ways).
4. Opening a page does not write reading progress (tested byte for byte).
5. No Hizb label.
6. No arrow-key or other single-key shortcuts; buttons, the slider and the Go box only.
7. An out-of-range `page` opens page 1 with "Page 700 doesn’t exist. Showing page 1." (a non-number: "That page doesn’t exist. Showing page 1.").
Holds: the Bismillah is read from surah 1's data (never typed, not for surahs 1 and 9, only where a surah starts); page boundaries are the existing meta page starts (no "20 pages per juz"); a page with two surahs names both in the header; Pin writes the Page slot of `quran:pins:v1` and Save writes `page:N`, both with Undo, and a test shows the listing's Last read marker is unaffected; the Page "not rebuilt yet" flag and the listing notice are removed and a test follows every Page chip target; Play is a visible real button with `aria-disabled` and "Coming with the player".

## What was built

- **`app/lib/pageReader.ts`** (pure): `pageSegments(page)` (runs per surah from the page starts, with `starts` and `bismillah` flags), `pageSurahNumbers`, `surahNamesLine`, `juzLine` ("Juz 4 and 5" when a juz begins mid-page), `firstAyahOf`, `parsePageParam` (with the notice), `parseGoTo` and `westernDigits` (Arabic-Indic and Persian digits by code point), the page's wording constants.
- **`app/pages/per-page-read.vue`** (the legacy route, rebuilt) and **`app/components/perpage/Frame.vue`**: header, tools, framed flowing text with the reader's ayah markers, states, Previous, slider, Next, Go to page, the live region, the link into the surah reader.
- **Listing and Library:** `READERS_READY` is now `{ surah, juz }` (the Page flag is gone), the listing's "still being moved" notice is removed, `OPENS_TODAY.page` is true, the Library's page slot reads "Not set. Pin a page from the page reader." until a pin exists. `lib/bookmarks.ts` gains `pageBookmarkKey` (`page:N`).
- **Fixtures:** `tests/fixtures/alquran-page-ranges.json` (all 604 recorded real page responses reduced to `[surah, firstAyah, lastAyah]` runs, 6,236 ayahs) and six full responses (pages 1, 2, 50, 187, 582, 604).

## Findings

- All 604 pages derived from the page starts equal the service's own list of ayahs for that page (including pages that start mid-surah and pages that cross into the next surah). The page starts and the page answers come from the same service, so agreement was expected; it is now tested page by page rather than assumed.
- The ranges are contiguous and cover the Qur'an's 6,236 ayahs exactly once, in reading order; every one of the 114 surahs starts on exactly one page; juz 4, 7, 11 and 26 begin mid-page (4 pages read "Juz N and N+1").
- The legacy page labelled `hizbQuarter` (1 to 240) as "Hizb", showed only the first ayah's surah and juz, and recorded nothing. None of this is carried over.
- The cached surah text has no sajda field, so no sajda sign is shown (the legacy page printed one). Sajda is 9B, from the service.
- A guard test caught Arabic digit characters in my first draft of the digit conversion (the repo bans typed Arabic in `app/`); it now converts by code point.
- The Page tab's chips are 604 links to `/per-page-read?page=N`; a browser test opens the first and last chip of each juz group (56 distinct pages, because four pages are shared by two juz) and every address is checked in the unit test.
- Focus: Previous, Next and Go move focus to the page title and announce "Page N of 604"; the slider keeps focus (moving it on each key press would make it unusable). Approved wording was "focus moves to the title"; this one exception is flagged here.
- Because the surah reader's text is shared, a page of an unopened surah needs that whole surah once; the next page's surahs are loaded quietly when online.

## Differences from the plan

- The slider is a native range input (not the Settings slider component) so it is a real, fully accessible slider with its own value text; it commits on release or key press.
- The slider does not take the heading focus (above). Nothing else differs.

## Deliberate gaps (CONTENT_TO_VERIFY.md)

No mushaf lines, no Hizb, no sajda sign, no translation on this page, no Play (Phase 4B). Wording of ours is listed there.

## Verification

`npm run verify` on Node 22 (lint, 528 unit tests, production build, dev smoke, 391 e2e tests): **passed, exit 0**. Earlier runs failed on (1) the repo's no-typed-Arabic guard (Arabic digit characters in my first digit conversion; now by code point) and (2) my 56-page chip test exceeding the default 30-second limit (now 150 s); neither was a page defect. The Settings picker test did not fail.

- `tests/pageReader.test.ts` (15): the 604 pages against the recorded service answers, completeness (604 pages, 6,236 ayahs), six full responses ayah by ayah, contiguity and reading order, banner and Bismillah rule (all 114 surahs), the header lines, the juz line, the address and Go-to parsing, the wording and the legacy keys.
- `e2e/perpage.spec.ts` (30, synthetic text, production build): the page header and text, page 2 (banner and Bismillah read from surah 1's data), page 1, a two-surah page, the last page, the link into the reader, "Juz N and N+1", Previous and Next (address, focus, live region, Back), disabled ends, the slider, Go to page (valid, Arabic-Indic digits, invalid), the Tab order, no arrow shortcuts, invalid addresses and notices, text size (both directions with Settings, limits, really larger), Pin (keeps other fields, Undo, replace, unpin, Library slot), Save (legacy key, Undo, Library), the Last read marker untouched, Play page, loading, failure and retry, saved text after a reload with the service refusing and offline states, the next page's surah ready, every Page chip target (first and last of each group), no "not rebuilt yet", dark mode, 375px including the largest Arabic size.
- Existing tests updated: the listing's Page-chip test now opens the reader, the readers notice test says no tab shows one, `OPENS_TODAY.page` is true, the Library's pending-notice list no longer names the page reader.

## What is left for you

- Review the wording of ours and the "not a line-for-line copy" sentence.
- Phone checks on the page reader (375px dark, the largest Arabic size, the slider by touch).
- Decide whether you want Hizb later (needs the service's per-page `hizbQuarter` with a real name) or line data.
- Then Phase 9B (Tasbeeh, Sajda, Asma-ul-Husna) needs a plan review.
