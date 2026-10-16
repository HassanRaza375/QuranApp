# CLAUDE.md (revamp-quran)

Guidance for Claude Code when working inside `revamp-quran/`. The repo-root `CLAUDE.md` still applies to the legacy app; this file adds the rules for the rebuild.

## What this folder is

A rebuild of the Quran companion app's UI as a **Nuxt 4 single-page app with shadcn-vue + Tailwind CSS v4**, replacing Vuetify. It lives on the branch `revamp-design-logic`, next to the legacy app, and reuses the legacy app's data, services and logic. At the end it replaces the legacy app.

The legacy app (repo root) must keep working. Do not edit it.

## Read first, in this order

1. `/CLAUDE.md` and `/README.md` (legacy app: stack, architecture, SSR/hydration hazards, known gaps)
2. `docs/PLAN.md` (stack, rendering, offline model, phases)
3. `docs/design/DESIGN_SYSTEM.md` (tokens, components, patterns, content rules)
4. `docs/design/PROTOTYPE_MAP.md` (where each page lives inside `docs/design/prototype.html`)
5. `docs/CONTENT_TO_VERIFY.md` (placeholders in the prototype that must never ship)
6. `docs/PROGRESS.md` (what is done, what is next)

For feature behaviour, the legacy docs still win: `/MODULE_BLUEPRINT.md`, `/PROJECT_PLAN.md`, `/prophets-quran-feature.md`, and the other specs listed in `/CLAUDE.md`.

## Hard rules

1. **Stay inside `revamp-quran/`.** The only allowed edits outside it are small ignore entries in root tooling (ESLint, Vitest, tsconfig, `.gitignore`) so the legacy app does not pick up this folder. List any such edit in the phase doc.
2. **No Vuetify and no `@mdi/font`.** UI comes from shadcn-vue components and Tailwind tokens. Icons are Lucide through `@nuxt/icon`, bundled locally. Never load fonts or icons from a CDN, because they must work offline.
3. **Reuse the legacy app, do not fork its data.**
   - Pure code (JSON data, `app/utils`, `app/services`) is imported through an alias such as `@legacy`.
   - Code that depends on Nuxt plugins or auto-imports (composables, `$storage`, `$api`) is copied and adapted.
   - Phase 0 decides the exact mechanism and records it in `docs/phases/phase-00-foundation.md`.
