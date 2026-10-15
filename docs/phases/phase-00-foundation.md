# Phase 0: Foundation

- Branch: `revamp-design-logic`
- Date: 2026-10-15
- Status: Done (see "Not verified" and "Open issues")

## Goal

Everything the later phases stand on, with no page work: toolchain, SPA and prerender decision, offline shell, tokens, fonts, icons, theme, storage wrapper and key inventory, legacy bridge, preferences store, responsive menu, undo toast, update toast, root tooling ignores.

## Scope

- Pages and components built: the shell (sidebar, mobile drawer, header with theme menu, mini player shell, toasts), `ResponsiveMenu`, three placeholder public pages (`/`, `/about`, `/surah-listing`, for the prerender spike), a catch-all "not rebuilt yet" page, and `/foundation` (a check page, removed at cutover).
- Prototype sections used: shell only (header, grouped sidebar, mobile drawer, mini player, menus and sheets). The prototype was not opened side by side this phase (see "Not verified").
- Legacy code reused: data and pure utils by alias (`@legacy`); services copied and adapted; `$storage` and the prayer-independent preference logic rewritten; plugins and composables not needed yet.

## What was built

- Nuxt 4 SPA (`ssr: false`), Tailwind v4 (`@tailwindcss/vite`), `shadcn-nuxt` with shadcn-vue components (button, dropdown-menu, drawer, sheet, sonner, switch, toggle-group, tabs, badge, separator, input, slider, tooltip), `@nuxt/icon` with Lucide bundled, Pinia.
- Tokens as CSS variables (`app/assets/css/tailwind.css`), light default, class-based dark, high-contrast and reduced-motion flags, Arabic scale variable, Arabic/Urdu/Bengali text classes, touch-target rules.
- Self-hosted fonts: Newsreader, Instrument Sans, Noto Naskh Arabic, Noto Nastaliq Urdu, Noto Serif Bengali (Fontsource), and the legacy Qur'an font Amiri Quran (copied from the legacy assets).
- `app/lib/storage.ts` (the only code that touches `localStorage`; separate raw and JSON access; never throws; read-merge-write for shared objects).
- `app/lib/preferences.ts` and `stores/preferences.ts`: 14 preferences on the legacy keys (table below), one descriptor each, cross-tab sync, DOM effects in `app/lib/applyPreferences.ts`.
- No-flash theme: an inline `<head>` script (`app/lib/noFlashScript.ts`) reads `themeMode` and the accessibility object before first paint.
- Legacy bridge: `@legacy` alias plus a Vite plugin (`build/legacyBridge.ts`).
- PWA with the legacy identity, update toast (`registerType: "prompt"`).
- Prerender of three public pages with their own head tags.
- Services (7) and the four server routes copied.

## Decisions and why

| Decision | Alternatives considered | Reason |
| --- | --- | --- |
| Hex tokens kept as hex, shadcn variables alias them (`--primary: var(--accent)`) | Convert to OKLCH as the design doc suggests | Tailwind v4 accepts any colour; no conversion drift; the hex stays the single source of truth. A unit test reads the hex from the CSS |
| `@legacy` alias for data and utils; Vite plugin rewrites `~/` imports made by legacy files | Nuxt layer; copying | A layer would pull in the legacy Vuetify/PWA config. Copying forks data that has generators. Legacy utils import their data with `~/data/...`, which would point at the revamp's own `app/` folder, so the plugin remaps `~/` only for importers inside the legacy folder |
| Services copied, on `useQuranApi()` instead of the `$api` plugin | Alias the services | They call `useNuxtApp().$api`, which does not exist here |
| Prerender with a Nitro `prerender:generate` hook that writes each page's title, description and Open Graph tags into its HTML (see spike a) | Per-route SSR via `routeRules` | Spike result below |
| Own no-flash script, not `@nuxtjs/color-mode` | color-mode module | It uses its own storage key; the legacy `themeMode` is a raw string it would not read (approved) |
| Missing `themeMode` means light | Legacy default `system` | Design: light by default. A stored `themeMode` always wins |
| `clientsClaim: true` added; `skipWaiting` stays message-only | Match legacy exactly (neither) | Amendment 3: the new worker must take over cleanly. See "Cutover plan" |
| No `maximum-scale` in the viewport meta | Match legacy (`maximum-scale=1`) | That setting disables pinch-zoom, an accessibility failure |
| `@nuxt/icon` with `fallbackToApi: false` and a scan that includes `app/lib` | Defaults | The defaults fetched 25 icons (the nav set) from `api.iconify.design` at runtime (caught by the "no external request" test). Now 34 icons are bundled |
| `vue-sonner/style.css` imported | Rely on the generated component | The shadcn-vue Sonner component does not import it; toasts were unstyled and mispositioned |
| Node 20 workarounds, not an upgrade | Require Node 22 | See "Toolchain notes". Node 22 LTS is recommended |

