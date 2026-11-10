# Reader transliteration (Surah and Page readers)

- Branch: `feat/transliteration`
- Date: 2026-11-10
- Status: Done (awaiting the owner's review of the source and licence, see Open issues)

## Goal

Let a reader switch on a Roman-script reading of each ayah under the Arabic, in the Surah reader and the Page (Mushaf) reader, with the choice remembered and no new offline gaps.

## Scope

- Pages and components: Surah reader (`pages/surah/[id].vue`, `reader/AyahList.vue`, `reader/ReaderHeader.vue`), Per page (`pages/per-page-read.vue`, `perpage/Frame.vue`), the shared switch `reader/TransliterationToggle.vue`. The Juz tab opens the Surah reader at the juz's first ayah, so it has the line too.
- Not built: a Juz reader. `/juz/<n>` is a redirect (DECISIONS.md, decision 11); the owner chose to keep it (2026-11-10).
- Prototype sections used: none (no prototype for this line); it follows the reader's existing layout and tokens.
- Legacy code reused: none new. The service lives next to the Duas' ayah transliteration call (`services/transliteration.service.ts`).

## What was built

- `lib/transliteration.ts` (pure): checks a surah's answer (right count, in order, strings), `loadTransliteration` (device copy first, then the service, then store), and the lookup by ayah key (`transliterationOf`, `transliterationByKey`) that works across surahs.
- `composables/useTransliteration.ts`: the setting, the lines loaded so far (shared by every view in a visit), `ensure(surahs)` (loads only while the setting is on, one request per surah, never throws), `get(surah, ayah)`.
- `TransliterationToggle.vue`: a real switch (44px target on a phone), "Loading the transliteration…", and "The transliteration isn't on this device yet. Connect once to load it." with Try again.
- Surah reader: a line under the Arabic and above the translation, in both ayah orders.
- Page reader: a surah that has lines is shown ayah by ayah (Arabic with its marker, then its line, a hairline between); one without lines flows as before. Play highlight and follow-audio keep working (same `ayah-text` elements).
- `quran-revamp-db` version 5 adds the `transliterations` store.

## Decisions and why

| Decision | Alternatives considered | Reason |
| --- | --- | --- |
| Per-surah fetch from api.alquran.cloud, cached in IndexedDB | Bundle a Tanzil or Quran.com file as a lazy chunk | Content rule: Qur'an-related text comes only from the existing services; same edition the Duas use; nothing to relicense or keep in step. Cost: a first visit needs the network (then it is offline). |
| Skip a Juz reader | Build a full-juz reader | A recorded decision says there is none; the Juz tab already lands in the Surah reader. |
| Off by default | On by default | A new reading aid should not change what existing readers see. |
| Field in `quran:reader-prefs:v1` | A new key | The reader's own additive record already exists; the legacy app ignores it; `mergeJSON` keeps other fields. |
| No font-size option | A size slider | The reader has no translation size either; Arabic size is the only text-size setting. |
| Ayah-by-ayah layout in the Page reader when on | Put the line after the whole flowing paragraph | A line has to sit with its ayah to be useful. |

## Files

- Added: `app/lib/transliteration.ts`, `app/composables/useTransliteration.ts`, `app/components/reader/TransliterationToggle.vue`, `tests/transliteration.test.ts`, `tests/fixtures/alquran-translit-surah-1.json` and `-114.json` (real recorded answers), `e2e/transliteration.spec.ts`.
- Changed: `app/db/revampDb.ts` (v5), `app/lib/readerPrefs.ts`, `app/services/transliteration.service.ts`, `AyahList.vue`, `ReaderHeader.vue`, `Frame.vue`, `per-page-read.vue`, `surah/[id].vue`, `e2e/mocks.ts` (`mockTransliterationSurah`, `realTransliteration`), `tests/reader.test.ts` (db version), docs and `CLAUDE.md`.
- Changes to `legacy/` or `docs/legacy-reference/`: none.

## Data and storage

- Service: `GET https://api.alquran.cloud/v1/surah/<n>/en.transliteration` (about 82 KB for surah 2, 1.4 KB for surah 1). No new host.
- Key: `transliteration: true` in `quran:reader-prefs:v1` (off is stored as `null`).
- Migration: `quran-revamp-db` 4 to 5, creates `transliterations` only. `quran-app-db` is not touched.

## Offline

- Level B (as the readers): a surah's lines work offline once they have been loaded with the switch on. Tested: a second visit with the service unreachable reads from the device (`e2e/transliteration.spec.ts`); first visit with the service down shows the Arabic and the message. Not tested with the real service worker (the worker is blocked in these tests).
- Not part of Downloads: "Download whole Qur'an text" does not fetch transliteration.

## Verification

See the numbers at the end of this file.

## Differences from the prototype

None (no prototype for this line).

## Content placeholders replaced

None; new items added to `CONTENT_TO_VERIFY.md` (source, licence, accuracy, our wording).

## Open issues and risks

- **Licence:** Tanzil’s terms were read on 2026-11-10 (non-commercial only; see `DECISIONS.md`). Met on the owner’s statement that the app is free and not monetised; **a release blocker if that ever changes**. About carries the credit. AlQuran Cloud’s own terms for the edition are still unstated.
- No type-check step exists in this repo (`vue-tsc` is not installed); Nuxt's build and ESLint are the gate.
- The verify was run on Node 24 (no Node 22 on this machine), against `.nvmrc` 22.
- Transliteration is not included in Downloads or the saved-surahs list.

## Next phase needs

Nothing. Possible follow-ups: include transliteration in Downloads; a credit line in About once the licence is known.
