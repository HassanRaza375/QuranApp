# Phase 16, stage 2: the investigations

- Date: 2026-10-29. Branch `phase-16-cutover`. The machine was shared with VS Code, Chrome and Java throughout (CPU 27 to 100%); every number below says so where it matters.
- Tools (dev-only, not in verify): `scripts/measure/play.spec.ts`, `scripts/measure/a11y.spec.ts`, `scripts/measure/playwright.config.ts` (run with `npx playwright test --config scripts/measure/playwright.config.ts`). axe-core was installed **outside the repository** and loaded from a path (`AXE=...`), so no dependency was added; adding `@axe-core/playwright` as a dev dependency is still your call.

## 1. Accessibility sweep and keyboard walk

**axe-core** (WCAG 2.0 A and AA, 2.1 A and AA, 2.2 AA rules) on the 49 legacy routes that have a page, at 1280 and 375 px, light and dark = 196 page views, with the services mocked.

- **First run: 12 of 196 views had violations, three rules.** `color-contrast` (Downloads: the whole Wi-Fi row was dimmed, so its explanation was too faint), `definition-list` (the Daily Fiqh glossary had letter headings inside a `<dl>`), `aria-prohibited-attr` (loading skeletons had an `aria-label` on a plain `div`: the Sajda page, and the same pattern in six other places).
- **Fixed:** only the Wi-Fi switch is dimmed; the glossary is one `<dl>` per letter; every loading skeleton has `role="status"`.
- **Rerun on the fixed build: 0 violations in 196 views.**
- Not covered: what axe cannot judge (reading order, whether labels make sense aloud, focus management in sheets), states the mocks did not produce (some pages showed their empty or offline state), and anything on a real screen reader. **V7, the VoiceOver and TalkBack pass, is still yours.**

**Keyboard walk** (Tab through every route at 1280 px, up to 220 stops): focus is **never stuck** on any of the 49 pages, every page is reachable, no stop is off screen. The first run flagged stops "without a focus indicator" on the knowledge cards and one unnamed input on Per page; both were my check being too narrow (the cards draw their ring on `::after`; the Per page field has a `<label for>`). After checking `::after`, **no stop lacks an indicator**. Limit: this checks that a ring exists, not that it is visible enough.

## 2. Play-to-audio start time, before and after Phase 14

Click on Play to the audio element being asked for its file, with the recorded audio element of the browser tests; median ms (min to max) of 15 runs; production build of each commit. Soon = the click 300 ms after the page is up; settled = after 3 s of idle.

| Surface, condition | before Phase 14 (3603e43) | Phase 14 merged (2d5e8ed) | head (06c0759) | head, Hifz chunks blocked |
| --- | --- | --- | --- | --- |
| listing, 1x soon | 24 (21-47) | 23 (21-96) | 22 (20-30) | 28 (20-45) |
| listing, 4x soon | 64 (39-115) | 55 (34-116) | 61 (32-154) | 54 (40-251) |
| listing, 4x settled | 51 (31-79) | 49 (32-73) | 54 (42-91) | 56 (29-71) |
| reader ayah, 1x soon | 30 (22-51) | 23 (20-79) | 21 (20-44) | 24 (21-41) |
| reader ayah, 4x soon | 45 (27-334) | 50 (24-130) | 53 (37-96) | 61 (24-149) |
| reader ayah, 4x settled | 43 (27-60) | 48 (26-188) | 53 (24-72) | 48 (24-250) |
| play page, 1x soon | 15 (14-64) | 14 (14-22) | 14 (13-44) | 21 (13-192) |
| play page, 4x soon | 38 (18-66) | 31 (16-60) | 45 (33-84) | 35 (21-93) |
| play page, 4x settled | 30 (19-105) | 47 (23-59) | 41 (22-63) | 39 (23-100) |

**Reading:** there is **no consistent change** across Phase 14: the medians move in both directions and the ranges overlap. On the reader and Per page at 4x the head reads about 8 ms higher than before Phase 14, which is smaller than the spread. **Blocking the Hifz chunks did not make anything faster**, so the one hypothesis (idle prefetch of those chunks) is **not supported**. The CPU read 100% when this run started, so these numbers are noisy. What the numbers do show: from a click to the element being asked for its file takes about 14 to 65 ms, so a test that reads the recorder once right after a click can lose that race, which is how the three earlier failures (`queue.spec.ts`, `player.spec.ts` twice) happened. **The cause of the changed timing after Phase 14 is still not shown**; I have no evidence it was real. A real-device measurement is not made (row A-series on a phone).

## 3. The two flake families

Each test run 50 times as-is (CPU 85 to 99% from other programs) and 50 times with three extra busy processes (CPU 99 to 100%), on the current production build.

| Test | As-is | Stressed | Finding |
| --- | --- | --- | --- |
| `perpage.spec.ts:345` ("a failed request says so, keeps the controls...") | 50 of 50 | 50 of 50 | **Not reproduced.** The Phase 10 failure (offline wording instead of the failed-request wording) has not recurred in 100 runs; no change made |
| `perpage.spec.ts:376` ("Next quietly has the next page's surah ready...") | 50 of 50 | 50 of 50 | **Not reproduced** |
| `knowledgeModules.spec.ts:239` ("a place's Connected list reaches the people...") | 49 of 50 | 49 of 50 | **Reproduced twice (about 2%), cause found** |

**`knowledgeModules.spec.ts:239`: a real test flaw, not load.** The test clicked "the first Connected link" on `/themes/tawhid` and expected a knowledge page (`k-name`). The Connected sections fill in as each module's data arrives, so now and then the **first link was a person's** (the failing page was `/persons/ibrahim`, which is a valid page with no `k-name`). It was an unordered choice, which load only makes more likely. Fixed: the test takes the first link to a knowledge module's own page and waits for it. **100 of 100 passes** after the fix. This was also the Phase 13 failure ("`k-name` not visible within 5 s").

## 4. Other test changes made on the way

- `stories.spec.ts` "no link ... goes to a missing route" visits up to 40 pages and took 22 to 37 s against the 30 s default on this machine: it now has a 120 s limit.
- Tests that asserted the old "This page is not rebuilt yet" wording now assert "Page not found".

## 5. Not done in this stage

The full `npm run verify` (stage 4). The investigations were run on the production build of this branch only (the older commits only for the Play timing).