## Spike results

### (a) SPA with prerendered public pages: works, with the fallback

- Global `ssr: false` plus `nitro.prerender.routes` builds `/`, `/about`, `/surah-listing` as files, but the HTML is the generic shell: every page has `<title>Quran App</title>` and no description (the page's `useSeoMeta` does not run).
- Per-route SSR: `routeRules: { "/about": { ssr: true, prerender: true } }` under global `ssr: false` is ignored (same generic HTML). Global `ssr: true` with `"/**": { ssr: false }` renders `/about` and `/surah-listing` correctly, but prerendering `/` fails (`[unstorage] Invalid key: "/"`), and it brings SSR hazards into the layout.
- **Chosen:** SPA everywhere; a hook injects each public page's meta into its prerendered HTML (`app/lib/publicMeta.ts`, unit-tested; e2e checks the HTML without JavaScript). Other routes are the shell. Keep `PUBLIC_META` in step with each page's `useSeoMeta`. Canonical URL and a default Open Graph image wait for the final phase (no site URL yet).

### (b) Offline navigation from the precached shell: works

On a production build (`e2e/offline.spec.ts`, Playwright offline mode):
- reload at `/` works offline; in-app navigation works;
- **a brand-new tab opened offline at `/foundation`, and at an unknown route, renders** (the legacy G6 symptom);
- `/api/*` is not answered with the shell;
- `sw.js`, scope `/`, manifest identity as the legacy app.

The per-route fallback `injectManifest` was not needed.

## Dev server (added after review)

`npm run dev` failed on Windows with `ERROR No entry found in rollupOptions.input` (`resolveServerEntry`, `@nuxt/vite-builder`), while `build` and `preview` worked.

- **Versions when it failed:** `nuxt` 4.4.5, `@nuxt/vite-builder` 4.4.5, the Vite it used 7.3.7 (a Vite 8.3.4 was also installed at the top level for other packages), Nitro 2.13.4, Node 20.19.3, Windows.
- **Cause:** a Nuxt bug, not our config. With `ssr: false`, the builder resolves the SSR entry from the client Vite config, which has only `{ entry }` and no `server`, and throws. Reproduced with a bare `defineNuxtConfig({ ssr: false })` project. With `ssr: true` it starts.
- **Config bisect** (each variant started `nuxt dev`): removing the PWA module, the Tailwind Vite plugin, the legacy bridge plugin, `vite.server.fs.allow`, the prerender hook and routes, or `shadcn-nuxt` changed nothing (all still failed). Only `ssr: true` started. So none of the nuxt.config `vite` options, PWA dev options, prerender hook or Tailwind plugin interferes with the Vite entry.
- **Fix:** `nuxt` `^4.6.1` (resolves to 4.6.1 with `@nuxt/vite-builder` 4.6.1 and Vite 8.3.4). The bare `ssr:false` app and the real app both start; `npm run dev -- --port 3001` answers `/` with 200 and no errors. The version floor is in `package.json`.
- **Guard:** `npm run test:dev` (`scripts/dev-smoke.mjs`, in `npm run verify`) starts the dev server, requires `/` to be 200 with the app shell, renders `/` and `/foundation` in Chromium, and fails on any page error, console error, HTTP 5xx or server error line. Negative control: on Nuxt 4.4.5 it fails with exactly this error; on 4.6.1 it passes.
- **Side effect of the upgrade:** the build now uses Vite 8. Build, lint, 63 unit tests, the dev smoke test and all 36 browser checks pass on it.
- Also changed: `dev` is `nuxt dev` and the port is `devServer.port: 3001` in `nuxt.config.ts` (the script used to repeat `--port 3001`).

### Flaky browser check (follow-up)

**Evidence.** After moving to Node 22, `npm run verify` (build, lint, 63 unit tests, dev smoke test, 36 browser checks) was run **ten times in a row with traces and screenshots kept on failure** (`trace: "retain-on-failure"` in `playwright.config.ts`). Result: **10 of 10 passed**, no failure, no trace produced. Each run took 98 to 134 seconds. Before that, the cutover test alone passed six runs in a row after its fix.

**What the earlier failures were.**
- Seen once: one browser check failed in one `verify` run on the Nuxt 4.4.5 / Node 20 setup (right after build, lint and unit tests); it did not reproduce in the next full runs, and **the name of the failing test was not captured**.
- Seen once more, with the name: after the Nuxt 4.6.1 upgrade the cutover rehearsal failed in a `verify` run. The test waited for the page's `load` event and then read the caches, but `load` can fire before the new service worker has replaced the old one. It now waits for the swap itself (the legacy-only precache entries disappearing).

**Does the cutover race explain the earlier failure?** It is the only check in the suite with that kind of timing dependence, and it failed in the same circumstance (a `verify` run straight after heavy CPU work), so it is the most likely cause. **It is not proven**, because the first failure's test name was lost. With the race fixed, 16 consecutive runs (6 single and 10 full) show no failure. If a browser check fails again, the retained trace and screenshot (`test-results/`) will identify it.

No check is marked as known flaky.

## Cutover plan (new service worker replaces the legacy one)

Same origin, same file name (`/sw.js`), same scope (`/`), same manifest identity, same runtime cache names, `cleanupOutdatedCaches` on, `clientsClaim` on.

Rehearsed in `e2e/cutover.spec.ts`: the legacy `dist/` is served, then the revamp build replaces it on the same origin. Result:
1. the browser detects the new `sw.js`; the new worker waits (`registerType: "prompt"`, as legacy);
2. the update toast appears; **Reload** activates it;
3. the registration keeps the same script URL and scope; precache entries that only the legacy build had are removed; the runtime cache `quran-api-cache` and its entries survive; the rebuilt app then works offline.

For the real cutover:
- Keep the user's choice (prompt). Consider one release with `skipWaiting` so users who never see the toast still move over; decide in Phase 16.
- Existing users get the toast on their next visit. The legacy app's own update snackbar triggers the same `SKIP_WAITING` message, which the new worker also understands.
- The old Vercel project stays up as rollback for a few weeks. Do not change the cache names or the manifest `id`/`start_url`/`scope`, or the installed app becomes a different app.

## Vercel notes

Two projects on one repository.

- **Legacy project:** root directory `/` (unchanged).
- **Revamp project:** root directory `revamp-quran`, framework Nuxt, install `npm install`, build `npm run build`, Node 22.x (Settings, General). Turn **on** "Include source files outside of the Root Directory in the Build Step", because the build imports `../app` (the `@legacy` alias).
- **Ignored Build Step** (Settings, Git). A command that exits `0` skips the build; exit `1` builds. Verify the exact semantics in the Vercel dashboard when setting up.
  - Legacy project, skip when only the revamp changed:
    `git diff --quiet HEAD^ HEAD -- . ':(exclude)revamp-quran'`
  - Revamp project (command runs in `revamp-quran`), build when its own files or the legacy files it imports changed:
    `git diff --quiet HEAD^ HEAD -- . ../app/data ../app/utils ../app/assets/data`
  - If the legacy files the revamp imports grow (more `@legacy/` imports), add them to the second command. A test could list them; for now `grep -rhn "@legacy/" revamp-quran/app` shows the set.
  - `HEAD^` fails on a first commit or a shallow clone; Vercel's deploy builds usually have the parent. If a branch's first push should always build, wrap the command: `git diff --quiet HEAD^ HEAD -- <paths> || exit 1`.
- Environment variables: none required (defaults point at the same upstreams); copy `QURAN_API_BASE` and `QURAN_API_BASE2` if the legacy project overrides them. `QURAN_API_BASE2` must be `https://`.
- The preview URL of the revamp project is a different origin from the legacy site: localStorage and service workers are per origin, so a preview shows no legacy user data. Test migration paths by seeding keys (as the e2e tests do).

## Storage keys

Read and written by the preferences store, same keys and formats as the legacy app (full inventory: `docs/LEGACY_INVENTORY.md`):

| Preference | Key | Format |
| --- | --- | --- |
| fiqh | `prayerFiqh` | raw `sunni` or `jafari` (anything else reads as sunni, the legacy rule). The prototype's `shia` is never stored |
| theme | `themeMode` | raw `light`, `dark`, `system` |
| Arabic scale (0.8 to 1.6) | `quran:accessibility:v1` field `arabicFontScale` | JSON object, merged |
| reduced motion, high contrast, large touch targets | `quran:accessibility:v1` | same object |
| default translation | `translationDefaultLang` | raw |
| default tafsir | `tafsirDefaultAuthor` | raw; removed when unset |
| reciter | `reciter` | JSON object, kept whole |
| playback speed, autoplay | `quran:audio-prefs:v1` (`playbackRate`, `autoAdvance`) | JSON object, merged (keeps `repeatOne`) |
| verse text | `preferredVerseDisplay` | raw. **Untouched meaning**; `quran:verse-layout:v1` is added later |
| literary modules | `quran:additional-modules-enabled:v1` | JSON boolean |
| Hijri adjustment (-2 to +2) | `quran:hijri-adjust:v1` | **new**, JSON `{days}` |

Not in the store yet: `quran:fiqh-prefs:v1` (the Daily Fiqh marja'), which Phase 13 owns. New settings (calculation method, Asr school, Wi-Fi-only downloads) get their own `quran:<feature>:v1` keys in Phase 2: add a field, a default and a descriptor in `app/lib/preferences.ts`.

Migrations: none (one new key, additive).

## Offline

- Level A: the shell, `/foundation`, the not-rebuilt page, all three placeholder pages.
- Tested offline: reload, in-app navigation, new tab at a deep route, `/api` not shadowed, cutover rehearsal.
- Not applicable yet: Level B and C data.

## Files

- Added: everything under `revamp-quran/` except the docs that existed before.
- Changed inside `revamp-quran/`: `CLAUDE.md`, `docs/PLAN.md`, `docs/design/DESIGN_SYSTEM.md`, `docs/README.md`, `docs/PROGRESS.md`.
- **Changes outside `revamp-quran/`:**
  - `eslint.config.mjs`: `{ ignores: ['revamp-quran/**'] }`
  - `vitest.config.ts`: `exclude: ["revamp-quran/**", "node_modules/**"]`
  - `.gitignore`: five `revamp-quran/...` build and test paths
  - `tsconfig.json`: no change needed (it only references `.nuxt/`)
  - Doc corrections for the fiqh key (amendment 1): root `CLAUDE.md`, and root `README.md` (same wrong `prayer.fiqh` string; this one was not on your list, say if you want it reverted)

## Toolchain and versions

Node **22.23.3** (`.nvmrc` is `22`, `engines.node` is `>=22`). Versions resolved in `package-lock.json` after the dev-server fix:

| Package | Version |
| --- | --- |
| nuxt | 4.6.1 |
| @nuxt/vite-builder | 4.6.1 |
| vite | 8.3.4 (Nuxt 4.4.5 used 7.3.7) |
| @vite-pwa/nuxt | 1.1.1 (vite-plugin-pwa 1.3.0, workbox-build 7.4.1) |
| tailwindcss, @tailwindcss/vite | 4.3.3 |
| shadcn-nuxt, shadcn-vue (CLI) | 2.8.2 (reka-ui 2.11.0) |

The machine's default was Node 20.19.3, which needed two workarounds (a pinned `undici` for the shadcn-vue CLI, and an `Object.groupBy` polyfill in the ESLint config). **Both were removed** after moving to Node 22; `npx shadcn-vue --version` and `npx eslint .` work without them. The suite was run on Node 22 using a Node 22.23.3 binary placed first on `PATH` (the system Node was not changed); upgrade the machine's Node to match `.nvmrc`.

Also from the first setup: `shadcn-vue init` needs a root `tsconfig.json` (created like the legacy one), and writes a Google Fonts `@import` that was removed (offline rule).

Root `npm test`: still 524 passing, unaffected. Root `npx eslint .`: 123 problems that were already there; it lints 0 revamp files.

## Verification

- [x] `npm run build` clean; `npx eslint .` clean; `npm test`: 63 unit tests pass; `npm run test:dev` (dev server smoke test) passes; all on Node 22.23.3, ten full runs
- [x] Browser checks at 1280px and 375px, light and dark (screenshots reviewed: desktop light, mobile dark drawer, mobile sheet, desktop toast; desktop dark and mobile light were captured and not looked at one by one), first-run state
- [x] Offline test (build and preview): 5 offline checks, 4 prerender checks, 1 cutover rehearsal
- [x] Keyboard: skip link, visible focus ring on links, theme menu by keys and Escape, drawer focus trap and Escape returning focus (scripted)
- [x] Contrast measured and tested (below)
- [ ] Screen-reader pass (not done)
- [x] Shell compared side by side with the prototype at 1280 and 375, light and dark (`docs/design/shell-compare/`, table in its README; open decisions below)
- Total browser checks: 36 pass (`npm run test:e2e`, after `npm run build`). `npm run verify` runs everything.

### Contrast (WCAG)

Every text pair used in the shell passes 4.5:1 in light and dark (ink, ink-2, accent on bg, surface and sunken; button text; danger). **`--ink-3` fails for text:** 2.58:1 on bg in light, 3.76:1 in dark (and 2.36 on sunken). Gold on bg: 3.53 light, 7.53 dark, fine for a graphic mark. High contrast mode lifts ink-3 to 6.8 (light) and 7.5 (dark). The shell therefore uses `ink-2` for all text; `ink-3` is only on decorative chevrons. **Design question for you:** the design system lists ink-3 for "muted, placeholders, captions". Reaching 4.5:1 on the page background needs a colour almost as dark as `ink-2` (`#6B6558`, 5.12:1; for example `#757062` only reaches 4.37), so a distinct third step is not possible for text. Accept ink-3 as non-text only (my recommendation), or drop it?

## Differences from the prototype

Full table with images: `docs/design/shell-compare/README.md`. Summary:

- **Intentional:** accent bar instead of gold on the active item; group labels in `ink-2` (contrast); mini player hidden until something plays (Phase 4).
- **Mine, not in the design (decision needed):** a Lucide icon on every nav row (the prototype nav has none).
- **Gaps:** the header has no page title, no search field and no gear (the title comes with each page, search with Phase 10); the mobile drawer's close icon is not accent-coloured.
- **Mismatch (decision needed before Phase 1 ships the nav):** the prototype lists "Continue reading", "Downloads" and merged rows ("Places · Stories · Themes", "Duas · Events · Signs", "Prayer times · Qibla", "Ramadan & events", "Commands & Prohibitions", "Peoples & Nations"); the revamp lists one row per legacy route.

## Content placeholders replaced

None of `docs/CONTENT_TO_VERIFY.md` applies to this phase. The only Arabic shown (`/foundation`) is surah names from the legacy data file `app/assets/data/surah.json`; no prototype text was copied.

## Not verified

- No screen-reader testing.
- Screen-reader behaviour of the shell, and whether the shell matches the prototype beyond the six screenshot pairs (page body not compared; it is a placeholder).
- `Ignored Build Step` commands and "Include source files outside the Root Directory" were written from knowledge of Vercel, not tested on a real project.
- Real-device PWA install and the update flow on a phone.
- The mini player has no real player behind it (Phase 4); it is shown only when the placeholder store has a track.

## Open issues and risks

1. **`--ink-3` contrast** (above): needs a design decision.
2. **Server proxies are unused** (inventory): drop at cutover?
3. **Legacy G6 root cause** (inventory): likely the missing `/` precache entry; verify against the deployed worker.
5. The legacy prayer cache keys (`prayer_<lat>_<lon>_<fiqh>_<date>`) are per day and exact coordinates; the revamp's monthly cache (PLAN.md) is a new key family and must not write to them.
6. The legacy `ayah-of-day` key uses a UTC date (`toISOString()`), the known bug class in `CLAUDE.md`; fix in the revamp copy, keeping the key.
7. `/foundation` and the placeholder pages must be removed or replaced (Phases 1, 3, 15, 16).

## Next phase needs

Phase 1 (Home): the prayer-times data layer (monthly cache, Update now), a `quran:<feature>:v1` key for the calculation method and Asr school if Home needs them, and your answers to items 1 and 2 above.