4. **Keep storage keys and formats identical** to the legacy app (for example `quran:ramadan:v1`). Users must keep their bookmarks, goals, Hifz progress and settings at cutover. Migrations are additive and versioned. Inventory every key in Phase 0.
5. **Content integrity.**
   - Qur'an text, translations, tafsir, audio and prayer data come only from the existing services and data files.
   - Every Arabic string, translation, dua, date, name list and religious statement in `prototype.html` is a placeholder or was typed from memory. Never copy them into product code. See `docs/CONTENT_TO_VERIFY.md`.
   - New religious content needs a named source and a visible status label (Qur'an, Traditional, Scholarly, Source note).
   - Never present a ruling as app-generated advice. Where traditions differ, show them side by side and add: follow your own marja' or local scholar.
6. **Fiqh is a user setting**, not a build-time identity (legacy key: `prayerFiqh`, stored as a raw string, not JSON; values `sunni` and `jafari`. The prototype's internal value `shia` is prototype-only and never goes to storage). Prayer calculation, the events dataset and fiqh-sensitive content filter by that setting. Pages that explain both traditions must show both.
7. **Design rules (non-negotiable)**
   - Scripture is never boxed in a card. Ayahs sit on the page with hairline dividers.
   - Gold appears only on verse-end markers (and Hifz mastery later). Everything interactive uses the accent.
   - Borders instead of shadows. Shadows only for floating layers (menus, sheets).
   - Light theme by default; System and Dark are options. Dark is fully designed, not an inversion.
   - Arabic text is never letter-spaced and never truncated, and it scales with the user's Arabic size setting.
   - Touch targets are at least 44px on mobile. Desktop menus are popovers; mobile menus are bottom sheets.
   - No streaks, badges, points or guilt reminders anywhere.
   - No depictions of any person (prophets, companions, angels, family). Use calligraphy, places, objects and geometry only.
   - Removing something offers Undo instead of a blocking confirm, except for wiping all data.
8. **Rendering and offline** (details in `docs/PLAN.md`)
   - SPA by default; at most a few public pages are prerendered (Home, About, Surah listing).
   - Offline pages work from one precached app shell. Every page declares its offline level (A, B or C) in its page doc.
   - Level C (online-only) features must show a clear offline state, never a blank page or a spinner forever.
   - Never call `localStorage` directly. Use the storage wrapper. Never fetch third-party APIs from components; go through services.
9. **IndexedDB: one new database, never touch the legacy one.** All new IndexedDB data lives in a separate database, `quran-revamp-db` (its own versioning). Never open `quran-app-db` with a different version, never add or remove object stores in it, and never change its schema, so that rolling back to the legacy app stays safe (a version bump would make the legacy app fail to open its own database). The revamp may read `quran-app-db` only as the same version 1, read-only, if it ever needs the legacy cached chapters or tafsir. The same applies to `localStorage`: do not write to legacy keys that the legacy app interprets differently (for example the day-keyed `prayer_*` keys).
10. **Prayer times** use the monthly AlAdhan cache with an "Update now" action; fetch first, swap only on success; show "Last updated".

## Workflow for every phase

1. **Plan first, no code.** Read the previous phase doc and the relevant prototype section. Propose the plan, list risks and open questions, then wait for approval.
2. **Build** in small commits (`revamp(<scope>): <what>`).
3. **Verify** (all of it):
   - `npm run build` and `npx eslint .` clean; `npm test` for pure logic.
   - Browser walk-through at 1280px and 375px, light and dark, including empty and first-run states.
   - For level A/B pages: build, `npm run preview`, then test offline (Playwright `context.setOffline(true)` or DevTools).
   - Compare against the prototype section side by side. Note every intentional difference.
   - Keyboard-only pass: focus order, visible focus, labels, contrast.
   - No console errors, no hydration warnings.
4. **Write the two docs** from `docs/templates/`: `docs/phases/phase-NN-<name>.md` and one `docs/pages/<page>.md` per page. Update `docs/PROGRESS.md`.
5. **Stop.** Do not begin the next phase. Report what changed, what is unverified, and the open questions.

## Gotchas found while building

- `npx shadcn-vue add <component>` rewrites `app/assets/css/tailwind.css`: it re-adds a Google Fonts `@import` (breaks the offline rule) and a duplicate `@layer base`. Remove both after adding a component; `tests/tokens.test.ts` fails if either comes back.
- shadcn-vue's `ToggleGroup` renders `aria-pressed` buttons, not radios. For a "choose one" control use `SettingsSegmentedControl` (a real radio group).
- Browser tests must start with `forbidRealApis(context)` (`e2e/mocks.ts`): any unmocked request to AlAdhan or the verse API fails the test, so a test can never depend on the internet by accident. For notifications, replace `Notification` with a recording stub (see `e2e/settings.spec.ts`) and use `context.clock.install` plus `page.clock.runFor` to fire reminders.
- Anything that reacts to the saved place or the prayer settings must react to **changes**, not to the first read (`plugins/prayer-watch.client.ts`), or unrelated pages start making requests.
- Long lists (the 114 surah rows) use plain elements and one delegated click handler (`data-act`, `data-n`), not a component per row: per-row components made the Surah tab's longest task 591 ms at 4x CPU (Phase 3, `docs/phases/phase-03-surah-listing.md`). Measure with the throttled test in `e2e/listing.spec.ts` before adding per-row components.
- Audio in browser tests: `stubAudio` in `e2e/listing.spec.ts` replaces `window.Audio` with a recorder (`window.__audio`); the store creates its element lazily, so the stub works. No test plays real audio.
- Reader links come from `app/lib/readerLinks.ts`; flip `READERS_READY` when a reader phase ships.
- Nuxt does not auto-import from `app/services/`. Import `useQuranApi` and friends explicitly (`tests/services.test.ts` covers every service).
- Legacy files import their data with `~/...`; `build/legacyBridge.ts` redirects those imports to the legacy folder. A legacy file that does a *dynamic* `~/` import (for example `quranAyahCounts.js`) is not rewritten under Vitest; do not call such functions from tests or from revamp code.
- Tests never use the real upstream APIs: mock them (`e2e/mocks.ts`) and fix the clock. Errors that a `catch` swallows (like the ayah of the day's) are logged with `console.debug`.

## Commands

```bash
cd revamp-quran
npm install
npm run dev -- --port 3001      # legacy app uses 3000
npm run build && npm run preview  # required for offline/PWA testing (offline does not work in dev)
npx eslint .
npm test                        # unit tests (tests/)
npm run test:e2e                # Playwright against the production build (run npm run build first; uses port 3011)
npm run test:dev               # starts the dev server and checks / renders with no errors
npm run verify                  # build + lint + unit + dev smoke + e2e
```

## When unsure

Ask. List open questions in the phase doc. Do not guess about religious content, storage formats or Qur'an data.
