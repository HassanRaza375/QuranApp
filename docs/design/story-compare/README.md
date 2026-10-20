# Story reader next to the prototype (Phase 7B)

`<device>-<theme>-<view>.jpg` puts the prototype (left) next to the revamp (right): desktop 1280px, mobile 375px, light and dark, for three views: `chapter` (Yusuf, chapter 2: a story fully told), `end` (Yusuf's end page) and `pieced` (Adam and Iblis, chapter 1: a pieced-together story) = **12 pairs**. `state-<name>-<device>-<theme>.jpg` are revamp-only state shots at 1280 light and 375 dark: directory, directory-no-match, directory-progress, chapter-top, chapter-show-all, rail-read-chapters, continue-banner, compare-tellings, entity-person, entity-place, in-this-story-events, single-chapter, loading, failed, end-of-story-lessons, not-found, person-story-tab (17 states x 2 = **34**). Regenerate with `node scripts/screenshots/phase-07b-story.mjs` (production build, Node 22).

The revamp is the production build with the clock fixed and the per-surah request answered with **synthetic text** ("TEST ARABIC 12:21", "Test English 12:21"), so no Qur'an text was stored by the script. The Arabic in the prototype column is the prototype's own sample excerpt and its text is not used anywhere.

## Differences

| # | Prototype | Revamp | Kind |
| --- | --- | --- | --- |
| 1 | Chapter titles, summaries, ayah counts and "Reflection" lines written for the prototype | The story's own episodes (title, summary, passage) or primary passages; every count is computed from the range; summaries are labelled "Summary (written for this app)" | Real data |
| 2 | Three or four sample ayahs per chapter and "the full chapter has N ayahs, this prototype shows a sample" | The real chapter text from the cached surah: the first 8 ayahs, then "Show all N ayahs" | Approved |
| 3 | A per-chapter "context" note and a per-chapter Reflection | None: the data has no per-chapter notes or lessons. Lessons are the story's, on the end page, with their basis chip; notes are under "Notes on this story" | Real data |
| 4 | "Traditional chronology" chip on every story | Not shown: the story data carries no chronology status | Real data |
| 5 | "Order: the surah's own sequence" for Yusuf and "Order: this app's study sequence" for Adam | The first only where computed from the passages (single surah, ascending); no Order line otherwise | Approved |
| 6 | "Arranged for study. These verses come from different surahs, so this is not one continuous passage." | "This story is assembled from passages in several surahs, in an order chosen for reading." for the 8 stories not fully told and for nuhflood (an override pending your decision; flagged for your review) | Approved |
| 7 | Per-chapter "Also told in" with a main telling and Compare tellings | Story-level "Also told in" (the data has no per-chapter mapping) and Compare tellings listing references, counts and the data's descriptions; "No description recorded yet." for all 13 supporting passages | Approved |
| 8 | Listen to this chapter plays | Visible, disabled, with "Coming with the player" (Phase 4B) | Approved |
| 9 | "In this chapter" chips (people, places, events) per chapter | "In this story" (story level): people, peoples and places open sheets; events are inert text; places and peoples say their page arrives later | Real data |
| 10 | Entity sheet "Open page" for people only | The same; places and people-groups have no link | Approved |
| 11 | Progress rail with ticks, "Story complete", "Continue with" people | The same rail (hidden for one-chapter stories), "Continue with" the related stories from the data, "Start again" with Undo | Intentional |
| 12 | No directory | A lean `/stories` directory (search, type, person, Saved, progress) | Approved |
| 13 | Arabic title "قصة يوسف" typed | The data's `arabicTitle` | Real data |
| 14 | Mini player bar always shown | Hidden until something plays | Intentional for now |

The sidebar and header differences are the Phase 1 ones (`docs/design/home-compare/README.md`).

**Looked at individually:** the desktop light Yusuf chapter pair, the mobile dark Adam and Iblis pair, the mobile dark Compare tellings state, and (after the fix) the directory at 1280 light. Looking at them found one fault, fixed and regenerated: the Arabic title overlapped the title (line-height too tight); the regenerated Adam and Iblis pair shows it clear. **Generated but not examined one by one:** the other nine pairs and the other 32 state shots (the states are exercised by the browser tests, which check their text, links and sizes).
