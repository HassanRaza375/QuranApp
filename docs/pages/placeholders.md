# Pages: placeholders from Phase 0

| Route | File | Replaced in |
| --- | --- | --- |
| `/` | `app/pages/index.vue` | Phase 1 (Home) |
| `/about` | `app/pages/about.vue` | Phase 15 (built: `docs/pages/about.md`) |
| `/surah-listing` | `app/pages/surah-listing.vue` | Phase 3 |
| any other route | `app/pages/[...slug].vue` ("This page is not rebuilt yet") | removed once the last legacy route is rebuilt |

Offline level A. They exist so the prerender and offline spikes have real routes. Their `<title>` and description are duplicated in `app/lib/publicMeta.ts` for the prerendered head tags (only the head is prerendered, not the body); change both together.

Tests: `e2e/prerender.spec.ts`, `e2e/offline.spec.ts`, `tests/bridge.test.ts`.
