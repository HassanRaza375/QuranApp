# Phase 9B: Asma-ul-Husna, Sajda verses, Tasbeeh

- Branch: `revamp-design-logic`
- Date: 2026-10-21
- Status: Done, awaiting review
- Plan and decisions: `phase-09b-plan.md` (the 9 decisions and the holds below were approved)
- Built as three commits in the approved order: Asma, Sajda, Tasbeeh.

## Approved decisions (as built)

1. One phase, three separate commits (no split was needed: verify passed).
2. The sajda list is bundled from the recorded service response (`tests/fixtures/alquran-sajda.json` → `scripts/gen-sajda.mjs` → `app/data/sajda.generated.ts`, pairs only), with a test against the recording; the Arabic is the surah reader's text.
3. No Obligatory/Recommended chips and no per-tradition text.
4. "After prayer" is left out entirely.
5. "Count this name" counts under `name-<n>` in `quran:tasbeeh:v1`; a test runs the legacy composable on records that contain such keys.
6. Legacy goals 33 / 99 / 100 and the unnamed custom counter.
7. The YouTube embed is dropped, with no replacement link.
8. Vibration with a switch next to the counter, on by default where supported, never while Reduce motion is on.
9. The sajda sign on the Per-page reader is built as an SVG mark, with a test on the right ayahs (**see the finding below: the text already carries the sign**).
Holds: `names.json` imported; only apostrophe typography normalised; the mixed apostrophes and the repeated meanings listed for review; tests for English-text contrast and the search label; a saved `name:<n>` shows in the Library's Names filter; the counter is a real button with a polite count, Space and Enter, and Reset with Undo; the legacy lifetime and cycle shapes tested through each operation with a legacy-shaped fixture.

## What was built

- **Asma-ul-Husna** (`/asma-ul-husna`): `lib/asma.ts`, `pages/asma-ul-husna.vue`, `components/asma/NameSheet.vue`. 99 names from the legacy file, search (name, meaning, Arabic, Urdu, number; ignoring case, hyphens, apostrophes and vowel marks), a Saved filter, star with Undo (`name:<id>`), a name sheet (`#name-N` in the address), Play disabled with its reason. The Library's Names type now opens it (`/asma-ul-husna#name-N`).
- **Sajda** (`/sajda`): `lib/sajda.ts`, `pages/sajda.vue`, generated list and generator, recorded response. 15 verses in order with surah, ayah, juz and page (derived and checked equal to the service's own values), the reader's Arabic loaded one ayah at a time, Save with Undo (`sajda:<s>:<a>`), Open in the reader. No obligation statements. The sign on the Per-page reader (`components/perpage/Frame.vue`).
- **Tasbeeh** (`/tasbeeh`, `/tasbeeh/[id]`): `lib/tasbeeh.ts`, two pages, `app/data/tasbeehPresets.generated.ts`, `scripts/gen-tasbeeh-presets.mjs` and `scripts/lib/legacy-tasbeeh.mjs` (loads the legacy composable in memory, never edits it). The count button, polite announcements, goals with Undo, Reset with Undo, the vibration switch, `name-<n>` counters.
- Fixed from the legacy pages: near-invisible English text in light theme and the "Search Surah" label (Asma); counters created while rendering, no Undo on reset, always-on vibration (Tasbeeh).

## Findings (please read)

- **The reader's own Arabic already carries the sajda sign.** The `quranapi` text (`arabic1`, the surah reader's source) contains the prostration character (U+06E9) inside exactly these 15 ayahs and in no other ayah of those 14 surahs (checked against the live data today). So the Sajda list, the surah reader and the Per-page reader already show the sign as part of the text, and **the SVG mark built under decision 9 is a second sign next to it** (visible in `docs/design/utilities-compare/state-perpage-sajda-sign-desktop-light.jpg`: the text's own sign, then the ayah marker, then my arrow). The synthetic text in the browser tests has no such character, so the tests could not show this; the real-text screenshots did. This also independently confirms the bundled list of 15. **Recommendation: remove the visible SVG mark** (keep, at most, a screen-reader label), because the text is the better source and the duplicate looks wrong. It is a one-line change in `components/perpage/Frame.vue` plus the e2e test; I left it as approved so you can decide. (The earlier 9A note "the cached surah text has no sajda sign" was about a missing data field; the sign is in the text itself.)
- **The Sajda service's flags are a ruling.** 4 of 15 are flagged `obligatory` (32:15, 41:38, 53:62, 96:19: exactly the Ja'fari set), 11 `recommended`; the legacy page showed these to everyone. Not carried over (decision 3); recorded in CONTENT_TO_VERIFY.md.
- **The legacy composable is the test oracle for Tasbeeh.** `tests/tasbeeh.test.ts` loads the real `useTasbeeh.ts` (transpiled in memory) and applies the same 12 operations plus 100 counts to both implementations on a legacy-shaped record that includes a `name-12` counter, an unknown field and an unknown counter; the stored records are equal after every step. The legacy code also accepts and preserves the `name-<n>` counters (and its counter page would show one as a counter named by its id), so a rollback is safe.
- **A request to `quranapi.pages.dev` from a script needs a browser-style User-Agent** (a bare Python request got HTTP 403). Browsers are unaffected; noted only for anyone scripting the data.
- **Data oddities left as they are** (for your review): mixed apostrophes in 7 transliterations and the repeated English meanings (a test pins them so a change is noticed).
- Holding Enter on a focused button repeats the click in browsers; the counter ignores auto-repeat (tested with `keyboard.down` twice).
- Reduce motion: the app sets a near-zero (not zero) transition duration; the test accepts that.
- A first `Search` test assumed "mercy" matches a name; the English meanings say "Merciful". The tests were corrected, not the data.

## Differences from the plan

- The slider-style Asma sheet shows the Urdu line in the sheet and on the cards (the plan said "as legacy"; kept on both).
- "Count this name" is in the sheet only (not on the cards).
- The sajda sign: see the finding above.

## Deliberate gaps (CONTENT_TO_VERIFY.md)

After prayer (both traditions), any obligation statement, the Hanafi count and note, the YouTube video, per-name audio (until 4B), a custom goal and a custom dhikr name.

## Verification

`npm run verify` on Node 22 (build, lint, 566 unit tests, dev smoke, 428 e2e tests): **passed, exit 0**. The Settings picker test did not fail. Along the way, failed-then-fixed runs were all in new tests (a search term, a hash-opened sheet hiding the page behind a modal, an offline navigation that needs the page code already loaded, a reduced-motion duration); none was a defect in a page.

- `tests/asma.test.ts` (12), `tests/sajda.test.ts` (9), `tests/tasbeeh.test.ts` (17, including the legacy-code differential).
- `e2e/asma.spec.ts` (10), `e2e/sajda.spec.ts` (11), `e2e/tasbeeh.spec.ts` (16). Existing tests updated: the Library's name type is "opens today", its pending notice no longer names Asma-ul-Husna, a new Per-page test for the sign.

## What is left for you

- Decide the duplicate sign (remove the visible SVG mark: recommended).
- Review `CONTENT_TO_VERIFY.md` (Tasbeeh, Sajda, Asma sections): the dhikr, the list of 15, the 99 names, the wording of ours.
- Supply sourced wording if you want obligation statements or After prayer later.
- Phone checks (counter by touch and vibration on a real device, 375px dark on all three pages, the name sheet) and the still-pending audio and compass checks. Phase 4B (the full player) is the next step that does not wait on content; it depends on your audio test.
