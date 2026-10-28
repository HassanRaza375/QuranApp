# Phase 14: Hifz

- Branch: `phase-14-hifz` (from the merged `chore/standalone-repo`)
- Date: 2026-10-28
- Status: **Built, full verify pending (see Verification).** Plan approved by the owner on 2026-10-28 ("as recommended", with seven specifics, recorded in `DECISIONS.md`). Waiting for the owner's acceptance; then merge into `chore/standalone-repo` with `--no-ff`, verify the merged head, push.

## Goal

Rebuild Hifz as the simple mode agreed on 2026-10-22: a home with one plan and one Start button, a session that is a queue of one-screen steps, a surah page, and an Add sheet. **A step is graded from the words you slip on**, not from Again / Good / Easy buttons. The legacy engine (spacing, strength, tricky ayahs first, new ayahs wait while 3 or more need work) and the legacy data stay exactly as they are, so a user keeps their targets and progress and can roll back to the legacy app.

## Scope

- Pages and components built: `app/pages/hifz/index.vue`, `session.vue`, `surah/[n].vue`; `app/components/hifz/` (`HifzHome`, `HifzSurah`, `HifzSession`, `Review`, `Learn`, `Join`, `Done`, `Words`, `Strip`, `Key`, `AddSheet`, `PracticeSheet`); `app/stores/hifz.ts`; `app/composables/useAyahPlays.ts`; the Home tile's count (`useHomeState`, `UtilStrip`).
- Prototype section used: `docs/design/prototype-hifz.html` (the whole file).
- Legacy code reused: `useHifz.ts` and `useHifzSession.ts` are vendored unmodified by `scripts/sync-legacy.mjs` (87 other files unchanged, legacy commit still `7120b6c`) and **run by the parity test** (`scripts/lib/legacy-hifz.mjs`, in memory, like Tasbeeh and the audio player). The engine is ported, not copied: `app/lib/hifz/engine.ts` is the same rules as pure functions.

## What was built

