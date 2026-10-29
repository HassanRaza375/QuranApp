# legacy/: read-only snapshot of the legacy Quran App

The files of the legacy app (the Vuetify Nuxt app) that this project imports or reads. They are here so this repository builds,
tests and deploys on its own: nothing in this repo reaches outside it, and no legacy checkout is needed.

<!-- sync-legacy:begin -->
- Commit: `7120b6cd6301ed267085b130052d767f95b2c15a` (branch `revamp-design-logic`, committed 2026-10-22)
- Synced: 2026-10-28
- Files: 91, 6929 KB (listed in `manifest.json`)
<!-- sync-legacy:end -->

## Rules

1. **Read-only.** Do not edit these files and do not add files here by hand. The one exception is a **cutover data fix**: once the
   legacy repo stops being the source (at cutover), a wrong entry in a data file may be corrected here, in a commit of its own
   (`legacy(data): <what and why>`), and listed under "Local edits" below.
2. **Refresh only with the script.** `LEGACY_REPO=<path to the legacy checkout> node scripts/sync-legacy.mjs` (add `--check` to see
   what would change without writing). It copies the files listed in `scripts/lib/legacy-files.mjs` from the legacy commit, rewrites
   `manifest.json` and the commit line above, and prints what changed. It warns when a file here was edited since the last sync.
3. **The build never calls it.** `npm run build`, `npm test` and `npm run verify` need no legacy checkout and no network for this.
4. **Only what the code uses.** A file is added to the list when something imports or reads it, and removed when nothing does.
   `tests/legacySnapshot.test.ts` fails if this folder and the list disagree.

## Layout

| Path | What | Used through |
|---|---|---|
| `app/...` | the legacy `app/` files, same relative paths as in the legacy repo | the `@legacy` alias points at `legacy/app`, so `@legacy/utils/x` is `legacy/app/utils/x`; legacy files' own `~/` imports are redirected here by `build/legacyBridge.ts` |
| `app/composables/useTasbeeh.ts`, `useAudioPlayer.ts` | the legacy composables, unmodified | `scripts/lib/legacy-*.mjs` load them in memory; the storage parity tests and `scripts/gen-tasbeeh-presets.mjs` run them |
| `routes.json` | the routes the legacy `app/pages` folder serves (derived, not a legacy file) | `tests/bridge.test.ts`: every navigation link must be a legacy route |
| `dist/sw.js`, `dist/workbox-*.js` | the legacy service worker and its Workbox runtime (build output, **not from the commit**) | `e2e/cutover.spec.ts` only |
| `manifest.json` | commit, and the size and SHA-256 of every file | `scripts/sync-legacy.mjs` |

`dist/` is the legacy app's git-ignored build output, taken from a local build (see `builtAt` in `manifest.json`), so it may differ
from what production serves. Before cutover, replace both files with the ones the production site serves (`/sw.js` and the
`workbox-*.js` it imports) and run `npm run test:e2e -- e2e/cutover.spec.ts`; see `docs/DEPLOY.md`.

## Local edits

None.