- **Engine and storage** (`app/lib/hifz/`): `engine.ts` (SM-2-lite grading, strength, new-ayah budget, introduction, the v1 migration, local-day helpers), `session.ts` (the legacy item shape and runner: the daily queue without the warm-up and the final test, the whole-surah check, free practice), `queue.ts` (today's plan and its lines), `words.ts` (an ayah as words), `slips.ts` (the words store and the tricky rule), `grading.ts` (slips to a grade), `timing.ts` (the estimate), `overview.ts` (the strength strip), `store.ts` (reading and writing the keys in the legacy shape).
- **Screens** as in `docs/pages/hifz.md`.
- **Tokens:** `--weak` and `--s1` to `--s3` in both themes (strong is `--gold`), recorded in `DESIGN_SYSTEM.md` and checked by `tests/tokens.test.ts`.
- **Home tile:** "N to practice" from the same queue (0 or damaged data: "Open Hifz").
- **Scripts:** `scripts/lib/legacy-hifz.mjs` (the loader) and `scripts/screenshots/phase-14-hifz.mjs` (the prototype next to the build, `docs/design/hifz-compare/`).

## Decisions and why

The seven owner decisions are in `DECISIONS.md` (Phase 14). Choices made while building:

| Decision | Alternatives considered | Reason |
| --- | --- | --- |
| The engine is **ported to pure functions** and compared with the vendored legacy composable on random histories | Vendor and call the composable from app code | The composable needs Nuxt state and the auto-imported `$storage`; the Tasbeeh and audio-player pattern (port, then prove equal) is the project's rule |
| A word is found by its **letters**; a token with none (a pause mark, the start-of-quarter sign, the sajda sign standing alone) is dropped | Strip a list of marks | Measured on all 114 surahs of the reader's text: 6,236 ayahs, 77,433 words, 4,578 standalone marks, no empty ayah, no token with letters and no space. Written as escapes: no Arabic script in `app/` |
| Words are compared **after NFC** | Compare as stored | 5,748 of 6,236 stored ayahs are not in NFC |
| A stored word entry keeps its **text**; a mismatch drops the entry | Store only the index | If the text ever changes under an index, the wrong word must never be shown as tricky |
| The words store is keyed by **surah and ayah**, not by target | Key by target | Removing a surah and adding it back (or Undo) keeps what you know about your tricky words |
| **Free practice is in memory only** | Store it like the legacy | Owner decision 5: it records nothing, not even the stored session; starting it also cannot overwrite a session in progress |
| A new ayah is **graded when the whole step ends** (after the joins) | Grade at the end of Recite | The legacy grades and advances in one call; this keeps a resumed legacy session from grading the same step twice. Cost: leaving during the joins of a new ayah loses that grade (the ayah is offered as new again) |
| **Both** Recite to someone and the whole-surah check are graded; joins in the check are graded | Recite to someone ungraded | Owner decision 4. The legacy assessment never graded its join items (they carry no ayah number); here they are graded |
| The session keeps one **extra optional field**, `mode: "check"` | Encode it in `kind` | The legacy runner is generic and keeps unknown fields; a Recite-to-someone session must come back as one |
| The Done tick is the accent, not gold | Prototype's gold | Design rule: gold is verse-end markers and Hifz mastery only |
| Remove keeps `quran:hifz-words:v1` | Delete with the surah | Undo, and re-adding, keep tricky words |

## Files

- Added: `app/lib/hifz/*` (9 files), `app/stores/hifz.ts`, `app/composables/useAyahPlays.ts`, `app/components/hifz/*` (12), `app/pages/hifz/*` (3), `scripts/lib/legacy-hifz.mjs`, `scripts/screenshots/phase-14-hifz.mjs`, `tests/hifzParity.test.ts`, `tests/hifz.test.ts`, `e2e/hifz.spec.ts`, `docs/pages/hifz.md`, `docs/design/hifz-compare/` (screenshots).
- Changed: `app/assets/css/tailwind.css`, `tests/tokens.test.ts`, `docs/design/DESIGN_SYSTEM.md` (tokens), `app/composables/useHomeState.ts`, `app/components/home/UtilStrip.vue` (the tile), `e2e/mocks.ts` (`mockHifzText`), `e2e/home.spec.ts` (a comment), `scripts/lib/legacy-files.mjs`.
- Changes to `legacy/`: only through `scripts/sync-legacy.mjs`: added `app/composables/useHifz.ts` and `useHifzSession.ts`, manifest and README updated; nothing hand-edited.

## Data and storage

- Services and composables used: the reader's `useQuranText().getChapter` (cache first), the shared player (`playAyah`) with the Settings reciter, `useUndoToast`.
- Keys, as the legacy app uses them: `quran:hifz:v2` (read and written, the legacy shape, **unknown fields kept**, a damaged value reads as empty and is not written over until you act), `quran:hifz:v1` (read once to migrate, **never written**), `quran:hifz-session:v1` (legacy shape, plus the optional `mode`).
- **New, additive** (the legacy app ignores them): `quran:hifz-words:v1`, `quran:hifz-timing:v1`. Export already writes every key; Reset leaves Hifz alone (as before); Clear all removes them with everything else.
- Migrations: none beyond the legacy v1 to v2 expansion, run once as the legacy does.
- IndexedDB: nothing new. `quran-app-db` is never opened (a browser test checks).

## Offline

- Level B (see `docs/pages/hifz.md`). Tested with the real service worker (`e2e/hifz.spec.ts`, "offline (level B)"): online, two steps load the text of two surahs; offline, Home still lists the surahs, the next step reads its text from the device and is graded and saved; a surah never opened shows the plain message, Try again offline shows it again (no spinner forever), and with the connection back Try again works. Audio that cannot be had says so and the step can be skipped.

## Verification

(To be filled with the result of the full `npm run verify` on Node 22 before this phase is handed over.)

## Differences from the prototype

Listed in `docs/pages/hifz.md`: one progress bar instead of segments; the Done tick in the accent; the verdict says what the engine does; "First word" reveals the first word.

## Content placeholders replaced

`CONTENT_TO_VERIFY.md`, section Hifz: every ayah and word on screen is the reader's text; the sample plan, strengths, "2 words slipped last time" and "Slipped on … twice" are computed; the time estimate has a stated basis; the verdict sentences were made true of the engine; Read along has no per-word highlight (decision 2026-10-22); the pace labels and the weeks are computed. Wording of ours is listed there.

## Open issues and risks

- **Real-device checks** are listed in `docs/DEVICE_CHECKS.md` (Phase 14): a phone in a quiet room reciting with a listener, audio in Listen and Read along, the Add sheet on iPhone, offline on an installed app.
- **Word-by-word highlighting** waits for a source of word timings (none exists in the services).
- **The sample time is a guess until you have done 10 sessions.** The first estimate is 1.5 s a word plus 10 s an item (a new ayah four times that), the owner's figures; it says "About".
- **A surah added in the legacy app with a custom pace** (5 or 10 a day) shows as "N a day (set earlier)" and keeps working; the Add sheet only offers 1, 2 and 3.
- **Two targets for one surah** (the legacy allowed it) open the first on `/hifz/surah/<n>`; Add refuses a second one.
- **Leaving during the joins of a new ayah** loses that ayah's grade (above).
- The legacy Hifz specification (`Hifz_Module_Specification.md`) is in neither repository: this work follows the legacy code.

## Next phase needs

Phase 15 (Reading goals, Calendar, About) is independent of Hifz. Hifz reminders (the legacy Hifz code has none) belong with the shared reminders list in the Calendar phase.
